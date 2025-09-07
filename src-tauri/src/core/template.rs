// === Jasper Template Serialization Core Types ===
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::core::element::{Position, Size, ReportElement};
use crate::errors::{AppError, Result};
use chrono::{DateTime, Utc};

// === Template Metadata ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateMetadata {
    pub version: String,
    pub format_version: String,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub created_by: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub compatibility: CompatibilityInfo,
}

impl Default for TemplateMetadata {
    fn default() -> Self {
        let now = Utc::now();
        Self {
            version: "2.0.0".to_string(),
            format_version: "1.0.0".to_string(),
            created_at: now,
            last_modified: now,
            created_by: "jasper-designer-v2".to_string(),
            description: None,
            tags: Vec::new(),
            compatibility: CompatibilityInfo::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityInfo {
    pub min_jasper_version: String,
    pub jasperreports_version: Option<String>,
}

impl Default for CompatibilityInfo {
    fn default() -> Self {
        Self {
            min_jasper_version: "2.0.0".to_string(),
            jasperreports_version: Some("6.20.0".to_string()),
        }
    }
}

// === Canvas Configuration ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Canvas {
    pub width: f64,
    pub height: f64,
    pub unit: PageUnit,
    pub orientation: PageOrientation,
    pub margins: PageMargins,
    pub grid: GridConfig,
    pub background: BackgroundConfig,
}

impl Default for Canvas {
    fn default() -> Self {
        Self {
            width: 595.0, // A4 width in points
            height: 842.0, // A4 height in points
            unit: PageUnit::Point,
            orientation: PageOrientation::Portrait,
            margins: PageMargins::default(),
            grid: GridConfig::default(),
            background: BackgroundConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageUnit {
    #[serde(rename = "pt")]
    Point,
    #[serde(rename = "mm")]
    Millimeter,
    #[serde(rename = "in")]
    Inch,
    #[serde(rename = "px")]
    Pixel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageOrientation {
    #[serde(rename = "portrait")]
    Portrait,
    #[serde(rename = "landscape")]
    Landscape,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageMargins {
    pub top: f64,
    pub bottom: f64,
    pub left: f64,
    pub right: f64,
}

impl Default for PageMargins {
    fn default() -> Self {
        Self {
            top: 20.0,
            bottom: 20.0,
            left: 20.0,
            right: 20.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridConfig {
    pub enabled: bool,
    pub size: f64,
    pub snap: bool,
    pub visible: bool,
}

impl Default for GridConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            size: 10.0,
            snap: true,
            visible: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundConfig {
    pub color: String,
    pub image: Option<String>,
}

impl Default for BackgroundConfig {
    fn default() -> Self {
        Self {
            color: "#ffffff".to_string(),
            image: None,
        }
    }
}

// === Data Source Configuration ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    pub id: String,
    pub name: String,
    pub source_type: DataSourceType,
    pub provider_type: String,
    pub config: DataSourceConfig,
    pub schema: DataSchema,
    pub query: Option<DataQuery>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DataSourceType {
    Json,
    Excel,
    Sql,
    Xml,
    Csv,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceConfig {
    // Database configuration
    pub host: Option<String>,
    pub port: Option<u16>,
    pub database: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub ssl_mode: Option<String>,
    
    // File configuration
    pub file_path: Option<String>,
    pub sheet_name: Option<String>,
    pub delimiter: Option<String>,
    
    // API configuration
    pub url: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub auth_method: Option<String>,
    
    // Connection settings
    pub timeout: Option<u64>,
    pub retry_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSchema {
    pub columns: Vec<ColumnInfo>,
    pub primary_key: Option<String>,
    pub indexes: Vec<String>,
    pub relationships: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: DataType,
    pub nullable: bool,
    pub default_value: Option<serde_json::Value>,
    pub constraints: Vec<String>,
    pub description: Option<String>,
    pub format_hint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataType {
    String,
    Number,
    Boolean,
    Date,
    DateTime,
    Array,
    Object,
    Null,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataQuery {
    pub sql: Option<String>,
    pub path: Option<String>,
    pub filter: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub sort: Option<String>,
    pub parameters: Vec<QueryParameter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryParameter {
    pub name: String,
    pub param_type: DataType,
    pub default: Option<serde_json::Value>,
    pub description: Option<String>,
}

// === Template Elements ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateElement {
    pub id: String,
    pub element_type: ElementType,
    pub position: Position,
    pub size: Size,
    pub z_index: i32,
    pub visible: bool,
    pub content: ElementContent,
    pub style: ElementStyle,
    pub data_binding: Option<DataBinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ElementType {
    Text,
    DataField,
    Rectangle,
    Line,
    Image,
    Barcode,
    Chart,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementContent {
    pub text: Option<String>,
    pub expression: Option<String>,
    pub font: Option<FontConfig>,
    pub alignment: Option<AlignmentConfig>,
    pub color: Option<String>,
    pub format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontConfig {
    pub family: String,
    pub size: f64,
    pub weight: FontWeight,
    pub style: FontStyle,
}

impl Default for FontConfig {
    fn default() -> Self {
        Self {
            family: "Arial".to_string(),
            size: 12.0,
            weight: FontWeight::Normal,
            style: FontStyle::Normal,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FontWeight {
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "bold")]
    Bold,
    #[serde(rename = "light")]
    Light,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FontStyle {
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "italic")]
    Italic,
    #[serde(rename = "oblique")]
    Oblique,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlignmentConfig {
    pub horizontal: HorizontalAlignment,
    pub vertical: VerticalAlignment,
}

impl Default for AlignmentConfig {
    fn default() -> Self {
        Self {
            horizontal: HorizontalAlignment::Left,
            vertical: VerticalAlignment::Middle,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HorizontalAlignment {
    #[serde(rename = "left")]
    Left,
    #[serde(rename = "center")]
    Center,
    #[serde(rename = "right")]
    Right,
    #[serde(rename = "justify")]
    Justify,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VerticalAlignment {
    #[serde(rename = "top")]
    Top,
    #[serde(rename = "middle")]
    Middle,
    #[serde(rename = "bottom")]
    Bottom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementStyle {
    pub background: Option<BackgroundStyle>,
    pub border: Option<BorderStyle>,
    pub padding: Option<PaddingConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundStyle {
    pub color: Option<String>,
    pub image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorderStyle {
    pub width: f64,
    pub color: String,
    pub style: BorderStyleType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BorderStyleType {
    #[serde(rename = "solid")]
    Solid,
    #[serde(rename = "dashed")]
    Dashed,
    #[serde(rename = "dotted")]
    Dotted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaddingConfig {
    pub top: f64,
    pub bottom: f64,
    pub left: f64,
    pub right: f64,
}

impl Default for PaddingConfig {
    fn default() -> Self {
        Self {
            top: 0.0,
            bottom: 0.0,
            left: 0.0,
            right: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataBinding {
    pub source_id: String,
    pub field_name: String,
    pub validation: Option<ValidationRules>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRules {
    pub required: bool,
    pub max_length: Option<usize>,
    pub min_length: Option<usize>,
    pub pattern: Option<String>,
}

// === Parameters and Variables ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parameter {
    pub name: String,
    pub param_type: DataType,
    pub default: Option<serde_json::Value>,
    pub description: Option<String>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub name: String,
    pub var_type: DataType,
    pub expression: String,
    pub initial_value: Option<serde_json::Value>,
    pub description: Option<String>,
}

// === Groups ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub name: String,
    pub expression: String,
    pub sort_order: SortOrder,
    pub header: Option<BandConfig>,
    pub footer: Option<BandConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortOrder {
    #[serde(rename = "asc")]
    Ascending,
    #[serde(rename = "desc")]
    Descending,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandConfig {
    pub height: f64,
    pub elements: Vec<String>, // Element IDs
}

// === Main Template Structure ===
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JasperTemplate {
    pub metadata: TemplateMetadata,
    pub canvas: Canvas,
    pub data_sources: Vec<DataSource>,
    pub elements: Vec<TemplateElement>,
    pub parameters: Vec<Parameter>,
    pub variables: Vec<Variable>,
    pub groups: Vec<Group>,
}

impl JasperTemplate {
    pub fn new() -> Self {
        Self {
            metadata: TemplateMetadata::default(),
            canvas: Canvas::default(),
            data_sources: Vec::new(),
            elements: Vec::new(),
            parameters: Vec::new(),
            variables: Vec::new(),
            groups: Vec::new(),
        }
    }
    
    pub fn validate(&self) -> Result<()> {
        // Validate canvas
        if self.canvas.width <= 0.0 || self.canvas.height <= 0.0 {
            return Err(AppError::ValidationError {
                message: "Canvas dimensions must be positive".to_string(),
            });
        }
        
        // Validate elements
        for element in &self.elements {
            element.position.validate()?;
            element.size.validate()?;
            
            // Validate data binding references
            if let Some(binding) = &element.data_binding {
                let source_exists = self.data_sources
                    .iter()
                    .any(|ds| ds.id == binding.source_id);
                
                if !source_exists {
                    return Err(AppError::ValidationError {
                        message: format!("Data source '{}' not found for element '{}'", 
                                       binding.source_id, element.id),
                    });
                }
            }
        }
        
        // Validate parameter names are unique
        let mut param_names = std::collections::HashSet::new();
        for param in &self.parameters {
            if !param_names.insert(&param.name) {
                return Err(AppError::ValidationError {
                    message: format!("Duplicate parameter name: {}", param.name),
                });
            }
        }
        
        // Validate variable names are unique
        let mut var_names = std::collections::HashSet::new();
        for var in &self.variables {
            if !var_names.insert(&var.name) {
                return Err(AppError::ValidationError {
                    message: format!("Duplicate variable name: {}", var.name),
                });
            }
        }
        
        Ok(())
    }
    
    pub fn add_element(&mut self, element: TemplateElement) -> Result<()> {
        // Check for duplicate IDs
        if self.elements.iter().any(|e| e.id == element.id) {
            return Err(AppError::ValidationError {
                message: format!("Element with ID '{}' already exists", element.id),
            });
        }
        
        self.elements.push(element);
        self.metadata.last_modified = Utc::now();
        Ok(())
    }
    
    pub fn remove_element(&mut self, element_id: &str) -> Result<bool> {
        let initial_len = self.elements.len();
        self.elements.retain(|e| e.id != element_id);
        
        if self.elements.len() < initial_len {
            self.metadata.last_modified = Utc::now();
            Ok(true)
        } else {
            Ok(false)
        }
    }
    
    pub fn get_element_by_id(&self, element_id: &str) -> Option<&TemplateElement> {
        self.elements.iter().find(|e| e.id == element_id)
    }
    
    pub fn get_element_by_id_mut(&mut self, element_id: &str) -> Option<&mut TemplateElement> {
        self.elements.iter_mut().find(|e| e.id == element_id)
    }
    
    pub fn update_canvas(&mut self, canvas: Canvas) {
        self.canvas = canvas;
        self.metadata.last_modified = Utc::now();
    }
    
    pub fn add_data_source(&mut self, data_source: DataSource) -> Result<()> {
        // Check for duplicate IDs
        if self.data_sources.iter().any(|ds| ds.id == data_source.id) {
            return Err(AppError::ValidationError {
                message: format!("Data source with ID '{}' already exists", data_source.id),
            });
        }
        
        self.data_sources.push(data_source);
        self.metadata.last_modified = Utc::now();
        Ok(())
    }
    
    pub fn get_data_source_by_id(&self, source_id: &str) -> Option<&DataSource> {
        self.data_sources.iter().find(|ds| ds.id == source_id)
    }
}

impl Default for JasperTemplate {
    fn default() -> Self {
        Self::new()
    }
}

// === Conversion utilities ===
impl From<&ReportElement> for TemplateElement {
    fn from(element: &ReportElement) -> Self {
        let (element_type, content) = match &element.content {
            crate::core::element::ElementContent::Text { content, style } => {
                (ElementType::Text, ElementContent {
                    text: Some(content.clone()),
                    expression: None,
                    font: Some(FontConfig {
                        family: style.font_family.clone(),
                        size: style.font_size,
                        weight: match style.font_weight.as_str() {
                            "bold" => FontWeight::Bold,
                            "light" => FontWeight::Light,
                            _ => FontWeight::Normal,
                        },
                        style: FontStyle::Normal,
                    }),
                    alignment: Some(match style.align {
                        crate::core::element::TextAlign::Left => AlignmentConfig {
                            horizontal: HorizontalAlignment::Left,
                            vertical: VerticalAlignment::Middle,
                        },
                        crate::core::element::TextAlign::Center => AlignmentConfig {
                            horizontal: HorizontalAlignment::Center,
                            vertical: VerticalAlignment::Middle,
                        },
                        crate::core::element::TextAlign::Right => AlignmentConfig {
                            horizontal: HorizontalAlignment::Right,
                            vertical: VerticalAlignment::Middle,
                        },
                    }),
                    color: Some(style.color.clone()),
                    format: None,
                })
            }
            crate::core::element::ElementContent::DataField { expression, format, style } => {
                (ElementType::DataField, ElementContent {
                    text: None,
                    expression: Some(expression.clone()),
                    font: Some(FontConfig {
                        family: style.font_family.clone(),
                        size: style.font_size,
                        weight: match style.font_weight.as_str() {
                            "bold" => FontWeight::Bold,
                            "light" => FontWeight::Light,
                            _ => FontWeight::Normal,
                        },
                        style: FontStyle::Normal,
                    }),
                    alignment: Some(match style.align {
                        crate::core::element::TextAlign::Left => AlignmentConfig {
                            horizontal: HorizontalAlignment::Left,
                            vertical: VerticalAlignment::Middle,
                        },
                        crate::core::element::TextAlign::Center => AlignmentConfig {
                            horizontal: HorizontalAlignment::Center,
                            vertical: VerticalAlignment::Middle,
                        },
                        crate::core::element::TextAlign::Right => AlignmentConfig {
                            horizontal: HorizontalAlignment::Right,
                            vertical: VerticalAlignment::Middle,
                        },
                    }),
                    color: Some(style.color.clone()),
                    format: format.clone(),
                })
            }
            crate::core::element::ElementContent::Rectangle { fill_color, .. } => {
                (ElementType::Rectangle, ElementContent {
                    text: None,
                    expression: None,
                    font: None,
                    alignment: None,
                    color: fill_color.clone(),
                    format: None,
                })
            }
            crate::core::element::ElementContent::Line { color, .. } => {
                (ElementType::Line, ElementContent {
                    text: None,
                    expression: None,
                    font: None,
                    alignment: None,
                    color: Some(color.clone()),
                    format: None,
                })
            }
            crate::core::element::ElementContent::Image { src, alt } => {
                (ElementType::Image, ElementContent {
                    text: alt.clone(),
                    expression: Some(src.clone()),
                    font: None,
                    alignment: None,
                    color: None,
                    format: None,
                })
            }
        };
        
        Self {
            id: element.id.to_string(),
            element_type,
            position: element.position.clone(),
            size: element.size.clone(),
            z_index: element.z_index,
            visible: element.visible,
            content,
            style: ElementStyle {
                background: None,
                border: None,
                padding: None,
            },
            data_binding: None,
        }
    }
}