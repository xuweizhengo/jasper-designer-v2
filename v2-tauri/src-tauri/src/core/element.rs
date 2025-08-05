use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::errors::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ElementId(Uuid);

impl ElementId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
    
    pub fn from_string(s: &str) -> Result<Self> {
        let uuid = Uuid::parse_str(s)
            .map_err(|_| AppError::SerializationError { 
                message: format!("Invalid UUID: {}", s) 
            })?;
        Ok(Self(uuid))
    }
    
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl Default for ElementId {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Position {
    pub fn new(x: f64, y: f64) -> Result<Self> {
        if x < 0.0 || y < 0.0 {
            return Err(AppError::InvalidPosition { x, y });
        }
        Ok(Self { x, y })
    }
    
    pub fn validate(&self) -> Result<()> {
        if self.x < 0.0 || self.y < 0.0 {
            return Err(AppError::InvalidPosition { x: self.x, y: self.y });
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

impl Size {
    pub fn new(width: f64, height: f64) -> Result<Self> {
        if width <= 0.0 || height <= 0.0 {
            return Err(AppError::InvalidSize { width, height });
        }
        Ok(Self { width, height })
    }
    
    pub fn validate(&self) -> Result<()> {
        if self.width <= 0.0 || self.height <= 0.0 {
            return Err(AppError::InvalidSize { 
                width: self.width, 
                height: self.height 
            });
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextStyle {
    pub font_family: String,
    pub font_size: f64,
    pub font_weight: String,
    pub color: String,
    pub align: TextAlign,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextAlign {
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorderStyle {
    pub color: String,
    pub width: f64,
    pub style: BorderStyleType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BorderStyleType {
    Solid,
    Dashed,
    Dotted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ElementContent {
    Text {
        content: String,
        style: TextStyle,
    },
    Image {
        src: String,
        alt: Option<String>,
    },
    Rectangle {
        fill_color: Option<String>,
        border: Option<BorderStyle>,
    },
    Line {
        color: String,
        width: f64,
    },
    DataField {
        expression: String,
        format: Option<String>,
        style: TextStyle,
    },
}

impl ElementContent {
    pub fn get_type_name(&self) -> &'static str {
        match self {
            ElementContent::Text { .. } => "text",
            ElementContent::Image { .. } => "image",
            ElementContent::Rectangle { .. } => "rectangle",
            ElementContent::Line { .. } => "line",
            ElementContent::DataField { .. } => "data_field",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportElement {
    pub id: ElementId,
    pub position: Position,
    pub size: Size,
    pub content: ElementContent,
    pub z_index: i32,
    pub visible: bool,
    pub locked: bool,
    pub name: Option<String>,
}

impl ReportElement {
    pub fn new(content: ElementContent, position: Position, size: Size) -> Result<Self> {
        position.validate()?;
        size.validate()?;
        
        Ok(Self {
            id: ElementId::new(),
            position,
            size,
            content,
            z_index: 0,
            visible: true,
            locked: false,
            name: None,
        })
    }
    
    pub fn update_position(&mut self, new_position: Position) -> Result<()> {
        new_position.validate()?;
        self.position = new_position;
        Ok(())
    }
    
    pub fn update_size(&mut self, new_size: Size) -> Result<()> {
        new_size.validate()?;
        self.size = new_size;
        Ok(())
    }
    
    pub fn move_by(&mut self, dx: f64, dy: f64) -> Result<()> {
        let new_position = Position::new(self.position.x + dx, self.position.y + dy)?;
        self.position = new_position;
        Ok(())
    }
    
    pub fn contains_point(&self, x: f64, y: f64) -> bool {
        x >= self.position.x
            && x <= self.position.x + self.size.width
            && y >= self.position.y
            && y <= self.position.y + self.size.height
    }
    
    pub fn intersects(&self, other: &ReportElement) -> bool {
        !(self.position.x + self.size.width < other.position.x
            || other.position.x + other.size.width < self.position.x
            || self.position.y + self.size.height < other.position.y
            || other.position.y + other.size.height < self.position.y)
    }
}