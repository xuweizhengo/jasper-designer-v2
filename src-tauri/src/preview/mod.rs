pub mod renderer;
pub mod formats;
pub mod cache;
pub mod svg_converter;
pub mod quality;
pub mod manager;
pub mod commands;

#[cfg(test)]
mod tests;

// Re-export main types for convenience
pub use renderer::PreviewRenderer;
pub use formats::FormatRenderer;
pub use cache::RenderCache;
pub use svg_converter::SvgConverter;
pub use manager::PreviewManager;
pub use crate::types::preview_types::*;

// Preview-specific error types
pub mod error {
    use serde::{Deserialize, Serialize};
    use thiserror::Error;
    
    #[derive(Debug, Error, Serialize, Deserialize)]
    pub enum PreviewError {
        #[error("Render error: {message}")]
        RenderError { message: String },
        
        #[error("Format not supported: {format}")]
        UnsupportedFormat { format: String },
        
        #[error("Invalid options: {details}")]
        InvalidOptions { details: String },
        
        #[error("Cache error: {message}")]
        CacheError { message: String },
        
        #[error("IO error: {message}")]
        IoError { message: String },
        
        #[error("Font error: {message}")]
        FontError { message: String },
        
        #[error("Memory limit exceeded")]
        OutOfMemory,
        
        #[error("Timeout after {timeout_ms}ms")]
        Timeout { timeout_ms: u64 },
    }

    pub type PreviewResult<T> = Result<T, PreviewError>;
}

pub use error::{PreviewError, PreviewResult};