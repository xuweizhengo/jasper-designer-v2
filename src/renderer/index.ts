/**
 * 渲染器模块导出
 */

// 核心接口
export type {
  IRenderer,
  RenderableElement,
  RendererOptions,
  Viewport,
  Point,
  Rectangle,
  TextStyle,
  TextMetrics,
  ElementStyle,
  Transform,
  RenderQuality,
  ExportOptions,
  RendererStats,
} from './core/interfaces';

export { toRenderableElement } from './core/interfaces';

// 渲染器工厂
export {
  RendererFactory,
  RendererManager,
  RendererMonitor,
  createRenderer,
  type RendererType,
  type RendererConfig,
} from './core/RendererFactory';

// Canvas 2D 渲染器
export { Canvas2DRenderer } from './canvas2d/Canvas2DRenderer';

// 分层管理器
export {
  LayerManager,
  type LayerManagerOptions,
  type InteractionEvent,
} from './layers/LayerManager';

// 便捷函数
import { RendererFactory } from './core/RendererFactory';
import { Canvas2DRenderer } from './canvas2d/Canvas2DRenderer';

// 注册默认渲染器
RendererFactory.register('canvas', async () => new Canvas2DRenderer());

/**
 * 快速创建分层画布
 */
export async function createLayeredCanvas(
  container: HTMLElement,
  options?: {
    mode?: 'design' | 'data' | 'preview' | 'export';
    rendererType?: 'canvas' | 'skia' | 'auto';
  }
) {
  const { LayerManager } = await import('./layers/LayerManager');

  return new LayerManager({
    container,
    mode: options?.mode || 'design',
    rendererType: options?.rendererType || 'auto',
    enableInteraction: true,
    enableFeedback: true,
  });
}