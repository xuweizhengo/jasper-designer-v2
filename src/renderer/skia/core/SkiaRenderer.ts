import type { CanvasKit, Canvas, Surface } from 'canvaskit-wasm';
import type { RenderElement, RenderOptions, Transform } from '../../types';

export class SkiaRenderer {
  private ck: CanvasKit;
  private surface: Surface | null;
  private canvas: Canvas;
  private fontManager: any;
  private elementCache = new Map<string, any>();
  private imageCache = new Map<string, any>();

  constructor(canvasKit: CanvasKit, canvasElement: HTMLCanvasElement) {
    this.ck = canvasKit;

    // 优先使用 WebGL，回退到 CPU
    this.surface = canvasKit.MakeWebGLCanvasSurface(canvasElement);
    if (!this.surface) {
      console.warn('WebGL not available, falling back to CPU rendering');
      this.surface = canvasKit.MakeSWCanvasSurface(canvasElement);
    }

    if (!this.surface) {
      throw new Error('Failed to create Skia surface');
    }

    this.canvas = this.surface.getCanvas();
    // @ts-ignore - FontMgr API variations
    this.fontManager = canvasKit.FontMgr?.RefDefault?.() || canvasKit.FontMgr?.RefEmpty?.();
  }

  // 主渲染函数
  render(elements: RenderElement[], options: RenderOptions = {}) {
    // 清空画布
    const clearColor = this.parseColor(options.background || '#ffffff');
    this.canvas.clear(clearColor);

    // 应用视口变换
    if (options.viewport) {
      this.applyViewport(options.viewport);
    }

    // 渲染网格（设计模式）
    if (options.showGrid) {
      this.renderGrid(options.gridSize || 20);
    }

    // 渲染所有元素
    for (const element of elements) {
      if (element.visible) {
        this.renderElement(element);
      }
    }

    // 渲染叠加层（用于设计模式）
    if (options.overlays) {
      this.renderOverlays(options.overlays);
    }

    // 刷新到屏幕
    this.surface?.flush();
  }

  private renderElement(element: RenderElement) {
    this.canvas.save();

    // 应用变换
    if (element.transform) {
      this.applyTransform(element.transform);
    }

    // 应用样式
    if (element.style.opacity !== undefined && element.style.opacity < 1) {
      // @ts-ignore - saveLayerAlpha may not be in type definitions
      this.canvas.saveLayerAlpha?.(null, element.style.opacity * 255) || this.canvas.saveLayer(null, this.createOpacityPaint(element.style.opacity));
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

    if (element.style.opacity !== undefined && element.style.opacity < 1) {
      this.canvas.restore(); // restore layer
    }

    this.canvas.restore();
  }

  private renderText(element: RenderElement) {
    const { content, fontSize = 14, fontFamily = 'Arial', color = '#000000' } = element.data;

    if (!content) return;

    const paint = new this.ck.Paint();
    paint.setColor(this.parseColor(color));
    paint.setAntiAlias(true);

    // 创建字体
    // @ts-ignore - FontStyle API variations
    const typeface = this.fontManager.matchFamilyStyle(fontFamily, this.ck.FontStyle?.Normal || 0);
    const font = new this.ck.Font(typeface, fontSize);

    // 简单文本渲染
    if (!content.includes('\n')) {
      this.canvas.drawText(content, 0, fontSize, paint, font);
    } else {
      // 多行文本
      const lines = content.split('\n');
      let y = fontSize;
      for (const line of lines) {
        this.canvas.drawText(line, 0, y, paint, font);
        y += fontSize * 1.2; // 行高
      }
    }

    paint.delete();
    font.delete();
  }

  private renderRect(element: RenderElement) {
    const paint = new this.ck.Paint();
    paint.setAntiAlias(true);

    const rect = this.ck.LTRBRect(
      0, 0,
      element.style.width || 100,
      element.style.height || 100
    );

    // 填充
    if (element.style.fill) {
      paint.setStyle(this.ck.PaintStyle.Fill);
      paint.setColor(this.parseColor(element.style.fill));
      this.canvas.drawRect(rect, paint);
    }

    // 描边
    if (element.style.stroke) {
      paint.setStyle(this.ck.PaintStyle.Stroke);
      paint.setColor(this.parseColor(element.style.stroke));
      paint.setStrokeWidth(element.style.strokeWidth || 1);
      this.canvas.drawRect(rect, paint);
    }

    paint.delete();
  }

  private renderCircle(element: RenderElement) {
    const paint = new this.ck.Paint();
    paint.setAntiAlias(true);

    const radius = Math.min(
      (element.style.width || 100) / 2,
      (element.style.height || 100) / 2
    );

    const cx = (element.style.width || 100) / 2;
    const cy = (element.style.height || 100) / 2;

    // 填充
    if (element.style.fill) {
      paint.setStyle(this.ck.PaintStyle.Fill);
      paint.setColor(this.parseColor(element.style.fill));
      this.canvas.drawCircle(cx, cy, radius, paint);
    }

    // 描边
    if (element.style.stroke) {
      paint.setStyle(this.ck.PaintStyle.Stroke);
      paint.setColor(this.parseColor(element.style.stroke));
      paint.setStrokeWidth(element.style.strokeWidth || 1);
      this.canvas.drawCircle(cx, cy, radius, paint);
    }

    paint.delete();
  }

  private renderPath(element: RenderElement) {
    const path = new this.ck.Path();
    const commands = element.data.commands || [];

    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M':
          path.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          path.lineTo(cmd.x, cmd.y);
          break;
        case 'Q':
          path.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          break;
        case 'C':
          path.cubicTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          break;
        case 'Z':
          path.close();
          break;
      }
    }

    const paint = new this.ck.Paint();
    paint.setAntiAlias(true);

    if (element.style.fill) {
      paint.setStyle(this.ck.PaintStyle.Fill);
      paint.setColor(this.parseColor(element.style.fill));
      this.canvas.drawPath(path, paint);
    }

    if (element.style.stroke) {
      paint.setStyle(this.ck.PaintStyle.Stroke);
      paint.setColor(this.parseColor(element.style.stroke));
      paint.setStrokeWidth(element.style.strokeWidth || 1);
      this.canvas.drawPath(path, paint);
    }

    path.delete();
    paint.delete();
  }

  private async renderImage(element: RenderElement) {
    const { src } = element.data;
    if (!src) return;

    let image = this.imageCache.get(src);

    if (!image) {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        image = this.ck.MakeImageFromEncoded(new Uint8Array(arrayBuffer));
        if (image) {
          this.imageCache.set(src, image);
        }
      } catch (error) {
        console.error('Failed to load image:', src, error);
        return;
      }
    }

    if (!image) return;

    const paint = new this.ck.Paint();
    const srcRect = this.ck.LTRBRect(0, 0, image.width(), image.height());
    const destRect = this.ck.LTRBRect(
      0, 0,
      element.style.width || 100,
      element.style.height || 100
    );

    this.canvas.drawImageRect(image, srcRect, destRect, paint);
    paint.delete();
  }

  private renderGroup(element: RenderElement) {
    if (!element.children) return;

    for (const child of element.children) {
      if (child.visible) {
        this.renderElement(child);
      }
    }
  }

  // 渲染网格背景
  private renderGrid(gridSize: number) {
    const paint = new this.ck.Paint();
    paint.setStyle(this.ck.PaintStyle.Stroke);
    paint.setColor(this.parseColor('#e0e0e0'));
    paint.setStrokeWidth(0.5);
    paint.setAntiAlias(true);

    const width = this.surface?.width() || 1200;
    const height = this.surface?.height() || 800;

    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      const path = new this.ck.Path();
      path.moveTo(x, 0);
      path.lineTo(x, height);
      this.canvas.drawPath(path, paint);
      path.delete();
    }

    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
      const path = new this.ck.Path();
      path.moveTo(0, y);
      path.lineTo(width, y);
      this.canvas.drawPath(path, paint);
      path.delete();
    }

    paint.delete();
  }

  // 渲染叠加层（设计模式用）
  private renderOverlays(overlays: any[]) {
    for (const overlay of overlays) {
      switch (overlay.type) {
        case 'selection':
          this.renderSelectionOverlay(overlay);
          break;
        case 'grid':
          this.renderGridOverlay(overlay);
          break;
        case 'ruler':
          this.renderRulerOverlay(overlay);
          break;
      }
    }
  }

  private renderSelectionOverlay(overlay: any) {
    const paint = new this.ck.Paint();
    paint.setStyle(this.ck.PaintStyle.Stroke);
    paint.setColor(this.parseColor('#0080ff'));
    paint.setStrokeWidth(2);

    // 虚线效果
    const dashEffect = this.ck.PathEffect.MakeDash([5, 5], 0);
    paint.setPathEffect(dashEffect);

    const rect = this.ck.LTRBRect(
      overlay.data.x,
      overlay.data.y,
      overlay.data.x + overlay.data.width,
      overlay.data.y + overlay.data.height
    );

    this.canvas.drawRect(rect, paint);

    // 绘制控制点
    paint.setPathEffect(null);
    paint.setStyle(this.ck.PaintStyle.Fill);
    paint.setColor(this.parseColor('#ffffff'));

    const handles = this.getResizeHandles(overlay.data);
    for (const handle of handles) {
      this.canvas.drawCircle(handle.x, handle.y, 4, paint);
    }

    paint.delete();
  }

  private renderGridOverlay(overlay: any) {
    const paint = new this.ck.Paint();
    paint.setStyle(this.ck.PaintStyle.Stroke);
    paint.setColor(this.ck.Color4f(0, 0, 0, 0.1));
    paint.setStrokeWidth(0.5);

    const { width, height, gridSize = 10 } = overlay.data;

    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      this.canvas.drawLine(x, 0, x, height, paint);
    }

    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
      this.canvas.drawLine(0, y, width, y, paint);
    }

    paint.delete();
  }

  private renderRulerOverlay(_overlay: any) {
    // 标尺渲染逻辑
  }

  // 工具函数
  private parseColor(color: string): Float32Array {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      const a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
      return this.ck.Color4f(r, g, b, a);
    }
    // 默认黑色
    return this.ck.Color4f(0, 0, 0, 1);
  }

  // 创建透明度画笔
  private createOpacityPaint(opacity: number) {
    const paint = new this.ck.Paint();
    paint.setAlphaf(opacity);
    return paint;
  }

  private applyTransform(transform: Transform) {
    if (transform.translate) {
      this.canvas.translate(transform.translate.x, transform.translate.y);
    }
    if (transform.scale) {
      this.canvas.scale(transform.scale.x, transform.scale.y);
    }
    if (transform.rotate) {
      const origin = transform.origin || { x: 0, y: 0 };
      this.canvas.rotate(transform.rotate, origin.x, origin.y);
    }
  }

  private applyViewport(viewport: any) {
    this.canvas.save();
    this.canvas.translate(-viewport.x, -viewport.y);
    this.canvas.scale(viewport.zoom, viewport.zoom);
  }

  private getResizeHandles(bounds: any) {
    const { x, y, width, height } = bounds;
    return [
      { x: x, y: y },                          // 左上
      { x: x + width / 2, y: y },              // 中上
      { x: x + width, y: y },                  // 右上
      { x: x + width, y: y + height / 2 },     // 右中
      { x: x + width, y: y + height },         // 右下
      { x: x + width / 2, y: y + height },     // 中下
      { x: x, y: y + height },                 // 左下
      { x: x, y: y + height / 2 },             // 左中
    ];
  }

  // 导出功能
  async exportToPNG(): Promise<Uint8Array | null> {
    if (!this.surface) return null;
    const image = this.surface.makeImageSnapshot();
    const bytes = image.encodeToBytes();
    image.delete();
    return bytes;
  }

  // 清理资源
  dispose() {
    // 清理缓存
    this.elementCache.clear();
    this.imageCache.forEach(image => image?.delete());
    this.imageCache.clear();

    // 清理 surface
    this.surface?.delete();
  }
}