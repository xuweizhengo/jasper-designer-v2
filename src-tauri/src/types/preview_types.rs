use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 预览相关的所有类型定义

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Pdf,
    Png,
    Jpg,
    Webp,
    Svg,
    Excel,
    PowerPoint,
}

/// 图片质量设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageQuality {
    pub dpi: u32,           // 分辨率，默认300
    pub compression: f32,   // 压缩质量 0.0-1.0
    pub color_space: ColorSpace,
    pub anti_aliasing: bool,
}

/// 色彩空间
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]  
pub enum ColorSpace {
    Srgb,
    AdobeRgb,
    Cmyk,
    Grayscale,
}

/// PDF特定设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfOptions {
    pub page_size: PageSize,
    pub orientation: Orientation,
    pub margins: Margins,
    pub embed_fonts: bool,
    pub compress_images: bool,
    pub pdf_version: String, // "1.4", "1.7", "2.0"
}

/// 页面尺寸
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PageSize {
    A4,
    A3,
    A5,
    Letter,
    Legal,
    Custom { width: f64, height: f64 }, // mm
}

/// 页面方向
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Orientation {
    Portrait,
    Landscape,
}

/// 页面边距
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Margins {
    pub top: f64,    // mm
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

/// Excel导出选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExcelOptions {
    pub sheet_name: String,
    pub include_formatting: bool,
    pub auto_fit_columns: bool,
    pub freeze_header: bool,
    pub cell_mapping_strategy: CellMappingStrategy,
}

/// Excel单元格映射策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CellMappingStrategy {
    PositionBased,  // 基于位置映射
    ContentBased,   // 基于内容映射
    TableBased,     // 表格结构映射
}

/// 渲染选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderOptions {
    pub format: OutputFormat,
    pub quality: RenderQuality,
    pub pdf_options: Option<PdfOptions>,
    pub image_quality: Option<ImageQuality>,
    pub excel_options: Option<ExcelOptions>,
    pub custom_properties: HashMap<String, serde_json::Value>,
}

/// 渲染质量级别
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RenderQuality {
    Draft,      // 快速预览，较低质量
    Standard,   // 标准质量
    High,       // 高质量
    Print,      // 印刷级质量
}

/// 渲染结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderResult {
    pub success: bool,
    pub data: Option<Vec<u8>>,
    pub format: OutputFormat,
    pub file_size: u64,
    pub render_time_ms: u64,
    pub metadata: RenderMetadata,
    pub error: Option<String>,
}

/// 渲染元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderMetadata {
    pub page_count: u32,
    pub dimensions: Dimensions,
    pub color_profile: Option<String>,
    pub fonts_used: Vec<String>,
    pub cache_hit: bool,
}

/// 尺寸信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dimensions {
    pub width: u32,
    pub height: u32,
    pub unit: DimensionUnit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DimensionUnit {
    Pixel,
    Mm,
    Inch,
    Point,
}

/// 预览请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewRequest {
    pub elements: Vec<crate::core::element::ReportElement>,
    pub canvas_config: crate::core::canvas::CanvasConfig,
    pub options: RenderOptions,
    pub use_cache: bool,
}

/// 批量渲染请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchRenderRequest {
    pub requests: Vec<PreviewRequest>,
    pub parallel: bool,
    pub max_concurrent: Option<usize>,
}

/// 渲染进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderProgress {
    pub task_id: String,
    pub progress: f64,        // 0.0 - 1.0
    pub stage: RenderStage,
    pub estimated_remaining_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RenderStage {
    Initializing,
    ConvertingToSvg,
    OptimizingSvg,
    Rendering,
    PostProcessing,
    Completed,
    Failed,
}

/// 渲染统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderStats {
    pub total_renders: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub average_render_time_ms: f64,
    pub memory_usage_mb: f64,
    pub error_count: u64,
}

/// 默认实现
impl Default for ImageQuality {
    fn default() -> Self {
        Self {
            dpi: 300,
            compression: 0.9,
            color_space: ColorSpace::Srgb,
            anti_aliasing: true,
        }
    }
}

impl Default for PdfOptions {
    fn default() -> Self {
        Self {
            page_size: PageSize::A4,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 20.0,
                right: 20.0,
                bottom: 20.0,
                left: 20.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.7".to_string(),
        }
    }
}

impl Default for ExcelOptions {
    fn default() -> Self {
        Self {
            sheet_name: "Report".to_string(),
            include_formatting: true,
            auto_fit_columns: true,
            freeze_header: false,
            cell_mapping_strategy: CellMappingStrategy::PositionBased,
        }
    }
}

impl Default for RenderOptions {
    fn default() -> Self {
        Self {
            format: OutputFormat::Pdf,
            quality: RenderQuality::High,
            pdf_options: Some(PdfOptions::default()),
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        }
    }
}

impl Default for RenderMetadata {
    fn default() -> Self {
        Self {
            page_count: 1,
            dimensions: Dimensions {
                width: 595, // A4 width in points
                height: 842, // A4 height in points
                unit: DimensionUnit::Point,
            },
            color_profile: None,
            fonts_used: Vec::new(),
            cache_hit: false,
        }
    }
}