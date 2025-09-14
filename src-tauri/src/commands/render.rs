use crate::renderer::core::SkiaRenderer;
use crate::renderer::types::*;
use tauri::command;
use std::fs;

#[command]
pub async fn export_with_skia(
    elements: Vec<RenderElement>,
    file_path: String,
    options: ExportOptions,
) -> Result<String, String> {
    // 创建渲染器
    let mut renderer = SkiaRenderer::new(
        options.width.unwrap_or(1200),
        options.height.unwrap_or(800),
    ).map_err(|e| e.to_string())?;

    // 根据格式导出
    let data = match options.format.as_str() {
        "pdf" => renderer.export_pdf(&elements),
        "png" => renderer.export_png(&elements),
        "jpg" | "jpeg" => renderer.export_jpg(&elements, options.quality.unwrap_or(90)),
        "svg" => {
            // SVG 返回字符串，需要转换为字节
            renderer.export_svg(&elements)
                .map(|svg| svg.into_bytes())
        },
        "webp" => renderer.export_webp(&elements, options.quality.unwrap_or(90)),
        _ => return Err(format!("Unsupported format: {}", options.format)),
    }.map_err(|e| e.to_string())?;

    // 写入文件
    fs::write(&file_path, data)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(file_path)
}

#[command]
pub async fn render_preview_skia(
    elements: Vec<RenderElement>,
    width: i32,
    height: i32,
) -> Result<Vec<u8>, String> {
    // 创建渲染器
    let mut renderer = SkiaRenderer::new(width, height)
        .map_err(|e| e.to_string())?;

    // 渲染并返回 PNG 数据
    renderer.export_png(&elements)
        .map_err(|e| e.to_string())
}