/**
 * 预览/导出模式渲染器接口
 * 用于预览模式和导出，优化渲染质量和一致性
 * 主要使用 Skia 实现
 */

import type { RenderableElement } from './interfaces';

/**
 * 导出格式枚举
 */
export enum ExportFormat {
  // 图片格式
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',

  // 矢量格式
  PDF = 'pdf',
  SVG = 'svg',
  EPS = 'eps',

  // Office 格式
  EXCEL = 'xlsx',
  WORD = 'docx',
  POWERPOINT = 'pptx',

  // 其他
  HTML = 'html',
  JSON = 'json',
}

/**
 * 预览/导出渲染器接口
 * 专注于高质量渲染和多格式导出
 */
export interface IExportRenderer {
  // ===== 生命周期 =====
  /**
   * 初始化（可能需要加载 Skia WASM）
   */
  initialize(options?: ExportRendererOptions): Promise<void>;

  /**
   * 销毁
   */
  dispose(): void;

  /**
   * 检查是否支持某种格式
   */
  isFormatSupported(format: ExportFormat): boolean;

  // ===== 高质量渲染 =====
  /**
   * 预览渲染（高质量，完整特性）
   */
  renderPreview(
    elements: RenderableElement[],
    canvas: HTMLCanvasElement,
    options?: PreviewOptions
  ): Promise<void>;

  /**
   * 渲染到离屏 Canvas（用于导出）
   */
  renderOffscreen(
    elements: RenderableElement[],
    width: number,
    height: number,
    options?: RenderOptions
  ): Promise<OffscreenCanvas | ImageData>;

  // ===== 导出功能 =====
  /**
   * 导出为图片
   */
  exportImage(
    elements: RenderableElement[],
    format: 'png' | 'jpeg' | 'webp',
    options?: ImageExportOptions
  ): Promise<Blob>;

  /**
   * 导出为 PDF
   */
  exportPDF(
    pages: RenderableElement[][],
    options?: PDFExportOptions
  ): Promise<Blob>;

  /**
   * 导出为 SVG
   */
  exportSVG(
    elements: RenderableElement[],
    options?: SVGExportOptions
  ): Promise<string>;

  /**
   * 导出为 Office 格式（通过后端）
   */
  exportOffice(
    elements: RenderableElement[],
    format: 'xlsx' | 'docx' | 'pptx',
    options?: OfficeExportOptions
  ): Promise<Blob>;

  // ===== 批量导出 =====
  /**
   * 批量导出多页
   */
  exportBatch(
    pages: RenderableElement[][],
    format: ExportFormat,
    options?: BatchExportOptions
  ): Promise<Blob[]>;

  /**
   * 导出进度回调
   */
  onExportProgress?: (progress: ExportProgress) => void;

  // ===== 打印支持 =====
  /**
   * 准备打印预览
   */
  preparePrint(
    elements: RenderableElement[],
    options?: PrintOptions
  ): Promise<PrintReadyDocument>;

  // ===== 质量控制 =====
  /**
   * 设置渲染质量
   */
  setQuality(quality: 'draft' | 'normal' | 'high' | 'print'): void;

  /**
   * 获取推荐的导出设置
   */
  getRecommendedSettings(format: ExportFormat): ExportSettings;
}

// ===== 配置和选项类型 =====

export interface ExportRendererOptions {
  // Skia 加载选项
  skiaWasmUrl?: string;
  useWebWorker?: boolean;

  // 渲染选项
  defaultQuality?: 'draft' | 'normal' | 'high' | 'print';
  maxTextureSize?: number;

  // 后端选项
  backendUrl?: string;
  authToken?: string;
}

export interface PreviewOptions {
  quality?: 'draft' | 'normal' | 'high' | 'print';
  scale?: number;
  background?: string;
  watermark?: WatermarkOptions;
}

export interface RenderOptions {
  dpi?: number;
  colorSpace?: 'srgb' | 'p3' | 'cmyk';
  antialias?: boolean;
  preserveAspectRatio?: boolean;
}

export interface ImageExportOptions extends RenderOptions {
  quality?: number;        // 0-1 for JPEG
  compression?: number;    // For PNG
  format?: 'rgb' | 'rgba';
  scale?: number;
}

export interface PDFExportOptions extends RenderOptions {
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  metadata?: PDFMetadata;
  embedFonts?: boolean;
  compress?: boolean;
  pdfVersion?: '1.4' | '1.5' | '1.7' | '2.0';
  pdfA?: boolean;  // PDF/A compliance for archiving
}

export interface SVGExportOptions {
  embedImages?: boolean;
  embedFonts?: boolean;
  minify?: boolean;
  precision?: number;
  convertTextToPath?: boolean;
}

export interface OfficeExportOptions {
  template?: string;
  preserveLayout?: boolean;
  embedImages?: boolean;
  compatibility?: 'latest' | 'office2016' | 'office2013';
}

export interface BatchExportOptions {
  parallel?: boolean;
  maxConcurrent?: number;
  continueOnError?: boolean;
  progressCallback?: (progress: ExportProgress) => void;
}

export interface PrintOptions {
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  scale?: number | 'fit' | 'actual';
  pageRanges?: string;  // e.g., "1-5,8,11-13"
  copies?: number;
  collate?: boolean;
  duplex?: 'simplex' | 'long-edge' | 'short-edge';
}

// ===== 辅助类型 =====

export interface WatermarkOptions {
  text?: string;
  image?: string;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  rotation?: number;
  scale?: number;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
  currentPage?: number;
  estimatedTimeRemaining?: number;
}

export interface ExportSettings {
  recommendedDPI: number;
  recommendedFormat: string;
  maxDimensions?: { width: number; height: number };
  colorSpace?: string;
  features?: string[];
  warnings?: string[];
}

export interface PrintReadyDocument {
  pages: Array<{
    content: string | Blob;
    pageNumber: number;
    dimensions: { width: number; height: number };
  }>;
  totalPages: number;
  printCSS?: string;
  options: PrintOptions;
}

/**
 * 导出错误类型
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public code: ExportErrorCode,
    public format?: ExportFormat,
    public details?: any
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export enum ExportErrorCode {
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  RENDER_FAILED = 'RENDER_FAILED',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BACKEND_ERROR = 'BACKEND_ERROR',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  CANCELLED = 'CANCELLED',
}