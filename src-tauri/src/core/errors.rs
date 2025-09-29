use thiserror::Error;
use super::models::{ExportFormat, ValidationError};

/// 渲染系统核心错误类型
#[derive(Error, Debug)]
pub enum RenderError {
    #[error("Validation failed: {message}")]
    ValidationError {
        message: String,
        errors: Vec<ValidationError>,
    },

    #[error("Unsupported format: {format:?}")]
    UnsupportedFormat { format: ExportFormat },

    #[error("Unsupported feature: {feature} in renderer {renderer}")]
    UnsupportedFeature { feature: String, renderer: String },

    #[error("Resource not found: {resource}")]
    ResourceNotFound { resource: String },

    #[error("Invalid dimensions: {width}x{height}")]
    InvalidDimensions { width: u32, height: u32 },

    #[error("Renderer initialization failed: {reason}")]
    InitializationFailed { reason: String },

    #[error("Render timeout after {seconds} seconds")]
    Timeout { seconds: u64 },

    #[error("Out of memory: required {required} bytes, available {available} bytes")]
    OutOfMemory { required: usize, available: usize },

    #[error("Thread pool exhausted")]
    ThreadPoolExhausted,

    #[error("Cache error: {message}")]
    CacheError { message: String },

    #[error("Conversion error: {from} to {to}: {message}")]
    ConversionError {
        from: String,
        to: String,
        message: String,
    },

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("UTF-8 error: {0}")]
    Utf8Error(#[from] std::string::FromUtf8Error),

    #[error("Skia error: {message}")]
    SkiaError { message: String },

    #[error("PDF error: {message}")]
    PdfError { message: String },

    #[error("SVG error: {message}")]
    SvgError { message: String },

    #[error("Unknown error: {0}")]
    Unknown(String),
}

/// 导出错误
#[derive(Error, Debug)]
pub enum ExportError {
    #[error("Export format not supported: {format:?}")]
    FormatNotSupported { format: ExportFormat },

    #[error("Invalid export options: {message}")]
    InvalidOptions { message: String },

    #[error("Export failed: {message}")]
    ExportFailed { message: String },

    #[error("File write error: {0}")]
    FileWriteError(#[from] std::io::Error),

    #[error("Encoding error: {message}")]
    EncodingError { message: String },

    #[error("Render error: {0}")]
    RenderError(#[from] RenderError),
}

/// 适配器错误
#[derive(Error, Debug)]
pub enum AdapterError {
    #[error("Field mapping failed: {field}")]
    FieldMappingFailed { field: String },

    #[error("Type conversion failed: expected {expected}, got {actual}")]
    TypeConversionFailed { expected: String, actual: String },

    #[error("Missing required field: {field}")]
    MissingRequiredField { field: String },

    #[error("Invalid value for field {field}: {value}")]
    InvalidFieldValue { field: String, value: String },

    #[error("Incompatible versions: source {source_version}, target {target_version}")]
    IncompatibleVersions { source_version: String, target_version: String },

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

/// 渲染器池错误
#[derive(Error, Debug)]
pub enum PoolError {
    #[error("Pool is empty")]
    PoolEmpty,

    #[error("Failed to create renderer: {reason}")]
    CreateFailed { reason: String },

    #[error("Checkout timeout after {seconds} seconds")]
    CheckoutTimeout { seconds: u64 },

    #[error("Invalid renderer state")]
    InvalidState,

    #[error("Pool shutdown")]
    PoolShutdown,
}

/// 结果类型别名
pub type RenderResult<T> = Result<T, RenderError>;
pub type ExportResult<T> = Result<T, ExportError>;
pub type AdapterResult<T> = Result<T, AdapterError>;
pub type PoolResult<T> = Result<T, PoolError>;

/// 错误转换辅助trait
pub trait ErrorContext<T> {
    fn context(self, message: &str) -> Result<T, RenderError>;
    fn with_context<F>(self, f: F) -> Result<T, RenderError>
    where
        F: FnOnce() -> String;
}

impl<T, E> ErrorContext<T> for Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn context(self, message: &str) -> Result<T, RenderError> {
        self.map_err(|e| RenderError::Unknown(format!("{}: {}", message, e)))
    }

    fn with_context<F>(self, f: F) -> Result<T, RenderError>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|e| RenderError::Unknown(format!("{}: {}", f(), e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_error_display() {
        let error = RenderError::UnsupportedFormat {
            format: ExportFormat::Pdf,
        };
        assert_eq!(error.to_string(), "Unsupported format: Pdf");
    }

    #[test]
    fn test_export_error_from_render_error() {
        let render_error = RenderError::ThreadPoolExhausted;
        let export_error = ExportError::from(render_error);
        match export_error {
            ExportError::RenderError(_) => {}
            _ => panic!("Expected RenderError variant"),
        }
    }

    #[test]
    fn test_error_context() {
        fn may_fail() -> Result<(), std::io::Error> {
            Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "file not found",
            ))
        }

        let result = may_fail().context("Failed to load resource");
        assert!(result.is_err());
        let error_msg = result.unwrap_err().to_string();
        assert!(error_msg.contains("Failed to load resource"));
    }
}