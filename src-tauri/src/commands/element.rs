use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{command, State};
use serde::{Deserialize, Serialize};

use crate::core::state::{AppState, AppStateDto};
use crate::core::element::{ElementId, ReportElement, ElementContent, Position, Size, TextStyle, TextAlign, BorderStyle, BorderStyleType, LineCapType, LineStyleType};
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
                corner_radius: Some(rect_data.get("corner_radius")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0)),
                opacity: Some(rect_data.get("opacity")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(1.0)),
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
                line_style: line_data.get("line_style")
                    .and_then(|v| v.as_str())
                    .map(|s| match s {
                        "Dashed" => LineStyleType::Dashed,
                        "Dotted" => LineStyleType::Dotted,
                        "DashDot" => LineStyleType::DashDot,
                        _ => LineStyleType::Solid,
                    }),
                start_cap: line_data.get("start_cap")
                    .and_then(|v| v.as_str())
                    .map(|s| match s {
                        "Arrow" => LineCapType::Arrow,
                        "Circle" => LineCapType::Circle,
                        "Square" => LineCapType::Square,
                        _ => LineCapType::None,
                    }),
                end_cap: line_data.get("end_cap")
                    .and_then(|v| v.as_str())
                    .map(|s| match s {
                        "Arrow" => LineCapType::Arrow,
                        "Circle" => LineCapType::Circle,
                        "Square" => LineCapType::Square,
                        _ => LineCapType::None,
                    }),
                opacity: Some(line_data.get("opacity")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(1.0)),
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
    
    // Handle content updates
    if let Some(content_updates) = request.updates.get("content") {
        element.content = update_element_content(element.content, content_updates)?;
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
pub async fn select_multiple(
    element_ids: Vec<String>,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let ids: std::result::Result<Vec<ElementId>, crate::errors::AppError> = element_ids
        .iter()
        .map(|id| ElementId::from_string(id))
        .collect();
    
    let ids = ids?;
    app_state.select_multiple(ids)?;
    
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

#[command]
pub async fn add_to_selection(
    element_id: String,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let id = ElementId::from_string(&element_id)?;
    app_state.add_to_selection(id)?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn remove_from_selection(
    element_id: String,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let id = ElementId::from_string(&element_id)?;
    app_state.remove_from_selection(&id);
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchUpdatePositionRequest {
    pub updates: Vec<ElementPositionUpdate>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ElementPositionUpdate {
    pub element_id: String,
    pub new_position: Position,
}

#[command]
pub async fn batch_update_positions(
    request: BatchUpdatePositionRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    for update in request.updates {
        let element_id = ElementId::from_string(&update.element_id)?;
        
        if let Some(mut element) = app_state.get_element(&element_id).cloned() {
            element.position = update.new_position;
            app_state.update_element(&element_id, element)?;
        }
    }
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn toggle_selection(
    element_id: String,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    let id = ElementId::from_string(&element_id)?;
    
    // Check if element is currently selected
    if app_state.selected_ids.contains(&id) {
        app_state.remove_from_selection(&id);
    } else {
        app_state.add_to_selection(id)?;
    }
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

// Helper function to emit state changes
async fn emit_state_change(app_state: &AppState) {
    let dto = AppStateDto::from(app_state);
    // Note: In a real implementation, we would emit this to the frontend
    // For now, we'll just log it
    println!("State changed: {} elements", dto.elements.len());
}

// Helper function to update element content
fn update_element_content(
    current_content: ElementContent,
    updates: &serde_json::Value,
) -> Result<ElementContent> {
    match current_content {
        ElementContent::Text { mut content, mut style } => {
            if let Some(new_content) = updates.get("content").and_then(|v| v.as_str()) {
                content = new_content.to_string();
            }
            
            if let Some(style_updates) = updates.get("style") {
                if let Some(font_family) = style_updates.get("font_family").and_then(|v| v.as_str()) {
                    style.font_family = font_family.to_string();
                }
                if let Some(font_size) = style_updates.get("font_size").and_then(|v| v.as_f64()) {
                    style.font_size = font_size;
                }
                if let Some(font_weight) = style_updates.get("font_weight").and_then(|v| v.as_str()) {
                    style.font_weight = font_weight.to_string();
                }
                if let Some(color) = style_updates.get("color").and_then(|v| v.as_str()) {
                    style.color = color.to_string();
                }
                if let Some(align_str) = style_updates.get("align").and_then(|v| v.as_str()) {
                    style.align = match align_str {
                        "Left" => TextAlign::Left,
                        "Center" => TextAlign::Center,
                        "Right" => TextAlign::Right,
                        // Legacy support for lowercase
                        "left" => TextAlign::Left,
                        "center" => TextAlign::Center,
                        "right" => TextAlign::Right,
                        _ => TextAlign::Left,
                    };
                }
            }
            
            Ok(ElementContent::Text { content, style })
        },
        
        ElementContent::Rectangle { mut fill_color, mut border, mut corner_radius, mut opacity } => {
            if let Some(new_fill_color) = updates.get("fill_color").and_then(|v| v.as_str()) {
                fill_color = Some(new_fill_color.to_string());
            }
            
            if let Some(new_corner_radius) = updates.get("corner_radius").and_then(|v| v.as_f64()) {
                corner_radius = Some(new_corner_radius);
            }
            
            if let Some(new_opacity) = updates.get("opacity").and_then(|v| v.as_f64()) {
                opacity = Some(new_opacity);
            }
            
            if let Some(border_updates) = updates.get("border") {
                if let Some(current_border) = border.as_mut() {
                    if let Some(color) = border_updates.get("color").and_then(|v| v.as_str()) {
                        current_border.color = color.to_string();
                    }
                    if let Some(width) = border_updates.get("width").and_then(|v| v.as_f64()) {
                        current_border.width = width;
                    }
                    if let Some(style_str) = border_updates.get("style").and_then(|v| v.as_str()) {
                        current_border.style = match style_str {
                            "Solid" => BorderStyleType::Solid,
                            "Dashed" => BorderStyleType::Dashed,
                            "Dotted" => BorderStyleType::Dotted,
                            // Legacy support for lowercase
                            "solid" => BorderStyleType::Solid,
                            "dashed" => BorderStyleType::Dashed,
                            "dotted" => BorderStyleType::Dotted,
                            _ => BorderStyleType::Solid,
                        };
                    }
                } else {
                    // Create new border if it doesn't exist
                    border = Some(BorderStyle {
                        color: border_updates.get("color")
                            .and_then(|v| v.as_str())
                            .unwrap_or("#000000")
                            .to_string(),
                        width: border_updates.get("width")
                            .and_then(|v| v.as_f64())
                            .unwrap_or(1.0),
                        style: BorderStyleType::Solid,
                    });
                }
            }
            
            Ok(ElementContent::Rectangle { fill_color, border, corner_radius, opacity })
        },
        
        ElementContent::Line { mut color, mut width, mut line_style, mut start_cap, mut end_cap, mut opacity } => {
            if let Some(new_color) = updates.get("color").and_then(|v| v.as_str()) {
                color = new_color.to_string();
            }
            
            if let Some(new_width) = updates.get("width").and_then(|v| v.as_f64()) {
                width = new_width;
            }
            
            if let Some(style_str) = updates.get("line_style").and_then(|v| v.as_str()) {
                line_style = Some(match style_str {
                    "Dashed" => LineStyleType::Dashed,
                    "Dotted" => LineStyleType::Dotted,
                    "DashDot" => LineStyleType::DashDot,
                    _ => LineStyleType::Solid,
                });
            }
            
            if let Some(start_cap_str) = updates.get("start_cap").and_then(|v| v.as_str()) {
                start_cap = Some(match start_cap_str {
                    "Arrow" => LineCapType::Arrow,
                    "Circle" => LineCapType::Circle,
                    "Square" => LineCapType::Square,
                    _ => LineCapType::None,
                });
            }
            
            if let Some(end_cap_str) = updates.get("end_cap").and_then(|v| v.as_str()) {
                end_cap = Some(match end_cap_str {
                    "Arrow" => LineCapType::Arrow,
                    "Circle" => LineCapType::Circle,
                    "Square" => LineCapType::Square,
                    _ => LineCapType::None,
                });
            }
            
            if let Some(new_opacity) = updates.get("opacity").and_then(|v| v.as_f64()) {
                opacity = Some(new_opacity);
            }
            
            Ok(ElementContent::Line { color, width, line_style, start_cap, end_cap, opacity })
        },
        
        ElementContent::DataField { mut expression, mut format, mut style } => {
            if let Some(new_expression) = updates.get("expression").and_then(|v| v.as_str()) {
                expression = new_expression.to_string();
            }
            
            if let Some(new_format) = updates.get("format").and_then(|v| v.as_str()) {
                format = Some(new_format.to_string());
            }
            
            if let Some(style_updates) = updates.get("style") {
                if let Some(font_family) = style_updates.get("font_family").and_then(|v| v.as_str()) {
                    style.font_family = font_family.to_string();
                }
                if let Some(font_size) = style_updates.get("font_size").and_then(|v| v.as_f64()) {
                    style.font_size = font_size;
                }
                if let Some(font_weight) = style_updates.get("font_weight").and_then(|v| v.as_str()) {
                    style.font_weight = font_weight.to_string();
                }
                if let Some(color) = style_updates.get("color").and_then(|v| v.as_str()) {
                    style.color = color.to_string();
                }
                if let Some(align_str) = style_updates.get("align").and_then(|v| v.as_str()) {
                    style.align = match align_str {
                        "Left" => TextAlign::Left,
                        "Center" => TextAlign::Center,
                        "Right" => TextAlign::Right,
                        // Legacy support for lowercase
                        "left" => TextAlign::Left,
                        "center" => TextAlign::Center,
                        "right" => TextAlign::Right,
                        _ => TextAlign::Left,
                    };
                }
            }
            
            Ok(ElementContent::DataField { expression, format, style })
        },
        
        ElementContent::Image { mut src, mut alt } => {
            if let Some(new_src) = updates.get("src").and_then(|v| v.as_str()) {
                src = new_src.to_string();
            }
            
            if let Some(new_alt) = updates.get("alt").and_then(|v| v.as_str()) {
                alt = Some(new_alt.to_string());
            }
            
            Ok(ElementContent::Image { src, alt })
        },
    }
}