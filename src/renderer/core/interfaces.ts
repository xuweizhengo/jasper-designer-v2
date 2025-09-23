/**
 * 渲染器核心接口定义
 * 所有渲染器实现必须遵循此接口
 */

import type { ReportElement } from '../../types';

// ============= 基础类型定义 =============

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  translate?: Point;
  scale?: Point;
  rotate?: number;
  origin?: Point;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  textBaseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface ElementStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  borderRadius?: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxLeft: number;
  actualBoundingBoxRight: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
  fontBoundingBoxAscent: number;
  fontBoundingBoxDescent: number;
}

// ============= 渲染元素定义 =============

export type ElementType = 'text' | 'rect' | 'circle' | 'line' | 'path' | 'image' | 'group';

export interface RenderableElement {
  id: string;
  type: ElementType;
  bounds: Rectangle;
  style: ElementStyle;
  transform?: Transform;
  data: any;
  visible: boolean;
  opacity?: number;
  zIndex?: number;
}

// ============= 渲染器选项 =============

export interface RendererOptions {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  alpha?: boolean;
  quality?: 'draft' | 'normal' | 'high';
  pixelRatio?: number;
}

export type RenderQuality = 'draft' | 'normal' | 'high' | 'print';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  quality?: number; // 0-1 for JPEG
  scale?: number;   // 导出缩放比例
  background?: string; // 背景色
}

// ============= 核心渲染器接口 =============

export interface IRenderer {
  // ===== 生命周期 =====
  /**
   * 初始化渲染器
   */
  initialize(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void>;

  /**
   * 销毁渲染器，释放资源
   */
  dispose(): void;

  /**
   * 获取渲染器类型
   */
  getType(): 'canvas' | 'skia' | 'webgl';

  // ===== 渲染核心 =====
  /**
   * 渲染元素列表
   */
  render(elements: RenderableElement[]): void;

  /**
   * 清空画布
   */
  clear(color?: string): void;

  /**
   * 强制刷新到屏幕
   */
  flush(): void;

  // ===== 视口管理 =====
  /**
   * 设置视口
   */
  setViewport(viewport: Viewport): void;

  /**
   * 获取当前视口
   */
  getViewport(): Viewport;

  /**
   * 屏幕坐标转画布坐标
   */
  screenToCanvas(point: Point): Point;

  /**
   * 画布坐标转屏幕坐标
   */
  canvasToScreen(point: Point): Point;

  // ===== 文字度量 =====
  /**
   * 测量文字尺寸
   */
  measureText(text: string, style: TextStyle): TextMetrics;

  // ===== 导出能力 =====
  /**
   * 导出为图片
   */
  exportToImage(options: ExportOptions): Promise<Blob>;

  /**
   * 导出为 DataURL
   */
  exportToDataURL(format: 'png' | 'jpeg', quality?: number): string;

  // ===== 性能优化 =====
  /**
   * 标记需要重绘的区域
   */
  markDirty(region?: Rectangle): void;

  /**
   * 设置渲染质量
   */
  setRenderQuality(quality: RenderQuality): void;

  /**
   * 获取性能统计
   */
  getStats(): RendererStats;

  // ===== 缓存管理 =====
  /**
   * 缓存元素渲染结果
   */
  cacheElement?(elementId: string, data: any): void;

  /**
   * 清除缓存
   */
  clearCache?(): void;

  // ===== 事件支持 =====
  /**
   * Hit-testing: 获取点击位置的元素
   */
  getElementAtPoint?(point: Point): string | null;

  /**
   * 获取区域内的元素
   */
  getElementsInRegion?(region: Rectangle): string[];
}

// ============= 性能统计 =============

export interface RendererStats {
  fps: number;
  renderTime: number;  // ms
  elementCount: number;
  drawCalls: number;
  memoryUsage?: number; // bytes
  cacheHitRate?: number; // 0-1
}

// ============= 渲染器事件 =============

export type RendererEventType =
  | 'initialized'
  | 'beforeRender'
  | 'afterRender'
  | 'error'
  | 'disposed';

export interface RendererEvent {
  type: RendererEventType;
  timestamp: number;
  data?: any;
}

export interface IRendererEventEmitter {
  on(event: RendererEventType, handler: (e: RendererEvent) => void): void;
  off(event: RendererEventType, handler: (e: RendererEvent) => void): void;
  emit(event: RendererEvent): void;
}

// ============= 工具函数 =============

/**
 * 将 ReportElement 转换为 RenderableElement
 */
export function toRenderableElement(element: ReportElement): RenderableElement {
  return {
    id: element.id,
    type: mapElementType(element.content.type),
    bounds: {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
    },
    style: extractStyle(element),
    data: element.content,
    visible: element.visible,
    opacity: 1,
    zIndex: element.z_index,
  };
}

function mapElementType(type: string): ElementType {
  const typeMap: Record<string, ElementType> = {
    'Text': 'text',
    'Rectangle': 'rect',
    'Line': 'line',
    'Image': 'image',
    'DataField': 'text',
  };
  return typeMap[type] || 'rect';
}

function extractStyle(element: ReportElement): ElementStyle {
  const { content } = element;
  const style: ElementStyle = {};

  if (content.type === 'Rectangle') {
    if (content.fill_color) {
      style.fillColor = content.fill_color;
    }
    if (content.border) {
      style.strokeColor = content.border.color;
      style.strokeWidth = content.border.width;
    }
    if (content.corner_radius !== undefined) {
      style.borderRadius = content.corner_radius;
    }
    if (content.opacity !== undefined) {
      style.opacity = content.opacity;
    }
  } else if (content.type === 'Text' || content.type === 'DataField') {
    if (content.style.color) {
      style.fillColor = content.style.color;
    }
  }

  return style;
}