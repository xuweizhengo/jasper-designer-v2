pub mod pdf;
pub mod image;
pub mod excel;

use async_trait::async_trait;
use crate::preview::PreviewResult;

// Re-export types for convenience
pub use crate::types::preview_types::{OutputFormat, RenderQuality, RenderOptions, RenderResult};

/// 格式渲染器trait - 所有格式渲染器的通用接口
#[async_trait]
pub trait FormatRenderer: Send + Sync {
    /// 渲染到指定格式
    async fn render(
        &self,
        svg_data: &str,
        options: &RenderOptions,
    ) -> PreviewResult<Vec<u8>>;
    
    /// 获取支持的格式
    fn supported_formats(&self) -> Vec<OutputFormat>;
    
    /// 验证渲染选项
    fn validate_options(&self, options: &RenderOptions) -> PreviewResult<()>;
    
    /// 获取默认选项
    fn default_options(&self) -> RenderOptions;
    
    /// 估算渲染时间
    async fn estimate_render_time(&self, svg_data: &str) -> PreviewResult<u64>;
}