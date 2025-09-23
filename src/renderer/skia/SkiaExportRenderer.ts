/**
 * Skia 导出渲染器
 * 用于预览模式和导出功能
 * 通过调用后端 Rust 服务实现高质量渲染
 */

import type {
  IExportRenderer,
  ExportRendererOptions,
  PreviewOptions,
  ImageExportOptions,
  PDFExportOptions,
  SVGExportOptions,
  OfficeExportOptions,
  BatchExportOptions,
  PrintOptions,
  ExportProgress,
  ExportSettings,
  PrintReadyDocument,
  ExportError,
  ExportErrorCode,
} from '../core/export-interfaces';
import { ExportFormat } from '../core/export-interfaces';
import type { RenderableElement } from '../core/interfaces';
import { invoke } from '@tauri-apps/api/tauri';

export class SkiaExportRenderer implements IExportRenderer {
  private isInitialized = false;
  private quality: 'draft' | 'normal' | 'high' | 'print' = 'normal';

  // 进度回调
  onExportProgress?: (progress: ExportProgress) => void;

  // ===== 生命周期 =====

  async initialize(options?: ExportRendererOptions): Promise<void> {
    console.log('初始化 Skia 导出渲染器...');
    this.options = options || {};

    try {
      // 调用后端初始化 Skia
      await invoke('init_skia_renderer', {
        useWebWorker: options?.useWebWorker || false,
        defaultQuality: options?.defaultQuality || 'normal',
        maxTextureSize: options?.maxTextureSize || 4096,
      });

      this.isInitialized = true;
      console.log('Skia 导出渲染器初始化成功');
    } catch (error) {
      console.error('Skia 初始化失败:', error);
      throw new Error(`Failed to initialize Skia renderer: ${error}`);
    }
  }

  dispose(): void {
    if (this.isInitialized) {
      // 调用后端清理 Skia
      invoke('dispose_skia_renderer').catch(console.error);
      this.isInitialized = false;
    }
  }

  isFormatSupported(format: ExportFormat): boolean {
    // Skia 支持的格式
    const supportedFormats: ExportFormat[] = [
      ExportFormat.PNG,
      ExportFormat.JPEG,
      ExportFormat.WEBP,
      ExportFormat.PDF,
      ExportFormat.SVG,
      // Office 格式通过后端服务支持
      ExportFormat.EXCEL,
      ExportFormat.WORD,
      ExportFormat.POWERPOINT,
    ];

    return supportedFormats.includes(format);
  }

  // ===== 高质量渲染 =====

  async renderPreview(
    elements: RenderableElement[],
    canvas: HTMLCanvasElement,
    options?: PreviewOptions
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    try {
      // 准备渲染数据
      const renderData = {
        elements: this.serializeElements(elements),
        width: canvas.width,
        height: canvas.height,
        quality: options?.quality || this.quality,
        scale: options?.scale || 1,
        background: options?.background || '#ffffff',
        watermark: options?.watermark,
      };

      // 调用后端渲染
      const imageData = await invoke<Uint8Array>('render_preview', renderData);

      // 将结果绘制到 Canvas
      const blob = new Blob([imageData], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('预览渲染失败:', error);
      throw error;
    }
  }

  async renderOffscreen(
    elements: RenderableElement[],
    width: number,
    height: number,
    options?: any
  ): Promise<ImageData> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    try {
      // 调用后端离屏渲染
      const renderData = {
        elements: this.serializeElements(elements),
        width,
        height,
        dpi: options?.dpi || 96,
        colorSpace: options?.colorSpace || 'srgb',
        antialias: options?.antialias ?? true,
      };

      const buffer = await invoke<Uint8Array>('render_offscreen', renderData);

      // 转换为 ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(buffer),
        width,
        height
      );

      return imageData;
    } catch (error) {
      console.error('离屏渲染失败:', error);
      throw error;
    }
  }

  // ===== 导出功能 =====

  async exportImage(
    elements: RenderableElement[],
    format: 'png' | 'jpeg' | 'webp',
    options?: ImageExportOptions
  ): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    this.reportProgress(0, 100, '准备导出图片...');

    try {
      const exportData = {
        elements: this.serializeElements(elements),
        format,
        quality: options?.quality || 0.9,
        compression: options?.compression || 6,
        scale: options?.scale || 1,
        dpi: options?.dpi || 96,
      };

      this.reportProgress(20, 100, '正在渲染...');

      // 调用后端导出
      const imageData = await invoke<Uint8Array>('export_image', exportData);

      this.reportProgress(80, 100, '正在生成文件...');

      const mimeType = `image/${format}`;
      const blob = new Blob([new Uint8Array(imageData)], { type: mimeType });

      this.reportProgress(100, 100, '导出完成');

      return blob;
    } catch (error) {
      console.error('图片导出失败:', error);
      throw this.createExportError('图片导出失败', 'RENDER_FAILED', format, error);
    }
  }

  async exportPDF(
    pages: RenderableElement[][],
    options?: PDFExportOptions
  ): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    this.reportProgress(0, pages.length, '准备导出 PDF...');

    try {
      // 准备页面尺寸
      const pageSize = this.getPageSize(options?.pageSize || 'A4');
      const isLandscape = options?.orientation === 'landscape';

      const exportData = {
        pages: pages.map(page => this.serializeElements(page)),
        pageWidth: isLandscape ? pageSize.height : pageSize.width,
        pageHeight: isLandscape ? pageSize.width : pageSize.height,
        margins: options?.margins || { top: 20, right: 20, bottom: 20, left: 20 },
        metadata: options?.metadata || {},
        embedFonts: options?.embedFonts ?? true,
        compress: options?.compress ?? true,
        pdfVersion: options?.pdfVersion || '1.7',
        pdfA: options?.pdfA || false,
      };

      // 分页渲染并报告进度
      const pdfData = await invoke<Uint8Array>('export_pdf', {
        ...exportData,
        progressCallback: (current: number) => {
          this.reportProgress(current, pages.length, `正在渲染第 ${current} 页...`);
        },
      });

      this.reportProgress(pages.length, pages.length, 'PDF 导出完成');

      return new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
    } catch (error) {
      console.error('PDF 导出失败:', error);
      throw this.createExportError('PDF 导出失败', 'RENDER_FAILED', ExportFormat.PDF, error);
    }
  }

  async exportSVG(
    elements: RenderableElement[],
    options?: SVGExportOptions
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    try {
      const exportData = {
        elements: this.serializeElements(elements),
        embedImages: options?.embedImages ?? true,
        embedFonts: options?.embedFonts ?? true,
        minify: options?.minify ?? false,
        precision: options?.precision || 2,
        convertTextToPath: options?.convertTextToPath ?? false,
      };

      const svgString = await invoke<string>('export_svg', exportData);
      return svgString;
    } catch (error) {
      console.error('SVG 导出失败:', error);
      throw this.createExportError('SVG 导出失败', 'RENDER_FAILED', ExportFormat.SVG, error);
    }
  }

  async exportOffice(
    elements: RenderableElement[],
    format: 'xlsx' | 'docx' | 'pptx',
    options?: OfficeExportOptions
  ): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    this.reportProgress(0, 100, `准备导出 ${format.toUpperCase()}...`);

    try {
      const exportData = {
        elements: this.serializeElements(elements),
        format,
        template: options?.template,
        preserveLayout: options?.preserveLayout ?? true,
        embedImages: options?.embedImages ?? true,
        compatibility: options?.compatibility || 'latest',
      };

      this.reportProgress(30, 100, '正在转换格式...');

      // 调用后端 Office 导出服务
      const officeData = await invoke<Uint8Array>('export_office', exportData);

      this.reportProgress(90, 100, '正在生成文件...');

      const mimeTypes = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };

      const blob = new Blob([officeData], { type: mimeTypes[format] });

      this.reportProgress(100, 100, '导出完成');

      return blob;
    } catch (error) {
      console.error(`${format} 导出失败:`, error);
      throw this.createExportError(`${format} 导出失败`, 'BACKEND_ERROR', ExportFormat.EXCEL, error);
    }
  }

  // ===== 批量导出 =====

  async exportBatch(
    pages: RenderableElement[][],
    format: ExportFormat,
    options?: BatchExportOptions
  ): Promise<Blob[]> {
    const results: Blob[] = [];
    const total = pages.length;
    const parallel = options?.parallel ?? false;
    const maxConcurrent = options?.maxConcurrent || 3;

    if (parallel) {
      // 并行导出
      const chunks = this.chunkArray(pages, maxConcurrent);
      for (const chunk of chunks) {
        const promises = chunk.map((page, index) =>
          this.exportSinglePage(page, format, index, total)
        );

        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
      }
    } else {
      // 串行导出
      for (let i = 0; i < pages.length; i++) {
        try {
          const blob = await this.exportSinglePage(pages[i], format, i, total);
          results.push(blob);
        } catch (error) {
          if (!options?.continueOnError) {
            throw error;
          }
          console.error(`页面 ${i + 1} 导出失败:`, error);
        }
      }
    }

    return results;
  }

  // ===== 打印支持 =====

  async preparePrint(
    elements: RenderableElement[],
    options?: PrintOptions
  ): Promise<PrintReadyDocument> {
    const pageSize = options?.pageSize || 'A4';
    const orientation = options?.orientation || 'portrait';

    // 生成打印预览
    const printData = {
      elements: this.serializeElements(elements),
      pageSize,
      orientation,
      margins: options?.margins || { top: 10, right: 10, bottom: 10, left: 10 },
      scale: options?.scale || 'fit',
    };

    const printPages = await invoke<Array<{ content: string; pageNumber: number }>>('prepare_print', printData);

    return {
      pages: printPages.map(page => ({
        content: page.content,
        pageNumber: page.pageNumber,
        dimensions: this.getPageSize(pageSize),
      })),
      totalPages: printPages.length,
      printCSS: this.generatePrintCSS(options),
      options: options || {},
    };
  }

  // ===== 质量控制 =====

  setQuality(quality: 'draft' | 'normal' | 'high' | 'print'): void {
    this.quality = quality;

    // 通知后端更新质量设置
    invoke('set_render_quality', { quality }).catch(console.error);
  }

  getRecommendedSettings(format: ExportFormat): ExportSettings {
    const settings: Record<ExportFormat, ExportSettings> = {
      [ExportFormat.PNG]: {
        recommendedDPI: 300,
        recommendedFormat: 'rgba',
        maxDimensions: { width: 8192, height: 8192 },
        colorSpace: 'srgb',
        features: ['transparency', 'lossless'],
      },
      [ExportFormat.JPEG]: {
        recommendedDPI: 300,
        recommendedFormat: 'rgb',
        maxDimensions: { width: 8192, height: 8192 },
        colorSpace: 'srgb',
        features: ['compression'],
        warnings: ['不支持透明度'],
      },
      [ExportFormat.PDF]: {
        recommendedDPI: 300,
        recommendedFormat: 'vector',
        colorSpace: 'cmyk',
        features: ['vector', 'multi-page', 'searchable-text', 'compression'],
      },
      [ExportFormat.SVG]: {
        recommendedDPI: 96,
        recommendedFormat: 'vector',
        colorSpace: 'srgb',
        features: ['vector', 'scalable', 'editable'],
      },
      [ExportFormat.EXCEL]: {
        recommendedDPI: 96,
        recommendedFormat: 'table',
        features: ['data-preservation', 'formulas', 'charts'],
        warnings: ['复杂布局可能丢失'],
      },
      [ExportFormat.WORD]: {
        recommendedDPI: 300,
        recommendedFormat: 'document',
        features: ['rich-text', 'images', 'tables'],
        warnings: ['精确定位可能偏移'],
      },
      [ExportFormat.POWERPOINT]: {
        recommendedDPI: 150,
        recommendedFormat: 'slides',
        features: ['animations', 'transitions', 'media'],
        warnings: ['每页作为单独幻灯片'],
      },
      // 其他格式使用默认设置
      [ExportFormat.WEBP]: {
        recommendedDPI: 150,
        recommendedFormat: 'rgba',
        maxDimensions: { width: 16384, height: 16384 },
        colorSpace: 'srgb',
        features: ['transparency', 'compression'],
      },
      [ExportFormat.EPS]: {
        recommendedDPI: 300,
        recommendedFormat: 'vector',
        colorSpace: 'cmyk',
        features: ['vector', 'print-ready'],
        warnings: ['较老的格式，建议使用 PDF'],
      },
      [ExportFormat.HTML]: {
        recommendedDPI: 96,
        recommendedFormat: 'web',
        features: ['interactive', 'responsive'],
      },
      [ExportFormat.JSON]: {
        recommendedDPI: 0,
        recommendedFormat: 'data',
        features: ['raw-data', 'serializable'],
      },
    };

    return settings[format] || {
      recommendedDPI: 96,
      recommendedFormat: 'unknown',
      warnings: ['不支持的格式'],
    };
  }

  // ===== 私有辅助方法 =====

  private serializeElements(elements: RenderableElement[]): any[] {
    // 序列化元素为后端可理解的格式
    return elements.map(el => ({
      id: el.id,
      type: el.type,
      bounds: el.bounds,
      style: el.style,
      data: el.data,
      visible: el.visible,
      opacity: el.opacity,
      zIndex: el.zIndex,
      transform: el.transform,
    }));
  }

  private async exportSinglePage(
    elements: RenderableElement[],
    format: ExportFormat,
    index: number,
    total: number
  ): Promise<Blob> {
    this.reportProgress(index, total, `导出第 ${index + 1}/${total} 页...`);

    switch (format) {
      case ExportFormat.PNG:
      case ExportFormat.JPEG:
      case ExportFormat.WEBP:
        return this.exportImage(elements, format as any);
      case ExportFormat.PDF:
        return this.exportPDF([elements]);
      default:
        throw new Error(`Unsupported batch export format: ${format}`);
    }
  }

  private reportProgress(current: number, total: number, message?: string): void {
    if (this.onExportProgress) {
      const percentage = (current / total) * 100;
      this.onExportProgress({
        current,
        total,
        percentage,
        message,
        estimatedTimeRemaining: this.estimateTimeRemaining(current, total),
      });
    }
  }

  private estimateTimeRemaining(current: number, total: number): number {
    // 简单的时间估算
    if (current === 0) return 0;
    const progress = current / total;
    const elapsed = performance.now();
    const estimated = elapsed / progress;
    return Math.max(0, estimated - elapsed);
  }

  private getPageSize(size: string | [number, number]): { width: number; height: number } {
    if (Array.isArray(size)) {
      return { width: size[0], height: size[1] };
    }

    // A4: 210mm x 297mm at 96 DPI
    const sizes: Record<string, { width: number; height: number }> = {
      A4: { width: 794, height: 1123 },
      A3: { width: 1123, height: 1587 },
      Letter: { width: 816, height: 1056 },
      Legal: { width: 816, height: 1344 },
    };

    return sizes[size] || sizes.A4;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generatePrintCSS(options?: PrintOptions): string {
    const margins = options?.margins || { top: 10, right: 10, bottom: 10, left: 10 };

    return `
      @media print {
        @page {
          size: ${options?.pageSize || 'A4'} ${options?.orientation || 'portrait'};
          margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .page-break {
          page-break-after: always;
        }

        .no-print {
          display: none;
        }
      }
    `;
  }

  private createExportError(
    message: string,
    code: string,
    format?: ExportFormat,
    details?: any
  ): ExportError {
    const error = new Error(message) as ExportError;
    error.name = 'ExportError';
    error.code = code as ExportErrorCode;
    error.format = format;
    error.details = details;
    return error;
  }
}