import { createSignal, createResource } from 'solid-js';
import { PreviewAPI } from '../api/preview';
import type { PreviewRequest, RenderResult, RenderOptions, OutputFormat } from '../types/preview';

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
    // stats will automatically refresh on next access
  };

  /**
   * 设置格式
   */
  const setFormat = async (format: OutputFormat) => {
    try {
      const defaultOptions = await PreviewAPI.getDefaultRenderOptions(format);
      setRenderOptions(defaultOptions);
    } catch (error) {
      console.error('Failed to get default options:', error);
      // 回退到基础选项
      setRenderOptions(prev => ({ ...prev, format }));
    }
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
    setRenderError,
    setFormat,
    render,
    download,
    clearCache,
  };
}