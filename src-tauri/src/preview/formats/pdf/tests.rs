#[cfg(test)]
mod tests {
    use super::*;
    use crate::preview::formats::{FormatRenderer, OutputFormat, RenderOptions, RenderQuality};
    use crate::types::preview_types::{PdfOptions, PageSize, Orientation, Margins};
    use std::collections::HashMap;

    /// 创建测试用的PDF选项
    fn create_test_pdf_options() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::A4,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 20.0,
                right: 20.0,
                bottom: 20.0,
                left: 20.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.7".to_string(),
        }
    }

    /// 创建测试用的渲染选项
    fn create_test_render_options() -> RenderOptions {
        RenderOptions {
            format: OutputFormat::Pdf,
            quality: RenderQuality::High,
            pdf_options: Some(create_test_pdf_options()),
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        }
    }

    /// 创建测试SVG
    fn create_test_svg() -> String {
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="30" fill="blue"/>
            <text x="50" y="30" text-anchor="middle" font-family="Arial" font-size="12">Test PDF</text>
        </svg>"#.to_string()
    }

    #[test]
    fn test_pdf_renderer_creation() {
        let renderer = crate::preview::formats::pdf::PdfRenderer::new();
        let supported_formats = renderer.supported_formats();
        
        assert_eq!(supported_formats.len(), 1);
        assert!(supported_formats.contains(&OutputFormat::Pdf));
    }

    #[test]
    fn test_pdf_options_validation() {
        let renderer = crate::preview::formats::pdf::PdfRenderer::new();
        let valid_options = create_test_render_options();
        
        // 测试有效选项
        assert!(renderer.validate_options(&valid_options).is_ok());
        
        // 测试无效格式
        let mut invalid_options = valid_options.clone();
        invalid_options.format = OutputFormat::Png;
        assert!(renderer.validate_options(&invalid_options).is_err());
    }

    #[test]
    fn test_pdf_config_presets() {
        use crate::preview::formats::pdf::config::PdfConfig;
        
        // 测试文档预设
        let doc_config = PdfConfig::document_preset();
        assert_eq!(doc_config.page_size, PageSize::A4);
        assert_eq!(doc_config.orientation, Orientation::Portrait);
        
        // 测试报告预设
        let report_config = PdfConfig::report_preset();
        assert_eq!(report_config.orientation, Orientation::Landscape);
        
        // 测试预设获取
        let preset_config = PdfConfig::get_preset_config("document");
        assert!(preset_config.is_some());
        
        let invalid_preset = PdfConfig::get_preset_config("invalid");
        assert!(invalid_preset.is_none());
    }

    #[test]
    fn test_pdf_config_validation() {
        use crate::preview::formats::pdf::config::PdfConfig;
        
        // 测试有效配置
        let valid_config = create_test_pdf_options();
        assert!(PdfConfig::validate_config(&valid_config).is_ok());
        
        // 测试无效的自定义尺寸
        let invalid_size_config = PdfOptions {
            page_size: PageSize::Custom { width: -10.0, height: 100.0 },
            ..valid_config.clone()
        };
        assert!(PdfConfig::validate_config(&invalid_size_config).is_err());
        
        // 测试过大的边距
        let invalid_margin_config = PdfOptions {
            margins: Margins {
                top: 100.0,
                right: 100.0,
                bottom: 100.0,
                left: 100.0,
            },
            ..valid_config
        };
        assert!(PdfConfig::validate_config(&invalid_margin_config).is_err());
    }

    #[test]
    fn test_page_builder() {
        use crate::preview::formats::pdf::page_builder::PageBuilder;
        
        let options = create_test_pdf_options();
        let builder = PageBuilder::new(options);
        
        // 测试页面尺寸计算
        let (width, height) = builder.calculate_page_dimensions();
        assert_eq!(width, 210.0); // A4宽度
        assert_eq!(height, 297.0); // A4高度
        
        // 测试内容区域计算
        let (content_x, content_y, content_width, content_height) = builder.calculate_content_area();
        assert_eq!(content_x, 20.0); // 左边距
        assert_eq!(content_y, 20.0); // 底边距
        assert_eq!(content_width, 170.0); // 210 - 20 - 20
        assert_eq!(content_height, 257.0); // 297 - 20 - 20
    }

    #[test]
    fn test_font_manager() {
        use crate::preview::formats::pdf::font_manager::FontManager;
        
        let mut font_manager = FontManager::new();
        
        // 测试文本宽度计算
        let width = font_manager.calculate_text_width("Hello", 12.0, "Arial");
        assert!(width > 0.0);
        assert!(width < 100.0); // 合理范围
        
        // 测试清理缓存
        font_manager.clear_cache();
        // 缓存清理后应该正常工作
        let width2 = font_manager.calculate_text_width("Hello", 12.0, "Arial");
        assert_eq!(width, width2); // 结果应该一致
    }

    #[tokio::test]
    async fn test_pdf_render_estimate() {
        let renderer = crate::preview::formats::pdf::PdfRenderer::new();
        let svg = create_test_svg();
        
        let estimate = renderer.estimate_render_time(&svg).await;
        assert!(estimate.is_ok());
        
        let time = estimate.unwrap();
        assert!(time > 0);
        assert!(time < 5000); // 应该在合理范围内
    }

    #[test]
    fn test_quality_adjustment() {
        use crate::preview::formats::pdf::config::PdfConfig;
        
        let base_config = create_test_pdf_options();
        
        // 测试草稿质量
        let draft_config = PdfConfig::adjust_for_quality(base_config.clone(), RenderQuality::Draft);
        assert_eq!(draft_config.embed_fonts, false);
        assert_eq!(draft_config.compress_images, true);
        
        // 测试印刷质量
        let print_config = PdfConfig::adjust_for_quality(base_config, RenderQuality::Print);
        assert_eq!(print_config.embed_fonts, true);
        assert_eq!(print_config.compress_images, false);
        assert_eq!(print_config.pdf_version, "2.0");
    }
}