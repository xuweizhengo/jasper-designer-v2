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
    elements: any[], 
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

    const blob = new Blob([result.data as any], { 
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
  static getMimeType(format: OutputFormat): string {
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