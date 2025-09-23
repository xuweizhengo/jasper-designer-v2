/**
 * Canvas 2D 设计模式渲染器
 * 优化交互性能，快速响应
 */

import type {
  IDesignRenderer,
  AlignmentGuide,
  DesignRendererOptions,
  DesignPerformanceStats,
} from '../core/design-interfaces';
import type {
  Point,
  Rectangle,
  RenderableElement,
  Viewport,
} from '../core/interfaces';

export class CanvasDesignRenderer implements IDesignRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: OffscreenCanvas | null = null;
  // private _offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  // 视口
  private viewport: Viewport = { x: 0, y: 0, width: 0, height: 0, scale: 1 };

  // 性能优化
  private isDraftMode = false;
  private dirtyRegion: Rectangle | null = null;
  private batchDepth = 0;
  private pendingOperations: (() => void)[] = [];

  // 缓存
  private elementCache = new Map<string, ImageData>();
  private elementBounds = new Map<string, Rectangle>();

  // 拖拽预览
  private dragPreviewElement: RenderableElement | null = null;
  private dragOffset: Point = { x: 0, y: 0 };

  // 性能统计
  private stats: DesignPerformanceStats = {
    renderTime: 0,
    hitTestTime: 0,
    fps: 0,
    dirtyRegionSize: 0,
    cachedElements: 0,
    batchedOperations: 0,
  };

  constructor(private options: DesignRendererOptions = {}) {}

  // ===== 生命周期 =====

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    });

    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // 设置默认样式
    this.ctx.imageSmoothingEnabled = this.options.antialias ?? true;

    // 创建离屏 Canvas 用于缓存
    if (typeof OffscreenCanvas !== 'undefined' && this.options.enableCaching) {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      // this._offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    // 设置视口
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      scale: this.options.pixelRatio || 1,
    };
  }

  dispose(): void {
    this.elementCache.clear();
    this.elementBounds.clear();
    this.pendingOperations = [];
    this.ctx = null;
    this.canvas = null;
    this.offscreenCanvas = null;
    // this._offscreenCtx = null;
  }

  // ===== 快速渲染 =====

  renderFast(elements: RenderableElement[]): void {
    if (!this.ctx || !this.canvas) return;

    const startTime = performance.now();

    // 批处理模式下，添加到队列
    if (this.batchDepth > 0) {
      this.pendingOperations.push(() => this.renderFast(elements));
      return;
    }

    // 草稿模式优化
    if (this.isDraftMode) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.globalAlpha = 0.9; // 略微透明表示草稿
    }

    // 清空或清理脏区域
    if (this.dirtyRegion) {
      this.clearRegion(this.dirtyRegion);
    } else {
      this.clear();
    }

    // 更新元素边界缓存
    elements.forEach(el => {
      this.elementBounds.set(el.id, el.bounds);
    });

    // 渲染可见元素
    const visibleElements = elements.filter(el =>
      el.visible && this.isInViewport(el.bounds)
    );

    // 使用缓存渲染
    visibleElements.forEach(el => {
      if (this.elementCache.has(el.id) && !this.isDraftMode) {
        // 使用缓存
        const cached = this.elementCache.get(el.id)!;
        this.ctx!.putImageData(cached, el.bounds.x, el.bounds.y);
      } else {
        // 直接渲染
        this.renderElement(el);
      }
    });

    // 恢复设置
    if (this.isDraftMode) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.globalAlpha = 1;
    }

    // 更新统计
    this.stats.renderTime = performance.now() - startTime;
    this.stats.cachedElements = this.elementCache.size;
  }

  renderIncremental(
    changedElements: RenderableElement[],
    _unchangedElements: RenderableElement[]
  ): void {
    if (!this.ctx) return;

    // 只重绘变化的元素
    changedElements.forEach(el => {
      // 清除旧位置
      const oldBounds = this.elementBounds.get(el.id);
      if (oldBounds) {
        this.clearRegion(oldBounds);
      }

      // 渲染新位置
      this.renderElement(el);

      // 更新边界
      this.elementBounds.set(el.id, el.bounds);

      // 清除缓存
      this.elementCache.delete(el.id);
    });

    // 不变的元素保持不动（除非被遮挡）
  }

  clear(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ===== 交互优化 =====

  renderDragPreview(element: RenderableElement, offset: Point): void {
    if (!this.ctx) return;

    this.dragPreviewElement = element;
    this.dragOffset = offset;

    // 保存状态
    this.ctx.save();

    // 设置预览样式
    this.ctx.globalAlpha = 0.5;
    this.ctx.setLineDash([5, 5]);

    // 移动到新位置
    this.ctx.translate(offset.x, offset.y);

    // 渲染元素
    this.renderElement(element);

    // 恢复状态
    this.ctx.restore();
  }

  clearDragPreview(): void {
    if (!this.dragPreviewElement) return;

    // 清除预览区域
    const bounds = {
      x: this.dragPreviewElement.bounds.x + this.dragOffset.x,
      y: this.dragPreviewElement.bounds.y + this.dragOffset.y,
      width: this.dragPreviewElement.bounds.width,
      height: this.dragPreviewElement.bounds.height,
    };

    this.clearRegion(bounds);
    this.dragPreviewElement = null;
  }

  renderSelectionBox(start: Point, end: Point): void {
    if (!this.ctx) return;

    this.ctx.save();

    // 设置选择框样式
    this.ctx.strokeStyle = '#0066ff';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';

    // 绘制矩形
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeRect(x, y, width, height);

    this.ctx.restore();
  }

  renderAlignmentGuides(guides: AlignmentGuide[]): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();

    guides.forEach(guide => {
      this.ctx!.strokeStyle = guide.color || '#ff0000';
      this.ctx!.lineWidth = 1;

      if (guide.style === 'dashed') {
        this.ctx!.setLineDash([5, 5]);
      } else {
        this.ctx!.setLineDash([]);
      }

      this.ctx!.beginPath();

      if (guide.type === 'vertical') {
        this.ctx!.moveTo(guide.position, 0);
        this.ctx!.lineTo(guide.position, this.canvas!.height);
      } else {
        this.ctx!.moveTo(0, guide.position);
        this.ctx!.lineTo(this.canvas!.width, guide.position);
      }

      this.ctx!.stroke();
    });

    this.ctx.restore();
  }

  // ===== 视口管理 =====

  setViewport(viewport: Viewport): void {
    this.viewport = { ...viewport };
    this.markDirty();
  }

  panViewport(delta: Point): void {
    this.viewport.x += delta.x;
    this.viewport.y += delta.y;
    this.markDirty();
  }

  zoomViewport(scale: number, center: Point): void {
    // 计算缩放中心
    const oldScale = this.viewport.scale;
    const newScale = oldScale * scale;

    // 调整视口位置以保持中心点不变
    this.viewport.x = center.x - (center.x - this.viewport.x) * (newScale / oldScale);
    this.viewport.y = center.y - (center.y - this.viewport.y) * (newScale / oldScale);
    this.viewport.scale = newScale;

    this.markDirty();
  }

  // ===== Hit Testing =====

  getElementAtPoint(point: Point): string | null {
    const startTime = performance.now();

    // 根据精度设置选择策略
    const precision = this.options.hitTestPrecision || 'bbox';

    if (precision === 'fast' || precision === 'bbox') {
      // 快速边界盒检测
      for (const [id, bounds] of this.elementBounds) {
        if (this.pointInRect(point, bounds)) {
          this.stats.hitTestTime = performance.now() - startTime;
          return id;
        }
      }
    } else {
      // 精确检测（需要更复杂的实现）
      // TODO: 实现像素级检测
    }

    this.stats.hitTestTime = performance.now() - startTime;
    return null;
  }

  getElementsInRegion(region: Rectangle): string[] {
    const result: string[] = [];

    for (const [id, bounds] of this.elementBounds) {
      if (this.rectIntersects(bounds, region)) {
        result.push(id);
      }
    }

    return result;
  }

  // ===== 性能优化 =====

  setDraftMode(enabled: boolean): void {
    this.isDraftMode = enabled;
  }

  markDirty(region?: Rectangle): void {
    if (region) {
      if (this.dirtyRegion) {
        // 合并脏区域
        this.dirtyRegion = this.mergeRectangles(this.dirtyRegion, region);
      } else {
        this.dirtyRegion = { ...region };
      }
    } else {
      // 标记整个画布为脏
      this.dirtyRegion = null;
    }

    this.stats.dirtyRegionSize = this.dirtyRegion
      ? this.dirtyRegion.width * this.dirtyRegion.height
      : this.canvas?.width! * this.canvas?.height!;
  }

  beginBatch(): void {
    this.batchDepth++;
  }

  endBatch(): void {
    this.batchDepth--;

    if (this.batchDepth === 0) {
      // 执行所有累积的操作
      const operations = [...this.pendingOperations];
      this.pendingOperations = [];

      operations.forEach(op => op());

      this.stats.batchedOperations = operations.length;
    }
  }

  // ===== 私有辅助方法 =====

  private renderElement(element: RenderableElement): void {
    if (!this.ctx) return;

    this.ctx.save();

    // 应用变换
    if (element.transform) {
      const { translate, scale, rotate } = element.transform;
      if (translate) {
        this.ctx.translate(translate.x, translate.y);
      }
      if (scale) {
        this.ctx.scale(scale.x, scale.y);
      }
      if (rotate) {
        this.ctx.rotate(rotate);
      }
    }

    // 根据类型渲染
    switch (element.type) {
      case 'text':
        this.renderText(element);
        break;
      case 'rect':
        this.renderRect(element);
        break;
      case 'circle':
        this.renderCircle(element);
        break;
      case 'line':
        this.renderLine(element);
        break;
      // ... 其他类型
    }

    this.ctx.restore();
  }

  private renderText(element: RenderableElement): void {
    if (!this.ctx) return;

    const { bounds, data, style } = element;
    const text = data.text || '';

    this.ctx.font = `${data.fontSize || 14}px ${data.fontFamily || 'Arial'}`;
    this.ctx.fillStyle = style.fillColor || '#000';
    this.ctx.fillText(text, bounds.x, bounds.y);
  }

  private renderRect(element: RenderableElement): void {
    if (!this.ctx) return;

    const { bounds, style } = element;

    if (style.fillColor) {
      this.ctx.fillStyle = style.fillColor;
      this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    if (style.strokeColor) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth || 1;
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  private renderCircle(element: RenderableElement): void {
    if (!this.ctx) return;

    const { bounds, style } = element;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    if (style.fillColor) {
      this.ctx.fillStyle = style.fillColor;
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  private renderLine(element: RenderableElement): void {
    if (!this.ctx) return;

    const { data, style } = element;

    this.ctx.beginPath();
    this.ctx.moveTo(data.x1 || 0, data.y1 || 0);
    this.ctx.lineTo(data.x2 || 0, data.y2 || 0);

    if (style.strokeColor) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  private clearRegion(region: Rectangle): void {
    if (!this.ctx) return;
    this.ctx.clearRect(region.x, region.y, region.width, region.height);
  }

  private isInViewport(bounds: Rectangle): boolean {
    return !(
      bounds.x + bounds.width < this.viewport.x ||
      bounds.y + bounds.height < this.viewport.y ||
      bounds.x > this.viewport.x + this.viewport.width ||
      bounds.y > this.viewport.y + this.viewport.height
    );
  }

  private pointInRect(point: Point, rect: Rectangle): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  private rectIntersects(r1: Rectangle, r2: Rectangle): boolean {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  private mergeRectangles(r1: Rectangle, r2: Rectangle): Rectangle {
    const x = Math.min(r1.x, r2.x);
    const y = Math.min(r1.y, r2.y);
    const x2 = Math.max(r1.x + r1.width, r2.x + r2.width);
    const y2 = Math.max(r1.y + r1.height, r2.y + r2.height);

    return {
      x,
      y,
      width: x2 - x,
      height: y2 - y,
    };
  }
}