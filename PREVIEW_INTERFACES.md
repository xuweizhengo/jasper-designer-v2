# 预览模式接口定义

## 🎯 接口设计原则
- **类型安全**: 所有接口严格类型定义
- **版本兼容**: 向后兼容的API设计
- **错误处理**: 统一的错误类型和处理机制
- **性能优先**: 异步操作，避免阻塞

## 🦀 Rust 后端接口定义

### 核心类型定义
```rust
// src-tauri/src/types/preview_types.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 输出格式枚举
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

/// 预览错误类型
#[derive(Debug, thiserror::Error, Serialize, Deserialize)]
pub enum PreviewError {
    #[error("Render error: {message}")]
    RenderError { message: String },
    
    #[error("Format not supported: {format:?}")]
    UnsupportedFormat { format: OutputFormat },
    
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
```

### 渲染引擎接口
```rust
// src-tauri/src/preview/renderer.rs

use async_trait::async_trait;
use crate::types::preview_types::*;

/// 格式渲染器trait
#[async_trait]
pub trait FormatRenderer: Send + Sync {
    /// 渲染到指定格式
    async fn render(
        &self,
        svg_data: &str,
        options: &RenderOptions,
    ) -> Result<Vec<u8>, PreviewError>;
    
    /// 获取支持的格式
    fn supported_formats(&self) -> Vec<OutputFormat>;
    
    /// 验证渲染选项
    fn validate_options(&self, options: &RenderOptions) -> Result<(), PreviewError>;
    
    /// 获取默认选项
    fn default_options(&self) -> RenderOptions;
    
    /// 估算渲染时间
    async fn estimate_render_time(&self, svg_data: &str) -> Result<u64, PreviewError>;
}

/// 主预览渲染器
pub struct PreviewRenderer {
    pdf_renderer: Box<dyn FormatRenderer>,
    image_renderer: Box<dyn FormatRenderer>,  
    excel_renderer: Box<dyn FormatRenderer>,
    cache: Arc<RwLock<RenderCache>>,
    config: RenderConfig,
}

impl PreviewRenderer {
    pub fn new() -> Self { /* ... */ }
    
    /// 渲染元素到指定格式
    pub async fn render_elements(
        &self,
        request: PreviewRequest,
    ) -> Result<RenderResult, PreviewError> { /* ... */ }
    
    /// 批量渲染
    pub async fn batch_render(
        &self,
        request: BatchRenderRequest,
    ) -> Result<Vec<RenderResult>, PreviewError> { /* ... */ }
    
    /// 生成预览缩略图
    pub async fn generate_thumbnail(
        &self,
        elements: &[ReportElement],
        size: (u32, u32),
    ) -> Result<Vec<u8>, PreviewError> { /* ... */ }
    
    /// 清理缓存
    pub async fn clear_cache(&self) -> Result<(), PreviewError> { /* ... */ }
    
    /// 获取渲染统计
    pub fn get_render_stats(&self) -> RenderStats { /* ... */ }
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
```

### Tauri命令接口
```rust
// src-tauri/src/commands/preview.rs

use crate::types::preview_types::*;
use crate::preview::PreviewRenderer;

/// 生成预览
#[tauri::command]
pub async fn generate_preview(
    request: PreviewRequest,
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<RenderResult, String> {
    renderer
        .render_elements(request)
        .await
        .map_err(|e| e.to_string())
}

/// 批量渲染
#[tauri::command] 
pub async fn batch_render(
    request: BatchRenderRequest,
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<Vec<RenderResult>, String> {
    renderer
        .batch_render(request)
        .await
        .map_err(|e| e.to_string())
}

/// 生成缩略图
#[tauri::command]
pub async fn generate_thumbnail(
    elements: Vec<ReportElement>,
    width: u32,
    height: u32,
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<Vec<u8>, String> {
    renderer
        .generate_thumbnail(&elements, (width, height))
        .await
        .map_err(|e| e.to_string())
}

/// 获取支持的格式
#[tauri::command]
pub async fn get_supported_formats(
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<Vec<OutputFormat>, String> {
    Ok(vec![
        OutputFormat::Pdf,
        OutputFormat::Png,
        OutputFormat::Jpg,
        OutputFormat::Excel,
    ])
}

/// 获取默认渲染选项
#[tauri::command]
pub async fn get_default_render_options(
    format: OutputFormat,
) -> Result<RenderOptions, String> {
    Ok(match format {
        OutputFormat::Pdf => RenderOptions {
            format,
            quality: RenderQuality::High,
            pdf_options: Some(PdfOptions {
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
            }),
            image_quality: None,
            excel_options: None,
            custom_properties: HashMap::new(),
        },
        // ... 其他格式的默认选项
    })
}

/// 验证渲染选项
#[tauri::command]
pub async fn validate_render_options(
    options: RenderOptions,
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<bool, String> {
    // 验证选项的合法性
    Ok(true) // 简化实现
}

/// 获取渲染统计
#[tauri::command]
pub async fn get_render_stats(
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<RenderStats, String> {
    Ok(renderer.get_render_stats())
}

/// 清理渲染缓存
#[tauri::command]
pub async fn clear_render_cache(
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<(), String> {
    renderer.clear_cache().await.map_err(|e| e.to_string())
}

/// 导出到文件
#[tauri::command]
pub async fn export_to_file(
    request: PreviewRequest,
    file_path: String,
    renderer: tauri::State<'_, Arc<PreviewRenderer>>,
) -> Result<String, String> {
    let result = renderer
        .render_elements(request)
        .await
        .map_err(|e| e.to_string())?;
    
    if let Some(data) = result.data {
        std::fs::write(&file_path, data)
            .map_err(|e| e.to_string())?;
        Ok(file_path)
    } else {
        Err("No data to export".to_string())
    }
}
```

## 🌐 TypeScript 前端接口定义

### 核心类型定义
```typescript
// src/types/preview.ts

export type OutputFormat = 
  | 'pdf' 
  | 'png' 
  | 'jpg' 
  | 'webp' 
  | 'svg' 
  | 'excel' 
  | 'powerpoint';

export type RenderQuality = 
  | 'draft' 
  | 'standard' 
  | 'high' 
  | 'print';

export type ColorSpace = 
  | 'srgb' 
  | 'adobe_rgb' 
  | 'cmyk' 
  | 'grayscale';

export type PageSize = 
  | 'a4' 
  | 'a3' 
  | 'a5' 
  | 'letter' 
  | 'legal'
  | { custom: { width: number; height: number } }; // mm

export type Orientation = 'portrait' | 'landscape';

export interface Margins {
  top: number;    // mm
  right: number;
  bottom: number;
  left: number;
}

export interface ImageQuality {
  dpi: number;
  compression: number;  // 0.0-1.0
  colorSpace: ColorSpace;
  antiAliasing: boolean;
}

export interface PdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margins: Margins;
  embedFonts: boolean;
  compressImages: boolean;
  pdfVersion: string;
}

export type CellMappingStrategy = 
  | 'position_based' 
  | 'content_based' 
  | 'table_based';

export interface ExcelOptions {
  sheetName: string;
  includeFormatting: boolean;
  autoFitColumns: boolean;
  freezeHeader: boolean;
  cellMappingStrategy: CellMappingStrategy;
}

export interface RenderOptions {
  format: OutputFormat;
  quality: RenderQuality;
  pdfOptions?: PdfOptions;
  imageQuality?: ImageQuality;
  excelOptions?: ExcelOptions;
  customProperties?: Record<string, any>;
}

export interface Dimensions {
  width: number;
  height: number;
  unit: 'pixel' | 'mm' | 'inch' | 'point';
}

export interface RenderMetadata {
  pageCount: number;
  dimensions: Dimensions;
  colorProfile?: string;
  fontsUsed: string[];
  cacheHit: boolean;
}

export interface RenderResult {
  success: boolean;
  data?: Uint8Array;
  format: OutputFormat;
  fileSize: number;
  renderTimeMs: number;
  metadata: RenderMetadata;
  error?: string;
}

export interface PreviewRequest {
  elements: ReportElement[];
  canvasConfig: CanvasConfig;
  options: RenderOptions;
  useCache: boolean;
}

export interface BatchRenderRequest {
  requests: PreviewRequest[];
  parallel: boolean;
  maxConcurrent?: number;
}

export type RenderStage = 
  | 'initializing'
  | 'converting_to_svg'
  | 'optimizing_svg'
  | 'rendering'
  | 'post_processing'
  | 'completed'
  | 'failed';

export interface RenderProgress {
  taskId: string;
  progress: number; // 0.0 - 1.0
  stage: RenderStage;
  estimatedRemainingMs?: number;
}

export interface RenderStats {
  totalRenders: number;
  cacheHits: number;
  cacheMisses: number;
  averageRenderTimeMs: number;
  memoryUsageMb: number;
  errorCount: number;
}
```

### 前端API接口
```typescript
// src/api/preview.ts

import { invoke } from '@tauri-apps/api/tauri';
import type { 
  PreviewRequest, 
  RenderResult, 
  RenderOptions, 
  OutputFormat,
  RenderStats,
  BatchRenderRequest 
} from '../types/preview';

export class PreviewAPI {
  /**
   * 生成预览
   */
  static async generatePreview(request: PreviewRequest): Promise<RenderResult> {
    return await invoke<RenderResult>('generate_preview', { request });
  }

  /**
   * 批量渲染
   */
  static async batchRender(request: BatchRenderRequest): Promise<RenderResult[]> {
    return await invoke<RenderResult[]>('batch_render', { request });
  }

  /**
   * 生成缩略图
   */
  static async generateThumbnail(
    elements: ReportElement[], 
    width: number, 
    height: number
  ): Promise<Uint8Array> {
    return await invoke<Uint8Array>('generate_thumbnail', { elements, width, height });
  }

  /**
   * 获取支持的格式
   */
  static async getSupportedFormats(): Promise<OutputFormat[]> {
    return await invoke<OutputFormat[]>('get_supported_formats');
  }

  /**
   * 获取默认渲染选项
   */
  static async getDefaultRenderOptions(format: OutputFormat): Promise<RenderOptions> {
    return await invoke<RenderOptions>('get_default_render_options', { format });
  }

  /**
   * 验证渲染选项
   */
  static async validateRenderOptions(options: RenderOptions): Promise<boolean> {
    return await invoke<boolean>('validate_render_options', { options });
  }

  /**
   * 获取渲染统计
   */
  static async getRenderStats(): Promise<RenderStats> {
    return await invoke<RenderStats>('get_render_stats');
  }

  /**
   * 清理渲染缓存
   */
  static async clearRenderCache(): Promise<void> {
    return await invoke<void>('clear_render_cache');
  }

  /**
   * 导出到文件
   */
  static async exportToFile(
    request: PreviewRequest, 
    filePath: string
  ): Promise<string> {
    return await invoke<string>('export_to_file', { request, filePath });
  }

  /**
   * 下载渲染结果
   */
  static downloadResult(result: RenderResult, filename: string): void {
    if (!result.data || !result.success) {
      throw new Error('No data to download');
    }

    const blob = new Blob([result.data], { 
      type: this.getMimeType(result.format) 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * 获取MIME类型
   */
  private static getMimeType(format: OutputFormat): string {
    const mimeTypes: Record<OutputFormat, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}
```

### React Hook接口
```typescript
// src/hooks/usePreview.ts

import { createSignal, createResource, createEffect } from 'solid-js';
import { PreviewAPI } from '../api/preview';
import type { PreviewRequest, RenderResult, RenderOptions } from '../types/preview';

export function usePreview() {
  const [renderOptions, setRenderOptions] = createSignal<RenderOptions>({
    format: 'pdf',
    quality: 'high',
    useCache: true,
  } as RenderOptions);

  const [renderResult, setRenderResult] = createSignal<RenderResult | null>(null);
  const [isRendering, setIsRendering] = createSignal(false);
  const [renderError, setRenderError] = createSignal<string | null>(null);

  // 渲染统计资源
  const [stats] = createResource(() => PreviewAPI.getRenderStats());

  // 支持的格式资源
  const [supportedFormats] = createResource(() => PreviewAPI.getSupportedFormats());

  /**
   * 执行渲染
   */
  const render = async (request: PreviewRequest) => {
    try {
      setIsRendering(true);
      setRenderError(null);
      
      const result = await PreviewAPI.generatePreview({
        ...request,
        options: renderOptions(),
      });
      
      setRenderResult(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRenderError(errorMessage);
      throw error;
    } finally {
      setIsRendering(false);
    }
  };

  /**
   * 下载当前结果
   */
  const download = (filename?: string) => {
    const result = renderResult();
    if (!result) {
      throw new Error('No render result to download');
    }
    
    const defaultFilename = `preview.${result.format}`;
    PreviewAPI.downloadResult(result, filename || defaultFilename);
  };

  /**
   * 清理缓存
   */
  const clearCache = async () => {
    await PreviewAPI.clearRenderCache();
    stats.refetch();
  };

  return {
    // 状态
    renderOptions,
    renderResult,
    isRendering,
    renderError,
    stats,
    supportedFormats,
    
    // 操作
    setRenderOptions,
    render,
    download,
    clearCache,
  };
}
```

## 🔧 配置接口

### 渲染器配置
```rust
// src-tauri/src/preview/config.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderConfig {
    pub max_concurrent_renders: usize,
    pub cache_size_mb: usize,
    pub timeout_seconds: u64,
    pub temp_directory: PathBuf,
    pub font_directories: Vec<PathBuf>,
    pub quality_presets: HashMap<RenderQuality, QualityPreset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityPreset {
    pub dpi: u32,
    pub compression: f32,
    pub anti_aliasing: bool,
    pub font_hinting: bool,
    pub color_accuracy: ColorAccuracy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ColorAccuracy {
    Fast,
    Accurate,
    Professional,
}
```

这套接口定义提供了：

✅ **完整的类型安全**: Rust和TypeScript类型完全对应  
✅ **灵活的配置**: 支持各种渲染选项和质量设置  
✅ **性能优化**: 异步操作、缓存支持、批量处理  
✅ **错误处理**: 统一的错误类型和处理机制  
✅ **扩展性**: 易于添加新格式和选项  

接下来可以基于这些接口开始具体实现。