#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::element::{ReportElement, ElementId, ElementContent, TextStyle, TextAlign, Position, Size};
    use crate::preview::formats::{OutputFormat, RenderQuality, RenderOptions};
    use std::collections::HashMap;

    /// 创建测试用的ReportElement
    fn create_test_element() -> ReportElement {
        ReportElement {
            id: ElementId::new(),
            position: Position { x: 10.0, y: 20.0 },
            size: Size { width: 100.0, height: 50.0 },
            content: ElementContent::Text {
                content: "Test Element".to_string(),
                style: TextStyle {
                    font_family: "Arial".to_string(),
                    font_size: 14.0,
                    font_weight: "normal".to_string(),
                    color: "#000000".to_string(),
                    align: TextAlign::Left,
                    border: None,
                    background: None,
                },
            },
            z_index: 0,
            visible: true,
            locked: false,
            name: None,
        }
    }

    /// 创建测试用的RenderOptions
    fn create_test_render_options(format: OutputFormat) -> RenderOptions {
        RenderOptions {
            format,
            quality: RenderQuality::High,
            custom_properties: HashMap::new(),
        }
    }

    #[test]
    fn test_svg_converter_element_to_svg() {
        let element = create_test_element();
        let result = crate::preview::svg_converter::SvgConverter::element_to_svg(&element);
        
        assert!(result.is_ok());
        let svg = result.unwrap();
        
        // 验证SVG包含基本元素
        assert!(svg.contains(&element.id));
        assert!(svg.contains("10")); // x position
        assert!(svg.contains("20")); // y position
        assert!(svg.contains("100")); // width
        assert!(svg.contains("50")); // height
    }

    #[test]
    fn test_svg_converter_elements_to_svg() {
        let elements = vec![
            create_test_element(),
            ReportElement {
                id: ElementId::new(),
                position: Position { x: 30.0, y: 40.0 },
                size: Size { width: 80.0, height: 60.0 },
                content: ElementContent::Text {
                    content: "Test Element 2".to_string(),
                    style: TextStyle {
                        font_family: "Arial".to_string(),
                        font_size: 12.0,
                        font_weight: "normal".to_string(),
                        color: "#333333".to_string(),
                        align: TextAlign::Center,
                        border: None,
                        background: None,
                    },
                },
                z_index: 1,
                visible: true,
                locked: false,
                name: Some("Test Element 2".to_string()),
            }
        ];

        let result = crate::preview::svg_converter::SvgConverter::elements_to_svg(&elements);
        
        assert!(result.is_ok());
        let svg = result.unwrap();
        
        // 验证SVG是完整的文档
        assert!(svg.starts_with("<svg"));
        assert!(svg.ends_with("</svg>"));
        
        // 验证包含两个元素的data-element-id
        assert!(svg.matches("data-element-id=").count() >= 2);
        
        // 验证文本内容
        assert!(svg.contains("Test Element"));
        assert!(svg.contains("Test Element 2"));
    }

    #[test]
    fn test_cache_basic_operations() {
        let mut cache = crate::preview::cache::RenderCache::new();
        
        // 测试SVG缓存
        cache.put_svg("key1".to_string(), "svg_content".to_string());
        assert_eq!(cache.get_svg("key1"), Some(&"svg_content".to_string()));
        assert_eq!(cache.get_svg("nonexistent"), None);
        
        // 测试输出缓存
        let test_data = vec![1, 2, 3, 4, 5];
        cache.put_output("key2".to_string(), test_data.clone());
        assert_eq!(cache.get_output("key2"), Some(&test_data));
        
        // 测试统计
        let stats = cache.stats();
        assert_eq!(stats.svg_entries, 1);
        assert_eq!(stats.output_entries, 1);
        assert_eq!(stats.total_entries, 2);
        
        // 测试清空
        cache.clear();
        let stats_after_clear = cache.stats();
        assert_eq!(stats_after_clear.total_entries, 0);
    }

    #[tokio::test]
    async fn test_preview_renderer_creation() {
        let renderer = PreviewRenderer::new();
        let supported_formats = renderer.get_supported_formats();
        
        // 验证支持的格式
        assert!(!supported_formats.is_empty());
        assert!(supported_formats.contains(&OutputFormat::Pdf));
        assert!(supported_formats.contains(&OutputFormat::Png));
    }

    #[tokio::test]
    async fn test_preview_renderer_render_elements() {
        let renderer = PreviewRenderer::new();
        let elements = vec![create_test_element()];
        let options = create_test_render_options(OutputFormat::Png);
        
        // 注意：这会失败，因为我们还没有实现真正的渲染逻辑
        // 但是测试框架已经准备好了
        let result = renderer.render_elements(&elements, &options).await;
        
        // 验证返回结果的结构是正确的
        assert!(result.is_ok());
        let render_result = result.unwrap();
        assert_eq!(render_result.format, OutputFormat::Png);
        
        // 目前应该失败，因为还没实现
        assert!(!render_result.success);
        assert!(render_result.error.is_some());
    }

    #[test]
    fn test_quality_presets() {
        let presets = crate::preview::quality::QualityPresets::new();
        
        // 测试预设存在
        assert!(presets.get("draft").is_some());
        assert!(presets.get("standard").is_some());
        assert!(presets.get("high").is_some());
        assert!(presets.get("print").is_some());
        assert!(presets.get("nonexistent").is_none());
        
        // 测试质量设置的合理性
        let draft = presets.get("draft").unwrap();
        let print = presets.get("print").unwrap();
        
        // 草稿质量应该比印刷质量DPI低
        assert!(draft.dpi < print.dpi);
        // 印刷质量应该有更好的压缩比
        assert!(draft.compression < print.compression);
    }

    #[test]
    fn test_format_renderer_trait_objects() {
        // 测试trait对象的创建和基本功能
        use crate::preview::formats::pdf::PdfRenderer;
        use crate::preview::formats::image::ImageRenderer;
        use crate::preview::formats::excel::ExcelRenderer;
        
        let pdf_renderer = Box::new(PdfRenderer::new()) as Box<dyn crate::preview::formats::FormatRenderer>;
        let image_renderer = Box::new(ImageRenderer::new()) as Box<dyn crate::preview::formats::FormatRenderer>;
        let excel_renderer = Box::new(ExcelRenderer::new()) as Box<dyn crate::preview::formats::FormatRenderer>;
        
        // 验证支持的格式
        let pdf_formats = pdf_renderer.supported_formats();
        let image_formats = image_renderer.supported_formats();
        let excel_formats = excel_renderer.supported_formats();
        
        assert!(pdf_formats.contains(&OutputFormat::Pdf));
        assert!(image_formats.contains(&OutputFormat::Png));
        assert!(excel_formats.contains(&OutputFormat::Excel));
    }

    #[test]
    fn test_svg_optimization() {
        let messy_svg = r#"
        <svg>
            
            <rect x="0" y="0" width="100" height="100"/>
            
            <text>Test</text>
            
        </svg>
        "#;
        
        let optimized = crate::preview::svg_converter::SvgConverter::optimize_svg(messy_svg);
        
        // 验证优化后的SVG更紧凑，但保留了结构
        assert!(optimized.len() < messy_svg.len());
        assert!(optimized.contains("rect"));
        assert!(optimized.contains("text"));
    }

    #[test]
    fn test_different_element_types() {
        use crate::core::element::{ElementContent, BorderStyle, BorderStyleType, LineStyleType};
        
        // 测试矩形元素
        let rectangle_element = ReportElement {
            id: ElementId::new(),
            position: Position { x: 0.0, y: 0.0 },
            size: Size { width: 100.0, height: 50.0 },
            content: ElementContent::Rectangle {
                fill_color: Some("#ff0000".to_string()),
                border: Some(BorderStyle {
                    color: "#000000".to_string(),
                    width: 2.0,
                    style: BorderStyleType::Solid,
                }),
                corner_radius: Some(5.0),
                opacity: Some(0.8),
            },
            z_index: 0,
            visible: true,
            locked: false,
            name: None,
        };

        let svg_result = crate::preview::svg_converter::SvgConverter::element_to_svg(&rectangle_element);
        assert!(svg_result.is_ok());
        let svg = svg_result.unwrap();
        assert!(svg.contains("rect"));
        assert!(svg.contains("#ff0000"));
        assert!(svg.contains("rx=\"5\""));

        // 测试线条元素
        let line_element = ReportElement {
            id: ElementId::new(),
            position: Position { x: 10.0, y: 10.0 },
            size: Size { width: 200.0, height: 20.0 },
            content: ElementContent::Line {
                color: "#0000ff".to_string(),
                width: 3.0,
                line_style: Some(LineStyleType::Dashed),
                start_cap: None,
                end_cap: None,
                opacity: Some(1.0),
            },
            z_index: 0,
            visible: true,
            locked: false,
            name: None,
        };

        let svg_result = crate::preview::svg_converter::SvgConverter::element_to_svg(&line_element);
        assert!(svg_result.is_ok());
        let svg = svg_result.unwrap();
        assert!(svg.contains("line"));
        assert!(svg.contains("#0000ff"));
        assert!(svg.contains("8,4")); // Dashed pattern
    }

    #[test]
    fn test_text_alignment() {
        for align in [TextAlign::Left, TextAlign::Center, TextAlign::Right] {
            let text_element = ReportElement {
                id: ElementId::new(),
                position: Position { x: 0.0, y: 0.0 },
                size: Size { width: 100.0, height: 30.0 },
                content: ElementContent::Text {
                    content: "Aligned Text".to_string(),
                    style: TextStyle {
                        font_family: "Arial".to_string(),
                        font_size: 16.0,
                        font_weight: "normal".to_string(),
                        color: "#000000".to_string(),
                        align,
                        border: None,
                        background: None,
                    },
                },
                z_index: 0,
                visible: true,
                locked: false,
                name: None,
            };

            let svg_result = crate::preview::svg_converter::SvgConverter::element_to_svg(&text_element);
            assert!(svg_result.is_ok());
            let svg = svg_result.unwrap();
            
            match align {
                TextAlign::Left => assert!(svg.contains("text-anchor=\"start\"")),
                TextAlign::Center => assert!(svg.contains("text-anchor=\"middle\"")),
                TextAlign::Right => assert!(svg.contains("text-anchor=\"end\"")),
            }
        }
    }

    #[test]
    fn test_invisible_element() {
        let mut element = create_test_element();
        element.visible = false;

        let svg_result = crate::preview::svg_converter::SvgConverter::element_to_svg(&element);
        assert!(svg_result.is_ok());
        let svg = svg_result.unwrap();
        
        // 不可见元素应该返回空字符串
        assert!(svg.is_empty());
    }

    #[test]
    fn test_xml_escaping() {
        let element = ReportElement {
            id: ElementId::new(),
            position: Position { x: 0.0, y: 0.0 },
            size: Size { width: 100.0, height: 30.0 },
            content: ElementContent::Text {
                content: "Text with <special> & \"quotes\"".to_string(),
                style: TextStyle {
                    font_family: "Arial".to_string(),
                    font_size: 14.0,
                    font_weight: "normal".to_string(),
                    color: "#000000".to_string(),
                    align: TextAlign::Left,
                    border: None,
                    background: None,
                },
            },
            z_index: 0,
            visible: true,
            locked: false,
            name: None,
        };

        let svg_result = crate::preview::svg_converter::SvgConverter::element_to_svg(&element);
        assert!(svg_result.is_ok());
        let svg = svg_result.unwrap();
        
        // 验证XML转义
        assert!(svg.contains("&lt;special&gt;"));
        assert!(svg.contains("&amp;"));
        assert!(svg.contains("&quot;"));
    }

    #[test]
    fn test_error_types() {
        use crate::preview::PreviewError;
        
        // 测试错误类型的创建和序列化
        let render_error = PreviewError::RenderError {
            message: "Test render error".to_string(),
        };
        
        let unsupported_error = PreviewError::UnsupportedFormat {
            format: "unknown".to_string(),
        };
        
        let timeout_error = PreviewError::Timeout { timeout_ms: 5000 };
        
        // 验证错误信息格式
        assert!(render_error.to_string().contains("Test render error"));
        assert!(unsupported_error.to_string().contains("unknown"));
        assert!(timeout_error.to_string().contains("5000"));
    }
}