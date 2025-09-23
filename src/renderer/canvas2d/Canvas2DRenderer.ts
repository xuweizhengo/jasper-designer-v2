/**
 * Canvas 2D 渲染器实现
 * 使用浏览器原生 Canvas 2D API 进行渲染
 */

import type {
  IRenderer,
  RendererOptions,
  RenderableElement,
  Viewport,
  Point,
  Rectangle,
  TextStyle,
  TextMetrics,
  ExportOptions,
  RenderQuality,
  RendererStats,
  Transform,
} from '../core/interfaces';

export class Canvas2DRenderer implements IRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private viewport: Viewport = { x: 0, y: 0, width: 0, height: 0, scale: 1 };
  private options: RendererOptions = {};

  // 性能优化
  private _isDirty = false;
  private dirtyRegion: Rectangle | null = null;
  private _quality: RenderQuality = 'normal';

  // 统计信息
  private stats: RendererStats = {
    fps: 0,
    renderTime: 0,
    elementCount: 0,
    drawCalls: 0,
  };

  // 缓存
  private elementCache = new Map<string, ImageData>();
  private textMetricsCache = new Map<string, TextMetrics>();

  // FPS 计算
  private frameCount = 0;
  private fpsUpdateTime = 0;

  // ===== 生命周期 =====

  async initialize(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void> {
    this.canvas = canvas;
    this.options = options || {};

    // 获取 2D 上下文
    this.ctx = canvas.getContext('2d', {
      alpha: options?.alpha ?? true,
      desynchronized: true, // 提高性能
      willReadFrequently: false, // 除非需要读取像素
    });

    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    // 设置初始配置
    this.setupContext();

    // 设置视口
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      scale: options?.pixelRatio || window.devicePixelRatio || 1,
    };

    // 应用像素比例
    this.applyPixelRatio();
  }

  dispose(): void {
    this.clearCache();
    this.ctx = null;
    this.canvas = null;
    this.elementCache.clear();
    this.textMetricsCache.clear();
  }

  getType(): 'canvas' | 'skia' | 'webgl' {
    return 'canvas';
  }

  // ===== 渲染核心 =====

  render(elements: RenderableElement[]): void {
    if (!this.ctx || !this.canvas) return;

    // 检查是否需要渲染
    if (!this._isDirty && elements.length === 0) return;

    const startTime = performance.now();
    this.stats.drawCalls = 0;
    this.stats.elementCount = elements.length;

    const ctx = this.ctx;

    // 保存状态
    ctx.save();

    try {
      // 清空画布或脏区域
      if (this.dirtyRegion) {
        this.clearRegion(this.dirtyRegion);
      } else {
        this.clear();
      }

      // 应用视口变换
      this.applyViewportTransform();

      // 按 z-index 排序
      const sortedElements = [...elements].sort((a, b) =>
        (a.zIndex || 0) - (b.zIndex || 0)
      );

      // 渲染可见元素
      for (const element of sortedElements) {
        if (!element.visible) continue;
        if (!this.isInViewport(element)) continue;

        this.renderElement(element);
        this.stats.drawCalls++;
      }
    } finally {
      // 恢复状态
      ctx.restore();
    }

    // 更新统计
    this.stats.renderTime = performance.now() - startTime;
    this.updateFPS();

    // 清除脏标记
    this._isDirty = false;
    this.dirtyRegion = null;
  }

  private renderElement(element: RenderableElement): void {
    const ctx = this.ctx!;

    ctx.save();

    try {
      // 应用变换
      if (element.transform) {
        this.applyTransform(element.transform, element.bounds);
      }

      // 应用透明度
      if (element.opacity !== undefined && element.opacity < 1) {
        ctx.globalAlpha = element.opacity;
      }

      // 应用样式
      this.applyElementStyle(element.style);

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
        case 'path':
          this.renderPath(element);
          break;
        case 'image':
          this.renderImage(element);
          break;
        case 'group':
          this.renderGroup(element);
          break;
      }
    } finally {
      ctx.restore();
    }
  }

  private renderText(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { bounds, data, style } = element;

    // 设置字体
    const textStyle = data.style || {};
    ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 14}px ${textStyle.fontFamily || 'Arial'}`;
    ctx.textAlign = textStyle.textAlign || 'left';
    ctx.textBaseline = 'top'; // 统一使用 top 基线

    // 设置颜色
    ctx.fillStyle = textStyle.color || style.fillColor || '#000000';

    // 渲染文字
    const text = data.content || data.text || '';

    // 处理多行文字
    if (text.includes('\n')) {
      const lines = text.split('\n');
      const lineHeight = (textStyle.fontSize || 14) * (textStyle.lineHeight || 1.2);
      lines.forEach((line: string, index: number) => {
        ctx.fillText(line, bounds.x, bounds.y + index * lineHeight);
      });
    } else {
      ctx.fillText(text, bounds.x, bounds.y);
    }
  }

  private renderRect(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { bounds, style } = element;

    // 圆角矩形
    if (style.borderRadius) {
      this.drawRoundRect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        style.borderRadius
      );
    } else {
      // 普通矩形
      if (style.fillColor) {
        ctx.fillStyle = style.fillColor;
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }

      if (style.strokeColor && style.strokeWidth) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }
  }

  private renderCircle(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { bounds, style } = element;

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    if (style.fillColor) {
      ctx.fillStyle = style.fillColor;
      ctx.fill();
    }

    if (style.strokeColor && style.strokeWidth) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.stroke();
    }
  }

  private renderLine(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { data, style } = element;

    ctx.beginPath();
    ctx.moveTo(data.x1 || 0, data.y1 || 0);
    ctx.lineTo(data.x2 || 0, data.y2 || 0);

    if (style.strokeColor) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth || 1;
      ctx.stroke();
    }
  }

  private renderPath(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { data, style } = element;

    if (!data.path) return;

    const path = new Path2D(data.path);

    if (style.fillColor) {
      ctx.fillStyle = style.fillColor;
      ctx.fill(path);
    }

    if (style.strokeColor && style.strokeWidth) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.stroke(path);
    }
  }

  private renderImage(element: RenderableElement): void {
    const ctx = this.ctx!;
    const { bounds, data } = element;

    // TODO: 实现图片加载和缓存
    if (data.image instanceof HTMLImageElement) {
      ctx.drawImage(data.image, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  private renderGroup(_element: RenderableElement): void {
    // Group 只是容器，其子元素会单独渲染
    // 这里可以应用 group 级别的变换
  }

  clear(color?: string): void {
    if (!this.ctx || !this.canvas) return;

    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  flush(): void {
    // Canvas 2D 自动刷新，无需手动操作
  }

  // ===== 视口管理 =====

  setViewport(viewport: Viewport): void {
    this.viewport = { ...viewport };
    this.markDirty();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  screenToCanvas(point: Point): Point {
    const { x, y, scale } = this.viewport;
    return {
      x: (point.x - x) / scale,
      y: (point.y - y) / scale,
    };
  }

  canvasToScreen(point: Point): Point {
    const { x, y, scale } = this.viewport;
    return {
      x: point.x * scale + x,
      y: point.y * scale + y,
    };
  }

  // ===== 文字度量 =====

  measureText(text: string, style: TextStyle): TextMetrics {
    if (!this.ctx) {
      throw new Error('Renderer not initialized');
    }

    // 缓存键
    const cacheKey = `${text}-${JSON.stringify(style)}`;

    // 检查缓存
    if (this.textMetricsCache.has(cacheKey)) {
      return this.textMetricsCache.get(cacheKey)!;
    }

    // 设置字体样式
    this.ctx.save();
    this.ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;

    // 测量文字
    const metrics = this.ctx.measureText(text);

    // 构建返回值
    const result: TextMetrics = {
      width: metrics.width,
      height: style.fontSize * (style.lineHeight || 1.2),
      actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
      actualBoundingBoxRight: metrics.actualBoundingBoxRight || metrics.width,
      actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || style.fontSize * 0.8,
      actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || style.fontSize * 0.2,
      fontBoundingBoxAscent: metrics.fontBoundingBoxAscent || style.fontSize,
      fontBoundingBoxDescent: metrics.fontBoundingBoxDescent || 0,
    };

    this.ctx.restore();

    // 缓存结果
    this.textMetricsCache.set(cacheKey, result);

    return result;
  }

  // ===== 导出能力 =====

  async exportToImage(options: ExportOptions): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Renderer not initialized');
    }

    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to export image'));
          }
        },
        `image/${options.format === 'png' ? 'png' : 'jpeg'}`,
        options.quality || 0.9
      );
    });
  }

  exportToDataURL(format: 'png' | 'jpeg', quality?: number): string {
    if (!this.canvas) {
      throw new Error('Renderer not initialized');
    }

    return this.canvas.toDataURL(`image/${format}`, quality || 0.9);
  }

  // ===== 性能优化 =====

  markDirty(region?: Rectangle): void {
    this._isDirty = true;
    if (region) {
      if (this.dirtyRegion) {
        // 合并脏区域
        this.dirtyRegion = this.mergeRectangles(this.dirtyRegion, region);
      } else {
        this.dirtyRegion = { ...region };
      }
    }
  }

  setRenderQuality(quality: RenderQuality): void {
    this._quality = quality;

    if (!this.ctx) return;

    // 根据质量调整渲染参数
    switch (this._quality) {
      case 'draft':
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.imageSmoothingQuality = 'low';
        break;
      case 'normal':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'medium';
        break;
      case 'high':
      case 'print':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        break;
    }
  }

  getStats(): RendererStats {
    return { ...this.stats };
  }

  // ===== 缓存管理 =====

  cacheElement(elementId: string, data: any): void {
    // TODO: 实现元素缓存
    if (data instanceof ImageData) {
      this.elementCache.set(elementId, data);
    }
  }

  clearCache(): void {
    this.elementCache.clear();
    this.textMetricsCache.clear();
  }

  // ===== 事件支持 =====

  getElementAtPoint(_point: Point): string | null {
    // TODO: 实现 hit-testing
    // 这需要维护元素的边界信息
    return null;
  }

  getElementsInRegion(_region: Rectangle): string[] {
    // TODO: 实现区域选择
    return [];
  }

  // ===== 私有辅助方法 =====

  private setupContext(): void {
    if (!this.ctx) return;

    // 设置默认属性
    this.ctx.imageSmoothingEnabled = this.options.antialias ?? true;
    this.ctx.imageSmoothingQuality = 'medium';
    this.ctx.textBaseline = 'top'; // 统一基线
  }

  private applyPixelRatio(): void {
    if (!this.canvas || !this.ctx) return;

    const ratio = this.viewport.scale;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 设置实际尺寸
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;

    // 设置显示尺寸
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // 缩放上下文
    this.ctx.scale(ratio, ratio);
  }

  private applyViewportTransform(): void {
    if (!this.ctx) return;

    const { x, y, scale, rotation } = this.viewport;

    // 平移
    this.ctx.translate(-x, -y);

    // 缩放
    if (scale !== 1) {
      this.ctx.scale(scale, scale);
    }

    // 旋转
    if (rotation) {
      this.ctx.rotate(rotation);
    }
  }

  private applyTransform(transform: Transform, bounds: Rectangle): void {
    if (!this.ctx) return;

    const origin = transform.origin || {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    // 移动到原点
    this.ctx.translate(origin.x, origin.y);

    // 应用变换
    if (transform.rotate) {
      this.ctx.rotate(transform.rotate);
    }

    if (transform.scale) {
      this.ctx.scale(transform.scale.x, transform.scale.y);
    }

    // 移回
    this.ctx.translate(-origin.x, -origin.y);

    // 应用平移
    if (transform.translate) {
      this.ctx.translate(transform.translate.x, transform.translate.y);
    }
  }

  private applyElementStyle(style: any): void {
    if (!this.ctx) return;

    // 阴影
    if (style.shadow) {
      this.ctx.shadowOffsetX = style.shadow.offsetX;
      this.ctx.shadowOffsetY = style.shadow.offsetY;
      this.ctx.shadowBlur = style.shadow.blur;
      this.ctx.shadowColor = style.shadow.color;
    }
  }

  private isInViewport(element: RenderableElement): boolean {
    const { bounds } = element;
    const viewport = this.viewport;

    return !(
      bounds.x + bounds.width < viewport.x ||
      bounds.y + bounds.height < viewport.y ||
      bounds.x > viewport.x + viewport.width ||
      bounds.y > viewport.y + viewport.height
    );
  }

  private clearRegion(region: Rectangle): void {
    if (!this.ctx) return;
    this.ctx.clearRect(region.x, region.y, region.width, region.height);
  }

  private drawRoundRect(x: number, y: number, width: number, height: number, radius: number): void {
    const ctx = this.ctx!;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (this.ctx!.fillStyle) {
      ctx.fill();
    }
    if (this.ctx!.strokeStyle) {
      ctx.stroke();
    }
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

  private updateFPS(): void {
    const now = performance.now();
    this.frameCount++;

    if (now - this.fpsUpdateTime >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }
}