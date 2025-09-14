use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transform {
    pub translate: Option<Point>,
    pub scale: Option<Point>,
    pub rotate: Option<f32>,
    pub origin: Option<Point>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Shadow {
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur: f32,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementStyle {
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub fill: Option<String>,
    pub stroke: Option<String>,
    pub stroke_width: Option<f32>,
    pub opacity: Option<f32>,
    pub blur: Option<f32>,
    pub shadow: Option<Shadow>,
    pub clip_path: Option<String>,
    pub blend_mode: Option<BlendMode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BlendMode {
    Normal,
    Multiply,
    Screen,
    Overlay,
    Darken,
    Lighten,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderElement {
    pub id: String,
    #[serde(rename = "type")]
    pub element_type: ElementType,
    pub transform: Transform,
    pub style: ElementStyle,
    pub data: serde_json::Value,
    pub visible: bool,
    pub locked: bool,
    pub children: Option<Vec<RenderElement>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ElementType {
    Text,
    Rect,
    Circle,
    Path,
    Image,
    Group,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOptions {
    pub format: String,
    pub quality: Option<u32>,
    pub dpi: Option<u32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
}