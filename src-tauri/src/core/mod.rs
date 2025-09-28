pub mod element;
pub mod canvas;
pub mod state;
pub mod history;
pub mod template;
pub mod template_service;

// 新架构模块
pub mod models;
pub mod renderer_trait;
pub mod errors;
pub mod renderer_pool;

// Re-export 常用类型
pub use models::{
    Element as DomainElement, ElementId, ElementType as DomainElementType,
    Geometry, Style as DomainStyle, Content, Metadata,
    Rectangle, Point, Transform, Color, ExportFormat, ExportOptions, ExportResult,
    ValidationResult, ValidationError,
};

pub use renderer_trait::{
    Renderer, RenderOutput, RenderContext, RenderQuality,
    RendererCapabilities, RendererConfig,
    CachableRenderer, IncrementalRenderer, RendererFactory,
};

pub use errors::{
    RenderError, ExportError, AdapterError, PoolError,
    RenderResult, AdapterResult, PoolResult,
    ErrorContext,
};