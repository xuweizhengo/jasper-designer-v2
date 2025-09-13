use crate::preview::{PreviewError, PreviewResult};
use crate::preview::formats::{FormatRenderer, OutputFormat, RenderOptions, RenderQuality};
use crate::preview::formats::pdf::{PageBuilder, SvgToPdfConverter};
use crate::types::preview_types::PdfOptions;
use async_trait::async_trait;
use std::collections::HashMap;

/// PDF渲染器核心类
pub struct PdfRenderer {
    // 配置参数
    default_options: PdfOptions,
}

impl PdfRenderer {
    pub fn new() -> Self {
        Self {
            default_options: PageBuilder::default_options(),
        }
    }

    /// 从渲染选项中提取PDF选项
    fn extract_pdf_options(&self, options: &RenderOptions) -> PdfOptions {
        options.pdf_options
            .clone()
            .unwrap_or_else(|| self.default_options.clone())
    }

    /// 根据质量级别调整PDF选项
    fn adjust_options_for_quality(&self, mut pdf_options: PdfOptions, quality: &RenderQuality) -> PdfOptions {
        match quality {
            RenderQuality::Draft => {
                pdf_options.compress_images = true;
                pdf_options.embed_fonts = false;
            }
            RenderQuality::Standard => {
                pdf_options.compress_images = true;
                pdf_options.embed_fonts = true;
            }
            RenderQuality::High => {
                pdf_options.compress_images = false;
                pdf_options.embed_fonts = true;
            }
            RenderQuality::Print => {
                pdf_options.compress_images = false;
                pdf_options.embed_fonts = true;
                pdf_options.pdf_version = "2.0".to_string(); // 使用最新版本
            }
        }
        pdf_options
    }

    /// 验证PDF选项
    fn validate_pdf_options(&self, options: &PdfOptions) -> PreviewResult<()> {
        // 验证页面尺寸
        let (width, height) = match &options.page_size {
            crate::types::preview_types::PageSize::Custom { width, height } => (*width, *height),
            _ => (210.0, 297.0), // A4默认值
        };

        if width <= 0.0 || height <= 0.0 {
            return Err(PreviewError::InvalidOptions {
                details: "Page dimensions must be positive".to_string(),
            });
        }

        // 验证边距
        let margins = &options.margins;
        if margins.top < 0.0 || margins.right < 0.0 || margins.bottom < 0.0 || margins.left < 0.0 {
            return Err(PreviewError::InvalidOptions {
                details: "Margins must be non-negative".to_string(),
            });
        }

        // 验证边距不能超过页面尺寸
        if margins.left + margins.right >= width || margins.top + margins.bottom >= height {
            return Err(PreviewError::InvalidOptions {
                details: "Margins cannot exceed page dimensions".to_string(),
            });
        }

        Ok(())
    }

    /// 估算PDF复杂度
    fn estimate_complexity(&self, svg_data: &str) -> u32 {
        let mut complexity = 0;
        
        // 基于SVG内容估算复杂度
        complexity += svg_data.matches("<text").count() as u32 * 2;
        complexity += svg_data.matches("<rect").count() as u32 * 1;
        complexity += svg_data.matches("<line").count() as u32 * 1;
        complexity += svg_data.matches("<path").count() as u32 * 3;
        complexity += svg_data.matches("<g").count() as u32 * 1;
        
        complexity.max(1) // 至少为1
    }
}

#[async_trait]
impl FormatRenderer for PdfRenderer {
    async fn render(
        &self,
        svg_data: &str,
        options: &RenderOptions,
    ) -> PreviewResult<Vec<u8>> {
        // 验证选项
        self.validate_options(options)?;

        // 提取和调整PDF选项
        let pdf_options = self.extract_pdf_options(options);
        let adjusted_options = self.adjust_options_for_quality(pdf_options, &options.quality);

        // 验证PDF选项
        self.validate_pdf_options(&adjusted_options)?;

        // 创建页面构建器
        let page_builder = PageBuilder::new(adjusted_options);

        // 创建SVG到PDF转换器
        let mut converter = SvgToPdfConverter::new(page_builder);

        // 执行转换
        converter.convert_svg_to_pdf(svg_data)
    }
    
    fn supported_formats(&self) -> Vec<OutputFormat> {
        vec![OutputFormat::Pdf]
    }
    
    fn validate_options(&self, options: &RenderOptions) -> PreviewResult<()> {
        match options.format {
            OutputFormat::Pdf => {
                // 如果有PDF选项，进行额外验证
                if let Some(pdf_options) = &options.pdf_options {
                    self.validate_pdf_options(pdf_options)?;
                }
                Ok(())
            }
            _ => Err(PreviewError::UnsupportedFormat {
                format: format!("{:?}", options.format),
            }),
        }
    }
    
    fn default_options(&self) -> RenderOptions {
        RenderOptions {
            format: OutputFormat::Pdf,
            quality: RenderQuality::High,
            pdf_options: Some(self.default_options.clone()),
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        }
    }
    
    async fn estimate_render_time(&self, svg_data: &str) -> PreviewResult<u64> {
        let complexity = self.estimate_complexity(svg_data);
        let svg_size = svg_data.len();
        
        // 基础时间 + 复杂度影响 + 大小影响
        let base_time = 100; // 基础100ms
        let complexity_time = complexity * 5; // 每个复杂元素5ms
        let size_time = (svg_size / 1000) as u32 * 2; // 每KB 2ms
        
        let total_time = (base_time + complexity_time + size_time).min(2000); // 最大2秒
        Ok(total_time as u64)
    }
}