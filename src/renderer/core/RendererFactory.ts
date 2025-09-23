/**
 * 渲染器工厂
 * 负责创建和管理不同类型的渲染器
 */

import type { IRenderer, RendererOptions } from './interfaces';
import { Canvas2DRenderer } from '../canvas2d/Canvas2DRenderer';

export type RendererType = 'canvas' | 'skia' | 'webgl' | 'auto';

export interface RendererConfig {
  type: RendererType;
  canvas: HTMLCanvasElement;
  options?: RendererOptions | undefined;
}

/**
 * 渲染器工厂类
 */
export class RendererFactory {
  private static renderers = new Map<RendererType, () => Promise<IRenderer>>();
  private static instances = new WeakMap<HTMLCanvasElement, IRenderer>();

  static {
    // 注册默认渲染器
    this.register('canvas', async () => new Canvas2DRenderer());
  }

  /**
   * 注册渲染器
   */
  static register(type: RendererType, factory: () => Promise<IRenderer>): void {
    if (type === 'auto') {
      throw new Error('Cannot register "auto" as a renderer type');
    }
    this.renderers.set(type, factory);
  }

  /**
   * 创建渲染器
   */
  static async create(config: RendererConfig): Promise<IRenderer> {
    const { type, canvas, options } = config;

    // 检查是否已有实例
    if (this.instances.has(canvas)) {
      console.warn('Canvas already has a renderer instance. Disposing old instance.');
      const oldRenderer = this.instances.get(canvas)!;
      oldRenderer.dispose();
      this.instances.delete(canvas);
    }

    // 自动选择渲染器类型
    const rendererType = type === 'auto' ? this.autoSelect(options) : type;

    // 获取工厂函数
    const factory = this.renderers.get(rendererType);
    if (!factory) {
      throw new Error(`Renderer type "${rendererType}" is not registered`);
    }

    // 创建渲染器
    const renderer = await factory();

    // 初始化
    await renderer.initialize(canvas, options);

    // 缓存实例
    this.instances.set(canvas, renderer);

    console.log(`Created ${rendererType} renderer`, {
      canvas: `${canvas.width}x${canvas.height}`,
      options,
    });

    return renderer;
  }

  /**
   * 获取 canvas 关联的渲染器
   */
  static get(canvas: HTMLCanvasElement): IRenderer | undefined {
    return this.instances.get(canvas);
  }

  /**
   * 自动选择最佳渲染器
   */
  private static autoSelect(options?: RendererOptions): RendererType {
    // 检测环境能力
    const capabilities = this.detectCapabilities();

    // 移动设备优先使用 Canvas 2D
    if (capabilities.isMobile) {
      return 'canvas';
    }

    // 内存受限使用 Canvas 2D
    if (capabilities.memoryLimited) {
      return 'canvas';
    }

    // 需要高质量且支持 WebGL2，未来可以返回 'skia'
    if (options?.quality === 'high' && capabilities.hasWebGL2) {
      // 当 Skia 渲染器实现后，这里可以返回 'skia'
      return 'canvas';
    }

    // 默认使用 Canvas 2D
    return 'canvas';
  }

  /**
   * 检测浏览器能力
   */
  private static detectCapabilities() {
    const isMobile = /mobile|android|ios|iphone|ipad/i.test(navigator.userAgent);
    const hasWebGL2 = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch {
        return false;
      }
    })();

    const memory = (performance as any).memory;
    const memoryLimited = memory ? memory.jsHeapSizeLimit < 2_147_483_648 : false; // < 2GB

    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    const hasImageBitmap = typeof createImageBitmap !== 'undefined';

    return {
      isMobile,
      hasWebGL2,
      memoryLimited,
      hasOffscreenCanvas,
      hasImageBitmap,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * 销毁所有渲染器实例
   */
  static disposeAll(): void {
    // WeakMap 会自动清理，这里只是提供一个明确的清理入口
    console.log('Disposing all renderer instances');
  }
}

/**
 * 渲染器管理器 - 简化的单例模式
 */
export class RendererManager {
  private static currentRenderer: IRenderer | null = null;
  private static currentCanvas: HTMLCanvasElement | null = null;

  /**
   * 设置当前渲染器
   */
  static async setRenderer(
    type: RendererType,
    canvas: HTMLCanvasElement,
    options?: RendererOptions
  ): Promise<IRenderer> {
    // 销毁旧渲染器
    if (this.currentRenderer) {
      this.currentRenderer.dispose();
      this.currentRenderer = null;
    }

    // 创建新渲染器
    const renderer = await RendererFactory.create({
      type,
      canvas,
      options,
    });

    this.currentRenderer = renderer;
    this.currentCanvas = canvas;

    return renderer;
  }

  /**
   * 获取当前渲染器
   */
  static getRenderer(): IRenderer | null {
    return this.currentRenderer;
  }

  /**
   * 切换渲染器类型
   */
  static async switchRenderer(type: RendererType): Promise<IRenderer> {
    if (!this.currentCanvas) {
      throw new Error('No canvas available for renderer switch');
    }

    // 保存当前视口
    const viewport = this.currentRenderer?.getViewport();

    // 创建新渲染器
    const renderer = await this.setRenderer(type, this.currentCanvas);

    // 恢复视口
    if (viewport) {
      renderer.setViewport(viewport);
    }

    return renderer;
  }

  /**
   * 销毁当前渲染器
   */
  static dispose(): void {
    if (this.currentRenderer) {
      this.currentRenderer.dispose();
      this.currentRenderer = null;
      this.currentCanvas = null;
    }
  }
}

/**
 * 渲染器性能监控
 */
export class RendererMonitor {
  private renderer: IRenderer;
  private monitorInterval: number | null = null;
  private statsCallback: (stats: any) => void;

  constructor(renderer: IRenderer, callback: (stats: any) => void) {
    this.renderer = renderer;
    this.statsCallback = callback;
  }

  /**
   * 开始监控
   */
  start(interval = 1000): void {
    if (this.monitorInterval) {
      this.stop();
    }

    this.monitorInterval = window.setInterval(() => {
      const stats = this.renderer.getStats();
      this.statsCallback(stats);
    }, interval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * 获取即时统计
   */
  getStats(): any {
    return this.renderer.getStats();
  }
}

/**
 * 便捷函数 - 快速创建渲染器
 */
export async function createRenderer(
  canvas: HTMLCanvasElement,
  type: RendererType = 'auto',
  options?: RendererOptions
): Promise<IRenderer> {
  return RendererFactory.create({ type, canvas, options });
}