/**
 * 🎯 Jasper Designer 优化架构设计 v2.0
 * 
 * 设计原则：
 * 1. 务实优先 - 避免过度工程化，专注核心需求
 * 2. 渐进式复杂度 - 从简单开始，分阶段扩展
 * 3. 清晰职责分离 - 小而专的组件，符合SOLID原则
 * 4. 实用插件系统 - 简化但可扩展的插件架构
 * 5. 性能导向 - 适合中等规模报表设计器的性能需求
 */

// ================================
// 第一层：基础设施层 (Infrastructure Layer)
// ================================

/**
 * 简化事件总线 - 只保留核心功能
 */
export interface EventBus {
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: (payload: T) => void): () => void;
  off(event: string, handler: Function): void;
  once<T>(event: string, handler: (payload: T) => void): void;
  
  // 基础命名空间支持
  namespace(ns: string): EventBus;
}

/**
 * 几何计算引擎 - 专门处理几何相关计算
 */
export interface GeometryEngine {
  calculateBounds(element: Element): BoundingBox;
  isPointInBounds(point: Point, bounds: BoundingBox): boolean;
  calculateDistance(point1: Point, point2: Point): number;
  getIntersection(bounds1: BoundingBox, bounds2: BoundingBox): BoundingBox | null;
  transformBounds(bounds: BoundingBox, transform: Transform): BoundingBox;
}

/**
 * 状态管理引擎 - 统一的响应式状态
 */
export interface StateEngine {
  get<T>(path: string): T;
  set<T>(path: string, value: T): void;
  subscribe(path: string, callback: (value: any) => void): () => void;
  batch(updates: () => void): void; // 批量更新
  
  // 历史管理
  checkpoint(name: string): void;
  undo(): boolean;
  redo(): boolean;
}

/**
 * 简化渲染引擎 - 专注核心渲染功能
 */
export interface RenderEngine {
  // 层管理
  createLayer(id: string, zIndex: number): RenderLayer;
  getLayer(id: string): RenderLayer | null;
  removeLayer(id: string): void;
  
  // 渲染控制
  render(): void;
  scheduleRender(): void; // 简化的渲染调度
  
  // 基础导出（可通过插件扩展）
  exportSVG(): string;
}

// ================================
// 第二层：数据层 (Data Layer) - 分离职责
// ================================

/**
 * 数据源管理器 - 单一职责：管理数据源
 */
export interface DataSourceManager {
  register(id: string, dataSource: DataSource): void;
  get(id: string): DataSource | null;
  testConnection(id: string): Promise<boolean>;
  list(): DataSourceInfo[];
}

/**
 * 查询引擎 - 单一职责：执行查询
 */
export interface QueryEngine {
  execute(dataSourceId: string, query: DataQuery): Promise<DataResult>;
  
  // 简化的缓存支持
  cached?: {
    get(key: string): DataResult | null;
    set(key: string, data: DataResult, ttl?: number): void;
    clear(): void;
  };
}

/**
 * 数据绑定管理器 - 单一职责：管理元素数据绑定
 */
export interface DataBindingManager {
  bind(elementId: string, binding: DataBinding): void;
  unbind(elementId: string): void;
  getBinding(elementId: string): DataBinding | null;
  
  // 数据更新
  updateElementData(elementId: string): Promise<void>;
  updateAllBoundElements(): Promise<void>;
}

/**
 * 简化的数据源接口
 */
export interface DataSource {
  id: string;
  type: 'sql' | 'rest' | 'file' | 'mock';
  name: string;
  
  connect(): Promise<void>;
  query(query: DataQuery): Promise<DataResult>;
  getSchema?(): Promise<DataSchema>;
}

// ================================
// 第三层：核心抽象层 (Core Abstraction Layer)
// ================================

/**
 * 渲染层抽象 - 清晰的职责
 */
export interface RenderLayer {
  id: string;
  zIndex: number;
  visible: boolean;
  
  addElement(element: RenderableElement): void;
  removeElement(elementId: string): void;
  updateElement(elementId: string, element: RenderableElement): void;
  clear(): void;
  
  render(): SVGElement;
}

/**
 * 可渲染元素 - 简化接口
 */
export interface RenderableElement {
  id: string;
  type: string;
  bounds: BoundingBox;
  
  render(context: RenderContext): SVGElement;
  hitTest(point: Point): boolean;
}

/**
 * 元素管理器 - 元素生命周期管理
 */
export interface ElementManager {
  create(type: string, data: ElementData): Element;
  get(id: string): Element | null;
  update(id: string, updates: Partial<Element>): void;
  delete(id: string): void;
  
  // 批量操作
  getAll(): Element[];
  clone(id: string): Element;
  
  // 层次结构
  group(elementIds: string[]): GroupElement;
  ungroup(groupId: string): Element[];
}

// ================================
// 第四层：专业功能层 (Professional Features Layer)
// ================================

/**
 * 选中系统 - 专门负责选中状态和视觉
 */
export interface SelectionSystem {
  // 状态管理
  select(elementIds: string[]): void;
  deselect(elementIds: string[]): void;
  toggle(elementId: string): void;
  clear(): void;
  
  // 查询
  isSelected(elementId: string): boolean;
  getSelected(): string[];
  
  // 选中视觉管理
  showSelection(elementId: string): void;
  hideSelection(elementId: string): void;
  updateSelection(elementId: string): void;
}

/**
 * 选中视觉策略 - 可扩展的选中效果
 */
export interface SelectionStrategy {
  canHandle(elementType: string): boolean;
  createVisual(element: Element, state: SelectionState): RenderableElement;
  updateVisual(visual: RenderableElement, state: SelectionState): void;
  destroyVisual(visual: RenderableElement): void;
}

/**
 * 交互系统 - 统一的交互管理
 */
export interface InteractionSystem {
  // 处理器管理
  register(handler: InteractionHandler): void;
  unregister(handlerId: string): void;
  
  // 事件处理
  process(event: InteractionEvent): InteractionResult;
  
  // 工具系统
  activateTool(toolId: string): void;
  getActiveTool(): InteractionTool | null;
  
  // 模式管理
  setMode(mode: InteractionMode): void;
  getMode(): InteractionMode;
}

/**
 * 交互处理器 - 专门的交互逻辑
 */
export interface InteractionHandler {
  id: string;
  priority: number;
  
  canHandle(event: InteractionEvent): boolean;
  handle(event: InteractionEvent): InteractionResult;
}

/**
 * 交互工具 - 可扩展的工具系统
 */
export interface InteractionTool {
  id: string;
  name: string;
  cursor: string;
  
  activate(): void;
  deactivate(): void;
  getHandlers(): InteractionHandler[];
}

// ================================
// 第五层：渲染层系统 (Rendering Layer System)
// ================================

/**
 * 分层管理器 - 管理标准渲染层
 */
export class LayerManager {
  // 标准层级定义
  static readonly BACKGROUND = 'background';    // z-index: 0
  static readonly CONTENT = 'content';          // z-index: 100
  static readonly SELECTION = 'selection';      // z-index: 200
  static readonly INTERACTION = 'interaction';  // z-index: 300
  static readonly OVERLAY = 'overlay';          // z-index: 400
  
  constructor(private renderEngine: RenderEngine) {
    this.initializeStandardLayers();
  }
  
  getLayer(id: string): RenderLayer | null {
    return this.renderEngine.getLayer(id);
  }
  
  createCustomLayer(id: string, zIndex: number): RenderLayer {
    return this.renderEngine.createLayer(id, zIndex);
  }
  
  private initializeStandardLayers(): void {
    // 创建标准层级
    this.renderEngine.createLayer(LayerManager.BACKGROUND, 0);
    this.renderEngine.createLayer(LayerManager.CONTENT, 100);
    this.renderEngine.createLayer(LayerManager.SELECTION, 200);
    this.renderEngine.createLayer(LayerManager.INTERACTION, 300);
    this.renderEngine.createLayer(LayerManager.OVERLAY, 400);
  }
}

/**
 * 内容渲染器 - 专门渲染元素内容
 */
export class ContentRenderer {
  private factories = new Map<string, ElementFactory>();
  private contentLayer: RenderLayer;
  
  constructor(layerManager: LayerManager) {
    this.contentLayer = layerManager.getLayer(LayerManager.CONTENT)!;
  }
  
  registerFactory(type: string, factory: ElementFactory): void {
    this.factories.set(type, factory);
  }
  
  render(element: Element): void {
    const factory = this.factories.get(element.type);
    if (factory) {
      const renderable = factory.create(element);
      this.contentLayer.addElement(renderable);
    }
  }
  
  update(elementId: string, element: Element): void {
    const factory = this.factories.get(element.type);
    if (factory) {
      const renderable = factory.create(element);
      this.contentLayer.updateElement(elementId, renderable);
    }
  }
}

/**
 * 选中渲染器 - 专门渲染选中效果
 */
export class SelectionRenderer {
  private strategies = new Map<string, SelectionStrategy>();
  private selectionLayer: RenderLayer;
  
  constructor(layerManager: LayerManager) {
    this.selectionLayer = layerManager.getLayer(LayerManager.SELECTION)!;
  }
  
  registerStrategy(type: string, strategy: SelectionStrategy): void {
    this.strategies.set(type, strategy);
  }
  
  showSelection(element: Element, state: SelectionState): void {
    const strategy = this.strategies.get(element.type);
    if (strategy) {
      const visual = strategy.createVisual(element, state);
      this.selectionLayer.addElement(visual);
    }
  }
  
  hideSelection(elementId: string): void {
    this.selectionLayer.removeElement(`selection:${elementId}`);
  }
}

// ================================
// 第六层：简化插件系统 (Simplified Plugin System)
// ================================

/**
 * 实用插件管理器 - 专注核心扩展能力
 */
export interface PluginManager {
  // 基础生命周期
  register(plugin: Plugin): Promise<void>;
  unregister(pluginId: string): Promise<void>;
  
  // 插件查询
  get(pluginId: string): Plugin | null;
  getAll(): Plugin[];
  
  // 能力注册
  registerElementType(type: string, factory: ElementFactory): void;
  registerTool(tool: InteractionTool): void;
  registerExporter(format: string, exporter: Exporter): void;
}

/**
 * 简化插件接口
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  
  // 简化的依赖管理
  dependencies?: string[];
  
  // 生命周期
  install(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;
  
  // 提供的功能
  provides: PluginCapability[];
}

/**
 * 插件上下文 - 插件可访问的API
 */
export interface PluginContext {
  // 核心系统访问
  elementManager: ElementManager;
  selectionSystem: SelectionSystem;
  interactionSystem: InteractionSystem;
  
  // 渲染系统访问
  contentRenderer: ContentRenderer;
  selectionRenderer: SelectionRenderer;
  layerManager: LayerManager;
  
  // 数据系统访问（可选）
  dataSourceManager?: DataSourceManager;
  queryEngine?: QueryEngine;
}

/**
 * 插件能力定义 - 简化的能力类型
 */
export type PluginCapability = 
  | { type: 'element-type'; elementType: string; factory: ElementFactory; }
  | { type: 'tool'; tool: InteractionTool; }
  | { type: 'selection-strategy'; elementType: string; strategy: SelectionStrategy; }
  | { type: 'exporter'; format: string; exporter: Exporter; }
  | { type: 'data-source'; dataSourceType: string; factory: DataSourceFactory; };

// ================================
// 第七层：应用层 (Application Layer)
// ================================

/**
 * Jasper Designer 主应用 - 简化的依赖管理
 */
export class JasperDesigner {
  // 核心系统
  private eventBus: EventBus;
  private stateEngine: StateEngine;
  private geometryEngine: GeometryEngine;
  private renderEngine: RenderEngine;
  
  // 功能系统
  private elementManager: ElementManager;
  private selectionSystem: SelectionSystem;
  private interactionSystem: InteractionSystem;
  
  // 渲染系统
  private layerManager: LayerManager;
  private contentRenderer: ContentRenderer;
  private selectionRenderer: SelectionRenderer;
  
  // 扩展系统
  private pluginManager: PluginManager;
  
  // 可选系统（按需加载）
  private dataSourceManager?: DataSourceManager;
  private queryEngine?: QueryEngine;
  private dataBindingManager?: DataBindingManager;
  
  constructor(config: DesignerConfig) {
    // 初始化核心系统
    this.initializeCore(config);
    
    // 初始化功能系统
    this.initializeFeatures();
    
    // 初始化渲染系统
    this.initializeRendering();
    
    // 按需初始化数据系统
    if (config.enableDataBinding) {
      this.initializeDataSystems(config);
    }
    
    // 加载插件
    this.loadPlugins(config.plugins);
    
    // 设置事件监听
    this.setupEventHandlers();
  }
  
  // 核心API
  createElement(type: string, data: ElementData): string {
    const element = this.elementManager.create(type, data);
    this.contentRenderer.render(element);
    return element.id;
  }
  
  selectElement(elementId: string): void {
    this.selectionSystem.select([elementId]);
  }
  
  deleteElement(elementId: string): void {
    this.selectionSystem.deselect([elementId]);
    this.elementManager.delete(elementId);
  }
  
  // 工具切换
  activateTool(toolId: string): void {
    this.interactionSystem.activateTool(toolId);
  }
  
  // 数据绑定API（可选）
  bindElementToData(elementId: string, binding: DataBinding): void {
    this.dataBindingManager?.bind(elementId, binding);
  }
  
  // 插件API
  loadPlugin(plugin: Plugin): Promise<void> {
    return this.pluginManager.register(plugin);
  }
  
  private initializeCore(config: DesignerConfig): void {
    this.eventBus = new EventBusImpl();
    this.stateEngine = new StateEngineImpl();
    this.geometryEngine = new GeometryEngineImpl();
    this.renderEngine = new SVGRenderEngineImpl(); // 可切换到Canvas
  }
  
  private initializeFeatures(): void {
    this.elementManager = new ElementManagerImpl(this.stateEngine, this.eventBus);
    this.selectionSystem = new SelectionSystemImpl(this.eventBus);
    this.interactionSystem = new InteractionSystemImpl(this.eventBus);
  }
  
  private initializeRendering(): void {
    this.layerManager = new LayerManager(this.renderEngine);
    this.contentRenderer = new ContentRenderer(this.layerManager);
    this.selectionRenderer = new SelectionRenderer(this.layerManager);
  }
  
  private initializeDataSystems(config: DesignerConfig): void {
    this.dataSourceManager = new DataSourceManagerImpl();
    this.queryEngine = new QueryEngineImpl();
    this.dataBindingManager = new DataBindingManagerImpl(
      this.dataSourceManager,
      this.queryEngine,
      this.eventBus
    );
  }
  
  private setupEventHandlers(): void {
    // 元素更新 → 重新渲染
    this.eventBus.on('element:updated', (event) => {
      const element = this.elementManager.get(event.elementId);
      if (element) {
        this.contentRenderer.update(event.elementId, element);
      }
    });
    
    // 选中变化 → 更新选中视觉
    this.eventBus.on('selection:changed', (event) => {
      event.deselected.forEach(id => this.selectionRenderer.hideSelection(id));
      event.selected.forEach(id => {
        const element = this.elementManager.get(id);
        if (element) {
          this.selectionRenderer.showSelection(element, { selected: true });
        }
      });
    });
  }
  
  private async loadPlugins(plugins: PluginConfig[]): Promise<void> {
    // 加载核心插件
    await this.pluginManager.register(new CoreElementsPlugin());
    await this.pluginManager.register(new CoreToolsPlugin());
    
    // 加载配置的插件
    for (const pluginConfig of plugins) {
      const plugin = await this.loadPluginFromConfig(pluginConfig);
      await this.pluginManager.register(plugin);
    }
  }
}

// ================================
// 配置接口
// ================================

export interface DesignerConfig {
  // 核心配置
  renderEngine: 'svg' | 'canvas';
  
  // 功能开关
  enableDataBinding?: boolean;
  enablePluginSystem?: boolean;
  
  // 插件配置
  plugins: PluginConfig[];
  
  // 数据源配置（可选）
  dataSources?: DataSourceConfig[];
}

export interface PluginConfig {
  id: string;
  enabled: boolean;
  config?: Record<string, any>;
}

// ================================
// 使用示例：渐进式复杂度
// ================================

// Phase 1: 基础设计器
const basicDesigner = new JasperDesigner({
  renderEngine: 'svg',
  plugins: []
});

// Phase 2: 添加数据绑定
const dataEnabledDesigner = new JasperDesigner({
  renderEngine: 'svg',
  enableDataBinding: true,
  dataSources: [
    { type: 'rest', url: 'https://api.example.com' }
  ],
  plugins: []
});

// Phase 3: 完整功能
const fullDesigner = new JasperDesigner({
  renderEngine: 'svg',
  enableDataBinding: true,
  enablePluginSystem: true,
  dataSources: [
    { type: 'sql', connectionString: '...' },
    { type: 'rest', url: 'https://api.example.com' }
  ],
  plugins: [
    { id: 'advanced-charts', enabled: true },
    { id: 'table-component', enabled: true }
  ]
});

export { JasperDesigner, LayerManager, PluginManager };