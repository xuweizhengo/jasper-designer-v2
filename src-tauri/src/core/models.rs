use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ===== 基础ID类型 =====

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ElementId(pub String);

impl ElementId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ResourceId(pub String);

// ===== 核心元素模型 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    pub id: ElementId,
    pub element_type: ElementType,
    pub geometry: Geometry,
    pub style: Style,
    pub content: Option<Content>,
    pub metadata: Metadata,
    pub children: Vec<Element>,
    pub visible: bool,
    pub locked: bool,
}

// ===== 元素类型 =====

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ElementType {
    Text,
    Rectangle,
    Ellipse,
    Line,
    Path,
    Image,
    Group,
    // 兼容旧版本
    Rect,
    Circle,
}

impl ElementType {
    /// 转换为统一的类型
    pub fn normalize(&self) -> Self {
        match self {
            ElementType::Rect => ElementType::Rectangle,
            ElementType::Circle => ElementType::Ellipse,
            _ => self.clone(),
        }
    }
}

// ===== 几何信息 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Geometry {
    pub bounds: Rectangle,
    pub transform: Transform,
    pub clip: Option<ClipPath>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rectangle {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

impl Rectangle {
    pub fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self { x, y, width, height }
    }

    pub fn from_points(x1: f32, y1: f32, x2: f32, y2: f32) -> Self {
        Self {
            x: x1.min(x2),
            y: y1.min(y2),
            width: (x2 - x1).abs(),
            height: (y2 - y1).abs(),
        }
    }

    pub fn center(&self) -> Point {
        Point {
            x: self.x + self.width / 2.0,
            y: self.y + self.height / 2.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn zero() -> Self {
        Self { x: 0.0, y: 0.0 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transform {
    pub translate: Option<Point>,
    pub scale: Option<Point>,
    pub rotate: Option<f32>,
    pub skew: Option<Point>,
    pub origin: Option<Point>,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            translate: None,
            scale: None,
            rotate: None,
            skew: None,
            origin: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipPath {
    pub path: String,
    pub fill_rule: FillRule,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FillRule {
    NonZero,
    EvenOdd,
}

// ===== 样式信息 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Style {
    pub fill: FillStyle,
    pub stroke: StrokeStyle,
    pub text: TextStyle,
    pub effects: Effects,
    pub opacity: f32,
    pub blend_mode: BlendMode,
}

impl Default for Style {
    fn default() -> Self {
        Self {
            fill: FillStyle::default(),
            stroke: StrokeStyle::default(),
            text: TextStyle::default(),
            effects: Effects::default(),
            opacity: 1.0,
            blend_mode: BlendMode::Normal,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FillStyle {
    pub color: Option<Color>,
    pub gradient: Option<Gradient>,
    pub pattern: Option<Pattern>,
}

impl Default for FillStyle {
    fn default() -> Self {
        Self {
            color: None,
            gradient: None,
            pattern: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StrokeStyle {
    pub color: Option<Color>,
    pub width: f32,
    pub dash_array: Option<Vec<f32>>,
    pub dash_offset: f32,
    pub line_cap: LineCap,
    pub line_join: LineJoin,
    pub miter_limit: f32,
}

impl Default for StrokeStyle {
    fn default() -> Self {
        Self {
            color: None,
            width: 1.0,
            dash_array: None,
            dash_offset: 0.0,
            line_cap: LineCap::Butt,
            line_join: LineJoin::Miter,
            miter_limit: 10.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum LineCap {
    Butt,
    Round,
    Square,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum LineJoin {
    Miter,
    Round,
    Bevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextStyle {
    pub font_family: String,
    pub font_size: f32,
    pub font_weight: FontWeight,
    pub font_style: FontStyle,
    pub text_align: TextAlign,
    pub text_baseline: TextBaseline,
    pub line_height: f32,
    pub letter_spacing: f32,
    pub text_decoration: TextDecoration,
}

impl Default for TextStyle {
    fn default() -> Self {
        Self {
            font_family: "Arial".to_string(),
            font_size: 14.0,
            font_weight: FontWeight::Normal,
            font_style: FontStyle::Normal,
            text_align: TextAlign::Left,
            text_baseline: TextBaseline::Alphabetic,
            line_height: 1.2,
            letter_spacing: 0.0,
            text_decoration: TextDecoration::None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FontWeight {
    Thin,
    ExtraLight,
    Light,
    Normal,
    Medium,
    SemiBold,
    Bold,
    ExtraBold,
    Black,
    #[serde(untagged)]
    Number(u16),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FontStyle {
    Normal,
    Italic,
    Oblique,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TextAlign {
    Left,
    Center,
    Right,
    Justify,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TextBaseline {
    Top,
    Middle,
    Alphabetic,
    Bottom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TextDecoration {
    None,
    Underline,
    Overline,
    LineThrough,
}

// ===== 效果 =====

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Effects {
    pub shadow: Option<Shadow>,
    pub blur: Option<Blur>,
    pub filters: Vec<Filter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Shadow {
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur_radius: f32,
    pub spread: f32,
    pub color: Color,
    pub inset: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Blur {
    pub radius: f32,
    pub blur_type: BlurType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BlurType {
    Gaussian,
    Box,
    Motion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Filter {
    Brightness(f32),
    Contrast(f32),
    Grayscale(f32),
    HueRotate(f32),
    Invert(f32),
    Saturate(f32),
    Sepia(f32),
}

// ===== 颜色 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Color {
    #[serde(rename = "hex")]
    Hex(String),
    #[serde(rename = "rgb")]
    Rgb { r: u8, g: u8, b: u8 },
    #[serde(rename = "rgba")]
    Rgba { r: u8, g: u8, b: u8, a: f32 },
    #[serde(rename = "hsl")]
    Hsl { h: f32, s: f32, l: f32 },
    #[serde(rename = "hsla")]
    Hsla { h: f32, s: f32, l: f32, a: f32 },
    #[serde(rename = "named")]
    Named(String),
}

impl Color {
    pub fn to_hex(&self) -> String {
        match self {
            Color::Hex(hex) => hex.clone(),
            Color::Rgb { r, g, b } => format!("#{:02x}{:02x}{:02x}", r, g, b),
            Color::Rgba { r, g, b, a } => {
                format!("#{:02x}{:02x}{:02x}{:02x}", r, g, b, (a * 255.0) as u8)
            }
            _ => "#000000".to_string(),
        }
    }

    pub fn to_rgba(&self) -> (u8, u8, u8, f32) {
        match self {
            Color::Rgb { r, g, b } => (*r, *g, *b, 1.0),
            Color::Rgba { r, g, b, a } => (*r, *g, *b, *a),
            Color::Hex(hex) => {
                let hex = hex.trim_start_matches('#');
                let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
                let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
                let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
                let a = if hex.len() >= 8 {
                    u8::from_str_radix(&hex[6..8], 16).unwrap_or(255) as f32 / 255.0
                } else {
                    1.0
                };
                (r, g, b, a)
            }
            _ => (0, 0, 0, 1.0),
        }
    }
}

// ===== 渐变 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Gradient {
    Linear(LinearGradient),
    Radial(RadialGradient),
    Conic(ConicGradient),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LinearGradient {
    pub start: Point,
    pub end: Point,
    pub stops: Vec<GradientStop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RadialGradient {
    pub center: Point,
    pub radius: f32,
    pub focal_point: Option<Point>,
    pub stops: Vec<GradientStop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConicGradient {
    pub center: Point,
    pub angle: f32,
    pub stops: Vec<GradientStop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GradientStop {
    pub offset: f32,
    pub color: Color,
}

// ===== 图案 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pattern {
    pub image: ResourceId,
    pub repeat: PatternRepeat,
    pub transform: Option<Transform>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PatternRepeat {
    Repeat,
    RepeatX,
    RepeatY,
    NoRepeat,
}

// ===== 混合模式 =====

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum BlendMode {
    Normal,
    Multiply,
    Screen,
    Overlay,
    Darken,
    Lighten,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Hue,
    Saturation,
    Color,
    Luminosity,
}

// ===== 内容类型 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type")]
pub enum Content {
    Text(TextContent),
    Image(ImageContent),
    Path(PathContent),
    Shape(ShapeContent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextContent {
    pub text: String,
    pub spans: Vec<TextSpan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextSpan {
    pub start: usize,
    pub end: usize,
    pub style: TextStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageContent {
    pub source: ImageSource,
    pub fit: ImageFit,
    pub alignment: ImageAlignment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ImageSource {
    Url(String),
    Data(String),
    Resource(ResourceId),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ImageFit {
    Fill,
    Contain,
    Cover,
    None,
    ScaleDown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageAlignment {
    pub x: f32, // 0.0 = left, 0.5 = center, 1.0 = right
    pub y: f32, // 0.0 = top, 0.5 = center, 1.0 = bottom
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathContent {
    pub commands: String, // SVG path data
    pub fill_rule: FillRule,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShapeContent {
    Rectangle {
        corner_radius: Option<f32>,
    },
    Ellipse,
    Line {
        start: Point,
        end: Point,
    },
    Polygon {
        points: Vec<Point>,
    },
    Star {
        points: u32,
        inner_radius: f32,
        outer_radius: f32,
    },
}

// ===== 元数据 =====

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub name: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub custom: HashMap<String, serde_json::Value>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub version: Option<u32>,
}

// ===== 导出格式 =====

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum ExportFormat {
    Png,
    Jpeg,
    Webp,
    Pdf,
    Svg,
    Excel,
    Word,
    PowerPoint,
    Eps,
    Html,
    Json,
}

// ===== 导出选项 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOptions {
    pub format: ExportFormat,
    pub quality: Option<f32>,
    pub dpi: Option<u32>,
    pub scale: Option<f32>,
    pub background: Option<Color>,
    pub embed_fonts: Option<bool>,
    pub embed_images: Option<bool>,
    pub compress: Option<bool>,
    pub metadata: Option<HashMap<String, String>>,
}

// ===== 验证结果 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
    pub error_type: ValidationErrorType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ValidationErrorType {
    MissingRequired,
    InvalidValue,
    TypeMismatch,
    OutOfRange,
    Incompatible,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationWarning {
    pub path: String,
    pub message: String,
    pub severity: WarningSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WarningSeverity {
    Low,
    Medium,
    High,
}

// ===== 导出结果 =====

#[derive(Debug, Clone)]
pub struct ExportResult {
    pub data: Vec<u8>,
    pub format: ExportFormat,
    pub metadata: HashMap<String, String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_element_creation() {
        let element = Element {
            id: ElementId::new("test"),
            element_type: ElementType::Rectangle,
            geometry: Geometry {
                bounds: Rectangle::new(0.0, 0.0, 100.0, 100.0),
                transform: Transform::default(),
                clip: None,
            },
            style: Style::default(),
            content: None,
            metadata: Metadata::default(),
            children: vec![],
            visible: true,
            locked: false,
        };

        assert_eq!(element.id.0, "test");
        assert_eq!(element.element_type, ElementType::Rectangle);
    }

    #[test]
    fn test_color_conversion() {
        let color = Color::Hex("#FF0000".to_string());
        assert_eq!(color.to_hex(), "#FF0000");

        let (r, g, b, a) = color.to_rgba();
        assert_eq!((r, g, b), (255, 0, 0));
        assert_eq!(a, 1.0);
    }

    #[test]
    fn test_rectangle_center() {
        let rect = Rectangle::new(10.0, 20.0, 30.0, 40.0);
        let center = rect.center();
        assert_eq!(center.x, 25.0);
        assert_eq!(center.y, 40.0);
    }
}