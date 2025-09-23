/**
 * 分层管理器
 * 管理渲染层、交互层、反馈层的协调工作
 */

import { createSignal, createEffect } from 'solid-js';
import type { RenderableElement, Point, Rectangle } from '../core/interfaces';
import type { IDesignRenderer } from '../core/design-interfaces';
import type { IExportRenderer } from '../core/export-interfaces';
import { RendererFactory } from '../factory/RendererFactory';

export interface LayerManagerOptions {
  container: HTMLElement;
  mode?: 'design' | 'data' | 'preview' | 'export';
  rendererType?: 'canvas' | 'skia' | 'auto';
  enableInteraction?: boolean;
  enableFeedback?: boolean;
}

export interface InteractionEvent {
  type: 'click' | 'drag' | 'hover' | 'select';
  point?: Point;
  region?: Rectangle;
  elementId?: string;
  data?: any;
}

/**
 * 分层管理器
 * 协调三层的工作
 */
export class LayerManager {
  // 容器元素
  private container: HTMLElement;

  // 三层元素
  private renderLayer: HTMLCanvasElement | null = null;
  private interactionLayer: HTMLDivElement | null = null;
  private feedbackLayer: SVGSVGElement | null = null;

  // 渲染器（双接口）
  private designRenderer: IDesignRenderer | null = null;
  private exportRenderer: IExportRenderer | null = null;

  // 配置
  private options: LayerManagerOptions;

  // 状态
  private mode: () => 'design' | 'data' | 'preview' | 'export';
  private setMode: (mode: 'design' | 'data' | 'preview' | 'export') => void;
  private selectedIds: () => string[];
  private setSelectedIds: (ids: string[]) => void;
  private hoveredId: () => string | null;
  private setHoveredId: (id: string | null) => void;

  // 事件处理器
  private eventHandlers = new Map<string, Set<Function>>();

  constructor(options: LayerManagerOptions) {
    this.options = options;
    this.container = options.container;

    // 初始化信号
    const [mode, setMode] = createSignal<'design' | 'data' | 'preview' | 'export'>(options.mode || 'design');
    const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
    const [hoveredId, setHoveredId] = createSignal<string | null>(null);

    this.mode = mode;
    this.setMode = setMode;
    this.selectedIds = selectedIds;
    this.setSelectedIds = setSelectedIds;
    this.hoveredId = hoveredId;
    this.setHoveredId = setHoveredId;

    this.initialize();
  }

  /**
   * 初始化层结构
   */
  private async initialize() {
    // 清空容器
    this.container.innerHTML = '';

    // 设置容器样式
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    // 创建渲染层
    await this.createRenderLayer();

    // 根据模式创建其他层
    if (this.options.enableInteraction !== false && this.mode() !== 'export') {
      this.createInteractionLayer();
    }

    if (this.options.enableFeedback !== false && (this.mode() === 'design' || this.mode() === 'data')) {
      this.createFeedbackLayer();
    }

    // 设置响应式效果
    this.setupEffects();
  }

  /**
   * 创建渲染层
   */
  private async createRenderLayer() {
    this.renderLayer = document.createElement('canvas');
    this.renderLayer.className = 'render-layer';
    this.renderLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    // 设置画布尺寸
    const rect = this.container.getBoundingClientRect();
    this.renderLayer.width = rect.width;
    this.renderLayer.height = rect.height;

    this.container.appendChild(this.renderLayer);

    // 根据模式创建对应的渲染器
    const currentMode = this.mode();

    if (currentMode === 'design' || currentMode === 'data') {
      // 设计和数据模式使用 Canvas 渲染器
      this.designRenderer = await RendererFactory.getDesignRenderer({
        enableCaching: true,
        hitTestPrecision: 'bbox',
        antialias: true,
      });
      await this.designRenderer.initialize(this.renderLayer);
    } else if (currentMode === 'preview' || currentMode === 'export') {
      // 预览和导出模式使用 Skia 渲染器
      this.exportRenderer = await RendererFactory.getExportRenderer({
        defaultQuality: currentMode === 'preview' ? 'high' : 'print',
      });
    }
  }

  /**
   * 创建交互层
   */
  private createInteractionLayer() {
    this.interactionLayer = document.createElement('div');
    this.interactionLayer.className = 'interaction-layer';
    this.interactionLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: all;
      cursor: default;
    `;

    // 绑定事件
    this.setupInteractionEvents();

    this.container.appendChild(this.interactionLayer);
  }

  /**
   * 创建反馈层
   */
  private createFeedbackLayer() {
    this.feedbackLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.feedbackLayer.setAttribute('class', 'feedback-layer');
    this.feedbackLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
      pointer-events: none;
    `;

    const rect = this.container.getBoundingClientRect();
    this.feedbackLayer.setAttribute('width', String(rect.width));
    this.feedbackLayer.setAttribute('height', String(rect.height));

    this.container.appendChild(this.feedbackLayer);
  }

  /**
   * 设置交互事件
   */
  private setupInteractionEvents() {
    if (!this.interactionLayer) return;

    let isDragging = false;
    let dragStart: Point | null = null;
    let selectedElement: string | null = null;

    // 鼠标按下
    this.interactionLayer.addEventListener('mousedown', (e) => {
      const point = this.getEventPoint(e);
      dragStart = point;
      isDragging = false;

      // Hit-test
      const elementId = this.hitTest(point);
      if (elementId) {
        selectedElement = elementId;
        this.emit('select', { elementId, point });
      } else {
        this.clearSelection();
      }
    });

    // 鼠标移动
    this.interactionLayer.addEventListener('mousemove', (e) => {
      const point = this.getEventPoint(e);

      if (dragStart && !isDragging) {
        // 检查是否开始拖拽
        const distance = Math.sqrt(
          Math.pow(point.x - dragStart.x, 2) +
          Math.pow(point.y - dragStart.y, 2)
        );

        if (distance > 3) {
          isDragging = true;
          this.emit('dragstart', { elementId: selectedElement, point: dragStart });
        }
      }

      if (isDragging && selectedElement) {
        // 拖拽中
        this.emit('drag', {
          elementId: selectedElement,
          point,
          delta: {
            x: point.x - dragStart!.x,
            y: point.y - dragStart!.y,
          },
        });
      } else {
        // 悬停
        const hoveredId = this.hitTest(point);
        if (hoveredId !== this.hoveredId()) {
          this.setHoveredId(hoveredId);
          this.emit('hover', { elementId: hoveredId, point });
        }
      }
    });

    // 鼠标释放
    this.interactionLayer.addEventListener('mouseup', (e) => {
      if (isDragging) {
        const point = this.getEventPoint(e);
        this.emit('dragend', {
          elementId: selectedElement,
          point,
        });
      }

      isDragging = false;
      dragStart = null;
      selectedElement = null;
    });

    // 鼠标离开
    this.interactionLayer.addEventListener('mouseleave', () => {
      isDragging = false;
      dragStart = null;
      this.setHoveredId(null);
    });
  }

  /**
   * 设置响应式效果
   */
  private setupEffects() {
    // 选中状态变化时更新反馈层
    createEffect(() => {
      const ids = this.selectedIds();
      this.updateSelectionFeedback(ids);
    });

    // 悬停状态变化时更新反馈层
    createEffect(() => {
      const id = this.hoveredId();
      this.updateHoverFeedback(id);
    });
  }

  /**
   * 更新选中反馈
   */
  private updateSelectionFeedback(ids: string[]) {
    if (!this.feedbackLayer) return;

    // 清除旧的选中框
    const oldSelections = this.feedbackLayer.querySelectorAll('.selection-box');
    oldSelections.forEach(el => el.remove());

    // 添加新的选中框
    ids.forEach(id => {
      const bounds = this.getElementBounds(id);
      if (bounds) {
        this.drawSelectionBox(bounds);
      }
    });
  }

  /**
   * 更新悬停反馈
   */
  private updateHoverFeedback(id: string | null) {
    if (!this.feedbackLayer) return;

    // 清除旧的悬停效果
    const oldHover = this.feedbackLayer.querySelector('.hover-box');
    oldHover?.remove();

    // 添加新的悬停效果
    if (id) {
      const bounds = this.getElementBounds(id);
      if (bounds) {
        this.drawHoverBox(bounds);
      }
    }
  }

  /**
   * 绘制选中框
   */
  private drawSelectionBox(bounds: Rectangle) {
    if (!this.feedbackLayer) return;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'selection-box');
    rect.setAttribute('x', String(bounds.x));
    rect.setAttribute('y', String(bounds.y));
    rect.setAttribute('width', String(bounds.width));
    rect.setAttribute('height', String(bounds.height));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#0066ff');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', '5,5');

    this.feedbackLayer.appendChild(rect);

    // 添加调整手柄
    this.drawResizeHandles(bounds);
  }

  /**
   * 绘制悬停框
   */
  private drawHoverBox(bounds: Rectangle) {
    if (!this.feedbackLayer) return;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'hover-box');
    rect.setAttribute('x', String(bounds.x));
    rect.setAttribute('y', String(bounds.y));
    rect.setAttribute('width', String(bounds.width));
    rect.setAttribute('height', String(bounds.height));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#0066ff');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('opacity', '0.5');

    this.feedbackLayer.appendChild(rect);
  }

  /**
   * 绘制调整手柄
   */
  private drawResizeHandles(bounds: Rectangle) {
    if (!this.feedbackLayer) return;

    const handleSize = 8;
    const positions = [
      { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 }, // 左上
      { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 }, // 中上
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 }, // 右上
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 }, // 右中
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 }, // 右下
      { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 }, // 中下
      { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 }, // 左下
      { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 }, // 左中
    ];

    positions.forEach(pos => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('class', 'resize-handle');
      rect.setAttribute('x', String(pos.x));
      rect.setAttribute('y', String(pos.y));
      rect.setAttribute('width', String(handleSize));
      rect.setAttribute('height', String(handleSize));
      rect.setAttribute('fill', 'white');
      rect.setAttribute('stroke', '#0066ff');
      rect.setAttribute('stroke-width', '2');

      this.feedbackLayer!.appendChild(rect);
    });
  }

  // ===== 公共方法 =====

  /**
   * 渲染元素
   */
  render(elements: RenderableElement[]) {
    const currentMode = this.mode();

    if ((currentMode === 'design' || currentMode === 'data') && this.designRenderer) {
      // 设计/数据模式使用快速渲染
      this.designRenderer.renderFast(elements);
    } else if (currentMode === 'preview' && this.exportRenderer && this.renderLayer) {
      // 预览模式使用高质量渲染
      this.exportRenderer.renderPreview(elements, this.renderLayer);
    }
  }

  /**
   * 切换模式
   */
  async switchMode(mode: 'design' | 'data' | 'preview' | 'export') {
    const oldMode = this.mode();
    this.setMode(mode);

    // 根据模式调整层的显示
    if (mode === 'export') {
      // 导出模式隐藏其他层
      if (this.interactionLayer) this.interactionLayer.style.display = 'none';
      if (this.feedbackLayer) this.feedbackLayer.style.display = 'none';
    } else if (mode === 'preview') {
      // 预览模式隐藏反馈层
      if (this.feedbackLayer) this.feedbackLayer.style.display = 'none';
      if (this.interactionLayer) this.interactionLayer.style.display = 'block';
    } else {
      // 设计/数据模式显示所有层
      if (this.interactionLayer) this.interactionLayer.style.display = 'block';
      if (this.feedbackLayer) this.feedbackLayer.style.display = 'block';
    }

    // 切换渲染器
    if ((oldMode === 'design' || oldMode === 'data') && (mode === 'preview' || mode === 'export')) {
      // 从设计模式切换到预览/导出模式，需要初始化 Skia
      if (!this.exportRenderer) {
        this.exportRenderer = await RendererFactory.getExportRenderer({
          defaultQuality: mode === 'preview' ? 'high' : 'print',
        });
      }
    } else if ((oldMode === 'preview' || oldMode === 'export') && (mode === 'design' || mode === 'data')) {
      // 从预览模式切换回设计模式，需要初始化 Canvas
      if (!this.designRenderer && this.renderLayer) {
        this.designRenderer = await RendererFactory.getDesignRenderer({
          enableCaching: true,
          hitTestPrecision: 'bbox',
          antialias: true,
        });
        await this.designRenderer.initialize(this.renderLayer);
      }
    }
  }

  /**
   * 选择元素
   */
  selectElements(ids: string[]) {
    this.setSelectedIds(ids);
  }

  /**
   * 清除选择
   */
  clearSelection() {
    this.setSelectedIds([]);
  }

  /**
   * 获取当前活动的渲染器
   */
  getCurrentRenderer(): IDesignRenderer | IExportRenderer | null {
    const mode = this.mode();
    if (mode === 'design' || mode === 'data') {
      return this.designRenderer;
    } else if (mode === 'preview' || mode === 'export') {
      return this.exportRenderer;
    }
    return null;
  }

  /**
   * 获取设计渲染器
   */
  getDesignRenderer(): IDesignRenderer | null {
    return this.designRenderer;
  }

  /**
   * 获取导出渲染器
   */
  getExportRenderer(): IExportRenderer | null {
    return this.exportRenderer;
  }

  /**
   * 销毁
   */
  dispose() {
    if (this.designRenderer) {
      this.designRenderer.dispose();
      this.designRenderer = null;
    }

    if (this.exportRenderer) {
      this.exportRenderer.dispose();
      this.exportRenderer = null;
    }

    this.container.innerHTML = '';
    this.eventHandlers.clear();
  }

  // ===== 私有辅助方法 =====

  /**
   * Hit-testing
   */
  private hitTest(point: Point): string | null {
    // 只有设计模式支持 hit-testing
    if (this.designRenderer) {
      return this.designRenderer.getElementAtPoint(point);
    }
    return null;
  }

  /**
   * 获取元素边界
   */
  private getElementBounds(_id: string): Rectangle | null {
    // TODO: 需要维护元素边界信息
    return {
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };
  }

  /**
   * 获取事件坐标
   */
  private getEventPoint(e: MouseEvent): Point {
    const rect = this.container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // ===== 事件系统 =====

  /**
   * 订阅事件
   */
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 取消订阅
   */
  off(event: string, handler: Function) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any) {
    this.eventHandlers.get(event)?.forEach(handler => handler(data));
  }
}