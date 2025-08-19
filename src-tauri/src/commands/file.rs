use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{command, State};
use serde::{Deserialize, Serialize};

use crate::core::state::{AppState, AppStateDto};
use crate::errors::{AppError, Result};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadTemplateRequest {
    pub file_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateData {
    pub name: String,
    pub description: Option<String>,
    pub canvas_config: crate::core::canvas::CanvasConfig,
    pub elements: Vec<crate::core::element::ReportElement>,
    pub version: String,
    pub created_at: u64,
}

#[command]
pub async fn save_template(
    request: SaveTemplateRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<String> {
    let mut app_state = state.write().await;
    
    let template_data = TemplateData {
        name: request.name.clone(),
        description: request.description,
        canvas_config: app_state.canvas.clone(),
        elements: app_state.elements.values().cloned().collect(),
        version: "2.0.0".to_string(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    };
    
    let json_content = serde_json::to_string_pretty(&template_data)
        .map_err(|e| AppError::SerializationError {
            message: format!("Failed to serialize template: {}", e),
        })?;
    
    let file_path = if let Some(path) = request.file_path {
        path
    } else {
        // In a real implementation, we would use Tauri's dialog API
        // For now, we'll create a default path
        format!("{}.jdt", request.name.replace(" ", "_").to_lowercase())
    };
    
    // In a real implementation, we would use Tauri's fs API to write the file
    // For now, we'll just simulate the save
    println!("Saving template to: {}", file_path);
    println!("Template content: {}", json_content);
    
    app_state.template_name = Some(request.name);
    app_state.set_dirty(false);
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(file_path)
}

#[command]
pub async fn load_template(
    request: LoadTemplateRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    // In a real implementation, we would use Tauri's fs API to read the file
    // For now, we'll simulate loading a template
    println!("Loading template from: {}", request.file_path);
    
    // Create a sample template for demonstration
    let sample_template = create_sample_template();
    
    // Clear current state
    app_state.clear();
    
    // Load template data
    app_state.canvas = sample_template.canvas_config;
    app_state.template_name = Some(sample_template.name);
    
    for element in sample_template.elements {
        app_state.elements.insert(element.id.clone(), element);
    }
    
    app_state.set_dirty(false);
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn new_template(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    app_state.clear();
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn export_json(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<String> {
    let app_state = state.read().await;
    
    let template_data = TemplateData {
        name: app_state.template_name.clone().unwrap_or_else(|| "Untitled".to_string()),
        description: None,
        canvas_config: app_state.canvas.clone(),
        elements: app_state.elements.values().cloned().collect(),
        version: "2.0.0".to_string(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    };
    
    let json_content = serde_json::to_string_pretty(&template_data)
        .map_err(|e| AppError::SerializationError {
            message: format!("Failed to serialize template: {}", e),
        })?;
    
    Ok(json_content)
}

#[command]
pub async fn get_recent_templates() -> Result<Vec<String>> {
    // In a real implementation, we would read from a recent files list
    // For now, return some sample templates
    Ok(vec![
        "标准银行回单.jdt".to_string(),
        "详细交易明细.jdt".to_string(),
        "简化回单模板.jdt".to_string(),
    ])
}

// Helper function to create a sample template
fn create_sample_template() -> TemplateData {
    use crate::core::element::{ReportElement, ElementContent, Position, Size, TextStyle, TextAlign};
    use crate::core::canvas::CanvasConfig;
    
    let mut elements = Vec::new();
    
    // Create sample elements
    if let Ok(title_element) = ReportElement::new(
        ElementContent::Text {
            content: "中国工商银行电子回单".to_string(),
            style: TextStyle {
                font_family: "SimHei".to_string(),
                font_size: 18.0,
                font_weight: "bold".to_string(),
                color: "#000000".to_string(),
                align: TextAlign::Center,
                border: None,
                background: None,
            },
        },
        Position { x: 200.0, y: 50.0 },
        Size { width: 195.0, height: 30.0 },
    ) {
        elements.push(title_element);
    }
    
    if let Ok(field_element) = ReportElement::new(
        ElementContent::DataField {
            expression: "${customerName}".to_string(),
            format: None,
            style: TextStyle {
                font_family: "SimSun".to_string(),
                font_size: 12.0,
                font_weight: "normal".to_string(),
                color: "#000000".to_string(),
                align: TextAlign::Left,
                border: None,
                background: None,
            },
        },
        Position { x: 100.0, y: 150.0 },
        Size { width: 150.0, height: 20.0 },
    ) {
        elements.push(field_element);
    }
    
    TemplateData {
        name: "标准银行回单".to_string(),
        description: Some("标准的银行电子回单模板".to_string()),
        canvas_config: CanvasConfig::default(),
        elements,
        version: "2.0.0".to_string(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    }
}

// Helper function to emit state changes
async fn emit_state_change(app_state: &AppState) {
    let dto = AppStateDto::from(app_state);
    println!("File operation completed: template={:?}", dto.template_name);
}