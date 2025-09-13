use tauri::{command, State};
use std::collections::HashMap;
use crate::preview::manager::PreviewManager;
use crate::types::preview_types::*;

/// 全局预览管理器状态
static mut PREVIEW_MANAGER: Option<PreviewManager> = None;
static PREVIEW_MANAGER_INIT: std::sync::Once = std::sync::Once::new();

/// 获取预览管理器实例
fn get_preview_manager() -> &'static PreviewManager {
    unsafe {
        PREVIEW_MANAGER_INIT.call_once(|| {
            PREVIEW_MANAGER = Some(PreviewManager::new());
        });
        PREVIEW_MANAGER.as_ref().unwrap()
    }
}

/// 生成预览
#[command]
pub async fn generate_preview(request: PreviewRequest) -> Result<RenderResult, String> {
    let manager = get_preview_manager();
    
    manager.render_preview(&request)
        .await
        .map_err(|e| e.to_string())
}

/// 批量渲染
#[command]
pub async fn batch_render(request: BatchRenderRequest) -> Result<Vec<RenderResult>, String> {
    let manager = get_preview_manager();
    
    let mut results = Vec::new();
    
    if request.parallel {
        // 并行渲染
        use tokio::task::JoinSet;
        let mut join_set = JoinSet::new();
        
        for preview_request in request.requests {
            let manager_ref = get_preview_manager();
            join_set.spawn(async move {
                manager_ref.render_preview(&preview_request).await
            });
        }
        
        while let Some(result) = join_set.join_next().await {
            match result {
                Ok(render_result) => {
                    match render_result {
                        Ok(r) => results.push(r),
                        Err(e) => return Err(format!("Render failed: {}", e)),
                    }
                }
                Err(e) => return Err(format!("Task join failed: {}", e)),
            }
        }
    } else {
        // 串行渲染
        for preview_request in request.requests {
            match manager.render_preview(&preview_request).await {
                Ok(result) => results.push(result),
                Err(e) => return Err(format!("Render failed: {}", e)),
            }
        }
    }
    
    Ok(results)
}

/// 生成缩略图
#[command]
pub async fn generate_thumbnail(
    elements: Vec<serde_json::Value>,
    width: u32,
    height: u32
) -> Result<Vec<u8>, String> {
    let manager = get_preview_manager();
    
    // Convert JSON values to ReportElement
    let converted_elements: Result<Vec<_>, _> = elements.iter()
        .map(|v| serde_json::from_value(v.clone()))
        .collect();
    
    let report_elements = converted_elements.map_err(|e| format!("Failed to parse elements: {}", e))?;
    
    // Create proper canvas config
    let canvas_config = crate::core::canvas::CanvasConfig {
        width: width as f64,
        height: height as f64,
        background_color: "#ffffff".to_string(),
        show_grid: false,
        grid_size: 20.0,
        snap_to_grid: false,
        zoom: 1.0,
        offset_x: 0.0,
        offset_y: 0.0,
        show_rulers: false,
    };
    
    // 创建缩略图专用请求
    let thumbnail_request = PreviewRequest {
        elements: report_elements,
        canvas_config,
        options: RenderOptions {
            format: OutputFormat::Png,
            quality: RenderQuality::Draft,
            image_quality: Some(ImageQuality {
                dpi: 72,
                compression: 0.8,
                color_space: ColorSpace::Srgb,
                anti_aliasing: false,
            }),
            pdf_options: None,
            excel_options: None,
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("thumbnail".to_string(), serde_json::Value::Bool(true));
                props
            },
        },
        use_cache: false, // 缩略图不使用缓存
    };
    
    match manager.render_preview(&thumbnail_request).await {
        Ok(result) => Ok(result.data.unwrap_or_default()),
        Err(e) => Err(format!("Thumbnail generation failed: {}", e)),
    }
}

/// 获取支持的输出格式
#[command]
pub async fn get_supported_formats() -> Result<Vec<OutputFormat>, String> {
    Ok(vec![
        OutputFormat::Pdf,
        OutputFormat::Png,
        OutputFormat::Jpg,
        OutputFormat::Webp,
        OutputFormat::Svg,
        OutputFormat::Excel,
        OutputFormat::PowerPoint,
    ])
}

/// 获取格式的默认渲染选项
#[command]
pub async fn get_default_render_options(format: OutputFormat) -> Result<RenderOptions, String> {
    let default_options = match format {
        OutputFormat::Pdf => RenderOptions {
            format,
            quality: RenderQuality::High,
            pdf_options: Some(PdfOptions {
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
            }),
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        },
        
        OutputFormat::Png | OutputFormat::Jpg | OutputFormat::Webp => RenderOptions {
            format,
            quality: RenderQuality::High,
            pdf_options: None,
            image_quality: Some(ImageQuality {
                dpi: 150,
                compression: 0.9,
                color_space: ColorSpace::Srgb,
                anti_aliasing: true,
            }),
            excel_options: None,
            custom_properties: HashMap::new(),
        },
        
        OutputFormat::Excel => RenderOptions {
            format,
            quality: RenderQuality::Standard,
            pdf_options: None,
            image_quality: None,
            excel_options: Some(ExcelOptions {
                sheet_name: "Report".to_string(),
                include_formatting: true,
                auto_fit_columns: true,
                freeze_header: true,
                cell_mapping_strategy: CellMappingStrategy::PositionBased,
            }),
            custom_properties: HashMap::new(),
        },
        
        OutputFormat::Svg => RenderOptions {
            format,
            quality: RenderQuality::Standard,
            pdf_options: None,
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        },
        
        OutputFormat::PowerPoint => RenderOptions {
            format,
            quality: RenderQuality::Standard,
            pdf_options: None,
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        },
    };
    
    Ok(default_options)
}

/// 验证渲染选项
#[command]
pub async fn validate_render_options(options: RenderOptions) -> Result<bool, String> {
    let manager = get_preview_manager();
    
    match manager.validate_options(&options).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Validation failed: {}", e)),
    }
}

/// 获取渲染统计信息
#[command]
pub async fn get_render_stats() -> Result<RenderStats, String> {
    let manager = get_preview_manager();
    
    Ok(manager.get_stats().await)
}

/// 清理渲染缓存
#[command]
pub async fn clear_render_cache() -> Result<(), String> {
    let manager = get_preview_manager();
    
    manager.clear_cache().await
        .map_err(|e| e.to_string())
}

/// 导出到文件
#[command]
pub async fn export_to_file(
    request: PreviewRequest,
    file_path: String
) -> Result<String, String> {
    let manager = get_preview_manager();
    
    match manager.render_preview(&request).await {
        Ok(result) => {
            if let Some(data) = result.data {
                match std::fs::write(&file_path, data) {
                    Ok(_) => Ok(file_path),
                    Err(e) => Err(format!("Failed to write file: {}", e)),
                }
            } else {
                Err("No data to export".to_string())
            }
        }
        Err(e) => Err(format!("Render failed: {}", e)),
    }
}

/// 获取渲染进度（用于长时间渲染任务）
#[command]
pub async fn get_render_progress(task_id: String) -> Result<RenderProgress, String> {
    let manager = get_preview_manager();
    
    manager.get_progress(&task_id)
        .await
        .ok_or_else(|| format!("Task {} not found", task_id))
}

/// 取消渲染任务
#[command]
pub async fn cancel_render_task(task_id: String) -> Result<bool, String> {
    let manager = get_preview_manager();
    
    Ok(manager.cancel_task(&task_id).await)
}