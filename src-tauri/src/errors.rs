use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("Element not found: {id}")]
    ElementNotFound { id: String },
    
    #[error("Element already exists: {id}")]
    ElementAlreadyExists { id: String },
    
    #[error("Invalid position: x={x}, y={y}")]
    InvalidPosition { x: f64, y: f64 },
    
    #[error("Invalid size: width={width}, height={height}")]
    InvalidSize { width: f64, height: f64 },
    
    #[error("Canvas operation failed: {message}")]
    CanvasError { message: String },
    
    #[error("File operation failed: {message}")]
    FileError { message: String },
    
    #[error("Serialization error: {message}")]
    SerializationError { message: String },
    
    #[error("History operation failed: {message}")]
    HistoryError { message: String },
    
    #[error("Validation error: {message}")]
    ValidationError { message: String },

    #[error("Database error: {message}")]
    DatabaseError { message: String },

    #[error("Connection error: {message}")]
    ConnectionError { message: String },

    #[error("Query error: {message}")]  
    QueryError { message: String },

    #[error("Configuration error: {message}")]
    ConfigError { message: String },
}

// Add JasperError as an alias for AppError for compatibility
pub type JasperError = AppError;

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}

// 添加sqlx错误转换
impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        AppError::DatabaseError {
            message: error.to_string(),
        }
    }
}

pub type Result<T> = std::result::Result<T, AppError>;