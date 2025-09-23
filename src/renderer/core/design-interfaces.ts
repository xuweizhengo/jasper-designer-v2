/**
 * 设计模式渲染器接口
 * 用于设计模式和数据模式，优化交互性能
 */

import type { Point, Rectangle, RenderableElement, Viewport } from './interfaces';

/**
 * 设计模式渲染器接口
 * 专注于快速响应和交互体验
 */
export interface IDesignRenderer {
  // ===== 生命周期 =====
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  dispose(): void;

  // ===== 快速渲染 =====
  /**
   * 快速渲染（可以牺牲质量换取速度）
   */
  renderFast(elements: RenderableElement[]): void;

  /**
   * 增量渲染（只渲染变化的部分）
   */
  renderIncremental(changedElements: RenderableElement[], unchangedElements: RenderableElement[]): void;

  /**
   * 清空画布
   */
  clear(): void;

  // ===== 交互优化 =====
  /**
   * 渲染拖拽预览（半透明或虚线）
   */
  renderDragPreview(element: RenderableElement, offset: Point): void;

  /**
   * 清除拖拽预览
   */
  clearDragPreview(): void;

  /**
   * 渲染选择框
   */
  renderSelectionBox(start: Point, end: Point): void;

  /**
   * 渲染对齐辅助线
   */
  renderAlignmentGuides(guides: AlignmentGuide[]): void;

  // ===== 视口管理 =====
  setViewport(viewport: Viewport): void;
  panViewport(delta: Point): void;
  zoomViewport(scale: number, center: Point): void;

  // ===== Hit Testing =====
  /**
   * 快速 hit-test（可以用边界盒近似）
   */
  getElementAtPoint(point: Point): string | null;

  /**
   * 批量 hit-test
   */
  getElementsInRegion(region: Rectangle): string[];

  // ===== 性能优化 =====
  /**
   * 开启/关闭草稿模式（降低质量提升速度）
   */
  setDraftMode(enabled: boolean): void;

  /**
   * 设置脏区域（只重绘这部分）
   */
  markDirty(region?: Rectangle): void;

  /**
   * 批处理开始/结束（累积多个操作一次渲染）
   */
  beginBatch(): void;
  endBatch(): void;
}

// ===== 辅助类型 =====

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  color?: string;
  style?: 'solid' | 'dashed';
}

export interface DragPreviewOptions {
  opacity?: number;
  style?: 'ghost' | 'outline';
  showOriginal?: boolean;
}

export interface SelectionBoxStyle {
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: number[];
}

/**
 * 设计模式渲染上下文
 * 包含交互相关的状态
 */
export interface DesignRenderContext {
  // 当前模式
  mode: 'select' | 'drag' | 'resize' | 'rotate' | 'draw';

  // 选中状态
  selectedIds: Set<string>;
  hoveredId: string | null;

  // 拖拽状态
  isDragging: boolean;
  dragStartPoint: Point | null;
  dragCurrentPoint: Point | null;

  // 显示选项
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGrid: boolean;

  // 性能选项
  useDraftMode: boolean;
  enableAnimation: boolean;
}

/**
 * 设计模式渲染器配置
 */
export interface DesignRendererOptions {
  // 性能选项
  enableCaching?: boolean;
  maxCacheSize?: number;
  useDirtyRectangles?: boolean;

  // 交互选项
  hitTestPrecision?: 'exact' | 'bbox' | 'fast';
  selectionTolerance?: number;

  // 显示选项
  antialias?: boolean;
  pixelRatio?: number;
}

/**
 * 设计模式性能统计
 */
export interface DesignPerformanceStats {
  renderTime: number;       // 渲染耗时
  hitTestTime: number;      // Hit-test 耗时
  fps: number;              // 帧率
  dirtyRegionSize: number;  // 脏区域大小
  cachedElements: number;   // 缓存的元素数
  batchedOperations: number; // 批处理的操作数
}