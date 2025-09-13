use crate::types::preview_types::{PdfOptions, PageSize, Orientation, Margins};
use crate::preview::formats::RenderQuality;

/// PDF配置工具类
pub struct PdfConfig;

impl PdfConfig {
    /// 获取预设配置
    pub fn get_preset_config(preset: &str) -> Option<PdfOptions> {
        match preset {
            "document" => Some(Self::document_preset()),
            "report" => Some(Self::report_preset()),
            "invoice" => Some(Self::invoice_preset()),
            "letter" => Some(Self::letter_preset()),
            _ => None,
        }
    }

    /// 文档预设：标准A4文档
    pub fn document_preset() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::A4,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 25.0,
                right: 20.0,
                bottom: 25.0,
                left: 20.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.7".to_string(),
        }
    }

    /// 报告预设：A4横向，适合表格
    pub fn report_preset() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::A4,
            orientation: Orientation::Landscape,
            margins: Margins {
                top: 15.0,
                right: 15.0,
                bottom: 15.0,
                left: 15.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.7".to_string(),
        }
    }

    /// 发票预设：紧凑布局
    pub fn invoice_preset() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::A4,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 10.0,
                right: 10.0,
                bottom: 10.0,
                left: 10.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.4".to_string(), // 更好的兼容性
        }
    }

    /// 信件预设：Letter格式
    pub fn letter_preset() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::Letter,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 25.4,  // 1 inch
                right: 25.4,
                bottom: 25.4,
                left: 25.4,
            },
            embed_fonts: true,
            compress_images: false, // 信件通常需要高质量
            pdf_version: "1.7".to_string(),
        }
    }

    /// 根据质量级别调整配置
    pub fn adjust_for_quality(mut config: PdfOptions, quality: RenderQuality) -> PdfOptions {
        match quality {
            RenderQuality::Draft => {
                config.compress_images = true;
                config.embed_fonts = false;
                config.pdf_version = "1.4".to_string();
            }
            RenderQuality::Standard => {
                config.compress_images = true;
                config.embed_fonts = true;
            }
            RenderQuality::High => {
                config.compress_images = false;
                config.embed_fonts = true;
            }
            RenderQuality::Print => {
                config.compress_images = false;
                config.embed_fonts = true;
                config.pdf_version = "2.0".to_string();
            }
        }
        config
    }

    /// 验证配置的合理性
    pub fn validate_config(config: &PdfOptions) -> Result<(), String> {
        // 验证页面尺寸
        let (width, height) = match &config.page_size {
            PageSize::Custom { width, height } => (*width, *height),
            _ => return Ok(()), // 内置尺寸都是有效的
        };

        if width <= 0.0 || height <= 0.0 {
            return Err("Custom page dimensions must be positive".to_string());
        }

        if width > 10000.0 || height > 10000.0 {
            return Err("Page dimensions are too large (max 10000mm)".to_string());
        }

        // 验证边距
        let margins = &config.margins;
        if margins.top < 0.0 || margins.right < 0.0 || 
           margins.bottom < 0.0 || margins.left < 0.0 {
            return Err("Margins must be non-negative".to_string());
        }

        // 验证边距不能太大
        if margins.left + margins.right >= width * 0.8 ||
           margins.top + margins.bottom >= height * 0.8 {
            return Err("Margins are too large for the page size".to_string());
        }

        Ok(())
    }
}