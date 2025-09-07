// === Template Management Commands ===
use crate::core::template::JasperTemplate;
use crate::core::template_service::{TemplateLoader, TemplateSerializer, TemplateFormat};
use crate::errors::Result;

#[tauri::command]
pub async fn load_jasper_template(file_path: String) -> Result<JasperTemplate> {
    TemplateLoader::load(&file_path)
}

#[tauri::command]
pub async fn save_jasper_template(template: JasperTemplate, file_path: String) -> Result<()> {
    let serializer = TemplateSerializer::new();
    serializer.save_to_file(&template, &file_path)
}

#[tauri::command]
pub async fn save_template_as(
    template: JasperTemplate, 
    file_path: String, 
    format: String
) -> Result<()> {
    let template_format = match format.as_str() {
        "json" => TemplateFormat::Json,
        "binary" => TemplateFormat::Binary,
        "jrxml" => TemplateFormat::Jrxml,
        _ => TemplateFormat::Json,
    };
    
    TemplateLoader::save(&template, &file_path, template_format)
}

#[tauri::command]
pub async fn validate_template(template: JasperTemplate) -> Result<bool> {
    template.validate()?;
    Ok(true)
}

#[tauri::command]
pub async fn create_empty_template() -> Result<JasperTemplate> {
    Ok(JasperTemplate::new())
}

#[tauri::command]
pub async fn get_template_info(file_path: String) -> Result<TemplateInfo> {
    let template = TemplateLoader::load(&file_path)?;
    Ok(TemplateInfo {
        version: template.metadata.version,
        format_version: template.metadata.format_version,
        created_at: template.metadata.created_at.to_rfc3339(),
        last_modified: template.metadata.last_modified.to_rfc3339(),
        description: template.metadata.description,
        tags: template.metadata.tags,
        element_count: template.elements.len(),
        data_source_count: template.data_sources.len(),
        parameter_count: template.parameters.len(),
    })
}

#[tauri::command]
pub async fn detect_template_format(file_path: String) -> Result<String> {
    let format = TemplateFormat::detect_from_file(&file_path);
    let format_string = match format {
        TemplateFormat::Json => "json",
        TemplateFormat::Binary => "binary", 
        TemplateFormat::Jrxml => "jrxml",
        TemplateFormat::Unknown => "unknown",
    };
    Ok(format_string.to_string())
}

#[tauri::command]
pub async fn export_template_json(template: JasperTemplate) -> Result<String> {
    let serializer = TemplateSerializer::new();
    serializer.serialize(&template)
}

#[tauri::command]
pub async fn import_template_json(json_data: String) -> Result<JasperTemplate> {
    TemplateSerializer::deserialize(&json_data)
}

#[tauri::command]
pub async fn clone_template(template: JasperTemplate) -> Result<JasperTemplate> {
    let mut cloned = template.clone();
    
    // Update metadata for the cloned template
    cloned.metadata.created_at = chrono::Utc::now();
    cloned.metadata.last_modified = chrono::Utc::now();
    cloned.metadata.description = cloned.metadata.description
        .map(|desc| format!("{} (Copy)", desc));
    
    // Generate new IDs for all elements to avoid conflicts
    for element in &mut cloned.elements {
        element.id = uuid::Uuid::new_v4().to_string();
    }
    
    Ok(cloned)
}

// === Template Information ===
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateInfo {
    pub version: String,
    pub format_version: String,
    pub created_at: String,
    pub last_modified: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub element_count: usize,
    pub data_source_count: usize,
    pub parameter_count: usize,
}

// === Template Preview ===
#[tauri::command]
pub async fn generate_template_preview(template: JasperTemplate) -> Result<TemplatePreview> {
    let canvas_info = CanvasInfo {
        width: template.canvas.width,
        height: template.canvas.height,
        unit: format!("{:?}", template.canvas.unit).to_lowercase(),
        orientation: format!("{:?}", template.canvas.orientation).to_lowercase(),
    };
    
    let elements_summary: Vec<ElementSummary> = template.elements
        .iter()
        .map(|e| ElementSummary {
            id: e.id.clone(),
            element_type: format!("{:?}", e.element_type).to_lowercase(),
            position: Position {
                x: e.position.x,
                y: e.position.y,
            },
            size: Size {
                width: e.size.width,
                height: e.size.height,
            },
            visible: e.visible,
        })
        .collect();
    
    let data_sources_summary: Vec<DataSourceSummary> = template.data_sources
        .iter()
        .map(|ds| DataSourceSummary {
            id: ds.id.clone(),
            name: ds.name.clone(),
            source_type: format!("{:?}", ds.source_type).to_lowercase(),
            column_count: ds.schema.columns.len(),
        })
        .collect();
    
    Ok(TemplatePreview {
        metadata: template.metadata,
        canvas: canvas_info,
        elements: elements_summary,
        data_sources: data_sources_summary,
        parameters: template.parameters,
        variables: template.variables,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplatePreview {
    pub metadata: crate::core::template::TemplateMetadata,
    pub canvas: CanvasInfo,
    pub elements: Vec<ElementSummary>,
    pub data_sources: Vec<DataSourceSummary>,
    pub parameters: Vec<crate::core::template::Parameter>,
    pub variables: Vec<crate::core::template::Variable>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasInfo {
    pub width: f64,
    pub height: f64,
    pub unit: String,
    pub orientation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementSummary {
    pub id: String,
    pub element_type: String,
    pub position: Position,
    pub size: Size,
    pub visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceSummary {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub column_count: usize,
}

// === Template Utilities ===
#[tauri::command]
pub async fn merge_templates(
    base_template: JasperTemplate, 
    overlay_template: JasperTemplate
) -> Result<JasperTemplate> {
    let mut merged = base_template.clone();
    
    // Merge elements with unique IDs
    for mut element in overlay_template.elements {
        element.id = uuid::Uuid::new_v4().to_string();
        merged.elements.push(element);
    }
    
    // Merge data sources
    for data_source in overlay_template.data_sources {
        if !merged.data_sources.iter().any(|ds| ds.id == data_source.id) {
            merged.data_sources.push(data_source);
        }
    }
    
    // Merge parameters
    for parameter in overlay_template.parameters {
        if !merged.parameters.iter().any(|p| p.name == parameter.name) {
            merged.parameters.push(parameter);
        }
    }
    
    // Merge variables
    for variable in overlay_template.variables {
        if !merged.variables.iter().any(|v| v.name == variable.name) {
            merged.variables.push(variable);
        }
    }
    
    // Update metadata
    merged.metadata.last_modified = chrono::Utc::now();
    merged.metadata.description = Some(format!(
        "Merged template (base: {}, overlay: {})",
        base_template.metadata.description.unwrap_or_else(|| "Untitled".to_string()),
        overlay_template.metadata.description.unwrap_or_else(|| "Untitled".to_string())
    ));
    
    Ok(merged)
}

#[tauri::command] 
pub async fn extract_template_elements(
    template: JasperTemplate,
    element_ids: Vec<String>
) -> Result<JasperTemplate> {
    let mut extracted = JasperTemplate::new();
    extracted.canvas = template.canvas;
    extracted.metadata.description = Some("Extracted elements".to_string());
    
    // Extract specified elements
    for element in template.elements {
        if element_ids.contains(&element.id) {
            extracted.elements.push(element);
        }
    }
    
    // Extract related data sources
    let mut used_source_ids = std::collections::HashSet::new();
    for element in &extracted.elements {
        if let Some(binding) = &element.data_binding {
            used_source_ids.insert(binding.source_id.clone());
        }
    }
    
    for data_source in template.data_sources {
        if used_source_ids.contains(&data_source.id) {
            extracted.data_sources.push(data_source);
        }
    }
    
    Ok(extracted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::template::JasperTemplate;
    
    #[tokio::test]
    async fn test_create_empty_template() {
        let template = create_empty_template().await.expect("Should create template");
        assert_eq!(template.elements.len(), 0);
        assert_eq!(template.data_sources.len(), 0);
        assert!(template.validate().is_ok());
    }
    
    #[tokio::test]
    async fn test_validate_template() {
        let template = JasperTemplate::new();
        let result = validate_template(template).await.expect("Should validate");
        assert!(result);
    }
    
    #[tokio::test]
    async fn test_clone_template() {
        let mut template = JasperTemplate::new();
        template.metadata.description = Some("Original".to_string());
        
        let cloned = clone_template(template.clone()).await.expect("Should clone");
        assert!(cloned.metadata.description.unwrap().contains("Copy"));
        assert_ne!(template.metadata.created_at, cloned.metadata.created_at);
    }
}