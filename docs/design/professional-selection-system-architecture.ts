/**
 * 🎨 专业选中系统架构设计 - 参考Figma等设计软件
 * 
 * 核心设计原则：
 * 1. 选中效果与元素渲染完全分离
 * 2. 类型感知的选中策略
 * 3. 状态驱动的视觉反馈
 * 4. 易于扩展的插件化架构
 */

// ================================
// 1. 选中状态管理
// ================================

export interface SelectionState {
  elementId: string;
  type: ElementType;
  state: 'normal' | 'hovered' | 'selected' | 'editing' | 'multi-selected';
  bounds: ElementBounds;
  metadata?: Record<string, any>;
}

export interface SelectionContext {
  selectedElements: Map<string, SelectionState>;
  hoveredElement: string | null;
  editingElement: string | null;
  multiSelectActive: boolean;
}

// ================================
// 2. 选中策略接口
// ================================

export interface SelectionStrategy {
  /**
   * 渲染选中效果
   */
  renderSelection(element: ReportElement, state: SelectionState): SVGElement;
  
  /**
   * 渲染悬浮效果
   */
  renderHover(element: ReportElement): SVGElement;
  
  /**
   * 获取交互控制点
   */
  getControlPoints(element: ReportElement): ControlPoint[];
  
  /**
   * 获取选中边界
   */
  getSelectionBounds(element: ReportElement): SelectionBounds;
}

// ================================
// 3. 具体选中策略实现
// ================================

/**
 * 文本元素选中策略 - 仿Figma文本选中
 */
export class TextSelectionStrategy implements SelectionStrategy {
  renderSelection(element: ReportElement, state: SelectionState): SVGElement {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    container.setAttribute('class', 'selection-text-container');
    
    // 1. 文本边界框 - 细线条，不干扰阅读
    const boundingBox = this.createTextBoundingBox(state.bounds);
    container.appendChild(boundingBox);
    
    // 2. 类型标识 - 小图标表示这是文本
    const typeIndicator = this.createTypeIndicator('text', state.bounds);
    container.appendChild(typeIndicator);
    
    // 3. 编辑状态特殊处理
    if (state.state === 'editing') {
      const cursor = this.createTextCursor(element);
      container.appendChild(cursor);
    }
    
    return container;
  }
  
  renderHover(element: ReportElement): SVGElement {
    // 文本悬浮：轻微的背景高亮
    const hover = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hover.setAttribute('class', 'text-hover-indicator');
    hover.setAttribute('fill', 'rgba(99, 102, 241, 0.08)');
    hover.setAttribute('stroke', 'none');
    hover.setAttribute('rx', '2');
    return hover;
  }
  
  private createTextBoundingBox(bounds: ElementBounds): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'text-selection-bounds');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#6366f1'); // Figma风格的蓝色
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('stroke-dasharray', '2,2');
    rect.setAttribute('rx', '2');
    return rect;
  }
}

/**
 * 图形元素选中策略 - 仿Figma形状选中
 */
export class ShapeSelectionStrategy implements SelectionStrategy {
  renderSelection(element: ReportElement, state: SelectionState): SVGElement {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    container.setAttribute('class', 'selection-shape-container');
    
    // 1. 形状边界框 - 更明显的边框
    const boundingBox = this.createShapeBoundingBox(state.bounds);
    container.appendChild(boundingBox);
    
    // 2. 控制点 - 8个方向的resize handles
    const controlPoints = this.createControlPoints(state.bounds);
    controlPoints.forEach(point => container.appendChild(point));
    
    // 3. 旋转控制点（如果支持旋转）
    if (this.supportsRotation(element)) {
      const rotationHandle = this.createRotationHandle(state.bounds);
      container.appendChild(rotationHandle);
    }
    
    return container;
  }
  
  private createShapeBoundingBox(bounds: ElementBounds): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'shape-selection-bounds');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#6366f1');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', 'none');
    return rect;
  }
  
  private createControlPoints(bounds: ElementBounds): SVGElement[] {
    const points: SVGElement[] = [];
    const positions = [
      'nw', 'n', 'ne',
      'w',       'e',
      'sw', 's', 'se'
    ];
    
    positions.forEach(position => {
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      point.setAttribute('class', `control-point control-point-${position}`);
      point.setAttribute('width', '6');
      point.setAttribute('height', '6');
      point.setAttribute('fill', '#6366f1');
      point.setAttribute('stroke', '#ffffff');
      point.setAttribute('stroke-width', '1');
      points.push(point);
    });
    
    return points;
  }
}

// ================================
// 4. 选中策略工厂
// ================================

export class SelectionStrategyFactory {
  private static strategies = new Map<ElementType, SelectionStrategy>([
    ['Text', new TextSelectionStrategy()],
    ['DataField', new TextSelectionStrategy()], // 复用文本策略
    ['Rectangle', new ShapeSelectionStrategy()],
    ['Line', new ShapeSelectionStrategy()],
    ['Image', new ImageSelectionStrategy()],
    // 更多元素类型...
  ]);
  
  static getStrategy(elementType: ElementType): SelectionStrategy {
    const strategy = this.strategies.get(elementType);
    if (!strategy) {
      console.warn(`No selection strategy for element type: ${elementType}`);
      return this.strategies.get('Rectangle')!; // 默认策略
    }
    return strategy;
  }
  
  /**
   * 注册新的选中策略 - 支持插件扩展
   */
  static registerStrategy(elementType: ElementType, strategy: SelectionStrategy): void {
    this.strategies.set(elementType, strategy);
  }
}

// ================================
// 5. 选中渲染器 - 独立的选中效果渲染层
// ================================

export class SelectionRenderer {
  private container: SVGGElement;
  private context: SelectionContext;
  
  constructor(parentSvg: SVGSVGElement) {
    // 创建独立的选中效果层
    this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.container.setAttribute('class', 'selection-overlay-layer');
    this.container.style.pointerEvents = 'none'; // 选中效果不影响交互
    parentSvg.appendChild(this.container);
    
    this.context = {
      selectedElements: new Map(),
      hoveredElement: null,
      editingElement: null,
      multiSelectActive: false
    };
  }
  
  /**
   * 更新选中状态
   */
  updateSelection(elementId: string, element: ReportElement, state: 'selected' | 'hovered' | 'editing'): void {
    const strategy = SelectionStrategyFactory.getStrategy(element.content.type);
    
    // 清除旧的选中效果
    this.clearSelectionFor(elementId);
    
    // 创建新的选中效果
    const selectionState: SelectionState = {
      elementId,
      type: element.content.type,
      state,
      bounds: this.calculateElementBounds(element),
    };
    
    let selectionElement: SVGElement;
    
    switch (state) {
      case 'selected':
        selectionElement = strategy.renderSelection(element, selectionState);
        break;
      case 'hovered':
        selectionElement = strategy.renderHover(element);
        break;
      case 'editing':
        selectionElement = strategy.renderSelection(element, { ...selectionState, state: 'editing' });
        break;
    }
    
    selectionElement.setAttribute('data-selection-for', elementId);
    this.container.appendChild(selectionElement);
    
    this.context.selectedElements.set(elementId, selectionState);
  }
  
  /**
   * 清除选中状态
   */
  clearSelection(elementId?: string): void {
    if (elementId) {
      this.clearSelectionFor(elementId);
    } else {
      // 清除所有选中效果
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
      this.context.selectedElements.clear();
    }
  }
  
  private clearSelectionFor(elementId: string): void {
    const existingSelection = this.container.querySelector(`[data-selection-for="${elementId}"]`);
    if (existingSelection) {
      this.container.removeChild(existingSelection);
    }
    this.context.selectedElements.delete(elementId);
  }
  
  private calculateElementBounds(element: ReportElement): ElementBounds {
    // 计算元素的实际边界，考虑变换、旋转等
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      // 更多边界信息...
    };
  }
}

// ================================
// 6. 使用示例 - 集成到Canvas中
// ================================

export class ProfessionalCanvas {
  private selectionRenderer: SelectionRenderer;
  
  constructor(svgElement: SVGSVGElement) {
    this.selectionRenderer = new SelectionRenderer(svgElement);
  }
  
  /**
   * 选中元素
   */
  selectElement(element: ReportElement): void {
    this.selectionRenderer.updateSelection(element.id, element, 'selected');
  }
  
  /**
   * 悬浮元素
   */
  hoverElement(element: ReportElement): void {
    this.selectionRenderer.updateSelection(element.id, element, 'hovered');
  }
  
  /**
   * 进入编辑模式
   */
  editElement(element: ReportElement): void {
    this.selectionRenderer.updateSelection(element.id, element, 'editing');
  }
  
  /**
   * 清除选中
   */
  clearSelection(): void {
    this.selectionRenderer.clearSelection();
  }
}

// ================================
// 7. 类型定义补充
// ================================

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  transform?: string;
}

interface SelectionBounds extends ElementBounds {
  padding?: number;
  minSize?: { width: number; height: number };
}

interface ControlPoint {
  id: string;
  position: 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | 'rotate';
  x: number;
  y: number;
  cursor: string;
  handler: (event: MouseEvent) => void;
}

type ElementType = 'Text' | 'DataField' | 'Rectangle' | 'Line' | 'Image' | 'Group' | 'Frame';