use crate::core::models::{
    Element, ElementId, ElementType, Geometry, Rectangle, Point, Transform,
    Style, FillStyle, StrokeStyle, TextStyle, Effects, Shadow, Blur, BlurType,
    Color, Content, TextContent, ImageContent, PathContent, ShapeContent,
    Metadata, BlendMode, LineCap, LineJoin, FontWeight, FontStyle as CoreFontStyle,
    TextAlign, TextBaseline, TextDecoration, ImageSource, ImageFit, ImageAlignment,
    FillRule,
};
use crate::core::errors::{AdapterError, AdapterResult};
use crate::commands::skia_export::{
    SkiaRenderElement, ElementBounds, ElementStyle as ApiElementStyle,
    ShadowStyle, ElementTransform, Point as ApiPoint,
};
use std::collections::HashMap;
use serde_json::Value;

/// API适配器 - 转换前端数据到领域模型
pub struct ApiAdapter;

impl ApiAdapter {
    /// 从前端API格式转换到领域模型
    pub fn from_api(api_element: &SkiaRenderElement) -> AdapterResult<Element> {
        let element_type = Self::convert_element_type(&api_element.r#type)?;

        // 转换几何信息
        let geometry = Geometry {
            bounds: Rectangle::new(
                api_element.bounds.x,
                api_element.bounds.y,
                api_element.bounds.width,
                api_element.bounds.height,
            ),
            transform: Self::convert_transform(&api_element.transform)?,
            clip: None, // TODO: 从data中提取clip信息
        };

        // 转换样式
        let style = Self::convert_style(&api_element.style, &api_element.data)?;

        // 转换内容
        let content = Self::extract_content(&element_type, &api_element.data)?;

        // 转换元数据
        let metadata = Self::extract_metadata(&api_element.data)?;

        Ok(Element {
            id: ElementId::new(&api_element.id),
            element_type,
            geometry,
            style,
            content,
            metadata,
            children: Vec::new(), // TODO: 处理子元素
            visible: api_element.visible,
            locked: false, // API中没有locked字段，默认false
        })
    }

    /// 从领域模型转换到前端API格式
    pub fn to_api(element: &Element) -> AdapterResult<SkiaRenderElement> {
        let element_type = Self::element_type_to_string(&element.element_type);

        // 转换边界
        let bounds = ElementBounds {
            x: element.geometry.bounds.x,
            y: element.geometry.bounds.y,
            width: element.geometry.bounds.width,
            height: element.geometry.bounds.height,
        };

        // 转换样式
        let style = Self::style_to_api(&element.style)?;

        // 转换变换
        let transform = Self::transform_to_api(&element.geometry.transform)?;

        // 准备数据字段
        let mut data = HashMap::new();

        // 添加内容相关数据
        if let Some(content) = &element.content {
            Self::content_to_data(content, &mut data)?;
        }

        // 添加元数据
        Self::metadata_to_data(&element.metadata, &mut data);

        Ok(SkiaRenderElement {
            id: element.id.0.clone(),
            r#type: element_type,
            bounds,
            style,
            data,
            visible: element.visible,
            opacity: element.style.opacity,
            z_index: 0, // TODO: 从metadata中提取z_index
            transform: Some(transform),
        })
    }

    /// 批量转换
    pub fn batch_from_api(api_elements: &[SkiaRenderElement]) -> AdapterResult<Vec<Element>> {
        api_elements
            .iter()
            .map(Self::from_api)
            .collect::<Result<Vec<_>, _>>()
    }

    pub fn batch_to_api(elements: &[Element]) -> AdapterResult<Vec<SkiaRenderElement>> {
        elements
            .iter()
            .map(Self::to_api)
            .collect::<Result<Vec<_>, _>>()
    }

    // ===== 私有辅助方法 =====

    fn convert_element_type(type_str: &str) -> AdapterResult<ElementType> {
        match type_str.to_lowercase().as_str() {
            "text" => Ok(ElementType::Text),
            "rect" | "rectangle" => Ok(ElementType::Rectangle),
            "circle" | "ellipse" => Ok(ElementType::Ellipse),
            "line" => Ok(ElementType::Line),
            "path" => Ok(ElementType::Path),
            "image" => Ok(ElementType::Image),
            "group" => Ok(ElementType::Group),
            _ => Err(AdapterError::TypeConversionFailed {
                expected: "valid element type".to_string(),
                actual: type_str.to_string(),
            }),
        }
    }

    fn element_type_to_string(element_type: &ElementType) -> String {
        match element_type {
            ElementType::Text => "text",
            ElementType::Rectangle | ElementType::Rect => "rect",
            ElementType::Ellipse | ElementType::Circle => "circle",
            ElementType::Line => "line",
            ElementType::Path => "path",
            ElementType::Image => "image",
            ElementType::Group => "group",
        }.to_string()
    }

    fn convert_transform(api_transform: &Option<ElementTransform>) -> AdapterResult<Transform> {
        if let Some(t) = api_transform {
            Ok(Transform {
                translate: t.translate.as_ref().map(|p| Point::new(p.x, p.y)),
                scale: t.scale.as_ref().map(|p| Point::new(p.x, p.y)),
                rotate: t.rotate,
                skew: None, // API不支持skew
                origin: t.origin.as_ref().map(|p| Point::new(p.x, p.y)),
            })
        } else {
            Ok(Transform::default())
        }
    }

    fn transform_to_api(transform: &Transform) -> AdapterResult<ElementTransform> {
        Ok(ElementTransform {
            translate: transform.translate.as_ref().map(|p| ApiPoint { x: p.x, y: p.y }),
            scale: transform.scale.as_ref().map(|p| ApiPoint { x: p.x, y: p.y }),
            rotate: transform.rotate,
            origin: transform.origin.as_ref().map(|p| ApiPoint { x: p.x, y: p.y }),
        })
    }

    fn convert_style(
        api_style: &ApiElementStyle,
        data: &HashMap<String, Value>,
    ) -> AdapterResult<Style> {
        let mut style = Style::default();

        // 填充样式
        if let Some(fill_color) = &api_style.fill_color {
            style.fill.color = Some(Self::parse_color(fill_color)?);
        }

        // 描边样式
        if let Some(stroke_color) = &api_style.stroke_color {
            style.stroke.color = Some(Self::parse_color(stroke_color)?);
        }
        if let Some(width) = api_style.stroke_width {
            style.stroke.width = width;
        }

        // 阴影效果
        if let Some(shadow) = &api_style.shadow {
            style.effects.shadow = Some(Shadow {
                offset_x: shadow.offset_x,
                offset_y: shadow.offset_y,
                blur_radius: shadow.blur,
                spread: 0.0, // API中没有spread
                color: Self::parse_color(&shadow.color)?,
                inset: false,
            });
        }

        // 从data中提取其他样式属性
        if let Some(opacity) = data.get("opacity") {
            if let Some(val) = opacity.as_f64() {
                style.opacity = val as f32;
            }
        }

        if let Some(blend_mode) = data.get("blendMode") {
            if let Some(mode) = blend_mode.as_str() {
                style.blend_mode = Self::parse_blend_mode(mode);
            }
        }

        // 文本样式
        Self::extract_text_style(&mut style.text, data);

        Ok(style)
    }

    fn style_to_api(style: &Style) -> AdapterResult<ApiElementStyle> {
        let fill_color = style.fill.color.as_ref().map(|c| c.to_hex());
        let stroke_color = style.stroke.color.as_ref().map(|c| c.to_hex());
        let stroke_width = if style.stroke.width > 0.0 {
            Some(style.stroke.width)
        } else {
            None
        };

        let shadow = style.effects.shadow.as_ref().map(|s| ShadowStyle {
            offset_x: s.offset_x,
            offset_y: s.offset_y,
            blur: s.blur_radius,
            color: s.color.to_hex(),
        });

        let border_radius = None; // TODO: 从data中提取

        Ok(ApiElementStyle {
            fill_color,
            stroke_color,
            stroke_width,
            border_radius,
            shadow,
        })
    }

    fn parse_color(color_str: &str) -> AdapterResult<Color> {
        if color_str.starts_with('#') {
            Ok(Color::Hex(color_str.to_string()))
        } else if color_str.starts_with("rgb") {
            // 简单的RGB解析
            Ok(Color::Named(color_str.to_string()))
        } else {
            Ok(Color::Named(color_str.to_string()))
        }
    }

    fn parse_blend_mode(mode: &str) -> BlendMode {
        match mode.to_lowercase().as_str() {
            "multiply" => BlendMode::Multiply,
            "screen" => BlendMode::Screen,
            "overlay" => BlendMode::Overlay,
            "darken" => BlendMode::Darken,
            "lighten" => BlendMode::Lighten,
            _ => BlendMode::Normal,
        }
    }

    fn extract_text_style(text_style: &mut TextStyle, data: &HashMap<String, Value>) {
        if let Some(font_family) = data.get("fontFamily") {
            if let Some(val) = font_family.as_str() {
                text_style.font_family = val.to_string();
            }
        }

        if let Some(font_size) = data.get("fontSize") {
            if let Some(val) = font_size.as_f64() {
                text_style.font_size = val as f32;
            }
        }

        if let Some(font_weight) = data.get("fontWeight") {
            text_style.font_weight = Self::parse_font_weight(font_weight);
        }

        if let Some(text_align) = data.get("textAlign") {
            if let Some(val) = text_align.as_str() {
                text_style.text_align = Self::parse_text_align(val);
            }
        }

        if let Some(line_height) = data.get("lineHeight") {
            if let Some(val) = line_height.as_f64() {
                text_style.line_height = val as f32;
            }
        }
    }

    fn parse_font_weight(value: &Value) -> FontWeight {
        if let Some(num) = value.as_u64() {
            FontWeight::Number(num as u16)
        } else if let Some(str_val) = value.as_str() {
            match str_val.to_lowercase().as_str() {
                "thin" => FontWeight::Thin,
                "light" => FontWeight::Light,
                "normal" => FontWeight::Normal,
                "medium" => FontWeight::Medium,
                "bold" => FontWeight::Bold,
                "black" => FontWeight::Black,
                _ => FontWeight::Normal,
            }
        } else {
            FontWeight::Normal
        }
    }

    fn parse_text_align(align: &str) -> TextAlign {
        match align.to_lowercase().as_str() {
            "center" => TextAlign::Center,
            "right" => TextAlign::Right,
            "justify" => TextAlign::Justify,
            _ => TextAlign::Left,
        }
    }

    fn extract_content(
        element_type: &ElementType,
        data: &HashMap<String, Value>,
    ) -> AdapterResult<Option<Content>> {
        match element_type {
            ElementType::Text => {
                if let Some(text) = data.get("text") {
                    if let Some(text_str) = text.as_str() {
                        return Ok(Some(Content::Text(TextContent {
                            text: text_str.to_string(),
                            spans: Vec::new(),
                        })));
                    }
                }
            }
            ElementType::Image => {
                if let Some(src) = data.get("src") {
                    if let Some(src_str) = src.as_str() {
                        let source = if src_str.starts_with("data:") {
                            ImageSource::Data(src_str.to_string())
                        } else {
                            ImageSource::Url(src_str.to_string())
                        };

                        return Ok(Some(Content::Image(ImageContent {
                            source,
                            fit: ImageFit::Contain,
                            alignment: ImageAlignment { x: 0.5, y: 0.5 },
                        })));
                    }
                }
            }
            ElementType::Path => {
                if let Some(path_data) = data.get("pathData") {
                    if let Some(path_str) = path_data.as_str() {
                        return Ok(Some(Content::Path(PathContent {
                            commands: path_str.to_string(),
                            fill_rule: FillRule::NonZero,
                        })));
                    }
                }
            }
            _ => {}
        }

        Ok(None)
    }

    fn content_to_data(content: &Content, data: &mut HashMap<String, Value>) -> AdapterResult<()> {
        match content {
            Content::Text(text_content) => {
                data.insert("text".to_string(), Value::String(text_content.text.clone()));
            }
            Content::Image(image_content) => {
                let src = match &image_content.source {
                    ImageSource::Url(url) => url.clone(),
                    ImageSource::Data(data_str) => data_str.clone(),
                    ImageSource::Resource(id) => format!("resource://{}", id.0),
                };
                data.insert("src".to_string(), Value::String(src));
            }
            Content::Path(path_content) => {
                data.insert("pathData".to_string(), Value::String(path_content.commands.clone()));
            }
            Content::Shape(_) => {
                // Shape内容通常通过element_type来确定
            }
        }

        Ok(())
    }

    fn extract_metadata(data: &HashMap<String, Value>) -> AdapterResult<Metadata> {
        let mut metadata = Metadata::default();

        if let Some(name) = data.get("name") {
            if let Some(val) = name.as_str() {
                metadata.name = Some(val.to_string());
            }
        }

        if let Some(description) = data.get("description") {
            if let Some(val) = description.as_str() {
                metadata.description = Some(val.to_string());
            }
        }

        // 将其他未识别的字段放入custom
        for (key, value) in data {
            if !["name", "description", "text", "src", "pathData", "fontFamily",
                 "fontSize", "fontWeight", "textAlign", "lineHeight", "opacity",
                 "blendMode"].contains(&key.as_str()) {
                metadata.custom.insert(key.clone(), value.clone());
            }
        }

        Ok(metadata)
    }

    fn metadata_to_data(metadata: &Metadata, data: &mut HashMap<String, Value>) {
        if let Some(name) = &metadata.name {
            data.insert("name".to_string(), Value::String(name.clone()));
        }

        if let Some(description) = &metadata.description {
            data.insert("description".to_string(), Value::String(description.clone()));
        }

        // 添加自定义字段
        for (key, value) in &metadata.custom {
            data.insert(key.clone(), value.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_element_type_conversion() {
        let api_element = SkiaRenderElement {
            id: "test".to_string(),
            r#type: "rect".to_string(),
            bounds: ElementBounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 100.0,
            },
            style: ApiElementStyle {
                fill_color: Some("#FF0000".to_string()),
                stroke_color: None,
                stroke_width: None,
                border_radius: None,
                shadow: None,
            },
            data: HashMap::new(),
            visible: true,
            opacity: 1.0,
            z_index: 0,
            transform: None,
        };

        let result = ApiAdapter::from_api(&api_element);
        assert!(result.is_ok());

        let element = result.unwrap();
        assert_eq!(element.element_type, ElementType::Rectangle);
        assert_eq!(element.geometry.bounds.width, 100.0);
    }

    #[test]
    fn test_round_trip_conversion() {
        let original = SkiaRenderElement {
            id: "test".to_string(),
            r#type: "text".to_string(),
            bounds: ElementBounds {
                x: 10.0,
                y: 20.0,
                width: 200.0,
                height: 50.0,
            },
            style: ApiElementStyle {
                fill_color: Some("#000000".to_string()),
                stroke_color: None,
                stroke_width: None,
                border_radius: None,
                shadow: None,
            },
            data: {
                let mut data = HashMap::new();
                data.insert("text".to_string(), Value::String("Hello World".to_string()));
                data
            },
            visible: true,
            opacity: 0.9,
            z_index: 1,
            transform: None,
        };

        let element = ApiAdapter::from_api(&original).unwrap();
        let converted = ApiAdapter::to_api(&element).unwrap();

        assert_eq!(original.id, converted.id);
        assert_eq!(original.r#type, converted.r#type);
        assert_eq!(original.bounds.x, converted.bounds.x);
    }
}