use crate::preview::{PreviewError, PreviewResult};
use crate::preview::formats::FormatRenderer;
use crate::types::preview_types::{OutputFormat, RenderOptions, RenderResult, RenderQuality, RenderMetadata, Dimensions, DimensionUnit};
use crate::preview::formats::{pdf::PdfRenderer, image::ImageRenderer, excel::ExcelRenderer};
use crate::preview::cache::RenderCache;
use crate::preview::svg_converter::SvgConverter;
use crate::core::element::ReportElement;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::Instant;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// 主预览渲染器
pub struct PreviewRenderer {
    pdf_renderer: Arc<PdfRenderer>,
    image_renderer: Arc<ImageRenderer>,
    excel_renderer: Arc<ExcelRenderer>,
    cache: Arc<RwLock<RenderCache>>,
}

impl PreviewRenderer {
    pub fn new() -> Self {
        Self {
            pdf_renderer: Arc::new(PdfRenderer::new()),
            image_renderer: Arc::new(ImageRenderer::new()),
            excel_renderer: Arc::new(ExcelRenderer::new()),
            cache: Arc::new(RwLock::new(RenderCache::new())),
        }
    }

    /// 渲染元素到指定格式
    pub async fn render_elements(
        &self,
        elements: &[ReportElement],
        options: &RenderOptions,
    ) -> PreviewResult<RenderResult> {
        let start_time = Instant::now();

        // 生成缓存键
        let cache_key = self.generate_cache_key(elements, options);

        // 尝试从缓存获取结果
        {
            let cache = self.cache.read().await;
            if let Some(cached_data) = cache.get_output(&cache_key) {
                let render_time = start_time.elapsed().as_millis() as u64;
                return Ok(RenderResult {
                    success: true,
                    data: Some(cached_data.clone()),
                    format: options.format.clone(),
                    file_size: cached_data.len() as u64,
                    render_time_ms: render_time,
                    metadata: RenderMetadata {
                        page_count: 1,
                        dimensions: Dimensions {
                            width: 0,
                            height: 0,
                            unit: DimensionUnit::Pixel,
                        },
                        color_profile: None,
                        fonts_used: vec![],
                        cache_hit: true,
                    },
                    error: None,
                });
            }
        }

        // 将elements转换为SVG
        let svg_data = SvgConverter::elements_to_svg(elements)?;
        
        // 优化SVG
        let optimized_svg = SvgConverter::optimize_svg(&svg_data);

        // 缓存SVG
        {
            let mut cache = self.cache.write().await;
            let svg_cache_key = format!("{}-svg", cache_key);
            cache.put_svg(svg_cache_key, optimized_svg.clone());
        }

        // 选择合适的渲染器
        let renderer = self.get_renderer(&options.format)?;

        // 执行渲染
        match renderer.render(&optimized_svg, options).await {
            Ok(data) => {
                let render_time = start_time.elapsed().as_millis() as u64;
                
                // 缓存渲染结果
                {
                    let mut cache = self.cache.write().await;
                    cache.put_output(cache_key, data.clone());
                }

                Ok(RenderResult {
                    success: true,
                    data: Some(data.clone()),
                    format: options.format.clone(),
                    file_size: data.len() as u64,
                    render_time_ms: render_time,
                    metadata: RenderMetadata {
                        page_count: 1,
                        dimensions: Dimensions {
                            width: 0,
                            height: 0,
                            unit: DimensionUnit::Pixel,
                        },
                        color_profile: None,
                        fonts_used: vec![],
                        cache_hit: false,
                    },
                    error: None,
                })
            }
            Err(error) => {
                let render_time = start_time.elapsed().as_millis() as u64;
                Ok(RenderResult {
                    success: false,
                    data: None,
                    format: options.format.clone(),
                    file_size: 0,
                    render_time_ms: render_time,
                    metadata: RenderMetadata {
                        page_count: 0,
                        dimensions: Dimensions {
                            width: 0,
                            height: 0,
                            unit: DimensionUnit::Pixel,
                        },
                        color_profile: None,
                        fonts_used: vec![],
                        cache_hit: false,
                    },
                    error: Some(error.to_string()),
                })
            }
        }
    }

    /// 获取支持的格式
    pub fn get_supported_formats(&self) -> Vec<OutputFormat> {
        let mut formats = Vec::new();
        formats.extend(self.pdf_renderer.supported_formats());
        formats.extend(self.image_renderer.supported_formats());
        formats.extend(self.excel_renderer.supported_formats());
        formats
    }

    /// 获取渲染器
    fn get_renderer(&self, format: &OutputFormat) -> PreviewResult<Arc<dyn FormatRenderer>> {
        match format {
            OutputFormat::Pdf => Ok(self.pdf_renderer.clone()),
            OutputFormat::Png | OutputFormat::Jpg | OutputFormat::Webp => {
                Ok(self.image_renderer.clone())
            }
            OutputFormat::Excel => Ok(self.excel_renderer.clone()),
            OutputFormat::Svg => Err(PreviewError::UnsupportedFormat {
                format: "SVG renderer not implemented yet".to_string(),
            }),
            OutputFormat::PowerPoint => Err(PreviewError::UnsupportedFormat {
                format: "PowerPoint renderer not implemented yet".to_string(),
            }),
        }
    }

    /// 生成缓存键
    fn generate_cache_key(&self, elements: &[ReportElement], options: &RenderOptions) -> String {
        let mut hasher = DefaultHasher::new();
        
        // 对元素进行哈希
        for element in elements {
            element.id.to_string().hash(&mut hasher);
            element.position.x.to_bits().hash(&mut hasher);
            element.position.y.to_bits().hash(&mut hasher);
            element.size.width.to_bits().hash(&mut hasher);
            element.size.height.to_bits().hash(&mut hasher);
            element.z_index.hash(&mut hasher);
            element.visible.hash(&mut hasher);
            // 注意: 对于复杂的content，这里只是简化实现
            // 实际项目中可能需要更精细的哈希策略
        }
        
        // 对选项进行哈希
        format!("{:?}", options.format).hash(&mut hasher);
        format!("{:?}", options.quality).hash(&mut hasher);
        
        format!("render-{:x}", hasher.finish())
    }

    /// 生成缩略图
    pub async fn generate_thumbnail(
        &self,
        elements: &[ReportElement],
        size: (u32, u32),
    ) -> PreviewResult<Vec<u8>> {
        let mut options = RenderOptions {
            format: OutputFormat::Png,
            quality: RenderQuality::Draft,
            pdf_options: None,
            image_quality: None,
            excel_options: None,
            custom_properties: std::collections::HashMap::new(),
        };
        
        // 添加缩略图特定选项
        options.custom_properties.insert(
            "thumbnail_width".to_string(),
            serde_json::Value::Number(serde_json::Number::from(size.0)),
        );
        options.custom_properties.insert(
            "thumbnail_height".to_string(),
            serde_json::Value::Number(serde_json::Number::from(size.1)),
        );

        let result = self.render_elements(elements, &options).await?;
        result.data.ok_or_else(|| PreviewError::RenderError {
            message: "Failed to generate thumbnail data".to_string(),
        })
    }

    /// 清理缓存
    pub async fn clear_cache(&self) -> PreviewResult<()> {
        let mut cache = self.cache.write().await;
        cache.clear();
        Ok(())
    }

    /// 渲染元素（公开的render方法）
    pub async fn render(
        &self,
        elements: &[ReportElement],
        options: &RenderOptions,
    ) -> PreviewResult<RenderResult> {
        self.render_elements(elements, options).await
    }
    
    /// 验证渲染选项
    pub async fn validate_options(&self, options: &RenderOptions) -> PreviewResult<()> {
        let renderer = self.get_renderer(&options.format)?;
        renderer.validate_options(options)
    }

    /// 获取渲染统计
    pub async fn get_render_stats(&self) -> crate::types::preview_types::RenderStats {
        let cache = self.cache.read().await;
        let cache_stats = cache.stats();
        
        // 这里是简化的统计信息
        crate::types::preview_types::RenderStats {
            total_renders: cache_stats.total_entries as u64,
            cache_hits: cache_stats.output_entries as u64,
            cache_misses: 0, // TODO: 实际统计
            average_render_time_ms: 250.0, // TODO: 实际统计
            memory_usage_mb: 25.0, // TODO: 实际测量
            error_count: 0, // TODO: 实际统计
        }
    }
    
}