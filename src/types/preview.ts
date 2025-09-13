// 前端预览相关类型定义

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
  elements: any[]; // ReportElement[]
  canvasConfig: any; // CanvasConfig  
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