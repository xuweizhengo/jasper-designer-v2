use crate::preview::{PreviewError, PreviewResult};
use crate::core::element::{ReportElement, ElementContent, TextAlign, BorderStyleType, LineStyleType, LineCapType};

/// SVG转换器 - 将ReportElement转换为SVG
pub struct SvgConverter;

impl SvgConverter {
    /// 将单个元素转换为SVG
    pub fn element_to_svg(element: &ReportElement) -> PreviewResult<String> {
        if !element.visible {
            return Ok(String::new());
        }

        let transform = format!("translate({}, {})", element.position.x, element.position.y);
        let element_id = element.id.to_string();

        match &element.content {
            ElementContent::Text { content, style } => {
                Self::text_to_svg(&element_id, &transform, content, style, &element.size)
            }
            ElementContent::Rectangle { fill_color, border, corner_radius, opacity } => {
                Self::rectangle_to_svg(&element_id, &transform, fill_color, border, corner_radius, opacity, &element.size)
            }
            ElementContent::Line { color, width, line_style, start_cap, end_cap, opacity } => {
                Self::line_to_svg(&element_id, &transform, color, *width, line_style, start_cap, end_cap, opacity, &element.size)
            }
            ElementContent::DataField { expression, format: _, style } => {
                // DataField渲染为文本，使用表达式作为占位符内容
                let display_text = if expression.is_empty() {
                    "[数据字段]".to_string()
                } else {
                    format!("[{}]", expression)
                };
                Self::text_to_svg(&element_id, &transform, &display_text, style, &element.size)
            }
            ElementContent::Image { src: _, alt } => {
                // 图片占位符实现
                let display_text = alt.as_deref().unwrap_or("[图片]");
                Ok(format!(
                    r##"<g data-element-id="{}" transform="{}">
                        <rect width="{}" height="{}" fill="#f0f0f0" stroke="#cccccc" stroke-width="1" stroke-dasharray="5,5"/>
                        <text x="{}" y="{}" font-family="Arial" font-size="12" fill="#666" text-anchor="middle" dominant-baseline="middle">{}</text>
                    </g>"##,
                    element_id,
                    transform,
                    element.size.width,
                    element.size.height,
                    element.size.width / 2.0,
                    element.size.height / 2.0,
                    display_text
                ))
            }
        }
    }

    /// 文本元素转SVG
    fn text_to_svg(
        element_id: &str,
        transform: &str,
        content: &str,
        style: &crate::core::element::TextStyle,
        size: &crate::core::element::Size,
    ) -> PreviewResult<String> {
        let mut svg = String::new();
        svg.push_str(&format!(r#"<g data-element-id="{}" transform="{}">"#, element_id, transform));

        // 背景层
        if let Some(background) = &style.background {
            let padding = background.padding.unwrap_or(0.0);
            let opacity = background.opacity.unwrap_or(1.0);
            svg.push_str(&format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" fill-opacity="{}" />"#,
                -padding,
                -padding,
                size.width + 2.0 * padding,
                size.height + 2.0 * padding,
                background.color,
                opacity
            ));
        }

        // 边框层
        if let Some(border) = &style.border {
            let padding = style.background.as_ref().and_then(|bg| bg.padding).unwrap_or(0.0);
            let stroke_dasharray = match border.style {
                BorderStyleType::Dashed => "5,5",
                BorderStyleType::Dotted => "2,2",
                _ => "none",
            };
            let radius = border.radius.unwrap_or(0.0);

            svg.push_str(&format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="none" stroke="{}" stroke-width="{}" stroke-dasharray="{}" rx="{}" ry="{}" />"#,
                -padding,
                -padding,
                size.width + 2.0 * padding,
                size.height + 2.0 * padding,
                border.color,
                border.width,
                stroke_dasharray,
                radius,
                radius
            ));
        }

        // 文本锚点和位置计算
        let (text_anchor, x_position) = match style.align {
            TextAlign::Left => ("start", 0.0),
            TextAlign::Center => ("middle", size.width / 2.0),
            TextAlign::Right => ("end", size.width),
        };

        // 文本行处理
        let lines: Vec<&str> = content.split('\n').collect();
        let line_height = style.font_size * 1.2; // 行高为字号的1.2倍
        let start_y = style.font_size; // 第一行的y位置

        for (index, line) in lines.iter().enumerate() {
            let y_position = start_y + (index as f64) * line_height;
            svg.push_str(&format!(
                r#"<text x="{}" y="{}" font-family="{}" font-size="{}" font-weight="{}" fill="{}" text-anchor="{}" dominant-baseline="hanging" text-rendering="optimizeLegibility" shape-rendering="geometricPrecision">{}</text>"#,
                x_position,
                y_position,
                style.font_family,
                style.font_size,
                style.font_weight,
                style.color,
                text_anchor,
                Self::escape_xml(line)
            ));
        }

        svg.push_str("</g>");
        Ok(svg)
    }

    /// 矩形元素转SVG
    fn rectangle_to_svg(
        element_id: &str,
        transform: &str,
        fill_color: &Option<String>,
        border: &Option<crate::core::element::BorderStyle>,
        corner_radius: &Option<f64>,
        opacity: &Option<f64>,
        size: &crate::core::element::Size,
    ) -> PreviewResult<String> {
        let fill = fill_color.as_deref().unwrap_or("transparent");
        let fill_opacity = opacity.unwrap_or(1.0);
        let radius = corner_radius.unwrap_or(0.0);

        let (stroke, stroke_width, stroke_dasharray) = if let Some(border) = border {
            let dasharray = match border.style {
                BorderStyleType::Dashed => "5,5",
                BorderStyleType::Dotted => "2,2",
                _ => "none",
            };
            (border.color.as_str(), border.width, dasharray)
        } else {
            ("none", 0.0, "none")
        };

        Ok(format!(
            r#"<g data-element-id="{}" transform="{}">
                <rect x="0" y="0" width="{}" height="{}" rx="{}" ry="{}" fill="{}" fill-opacity="{}" stroke="{}" stroke-width="{}" stroke-opacity="{}" stroke-dasharray="{}" />
            </g>"#,
            element_id,
            transform,
            size.width,
            size.height,
            radius,
            radius,
            fill,
            fill_opacity,
            stroke,
            stroke_width,
            fill_opacity,
            stroke_dasharray
        ))
    }

    /// 线条元素转SVG
    fn line_to_svg(
        element_id: &str,
        transform: &str,
        color: &str,
        width: f64,
        line_style: &Option<LineStyleType>,
        start_cap: &Option<LineCapType>,
        end_cap: &Option<LineCapType>,
        opacity: &Option<f64>,
        size: &crate::core::element::Size,
    ) -> PreviewResult<String> {
        let stroke_dasharray = match line_style.as_ref().unwrap_or(&LineStyleType::Solid) {
            LineStyleType::Dashed => "8,4",
            LineStyleType::Dotted => "2,2",
            LineStyleType::DashDot => "8,4,2,4",
            LineStyleType::Solid => "none",
        };

        let stroke_opacity = opacity.unwrap_or(1.0);

        let mut svg = String::new();
        svg.push_str(&format!(r#"<g data-element-id="{}" transform="{}">"#, element_id, transform));

        // 主线条
        svg.push_str(&format!(
            r#"<line x1="0" y1="{}" x2="{}" y2="{}" stroke="{}" stroke-width="{}" stroke-opacity="{}" stroke-dasharray="{}" />"#,
            size.height / 2.0,
            size.width,
            size.height / 2.0,
            color,
            width,
            stroke_opacity,
            stroke_dasharray
        ));

        // TODO: 实现线条端点装饰 (箭头、圆点等)
        if start_cap.is_some() || end_cap.is_some() {
            // 暂时跳过端点装饰的实现
        }

        svg.push_str("</g>");
        Ok(svg)
    }

    /// 将多个元素转换为完整的SVG文档
    pub fn elements_to_svg(elements: &[ReportElement]) -> PreviewResult<String> {
        if elements.is_empty() {
            return Ok(r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"></svg>"#.to_string());
        }

        // 计算画布边界
        let (min_x, min_y, max_x, max_y) = Self::calculate_bounds(elements);
        let margin = 20.0; // 边距
        let viewbox_x = (min_x - margin).max(0.0);
        let viewbox_y = (min_y - margin).max(0.0);
        let viewbox_width = max_x - min_x + 2.0 * margin;
        let viewbox_height = max_y - min_y + 2.0 * margin;

        let mut svg_content = String::new();
        svg_content.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="{} {} {} {}">"#,
            viewbox_x, viewbox_y, viewbox_width, viewbox_height
        ));

        // 按z_index排序元素
        let mut sorted_elements = elements.to_vec();
        sorted_elements.sort_by_key(|e| e.z_index);

        for element in &sorted_elements {
            let element_svg = Self::element_to_svg(element)?;
            if !element_svg.is_empty() {
                svg_content.push_str(&element_svg);
            }
        }

        svg_content.push_str("</svg>");
        Ok(svg_content)
    }

    /// 计算元素边界
    fn calculate_bounds(elements: &[ReportElement]) -> (f64, f64, f64, f64) {
        let mut min_x = f64::MAX;
        let mut min_y = f64::MAX;
        let mut max_x = f64::MIN;
        let mut max_y = f64::MIN;

        for element in elements {
            if element.visible {
                min_x = min_x.min(element.position.x);
                min_y = min_y.min(element.position.y);
                max_x = max_x.max(element.position.x + element.size.width);
                max_y = max_y.max(element.position.y + element.size.height);
            }
        }

        // 如果没有可见元素，返回默认边界
        if min_x == f64::MAX {
            (0.0, 0.0, 800.0, 600.0)
        } else {
            (min_x, min_y, max_x, max_y)
        }
    }

    /// 优化SVG内容
    pub fn optimize_svg(svg: &str) -> String {
        // 移除多余的空白和换行，但保留结构
        svg.lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// XML转义
    fn escape_xml(text: &str) -> String {
        text.replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#39;")
    }
}