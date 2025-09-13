use crate::preview::{PreviewError, PreviewResult};
use crate::preview::formats::{FormatRenderer, OutputFormat, RenderOptions, RenderQuality};
use crate::types::preview_types::ImageQuality;
use async_trait::async_trait;
use std::collections::HashMap;
use resvg::usvg::{self, TreeParsing};
use tiny_skia::Pixmap;

pub struct ImageRenderer {
    // 渲染器配置
    default_width: u32,
    default_height: u32,
}

impl ImageRenderer {
    pub fn new() -> Self {
        Self {
            default_width: 800,
            default_height: 600,
        }
    }

    /// 从SVG渲染为像素数据
    fn render_svg_to_pixmap(
        &self, 
        svg_data: &str, 
        options: &RenderOptions
    ) -> PreviewResult<Pixmap> {
        // 解析SVG
        let opt = usvg::Options::default();
        let mut fontdb = usvg::fontdb::Database::new();
        fontdb.load_system_fonts();

        let tree = usvg::Tree::from_str(svg_data, &opt)
            .map_err(|e| PreviewError::RenderError {
                message: format!("Failed to parse SVG: {}", e),
            })?;

        // 确定输出尺寸
        let (width, height) = self.calculate_output_size(&tree, options);

        // 创建像素缓冲区
        let mut pixmap = Pixmap::new(width, height)
            .ok_or_else(|| PreviewError::RenderError {
                message: "Failed to create pixmap".to_string(),
            })?;

        // 设置渲染变换
        let transform = self.calculate_transform(&tree, width, height);

        // 执行渲染
        resvg::Tree::from_usvg(&tree).render(transform, &mut pixmap.as_mut());

        Ok(pixmap)
    }

    /// 计算输出尺寸
    fn calculate_output_size(
        &self, 
        tree: &usvg::Tree, 
        options: &RenderOptions
    ) -> (u32, u32) {
        // 检查自定义尺寸设置
        if let (Some(width), Some(height)) = (
            options.custom_properties.get("thumbnail_width"),
            options.custom_properties.get("thumbnail_height")
        ) {
            if let (Some(w), Some(h)) = (width.as_u64(), height.as_u64()) {
                return (w as u32, h as u32);
            }
        }

        // 根据质量设置调整DPI
        let dpi_multiplier = match options.quality {
            RenderQuality::Draft => 0.5,
            RenderQuality::Standard => 1.0,
            RenderQuality::High => 1.5,
            RenderQuality::Print => 2.0,
        };

        // 使用SVG的原生尺寸
        let svg_size = tree.size;
        let width = (svg_size.width() * dpi_multiplier) as u32;
        let height = (svg_size.height() * dpi_multiplier) as u32;

        // 确保尺寸合理
        let width = width.max(1).min(4096);
        let height = height.max(1).min(4096);

        (width, height)
    }

    /// 计算渲染变换
    fn calculate_transform(
        &self,
        tree: &usvg::Tree,
        target_width: u32,
        target_height: u32,
    ) -> tiny_skia::Transform {
        let svg_size = tree.size;
        let scale_x = target_width as f32 / svg_size.width();
        let scale_y = target_height as f32 / svg_size.height();
        
        // 使用统一缩放以保持纵横比
        let scale = scale_x.min(scale_y);
        
        tiny_skia::Transform::from_scale(scale, scale)
    }

    /// 将Pixmap编码为指定格式
    fn encode_pixmap(
        &self,
        pixmap: &Pixmap,
        format: &OutputFormat,
        options: &RenderOptions,
    ) -> PreviewResult<Vec<u8>> {
        match format {
            OutputFormat::Png => {
                pixmap.encode_png()
                    .map_err(|e| PreviewError::RenderError {
                        message: format!("PNG encoding failed: {}", e),
                    })
            }
            OutputFormat::Jpg => {
                // JPEG编码需要移除alpha通道
                let rgb_data = self.pixmap_to_rgb(pixmap);
                let quality = self.get_jpeg_quality(options);
                
                let mut jpeg_data = Vec::new();
                let mut encoder = image::codecs::jpeg::JpegEncoder::new(&mut jpeg_data);
                encoder.encode(
                    &rgb_data,
                    pixmap.width(),
                    pixmap.height(),
                    image::ColorType::Rgb8,
                ).map_err(|e| PreviewError::RenderError {
                    message: format!("JPEG encoding failed: {}", e),
                })?;
                
                Ok(jpeg_data)
            }
            OutputFormat::Webp => {
                // WebP编码 (简化实现，实际可能需要webp库)
                // 目前回退到PNG
                pixmap.encode_png()
                    .map_err(|e| PreviewError::RenderError {
                        message: format!("WebP encoding fallback to PNG failed: {}", e),
                    })
            }
            _ => Err(PreviewError::UnsupportedFormat {
                format: format!("{:?}", format),
            }),
        }
    }

    /// 将RGBA像素数据转换为RGB
    fn pixmap_to_rgb(&self, pixmap: &Pixmap) -> Vec<u8> {
        let rgba_data = pixmap.data();
        let mut rgb_data = Vec::with_capacity(rgba_data.len() * 3 / 4);
        
        for chunk in rgba_data.chunks(4) {
            if chunk.len() >= 4 {
                // 预乘alpha处理
                let alpha = chunk[3] as f32 / 255.0;
                let r = (chunk[0] as f32 / alpha).min(255.0) as u8;
                let g = (chunk[1] as f32 / alpha).min(255.0) as u8;
                let b = (chunk[2] as f32 / alpha).min(255.0) as u8;
                
                rgb_data.extend_from_slice(&[r, g, b]);
            }
        }
        
        rgb_data
    }

    /// 获取JPEG质量参数
    fn get_jpeg_quality(&self, options: &RenderOptions) -> u8 {
        match options.quality {
            RenderQuality::Draft => 60,
            RenderQuality::Standard => 80,
            RenderQuality::High => 90,
            RenderQuality::Print => 95,
        }
    }
}

#[async_trait]
impl FormatRenderer for ImageRenderer {
    async fn render(
        &self,
        svg_data: &str,
        options: &RenderOptions,
    ) -> PreviewResult<Vec<u8>> {
        // 验证选项
        self.validate_options(options)?;

        // 渲染SVG到像素图
        let pixmap = self.render_svg_to_pixmap(svg_data, options)?;

        // 编码为目标格式
        self.encode_pixmap(&pixmap, &options.format, options)
    }
    
    fn supported_formats(&self) -> Vec<OutputFormat> {
        vec![OutputFormat::Png, OutputFormat::Jpg, OutputFormat::Webp]
    }
    
    fn validate_options(&self, options: &RenderOptions) -> PreviewResult<()> {
        match options.format {
            OutputFormat::Png | OutputFormat::Jpg | OutputFormat::Webp => Ok(()),
            _ => Err(PreviewError::UnsupportedFormat {
                format: format!("{:?}", options.format),
            }),
        }
    }
    
    fn default_options(&self) -> RenderOptions {
        RenderOptions {
            format: OutputFormat::Png,
            quality: RenderQuality::High,
            pdf_options: None,
            image_quality: Some(ImageQuality::default()),
            excel_options: None,
            custom_properties: HashMap::new(),
        }
    }
    
    async fn estimate_render_time(&self, svg_data: &str) -> PreviewResult<u64> {
        // 基于SVG复杂度的简单估算
        let complexity_score = svg_data.len() / 1000; // 每1KB大约1ms
        let base_time = 50; // 基础时间50ms
        Ok((base_time + complexity_score).min(500) as u64) // 最大500ms
    }
}