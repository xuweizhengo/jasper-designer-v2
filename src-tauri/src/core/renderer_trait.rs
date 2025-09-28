use async_trait::async_trait;
use std::error::Error;
use super::models::{Element, ExportFormat, ExportOptions, ExportResult, ValidationResult};

/// 渲染器输出类型
#[derive(Debug, Clone)]
pub enum RenderOutput {
    Image(Vec<u8>),
    Vector(String),
    Document(Vec<u8>),
}

/// 渲染器能力描述
#[derive(Debug, Clone)]
pub struct RendererCapabilities {
    pub supported_formats: Vec<ExportFormat>,
    pub max_width: u32,
    pub max_height: u32,
    pub supports_transparency: bool,
    pub supports_layers: bool,
    pub supports_text: bool,
    pub supports_gradients: bool,
    pub supports_filters: bool,
    pub supports_blend_modes: bool,
    pub thread_safe: bool,
}

/// 渲染上下文
#[derive(Debug, Clone)]
pub struct RenderContext {
    pub width: u32,
    pub height: u32,
    pub dpi: u32,
    pub background: Option<crate::core::models::Color>,
    pub clip_bounds: Option<crate::core::models::Rectangle>,
    pub quality: RenderQuality,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RenderQuality {
    Draft,
    Normal,
    High,
    Print,
}

/// 核心渲染器trait
#[async_trait]
pub trait Renderer: Send + Sync {
    type Error: Error + Send + Sync;

    /// 获取渲染器能力
    fn capabilities(&self) -> RendererCapabilities;

    /// 验证元素是否可以渲染
    fn validate(&self, element: &Element) -> ValidationResult;

    /// 渲染单个元素
    async fn render(
        &self,
        element: &Element,
        context: &RenderContext,
    ) -> Result<RenderOutput, Self::Error>;

    /// 批量渲染元素
    async fn render_batch(
        &self,
        elements: &[Element],
        context: &RenderContext,
    ) -> Result<Vec<RenderOutput>, Self::Error> {
        let mut results = Vec::with_capacity(elements.len());
        for element in elements {
            results.push(self.render(element, context).await?);
        }
        Ok(results)
    }

    /// 导出到指定格式
    async fn export(
        &self,
        element: &Element,
        options: &ExportOptions,
    ) -> Result<ExportResult, Self::Error>;

    /// 预处理元素（可选）
    fn preprocess(&self, element: &mut Element) {
        // 默认不做任何处理
    }

    /// 后处理输出（可选）
    fn postprocess(&self, output: &mut RenderOutput) {
        // 默认不做任何处理
    }
}

/// 可缓存的渲染器
pub trait CachableRenderer: Renderer {
    /// 生成缓存键
    fn cache_key(&self, element: &Element, context: &RenderContext) -> String;

    /// 检查缓存是否有效
    fn is_cache_valid(&self, key: &str) -> bool;
}

/// 支持增量渲染的渲染器
#[async_trait]
pub trait IncrementalRenderer: Renderer {
    /// 计算脏区域
    fn calculate_dirty_regions(
        &self,
        old_element: &Element,
        new_element: &Element,
    ) -> Vec<crate::core::models::Rectangle>;

    /// 增量渲染
    async fn render_incremental(
        &self,
        element: &Element,
        dirty_regions: &[crate::core::models::Rectangle],
        context: &RenderContext,
    ) -> Result<RenderOutput, Self::Error>;
}

/// 渲染器工厂
pub trait RendererFactory: Send + Sync {
    type Renderer: Renderer;

    /// 创建渲染器实例
    fn create(&self) -> Result<Self::Renderer, Box<dyn Error + Send + Sync>>;

    /// 创建带配置的渲染器
    fn create_with_config(
        &self,
        config: RendererConfig,
    ) -> Result<Self::Renderer, Box<dyn Error + Send + Sync>>;
}

/// 渲染器配置
#[derive(Debug, Clone)]
pub struct RendererConfig {
    pub max_width: u32,
    pub max_height: u32,
    pub enable_cache: bool,
    pub cache_size_mb: usize,
    pub thread_pool_size: usize,
    pub timeout_seconds: u64,
}

impl Default for RendererConfig {
    fn default() -> Self {
        Self {
            max_width: 8192,
            max_height: 8192,
            enable_cache: true,
            cache_size_mb: 256,
            thread_pool_size: 4,
            timeout_seconds: 30,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::models::{ElementId, ElementType, Geometry, Rectangle, Style, Metadata};

    // 模拟渲染器用于测试
    struct MockRenderer;

    #[async_trait]
    impl Renderer for MockRenderer {
        type Error = std::io::Error;

        fn capabilities(&self) -> RendererCapabilities {
            RendererCapabilities {
                supported_formats: vec![ExportFormat::Png],
                max_width: 4096,
                max_height: 4096,
                supports_transparency: true,
                supports_layers: false,
                supports_text: true,
                supports_gradients: false,
                supports_filters: false,
                supports_blend_modes: false,
                thread_safe: true,
            }
        }

        fn validate(&self, _element: &Element) -> ValidationResult {
            ValidationResult {
                is_valid: true,
                errors: vec![],
                warnings: vec![],
            }
        }

        async fn render(
            &self,
            _element: &Element,
            _context: &RenderContext,
        ) -> Result<RenderOutput, Self::Error> {
            Ok(RenderOutput::Image(vec![0, 1, 2, 3]))
        }

        async fn export(
            &self,
            _element: &Element,
            options: &ExportOptions,
        ) -> Result<ExportResult, Self::Error> {
            Ok(ExportResult {
                data: vec![0, 1, 2, 3],
                format: options.format.clone(),
                metadata: std::collections::HashMap::new(),
            })
        }
    }

    #[tokio::test]
    async fn test_mock_renderer() {
        let renderer = MockRenderer;
        let element = Element {
            id: ElementId::new("test"),
            element_type: ElementType::Rectangle,
            geometry: Geometry {
                bounds: Rectangle::new(0.0, 0.0, 100.0, 100.0),
                transform: crate::core::models::Transform::default(),
                clip: None,
            },
            style: Style::default(),
            content: None,
            metadata: Metadata::default(),
            children: vec![],
            visible: true,
            locked: false,
        };

        let context = RenderContext {
            width: 100,
            height: 100,
            dpi: 96,
            background: None,
            clip_bounds: None,
            quality: RenderQuality::Normal,
        };

        let result = renderer.render(&element, &context).await;
        assert!(result.is_ok());
    }
}