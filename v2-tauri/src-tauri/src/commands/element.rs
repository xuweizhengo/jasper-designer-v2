use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{command, State};
use serde::{Deserialize, Serialize};

use crate::core::state::{AppState, AppStateDto};
use crate::core::element::{ElementId, ReportElement, ElementContent, Position, Size, TextStyle, TextAlign, BorderStyle, BorderStyleType};
use crate::errors::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateElementRequest {
    pub element_type: String,
    pub position: Position,
    pub size: Size,
    pub content_data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateElementRequest {
    pub id: String,
    pub updates: serde_json::Value,
}

#[command]
pub async fn create_element(
    request: CreateElementRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<String> {
    let mut app_state = state.write().await;
    
    let content = match request.element_type.as_str() {
        "text" => {
            let text_data: serde_json::Value = request.content_data;
            ElementContent::Text {
                content: text_data.get("content")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Text")
                    .to_string(),
                style: TextStyle {
                    font_family: text_data.get("font_family")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Arial")
                        .to_string(),
                    font_size: text_data.get("font_size")
                        .and_then(|v| v.as_f64())
                        .unwrap_or(14.0),
                    font_weight: text_data.get("font_weight")
                        .and_then(|v| v.as_str())
                        .unwrap_or("normal")
                        .to_string(),
                    color: text_data.get("color")
                        .and_then(|v| v.as_str())
                        .unwrap_or("#000000")
                        .to_string(),
                    align: TextAlign::Left,
                },
            }
        }
        "rectangle" => {
            let rect_data: serde_json::Value = request.content_data;
            ElementContent::Rectangle {
                fill_color: rect_data.get("fill_color")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                border: Some(BorderStyle {
                    color: rect_data.get("border_color")
                        .and_then(|v| v.as_str())
                        .unwrap_or("#000000")
                        .to_string(),
                    width: rect_data.get("border_width")
                        .and_then(|v| v.as_f64())
                        .unwrap_or(1.0),
                    style: BorderStyleType::Solid,
                }),
            }
        }
        "image" => {
            let img_data: serde_json::Value = request.content_data;
            ElementContent::Image {
                src: img_data.get("src")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                alt: img_data.get("alt")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            }
        }
        "line" => {
            let line_data: serde_json::Value = request.content_data;
            ElementContent::Line {
                color: line_data.get("color")
                    .and_then(|v| v.as_str())
                    .unwrap_or("#000000")
                    .to_string(),
                width: line_data.get("width")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(1.0),
            }
        }
        "data_field" => {
            let field_data: serde_json::Value = request.content_data;
            ElementContent::DataField {
                expression: field_data.get("expression")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                format: field_data.get("format")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                style: TextStyle {
                    font_family: field_data.get("font_family")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Arial")
                        .to_string(),
                    font_size: field_data.get("font_size")
                        .and_then(|v| v.as_f64())
                        .unwrap_or(14.0),
                    font_weight: field_data.get("font_weight")
                        .and_then(|v| v.as_str())
                        .unwrap_or("normal")
                        .to_string(),
                    color: field_data.get("color")
                        .and_then(|v| v.as_str())
                        .unwrap_or("#000000")
                        .to_string(),
                    align: TextAlign::Left,
                },
            }
        }
        _ => {
            return Err(crate::errors::AppError::CanvasError {
                message: format!("Unknown element type: {}", request.element_type),
            });
        }
    };
    
    let element = ReportElement::new(content, request.position, request.size)?;
    let element_id = element.id.to_string();
    
    app_state.add_element(element)?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(element_id)
}

#[command]
pub async fn update_element(
    request: UpdateElementRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let element_id = ElementId::from_string(&request.id)?;
    
    let mut element = app_state.get_element(&element_id)
        .ok_or_else(|| crate::errors::AppError::ElementNotFound {
            id: request.id.clone(),
        })?
        .clone();
    
    // Apply updates
    if let Some(position) = request.updates.get("position") {
        if let (Some(x), Some(y)) = (position.get("x").and_then(|v| v.as_f64()), 
                                      position.get("y").and_then(|v| v.as_f64())) {
            element.position = Position::new(x, y)?;
        }
    }
    
    if let Some(size) = request.updates.get("size") {
        if let (Some(width), Some(height)) = (size.get("width").and_then(|v| v.as_f64()), 
                                              size.get("height").and_then(|v| v.as_f64())) {
            element.size = Size::new(width, height)?;
        }
    }
    
    if let Some(visible) = request.updates.get("visible").and_then(|v| v.as_bool()) {
        element.visible = visible;
    }
    
    if let Some(locked) = request.updates.get("locked").and_then(|v| v.as_bool()) {
        element.locked = locked;
    }
    
    if let Some(z_index) = request.updates.get("z_index").and_then(|v| v.as_i64()) {
        element.z_index = z_index as i32;
    }
    
    app_state.update_element(&element_id, element)?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn delete_element(
    element_id: String,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let id = ElementId::from_string(&element_id)?;
    app_state.delete_element(&id)?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn select_element(
    element_id: String,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let id = ElementId::from_string(&element_id)?;
    app_state.select_element(id)?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn clear_selection(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    app_state.clear_selection();
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn get_elements_at_point(
    x: f64,
    y: f64,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<Vec<String>> {
    let app_state = state.read().await;
    
    let elements = app_state.get_elements_at_point(x, y);
    let element_ids: Vec<String> = elements
        .into_iter()
        .map(|element| element.id.to_string())
        .collect();
    
    Ok(element_ids)
}

#[command]
pub async fn copy_selected(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    app_state.copy_selected();
    Ok(())
}

#[command]
pub async fn paste_elements(
    offset_x: f64,
    offset_y: f64,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<Vec<String>> {
    let mut app_state = state.write().await;
    
    let new_ids = app_state.paste(offset_x, offset_y)?;
    let id_strings: Vec<String> = new_ids
        .into_iter()
        .map(|id| id.to_string())
        .collect();
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(id_strings)
}

// Helper function to emit state changes
async fn emit_state_change(app_state: &AppState) {
    let dto = AppStateDto::from(app_state);
    // Note: In a real implementation, we would emit this to the frontend
    // For now, we'll just log it
    println!("State changed: {} elements", dto.elements.len());
}