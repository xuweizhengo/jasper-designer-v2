// === Template Serialization Service ===
use std::fs;
use std::path::Path;
use serde_json;
use crate::core::template::JasperTemplate;
use crate::errors::{AppError, Result};

pub struct TemplateSerializer {
    pretty_print: bool,
}

impl TemplateSerializer {
    pub fn new() -> Self {
        Self {
            pretty_print: true,
        }
    }
    
    pub fn with_compact_format() -> Self {
        Self {
            pretty_print: false,
        }
    }
    
    /// Serialize template to JSON string
    pub fn serialize(&self, template: &JasperTemplate) -> Result<String> {
        // Validate template before serialization
        template.validate()?;
        
        let json_string = if self.pretty_print {
            serde_json::to_string_pretty(template)
        } else {
            serde_json::to_string(template)
        }.map_err(|e| AppError::SerializationError {
            message: format!("Failed to serialize template: {}", e),
        })?;
        
        Ok(json_string)
    }
    
    /// Deserialize template from JSON string
    pub fn deserialize(json_data: &str) -> Result<JasperTemplate> {
        let template: JasperTemplate = serde_json::from_str(json_data)
            .map_err(|e| AppError::SerializationError {
                message: format!("Failed to deserialize template: {}", e),
            })?;
        
        // Validate deserialized template
        template.validate()?;
        
        Ok(template)
    }
    
    /// Save template to file
    pub fn save_to_file(&self, template: &JasperTemplate, file_path: &str) -> Result<()> {
        let json_data = self.serialize(template)?;
        
        // Ensure parent directory exists
        if let Some(parent) = Path::new(file_path).parent() {
            fs::create_dir_all(parent).map_err(|e| AppError::FileError {
                message: format!("Failed to create directory: {}", e),
            })?;
        }
        
        fs::write(file_path, json_data).map_err(|e| AppError::FileError {
            message: format!("Failed to write template file '{}': {}", file_path, e),
        })?;
        
        Ok(())
    }
    
    /// Load template from file
    pub fn load_from_file(file_path: &str) -> Result<JasperTemplate> {
        let json_data = fs::read_to_string(file_path).map_err(|e| AppError::FileError {
            message: format!("Failed to read template file '{}': {}", file_path, e),
        })?;
        
        Self::deserialize(&json_data)
    }
    
    /// Serialize to binary format (compressed)
    pub fn serialize_binary(&self, template: &JasperTemplate) -> Result<Vec<u8>> {
        template.validate()?;
        
        // First serialize to JSON
        let json_data = serde_json::to_vec(template).map_err(|e| AppError::SerializationError {
            message: format!("Failed to serialize template to binary: {}", e),
        })?;
        
        // Add magic header and version
        let mut binary_data = Vec::new();
        binary_data.extend_from_slice(b"JASPER2\0"); // Magic number
        binary_data.extend_from_slice(&1u32.to_le_bytes()); // Version
        binary_data.extend_from_slice(&(json_data.len() as u32).to_le_bytes()); // Size
        binary_data.extend_from_slice(&json_data);
        
        Ok(binary_data)
    }
    
    /// Deserialize from binary format
    pub fn deserialize_binary(binary_data: &[u8]) -> Result<JasperTemplate> {
        if binary_data.len() < 16 {
            return Err(AppError::SerializationError {
                message: "Invalid binary format: too short".to_string(),
            });
        }
        
        // Check magic number
        if &binary_data[0..8] != b"JASPER2\0" {
            return Err(AppError::SerializationError {
                message: "Invalid binary format: bad magic number".to_string(),
            });
        }
        
        // Check version
        let version = u32::from_le_bytes([
            binary_data[8], binary_data[9], binary_data[10], binary_data[11]
        ]);
        
        if version != 1 {
            return Err(AppError::SerializationError {
                message: format!("Unsupported binary format version: {}", version),
            });
        }
        
        // Get data size
        let data_size = u32::from_le_bytes([
            binary_data[12], binary_data[13], binary_data[14], binary_data[15]
        ]) as usize;
        
        if binary_data.len() < 16 + data_size {
            return Err(AppError::SerializationError {
                message: "Invalid binary format: incomplete data".to_string(),
            });
        }
        
        // Extract JSON data
        let json_data = &binary_data[16..16 + data_size];
        
        let template: JasperTemplate = serde_json::from_slice(json_data)
            .map_err(|e| AppError::SerializationError {
                message: format!("Failed to deserialize template from binary: {}", e),
            })?;
        
        template.validate()?;
        Ok(template)
    }
}

impl Default for TemplateSerializer {
    fn default() -> Self {
        Self::new()
    }
}

// === File Format Detection ===
#[derive(Debug, Clone, PartialEq)]
pub enum TemplateFormat {
    Json,
    Binary,
    Jrxml,
    Unknown,
}

impl TemplateFormat {
    pub fn detect_from_file(file_path: &str) -> Self {
        // Check file extension first
        if let Some(extension) = Path::new(file_path).extension() {
            match extension.to_str() {
                Some("jasper") => return Self::Json,
                Some("jbin") => return Self::Binary,
                Some("jrxml") => return Self::Jrxml,
                _ => {}
            }
        }
        
        // Try to read first few bytes
        if let Ok(header) = fs::read(file_path) {
            if header.len() >= 8 && &header[0..8] == b"JASPER2\0" {
                return Self::Binary;
            }
            
            if let Ok(text) = String::from_utf8(header.clone()) {
                let text_trimmed = text.trim_start();
                if text_trimmed.starts_with('{') {
                    return Self::Json;
                }
                if text_trimmed.starts_with("<?xml") || text_trimmed.starts_with("<jasperReport") {
                    return Self::Jrxml;
                }
            }
        }
        
        Self::Unknown
    }
    
    pub fn detect_from_data(data: &[u8]) -> Self {
        if data.len() >= 8 && &data[0..8] == b"JASPER2\0" {
            return Self::Binary;
        }
        
        if let Ok(text) = std::str::from_utf8(data) {
            let text_trimmed = text.trim_start();
            if text_trimmed.starts_with('{') {
                return Self::Json;
            }
            if text_trimmed.starts_with("<?xml") || text_trimmed.starts_with("<jasperReport") {
                return Self::Jrxml;
            }
        }
        
        Self::Unknown
    }
}

// === Universal Template Loader ===
pub struct TemplateLoader;

impl TemplateLoader {
    /// Load template from any supported format
    pub fn load(file_path: &str) -> Result<JasperTemplate> {
        let format = TemplateFormat::detect_from_file(file_path);
        
        match format {
            TemplateFormat::Json => {
                TemplateSerializer::load_from_file(file_path)
            }
            TemplateFormat::Binary => {
                let binary_data = fs::read(file_path).map_err(|e| AppError::FileError {
                    message: format!("Failed to read binary template file '{}': {}", file_path, e),
                })?;
                TemplateSerializer::deserialize_binary(&binary_data)
            }
            TemplateFormat::Jrxml => {
                // TODO: Implement JRXML conversion
                Err(AppError::SerializationError {
                    message: "JRXML format not yet implemented".to_string(),
                })
            }
            TemplateFormat::Unknown => {
                Err(AppError::FileError {
                    message: format!("Unknown template format for file: {}", file_path),
                })
            }
        }
    }
    
    /// Save template to specified format
    pub fn save(template: &JasperTemplate, file_path: &str, format: TemplateFormat) -> Result<()> {
        let serializer = TemplateSerializer::new();
        
        match format {
            TemplateFormat::Json => {
                serializer.save_to_file(template, file_path)
            }
            TemplateFormat::Binary => {
                let binary_data = serializer.serialize_binary(template)?;
                fs::write(file_path, binary_data).map_err(|e| AppError::FileError {
                    message: format!("Failed to write binary template file '{}': {}", file_path, e),
                })?;
                Ok(())
            }
            TemplateFormat::Jrxml => {
                // TODO: Implement JRXML conversion
                Err(AppError::SerializationError {
                    message: "JRXML format not yet implemented".to_string(),
                })
            }
            TemplateFormat::Unknown => {
                Err(AppError::SerializationError {
                    message: "Cannot save to unknown format".to_string(),
                })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::template::{JasperTemplate, TemplateMetadata};
    use tempfile::tempdir;
    
    fn create_test_template() -> JasperTemplate {
        let mut template = JasperTemplate::new();
        template.metadata.description = Some("Test template".to_string());
        template.metadata.tags = vec!["test".to_string(), "example".to_string()];
        template
    }
    
    #[test]
    fn test_json_serialization() {
        let template = create_test_template();
        let serializer = TemplateSerializer::new();
        
        let json_data = serializer.serialize(&template).expect("Should serialize");
        assert!(json_data.contains("Test template"));
        
        let deserialized = TemplateSerializer::deserialize(&json_data)
            .expect("Should deserialize");
        
        assert_eq!(template.metadata.description, deserialized.metadata.description);
        assert_eq!(template.metadata.tags, deserialized.metadata.tags);
    }
    
    #[test]
    fn test_binary_serialization() {
        let template = create_test_template();
        let serializer = TemplateSerializer::new();
        
        let binary_data = serializer.serialize_binary(&template).expect("Should serialize");
        assert!(binary_data.starts_with(b"JASPER2\0"));
        
        let deserialized = TemplateSerializer::deserialize_binary(&binary_data)
            .expect("Should deserialize");
        
        assert_eq!(template.metadata.description, deserialized.metadata.description);
    }
    
    #[test]
    fn test_file_operations() {
        let template = create_test_template();
        let dir = tempdir().expect("Should create temp dir");
        let file_path = dir.path().join("test.jasper");
        let file_path_str = file_path.to_str().unwrap();
        
        let serializer = TemplateSerializer::new();
        serializer.save_to_file(&template, file_path_str).expect("Should save");
        
        let loaded = TemplateSerializer::load_from_file(file_path_str)
            .expect("Should load");
        
        assert_eq!(template.metadata.description, loaded.metadata.description);
    }
    
    #[test]
    fn test_format_detection() {
        // Test JSON detection
        let json_data = b"{\"metadata\":{\"version\":\"2.0.0\"}}";
        assert_eq!(TemplateFormat::detect_from_data(json_data), TemplateFormat::Json);
        
        // Test binary detection
        let binary_data = b"JASPER2\0\x01\x00\x00\x00";
        assert_eq!(TemplateFormat::detect_from_data(binary_data), TemplateFormat::Binary);
        
        // Test XML detection
        let xml_data = b"<?xml version=\"1.0\"?><jasperReport>";
        assert_eq!(TemplateFormat::detect_from_data(xml_data), TemplateFormat::Jrxml);
    }
}