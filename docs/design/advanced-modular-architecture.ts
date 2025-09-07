/**
 * 🎨 专业设计软件架构 - 深度模块化设计
 * 
 * 设计理念：
 * 1. 极致的职责分离 - 每个模块只做一件事
 * 2. 可插拔的架构 - 任何模块都可以替换和扩展  
 * 3. 事件驱动 - 模块间通过事件通信，完全解耦
 * 4. 层级清晰 - 从底层到顶层清晰的依赖关系
 */

// ================================
// 第一层：基础设施层 (Infrastructure Layer)
// ================================

/**
 * 事件总线 - 整个系统的神经网络
 */
export interface EventBus {
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: (payload: T) => void): () => void;
  off(event: string, handler: Function): void;
  once<T>(event: string, handler: (payload: T) => void): void;
}

/**
 * 几何计算引擎 - 专门处理几何相关计算
 */
export interface GeometryEngine {
  calculateBounds(element: Element): BoundingBox;
  calculateIntersection(box1: BoundingBox, box2: BoundingBox): BoundingBox | null;
  calculateDistance(point1: Point, point2: Point): number;
  isPointInside(point: Point, bounds: BoundingBox): boolean;
  transformPoint(point: Point, matrix: TransformMatrix): Point;
}

/**
 * 渲染引擎抽象 - 支持不同的渲染后端 (SVG/Canvas/WebGL)
 */
export interface RenderEngine {
  createLayer(id: string): RenderLayer;
  removeLayer(id: string): void;
  getLayer(id: string): RenderLayer | null;
  setLayerOrder(layerIds: string[]): void;
  render(): void;
}

/**
 * 状态管理引擎 - 统一的状态管理
 */
export interface StateEngine {
  get<T>(path: string): T;
  set<T>(path: string, value: T): void;
  subscribe(path: string, callback: (value: any) => void): () => void;
  transaction(updates: Record<string, any>): void;
}

// ================================
// 第二层：核心抽象层 (Core Abstraction Layer)
// ================================

/**
 * 渲染层抽象 - 每个层都是独立的渲染单元
 */
export interface RenderLayer {
  id: string;
  zIndex: number;
  visible: boolean;
  opacity: number;
  
  addElement(element: RenderableElement): void;
  removeElement(elementId: string): void;
  updateElement(elementId: string, updates: Partial<RenderableElement>): void;
  clear(): void;
}

/**
 * 可渲染元素抽象
 */
export interface RenderableElement {
  id: string;
  type: string;
  geometry: GeometryData;
  style: StyleData;
  metadata: Record<string, any>;
  
  render(context: RenderContext): SVGElement | HTMLElement;
  getBounds(): BoundingBox;
  hitTest(point: Point): boolean;
}

/**
 * 交互处理器抽象
 */
export interface InteractionHandler {
  id: string;
  priority: number;
  
  canHandle(event: InteractionEvent): boolean;
  handle(event: InteractionEvent): InteractionResult;
  cleanup(): void;
}

/**
 * 元素管理器抽象 - 管理所有元素的生命周期
 */
export interface ElementManager {
  createElement(type: string, data: any): Element;
  deleteElement(id: string): void;
  updateElement(id: string, updates: Partial<Element>): void;
  getElement(id: string): Element | null;
  getAllElements(): Element[];
  
  // 高级操作
  cloneElement(id: string): Element;
  groupElements(ids: string[]): GroupElement;
  ungroupElement(groupId: string): Element[];
}

// ================================
// 第三层：专业功能层 (Professional Features Layer)
// ================================

/**
 * 选中系统 - 独立的选中状态和视觉管理
 */
export interface SelectionSystem {
  // 状态管理
  select(elementIds: string[]): void;
  deselect(elementIds: string[]): void;
  selectAll(): void;
  clearSelection(): void;
  isSelected(elementId: string): boolean;
  getSelectedElements(): Element[];
  
  // 视觉管理
  showSelectionFor(elementId: string): void;
  hideSelectionFor(elementId: string): void;
  updateSelectionVisual(elementId: string): void;
  
  // 交互管理
  getSelectionInteractions(elementId: string): InteractionHandler[];
}

/**
 * 选中视觉策略 - 专门处理选中的视觉效果
 */
export interface SelectionVisualStrategy {
  type: ElementType;
  
  createSelectionVisual(element: Element, state: SelectionState): RenderableElement;
  updateSelectionVisual(visual: RenderableElement, state: SelectionState): void;
  destroySelectionVisual(visual: RenderableElement): void;
  
  // 不同状态的视觉效果
  createHoverVisual(element: Element): RenderableElement;
  createSelectedVisual(element: Element): RenderableElement;
  createEditingVisual(element: Element): RenderableElement;
  createMultiSelectVisual(element: Element): RenderableElement;
}

/**
 * 交互系统 - 管理所有交互行为
 */
export interface InteractionSystem {
  registerHandler(handler: InteractionHandler): void;
  unregisterHandler(handlerId: string): void;
  processEvent(event: InteractionEvent): void;
  
  // 交互模式管理
  setMode(mode: InteractionMode): void;
  getMode(): InteractionMode;
  
  // 工具系统
  registerTool(tool: InteractionTool): void;
  activateTool(toolId: string): void;
  getActiveTool(): InteractionTool | null;
}

/**
 * 工具系统 - 可扩展的工具集
 */
export interface InteractionTool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  
  activate(): void;
  deactivate(): void;
  
  // 工具专用的交互处理器
  getHandlers(): InteractionHandler[];
  
  // 工具状态
  isActive(): boolean;
  getConfig(): ToolConfig;
  setConfig(config: ToolConfig): void;
}

// ================================
// 第四层：渲染层系统 (Rendering Layer System)
// ================================

/**
 * 分层渲染管理器 - 管理所有渲染层
 */
export class LayerManager {
  private layers = new Map<string, RenderLayer>();
  private renderEngine: RenderEngine;
  private eventBus: EventBus;
  
  // 预定义的标准层级
  static readonly BACKGROUND_LAYER = 'background';
  static readonly CONTENT_LAYER = 'content';
  static readonly DECORATION_LAYER = 'decoration';
  static readonly SELECTION_LAYER = 'selection';
  static readonly INTERACTION_LAYER = 'interaction';
  static readonly ANNOTATION_LAYER = 'annotation';
  static readonly UI_OVERLAY_LAYER = 'ui-overlay';
  static readonly DEBUG_LAYER = 'debug';
  
  constructor(renderEngine: RenderEngine, eventBus: EventBus) {
    this.renderEngine = renderEngine;
    this.eventBus = eventBus;
    this.initializeStandardLayers();
  }
  
  private initializeStandardLayers() {
    // 按z-index顺序创建标准层级
    const standardLayers = [
      { id: LayerManager.BACKGROUND_LAYER, zIndex: 0 },
      { id: LayerManager.CONTENT_LAYER, zIndex: 100 },
      { id: LayerManager.DECORATION_LAYER, zIndex: 200 },
      { id: LayerManager.SELECTION_LAYER, zIndex: 300 },
      { id: LayerManager.INTERACTION_LAYER, zIndex: 400 },
      { id: LayerManager.ANNOTATION_LAYER, zIndex: 500 },
      { id: LayerManager.UI_OVERLAY_LAYER, zIndex: 600 },
      { id: LayerManager.DEBUG_LAYER, zIndex: 1000 },
    ];
    
    standardLayers.forEach(({ id, zIndex }) => {
      const layer = this.renderEngine.createLayer(id);
      layer.zIndex = zIndex;
      this.layers.set(id, layer);
    });
  }
  
  // 动态层管理
  createCustomLayer(id: string, zIndex: number): RenderLayer {
    if (this.layers.has(id)) {
      throw new Error(`Layer ${id} already exists`);
    }
    
    const layer = this.renderEngine.createLayer(id);
    layer.zIndex = zIndex;
    this.layers.set(id, layer);
    
    this.eventBus.emit('layer:created', { id, zIndex });
    return layer;
  }
  
  removeCustomLayer(id: string): void {
    if (this.isStandardLayer(id)) {
      throw new Error(`Cannot remove standard layer: ${id}`);
    }
    
    this.layers.delete(id);
    this.renderEngine.removeLayer(id);
    this.eventBus.emit('layer:removed', { id });
  }
  
  private isStandardLayer(id: string): boolean {
    return Object.values(LayerManager).includes(id);
  }
}

/**
 * 内容渲染器 - 专门负责元素内容的渲染
 */
export class ContentRenderer {
  private contentLayer: RenderLayer;
  private elementFactories = new Map<string, ElementFactory>();
  
  constructor(layerManager: LayerManager) {
    this.contentLayer = layerManager.getLayer(LayerManager.CONTENT_LAYER)!;
  }
  
  // 元素工厂注册 - 支持插件化扩展
  registerElementFactory(type: string, factory: ElementFactory): void {
    this.elementFactories.set(type, factory);
  }
  
  // 渲染元素内容
  renderElement(element: Element): void {
    const factory = this.elementFactories.get(element.type);
    if (!factory) {
      console.warn(`No factory registered for element type: ${element.type}`);
      return;
    }
    
    const renderable = factory.create(element);
    this.contentLayer.addElement(renderable);
  }
  
  updateElement(elementId: string, element: Element): void {
    const factory = this.elementFactories.get(element.type);
    if (!factory) return;
    
    const updates = factory.update(element);
    this.contentLayer.updateElement(elementId, updates);
  }
  
  removeElement(elementId: string): void {
    this.contentLayer.removeElement(elementId);
  }
}

/**
 * 选中渲染器 - 专门负责选中效果的渲染
 */
export class SelectionRenderer {
  private selectionLayer: RenderLayer;
  private visualStrategies = new Map<string, SelectionVisualStrategy>();
  
  constructor(layerManager: LayerManager) {
    this.selectionLayer = layerManager.getLayer(LayerManager.SELECTION_LAYER)!;
  }
  
  // 策略注册
  registerVisualStrategy(type: string, strategy: SelectionVisualStrategy): void {
    this.visualStrategies.set(type, strategy);
  }
  
  // 渲染选中效果
  showSelection(element: Element, state: SelectionState): void {
    const strategy = this.visualStrategies.get(element.type);
    if (!strategy) {
      console.warn(`No selection strategy for element type: ${element.type}`);
      return;
    }
    
    const visual = strategy.createSelectionVisual(element, state);
    this.selectionLayer.addElement(visual);
  }
  
  hideSelection(elementId: string): void {
    this.selectionLayer.removeElement(`selection:${elementId}`);
  }
  
  updateSelection(element: Element, state: SelectionState): void {
    const strategy = this.visualStrategies.get(element.type);
    if (!strategy) return;
    
    // 先移除旧的，再添加新的
    this.hideSelection(element.id);
    this.showSelection(element, state);
  }
}

// ================================
// 第五层：插件系统 (Plugin System)
// ================================

/**
 * 插件管理器 - 支持第三方扩展
 */
export interface PluginManager {
  // 插件生命周期
  loadPlugin(plugin: Plugin): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): void;
  disablePlugin(pluginId: string): void;
  
  // 插件查询
  getPlugin(pluginId: string): Plugin | null;
  getAllPlugins(): Plugin[];
  getEnabledPlugins(): Plugin[];
  
  // 插件通信
  getPluginAPI(pluginId: string): PluginAPI | null;
  broadcastToPlugins(event: string, data: any): void;
}

/**
 * 插件接口
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  
  // 插件依赖
  dependencies: string[];
  peerDependencies: string[];
  
  // 插件生命周期钩子
  install(context: PluginContext): Promise<void>;
  activate(context: PluginContext): Promise<void>;
  deactivate(context: PluginContext): Promise<void>;
  uninstall(context: PluginContext): Promise<void>;
  
  // 插件提供的功能
  provides: PluginCapability[];
}

/**
 * 插件能力定义
 */
export type PluginCapability = 
  | ElementTypeCapability    // 新的元素类型
  | ToolCapability          // 新的工具
  | RendererCapability      // 新的渲染器
  | InteractionCapability   // 新的交互方式
  | ExportCapability        // 新的导出格式
  | ImportCapability;       // 新的导入格式

// ================================
// 第六层：应用层 (Application Layer)
// ================================

/**
 * 应用程序主控制器
 */
export class DesignApplication {
  private eventBus: EventBus;
  private stateEngine: StateEngine;
  private geometryEngine: GeometryEngine;
  private renderEngine: RenderEngine;
  
  private layerManager: LayerManager;
  private elementManager: ElementManager;
  private selectionSystem: SelectionSystem;
  private interactionSystem: InteractionSystem;
  private pluginManager: PluginManager;
  
  constructor() {
    // 初始化基础设施
    this.eventBus = new EventBusImpl();
    this.stateEngine = new StateEngineImpl();
    this.geometryEngine = new GeometryEngineImpl();
    this.renderEngine = new SVGRenderEngine(); // 可切换到Canvas/WebGL
    
    // 初始化核心系统
    this.layerManager = new LayerManager(this.renderEngine, this.eventBus);
    this.elementManager = new ElementManagerImpl(this.stateEngine, this.eventBus);
    this.selectionSystem = new SelectionSystemImpl(this.layerManager, this.eventBus);
    this.interactionSystem = new InteractionSystemImpl(this.eventBus);
    this.pluginManager = new PluginManagerImpl(this.eventBus);
    
    this.setupEventHandlers();
    this.loadCorePlugins();
  }
  
  private setupEventHandlers() {
    // 元素变化 → 重新渲染
    this.eventBus.on('element:updated', (event) => {
      this.rerenderElement(event.elementId);
    });
    
    // 选中变化 → 更新选中视觉
    this.eventBus.on('selection:changed', (event) => {
      this.updateSelectionVisuals(event.selectedIds);
    });
    
    // 交互事件 → 系统响应
    this.eventBus.on('interaction:*', (event) => {
      this.interactionSystem.processEvent(event);
    });
  }
  
  private loadCorePlugins() {
    // 加载核心元素类型插件
    this.pluginManager.loadPlugin(new TextElementPlugin());
    this.pluginManager.loadPlugin(new ShapeElementPlugin());
    this.pluginManager.loadPlugin(new ImageElementPlugin());
    
    // 加载核心工具插件
    this.pluginManager.loadPlugin(new SelectionToolPlugin());
    this.pluginManager.loadPlugin(new DrawingToolsPlugin());
    this.pluginManager.loadPlugin(new TextToolPlugin());
  }
}

// ================================
// 使用示例：完全模块化的架构
// ================================

// 1. 注册新的元素类型（插件方式）
class CustomChartElementPlugin implements Plugin {
  id = 'custom-chart-element';
  name = 'Custom Chart Element';
  version = '1.0.0';
  author = 'Third Party';
  description = 'Adds support for custom chart elements';
  dependencies: string[] = [];
  peerDependencies: string[] = [];
  provides: PluginCapability[] = [
    {
      type: 'element-type',
      elementType: 'CustomChart',
      factory: new CustomChartElementFactory(),
      selectionStrategy: new CustomChartSelectionStrategy(),
      interactionHandlers: [new CustomChartInteractionHandler()]
    }
  ];
  
  async install(context: PluginContext): Promise<void> {
    // 注册元素工厂
    context.contentRenderer.registerElementFactory('CustomChart', new CustomChartElementFactory());
    
    // 注册选中策略
    context.selectionRenderer.registerVisualStrategy('CustomChart', new CustomChartSelectionStrategy());
    
    // 注册交互处理器
    context.interactionSystem.registerHandler(new CustomChartInteractionHandler());
  }
  
  async activate(context: PluginContext): Promise<void> {
    console.log('Custom Chart Plugin activated');
  }
  
  async deactivate(context: PluginContext): Promise<void> {
    console.log('Custom Chart Plugin deactivated');
  }
  
  async uninstall(context: PluginContext): Promise<void> {
    // 清理注册的组件
  }
}

// 2. 自定义渲染层（高级用法）
const customLayer = layerManager.createCustomLayer('annotations', 250);
customLayer.addElement(new AnnotationElement('ruler', rulerData));

// 3. 自定义交互工具
class MeasurementTool implements InteractionTool {
  id = 'measurement-tool';
  name = 'Measurement Tool';
  icon = 'ruler-icon';
  cursor = 'crosshair';
  
  private handlers: InteractionHandler[] = [
    new MeasurementClickHandler(),
    new MeasurementDragHandler(),
    new MeasurementKeyboardHandler()
  ];
  
  getHandlers(): InteractionHandler[] {
    return this.handlers;
  }
  
  // ... 其他实现
}

export { DesignApplication, LayerManager, PluginManager };