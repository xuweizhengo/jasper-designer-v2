/**
 * 渲染器工厂
 * 根据模式创建对应的渲染器实例
 */

import type { IDesignRenderer } from '../core/design-interfaces';
import type { IExportRenderer } from '../core/export-interfaces';
import { CanvasDesignRenderer } from '../canvas2d/CanvasDesignRenderer';
import { SkiaExportRenderer } from '../skia/SkiaExportRenderer';

export type RenderMode = 'design' | 'data' | 'preview' | 'export';

/**
 * 渲染器工厂类
 * 管理不同模式下的渲染器创建
 */
export class RendererFactory {
  private static designRenderer: IDesignRenderer | null = null;
  private static exportRenderer: IExportRenderer | null = null;

  /**
   * 获取设计模式渲染器（设计模式、数据模式）
   * 使用 Canvas 2D 实现，优化交互性能
   */
  static async getDesignRenderer(options?: any): Promise<IDesignRenderer> {
    if (!this.designRenderer) {
      console.log('创建 Canvas 设计渲染器...');
      this.designRenderer = new CanvasDesignRenderer(options);
    }
    return this.designRenderer;
  }

  /**
   * 获取导出渲染器（预览模式、导出功能）
   * 使用 Skia 实现，确保跨平台一致性
   */
  static async getExportRenderer(options?: any): Promise<IExportRenderer> {
    if (!this.exportRenderer) {
      console.log('创建 Skia 导出渲染器...');
      this.exportRenderer = new SkiaExportRenderer();
      await this.exportRenderer.initialize(options);
    }
    return this.exportRenderer;
  }

  /**
   * 根据模式获取对应的渲染器
   */
  static async getRenderer(mode: RenderMode): Promise<IDesignRenderer | IExportRenderer> {
    switch (mode) {
      case 'design':
      case 'data':
        // 设计和数据模式使用 Canvas 渲染器
        return this.getDesignRenderer();

      case 'preview':
      case 'export':
        // 预览和导出模式使用 Skia 渲染器
        return this.getExportRenderer();

      default:
        throw new Error(`Unknown render mode: ${mode}`);
    }
  }

  /**
   * 创建新的设计渲染器实例（不使用单例）
   */
  static createDesignRenderer(options?: any): IDesignRenderer {
    return new CanvasDesignRenderer(options);
  }

  /**
   * 创建新的导出渲染器实例（不使用单例）
   */
  static async createExportRenderer(options?: any): Promise<IExportRenderer> {
    const renderer = new SkiaExportRenderer();
    await renderer.initialize(options);
    return renderer;
  }

  /**
   * 清理所有渲染器
   */
  static dispose(): void {
    if (this.designRenderer) {
      this.designRenderer.dispose();
      this.designRenderer = null;
    }

    if (this.exportRenderer) {
      this.exportRenderer.dispose();
      this.exportRenderer = null;
    }
  }

  /**
   * 检查某种导出格式是否支持
   */
  static async isExportFormatSupported(format: any): Promise<boolean> {
    const exportRenderer = await this.getExportRenderer();
    return exportRenderer.isFormatSupported(format);
  }

  /**
   * 获取推荐的导出设置
   */
  static async getExportSettings(format: any): Promise<any> {
    const exportRenderer = await this.getExportRenderer();
    return exportRenderer.getRecommendedSettings(format);
  }
}