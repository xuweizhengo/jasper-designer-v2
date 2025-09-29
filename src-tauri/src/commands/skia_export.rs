use crate::renderer::core::SkiaRenderer;
use serde::{Deserialize, Serialize};
use tauri::command;
use std::collections::HashMap;

// ===== 数据结构 =====

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkiaRenderElement {
    pub id: String,
    pub r#type: String,
    pub bounds: ElementBounds,
    pub style: ElementStyle,
    pub data: HashMap<String, serde_json::Value>,
    pub visible: bool,
    pub opacity: f32,
    pub z_index: i32,
    pub transform: Option<ElementTransform>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementBounds {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementStyle {
    pub fill_color: Option<String>,
    pub stroke_color: Option<String>,
    pub stroke_width: Option<f32>,
    pub border_radius: Option<f32>,
    pub shadow: Option<ShadowStyle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShadowStyle {
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur: f32,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementTransform {
    pub translate: Option<Point>,
    pub scale: Option<Point>,
    pub rotate: Option<f32>,
    pub origin: Option<Point>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkiaInitOptions {
    pub use_web_worker: bool,
    pub default_quality: String,
    pub max_texture_size: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageExportData {
    pub elements: Vec<SkiaRenderElement>,
    pub format: String,
    pub quality: f32,
    pub compression: u32,
    pub scale: f32,
    pub dpi: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PDFExportData {
    pub pages: Vec<Vec<SkiaRenderElement>>,
    pub page_width: f32,
    pub page_height: f32,
    pub margins: PageMargins,
    pub metadata: PDFMetadata,
    pub embed_fonts: bool,
    pub compress: bool,
    pub pdf_version: String,
    pub pdf_a: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageMargins {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PDFMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub creator: Option<String>,
    pub producer: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SVGExportData {
    pub elements: Vec<SkiaRenderElement>,
    pub embed_images: bool,
    pub embed_fonts: bool,
    pub minify: bool,
    pub precision: u32,
    pub convert_text_to_path: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OfficeExportData {
    pub elements: Vec<SkiaRenderElement>,
    pub format: String, // "xlsx" | "docx" | "pptx"
    pub template: Option<String>,
    pub preserve_layout: bool,
    pub embed_images: bool,
    pub compatibility: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewRenderData {
    pub elements: Vec<SkiaRenderElement>,
    pub width: u32,
    pub height: u32,
    pub quality: String,
    pub scale: f32,
    pub background: String,
    pub watermark: Option<WatermarkOptions>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatermarkOptions {
    pub text: Option<String>,
    pub image: Option<String>,
    pub position: String,
    pub opacity: f32,
    pub rotation: f32,
    pub scale: f32,
}

// ===== Skia 渲染器状态管理 =====
// 注意: SkiaRenderer 包含的 Surface 和 FontMgr 不是 Send，
// 所以我们不使用全局静态变量，而是在每次需要时创建新实例

// ===== 命令实现 =====

#[command]
pub async fn init_skia_renderer(options: SkiaInitOptions) -> Result<(), String> {
    use crate::renderer::utils::logger::{log, LogLevel};

    log(LogLevel::Info, "SkiaExport", &format!("初始化 Skia 渲染器: {:?}", options));

    // 只是测试创建渲染器是否成功
    let _renderer = SkiaRenderer::new(1920, 1080)
        .map_err(|e| {
            let error_msg = format!("Failed to initialize Skia: {}", e);
            log(LogLevel::Error, "SkiaExport", &error_msg);
            error_msg
        })?;

    log(LogLevel::Info, "SkiaExport", "Skia 渲染器初始化成功");
    Ok(())
}

#[command]
pub async fn dispose_skia_renderer() -> Result<(), String> {
    println!("销毁 Skia 渲染器");
    // 由于我们现在是按需创建渲染器，这里不需要做任何事
    Ok(())
}

#[command]
pub async fn render_preview(data: PreviewRenderData) -> Result<Vec<u8>, String> {
    println!("渲染预览: {} 个元素", data.elements.len());

    // 创建临时渲染器
    let mut renderer = SkiaRenderer::new(data.width as i32, data.height as i32)
        .map_err(|e| format!("Failed to create renderer: {}", e))?;

    // 转换元素格式
    let render_elements = convert_elements(data.elements);

    // 渲染为 PNG
    renderer.export_png(&render_elements)
        .map_err(|e| format!("Failed to render preview: {}", e))
}

#[command]
pub async fn render_offscreen(
    elements: Vec<SkiaRenderElement>,
    width: u32,
    height: u32,
    dpi: u32,
    color_space: String,
    _antialias: bool,
) -> Result<Vec<u8>, String> {
    println!("离屏渲染: {}x{}, DPI: {}", width, height, dpi);

    // 创建渲染器
    let mut renderer = SkiaRenderer::new(width as i32, height as i32)
        .map_err(|e| format!("Failed to create renderer: {}", e))?;

    // 转换元素
    let render_elements = convert_elements(elements);

    // 渲染
    renderer.export_png(&render_elements)
        .map_err(|e| format!("Failed to render: {}", e))
}

#[command]
pub async fn export_image(data: ImageExportData) -> Result<Vec<u8>, String> {
    println!("导出图片: 格式 {}", data.format);

    // 计算实际尺寸
    let (width, height) = calculate_canvas_size(&data.elements, data.scale);

    // 创建渲染器
    let mut renderer = SkiaRenderer::new(width, height)
        .map_err(|e| format!("Failed to create renderer: {}", e))?;

    // 转换元素
    let render_elements = convert_elements(data.elements);

    // 根据格式导出
    match data.format.as_str() {
        "png" => renderer.export_png(&render_elements),
        "jpeg" | "jpg" => renderer.export_jpg(&render_elements, data.quality as u32),
        "webp" => renderer.export_webp(&render_elements, data.quality as u32),
        _ => Err(anyhow::anyhow!("Unsupported image format: {}", data.format)),
    }.map_err(|e| format!("Failed to export image: {}", e))
}

#[command]
pub async fn export_pdf(data: PDFExportData) -> Result<Vec<u8>, String> {
    println!("导出 PDF: {} 页", data.pages.len());

    // 创建渲染器
    let mut renderer = SkiaRenderer::new(
        data.page_width as i32,
        data.page_height as i32,
    ).map_err(|e| format!("Failed to create renderer: {}", e))?;

    // TODO: 实现多页 PDF 渲染
    // 目前先渲染第一页
    if let Some(first_page) = data.pages.first() {
        let render_elements = convert_elements(first_page.to_vec());
        renderer.export_pdf(&render_elements)
            .map_err(|e| format!("Failed to export PDF: {}", e))
    } else {
        Err("No pages to export".to_string())
    }
}

#[command]
pub async fn export_svg(data: SVGExportData) -> Result<String, String> {
    println!("导出 SVG: {} 个元素", data.elements.len());

    // 计算画布大小
    let (width, height) = calculate_canvas_size(&data.elements, 1.0);

    // 创建渲染器
    let mut renderer = SkiaRenderer::new(width, height)
        .map_err(|e| format!("Failed to create renderer: {}", e))?;

    // 转换元素
    let render_elements = convert_elements(data.elements);

    // 导出 SVG
    renderer.export_svg(&render_elements)
        .map_err(|e| format!("Failed to export SVG: {}", e))
}

#[command]
pub async fn export_office(data: OfficeExportData) -> Result<Vec<u8>, String> {
    println!("导出 Office 格式: {}", data.format);

    // TODO: 实现 Office 格式导出
    // 这需要集成第三方库或调用外部服务

    match data.format.as_str() {
        "xlsx" => export_to_excel(data.elements),
        "docx" => export_to_word(data.elements),
        "pptx" => export_to_powerpoint(data.elements),
        _ => Err(format!("Unsupported Office format: {}", data.format)),
    }
}

#[command]
pub async fn prepare_print(
    elements: Vec<SkiaRenderElement>,
    page_size: String,
    orientation: String,
    margins: PageMargins,
    scale: String,
) -> Result<Vec<PrintPage>, String> {
    println!("准备打印: {} 元素", elements.len());

    // TODO: 实现打印预览
    // 将元素分页并生成打印预览

    Ok(vec![])
}

#[command]
pub async fn set_render_quality(quality: String) -> Result<(), String> {
    println!("设置渲染质量: {}", quality);

    // TODO: 存储质量设置

    Ok(())
}

// ===== 辅助函数 =====

fn convert_elements(elements: Vec<SkiaRenderElement>) -> Vec<crate::renderer::types::RenderElement> {
    use crate::renderer::types::{RenderElement, ElementType, Transform, ElementStyle, Shadow, BlendMode, Point};

    elements.into_iter().map(|el| {
        RenderElement {
            id: el.id,
            element_type: match el.r#type.as_str() {
                "text" => ElementType::Text,
                "rect" | "rectangle" => ElementType::Rect,
                "circle" | "ellipse" => ElementType::Circle,
                "path" | "line" => ElementType::Path,
                "image" => ElementType::Image,
                _ => ElementType::Group,
            },
            transform: Transform {
                translate: Some(Point { x: el.bounds.x, y: el.bounds.y }),
                scale: el.transform.as_ref().and_then(|t| t.scale.clone()).map(|s| Point { x: s.x, y: s.y }),
                rotate: el.transform.as_ref().and_then(|t| t.rotate),
                origin: el.transform.as_ref().and_then(|t| t.origin.clone()).map(|o| Point { x: o.x, y: o.y }),
            },
            style: ElementStyle {
                width: Some(el.bounds.width),
                height: Some(el.bounds.height),
                fill: el.style.fill_color.clone(),
                stroke: el.style.stroke_color.clone(),
                stroke_width: el.style.stroke_width,
                opacity: Some(el.opacity),
                blur: None,  // skia_export::ElementStyle 没有blur字段
                shadow: el.style.shadow.as_ref().map(|s| Shadow {
                    offset_x: s.offset_x,
                    offset_y: s.offset_y,
                    blur: s.blur,
                    color: s.color.clone(),
                }),
                clip_path: None,
                blend_mode: None,  // skia_export::ElementStyle 没有blend_mode字段
            },
            data: serde_json::Value::Object(el.data.into_iter().collect()),
            visible: el.visible,
            locked: false,
            children: None,
        }
    }).collect()
}

fn calculate_canvas_size(elements: &[SkiaRenderElement], scale: f32) -> (i32, i32) {
    if elements.is_empty() {
        return (1200, 800); // 默认尺寸
    }

    let mut max_x = 0.0f32;
    let mut max_y = 0.0f32;

    for element in elements {
        let right = element.bounds.x + element.bounds.width;
        let bottom = element.bounds.y + element.bounds.height;

        if right > max_x {
            max_x = right;
        }
        if bottom > max_y {
            max_y = bottom;
        }
    }

    // 添加一些边距
    let width = ((max_x + 50.0) * scale) as i32;
    let height = ((max_y + 50.0) * scale) as i32;

    (width.max(100), height.max(100))
}

// ===== Office 导出实现 =====

fn export_to_excel(elements: Vec<SkiaRenderElement>) -> Result<Vec<u8>, String> {
    use crate::renderer::export::OfficeExporter;

    let render_elements = convert_elements(elements);
    OfficeExporter::export_excel(&render_elements)
        .map_err(|e| format!("Failed to export to Excel: {}", e))
}

fn export_to_word(elements: Vec<SkiaRenderElement>) -> Result<Vec<u8>, String> {
    use crate::renderer::export::OfficeExporter;

    let render_elements = convert_elements(elements);
    OfficeExporter::export_word(&render_elements)
        .map_err(|e| format!("Failed to export to Word: {}", e))
}

fn export_to_powerpoint(elements: Vec<SkiaRenderElement>) -> Result<Vec<u8>, String> {
    use crate::renderer::export::OfficeExporter;

    let render_elements = convert_elements(elements);
    OfficeExporter::export_powerpoint(&render_elements)
        .map_err(|e| format!("Failed to export to PowerPoint: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintPage {
    pub content: String,
    pub page_number: u32,
}