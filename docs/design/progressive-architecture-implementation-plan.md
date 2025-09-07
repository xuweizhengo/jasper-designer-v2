# 🚀 Jasper Designer 渐进式架构实施规划

## 🎯 总体策略：三阶段八里程碑

```
Phase A: 架构基础重构    (4-5周) - M1→M2→M3
Phase B: 核心功能升级    (3-4周) - M4→M5→M6  
Phase C: 扩展能力建设    (2-3周) - M7→M8
```

---

## 📋 Phase A: 架构基础重构 (4-5周)

### 🎯 Milestone 1: 基础设施层建设 (1周)
**目标**: 建立新架构的基础设施，与现有系统并行运行

#### 核心任务
```typescript
// 1. 创建新的基础设施模块
src/v2/
├── core/
│   ├── event-bus.ts        // 简化事件总线
│   ├── state-engine.ts     // 响应式状态管理  
│   ├── geometry-engine.ts  // 几何计算
│   └── render-engine.ts    // SVG渲染引擎
├── types/
│   └── core-types.ts       // 核心类型定义
└── utils/
    └── core-utils.ts       // 工具函数
```

#### 具体实现
```typescript
// 新的事件总线实现
export class EventBusImpl implements EventBus {
  private listeners = new Map<string, Function[]>();
  
  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(payload));
  }
  
  on<T>(event: string, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    
    // 返回取消监听函数
    return () => this.off(event, handler);
  }
  
  namespace(ns: string): EventBus {
    // 简单的命名空间实现
    return new NamespacedEventBus(this, ns);
  }
}

// 新的状态管理引擎
export class StateEngineImpl implements StateEngine {
  private state = new Map<string, any>();
  private subscribers = new Map<string, Function[]>();
  
  get<T>(path: string): T {
    return this.state.get(path);
  }
  
  set<T>(path: string, value: T): void {
    this.state.set(path, value);
    this.notifySubscribers(path, value);
  }
  
  // 批量更新支持
  batch(updates: () => void): void {
    this.batchMode = true;
    updates();
    this.batchMode = false;
    this.flushBatchUpdates();
  }
}
```

#### 测试策略
```typescript
// 单元测试
describe('EventBus', () => {
  it('should emit and handle events correctly', () => {
    const bus = new EventBusImpl();
    let received = null;
    
    bus.on('test', (payload) => { received = payload; });
    bus.emit('test', { data: 'hello' });
    
    expect(received).toEqual({ data: 'hello' });
  });
});

// 集成测试
describe('StateEngine', () => {
  it('should manage state reactively', () => {
    const engine = new StateEngineImpl();
    let notified = false;
    
    engine.subscribe('test.path', () => { notified = true; });
    engine.set('test.path', 'value');
    
    expect(notified).toBe(true);
  });
});
```

#### 交付标准
- ✅ 基础设施模块100%测试覆盖
- ✅ 与现有系统零冲突
- ✅ 性能基准测试通过
- ✅ TypeScript类型安全

---

### 🎯 Milestone 2: 渲染层分离重构 (1.5周)
**目标**: 实现内容渲染与选中效果的完全分离

#### 核心任务
```typescript
// 2. 新的分层渲染系统
src/v2/rendering/
├── layer-manager.ts        // 渲染层管理
├── content-renderer.ts     // 纯内容渲染
├── selection-renderer.ts   // 独立选中渲染
└── factories/
    ├── text-factory.ts     // 文本元素工厂
    ├── shape-factory.ts    // 形状元素工厂
    └── element-factory.ts  // 元素工厂接口
```

#### 具体实现
```typescript
// 分层管理器
export class LayerManager {
  static readonly BACKGROUND = 'background';
  static readonly CONTENT = 'content'; 
  static readonly SELECTION = 'selection';
  static readonly INTERACTION = 'interaction';
  static readonly OVERLAY = 'overlay';
  
  private layers = new Map<string, RenderLayer>();
  
  constructor(private renderEngine: RenderEngine) {
    this.initializeStandardLayers();
  }
  
  getLayer(id: string): RenderLayer | null {
    return this.layers.get(id) || null;
  }
  
  private initializeStandardLayers(): void {
    // 按z-index顺序创建标准层
    this.createLayer(LayerManager.BACKGROUND, 0);
    this.createLayer(LayerManager.CONTENT, 100);
    this.createLayer(LayerManager.SELECTION, 200);
    this.createLayer(LayerManager.INTERACTION, 300);
    this.createLayer(LayerManager.OVERLAY, 400);
  }
}

// 内容渲染器 - 只负责元素内容
export class ContentRenderer {
  private factories = new Map<string, ElementFactory>();
  private contentLayer: RenderLayer;
  
  constructor(layerManager: LayerManager) {
    this.contentLayer = layerManager.getLayer(LayerManager.CONTENT)!;
    this.registerDefaultFactories();
  }
  
  render(element: Element): void {
    const factory = this.factories.get(element.type);
    if (factory) {
      const renderable = factory.create(element);
      this.contentLayer.addElement(renderable);
    }
  }
  
  private registerDefaultFactories(): void {
    this.factories.set('Text', new TextElementFactory());
    this.factories.set('Rectangle', new ShapeElementFactory());
    this.factories.set('Line', new LineElementFactory());
  }
}

// 选中渲染器 - 独立的选中效果
export class SelectionRenderer {
  private strategies = new Map<string, SelectionStrategy>();
  private selectionLayer: RenderLayer;
  
  constructor(layerManager: LayerManager) {
    this.selectionLayer = layerManager.getLayer(LayerManager.SELECTION)!;
    this.registerDefaultStrategies();
  }
  
  showSelection(element: Element, state: SelectionState): void {
    const strategy = this.strategies.get(element.type);
    if (strategy && strategy.canHandle(element.type)) {
      const visual = strategy.createVisual(element, state);
      this.selectionLayer.addElement(visual);
    }
  }
  
  private registerDefaultStrategies(): void {
    this.strategies.set('Text', new TextSelectionStrategy());
    this.strategies.set('Rectangle', new ShapeSelectionStrategy());
    // 复用策略
    this.strategies.set('DataField', this.strategies.get('Text')!);
  }
}
```

#### 集成策略
```typescript
// 渐进式替换现有ElementRenderer
export const ElementRendererV2: Component<ElementRendererProps> = (props) => {
  const useNewRenderer = () => localStorage.getItem('useV2Renderer') === 'true';
  
  if (useNewRenderer()) {
    // 使用新的渲染系统
    return <V2ElementContent element={props.element} />;
  } else {
    // 继续使用现有系统
    return <LegacyElementRenderer {...props} />;
  }
};

// 特性开关控制
export const V2ElementContent: Component<{element: Element}> = (props) => {
  const contentRenderer = useContentRenderer();
  const element = contentRenderer.render(props.element);
  
  return (
    <g class="v2-element-content">
      {element}
    </g>
  );
};
```

#### 交付标准
- ✅ 选中效果完全独立，无冲突
- ✅ 支持特性开关A/B测试
- ✅ 渲染性能不低于现有系统
- ✅ 所有现有元素类型正常工作

---

### 🎯 Milestone 3: 选中系统重构 (1.5周)
**目标**: 完全解决选中冲突问题，实现专业的选中体验

#### 核心任务
```typescript
// 3. 新的选中系统
src/v2/selection/
├── selection-system.ts     // 选中状态管理
├── selection-strategies.ts // 选中视觉策略
├── selection-types.ts      // 选中相关类型
└── strategies/
    ├── text-selection.ts   // 文本选中策略
    ├── shape-selection.ts  // 形状选中策略
    └── base-selection.ts   // 基础选中策略
```

#### 具体实现
```typescript
// 选中系统核心
export class SelectionSystemImpl implements SelectionSystem {
  private selectedElements = new Set<string>();
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  select(elementIds: string[]): void {
    const previousSelected = Array.from(this.selectedElements);
    
    // 更新选中状态
    this.selectedElements.clear();
    elementIds.forEach(id => this.selectedElements.add(id));
    
    // 发送选中变化事件
    this.eventBus.emit('selection:changed', {
      selected: elementIds,
      deselected: previousSelected.filter(id => !elementIds.includes(id)),
      added: elementIds.filter(id => !previousSelected.includes(id))
    });
  }
  
  toggle(elementId: string): void {
    if (this.selectedElements.has(elementId)) {
      this.deselect([elementId]);
    } else {
      const newSelection = [...this.selectedElements, elementId];
      this.select(newSelection);
    }
  }
}

// 文本选中策略 - 解决蓝色加粗问题
export class TextSelectionStrategy implements SelectionStrategy {
  canHandle(elementType: string): boolean {
    return elementType === 'Text' || elementType === 'DataField';
  }
  
  createVisual(element: Element, state: SelectionState): RenderableElement {
    return {
      id: `selection:${element.id}`,
      type: 'TextSelection',
      bounds: this.calculateTextBounds(element),
      
      render: (context: RenderContext): SVGElement => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'text-selection-visual');
        
        // 1. 紫色虚线边框，不加粗
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#8b5cf6'); // 紫色
        border.setAttribute('stroke-width', '1');
        border.setAttribute('stroke-dasharray', '2,2');
        border.setAttribute('rx', '2');
        
        // 2. 位置和尺寸
        border.setAttribute('x', String(element.position.x - 2));
        border.setAttribute('y', String(element.position.y - 2));
        border.setAttribute('width', String(element.size.width + 4));
        border.setAttribute('height', String(element.size.height + 4));
        
        group.appendChild(border);
        
        // 3. 类型指示器（可选）
        if (state.showTypeIndicator) {
          const indicator = this.createTypeIndicator(element);
          group.appendChild(indicator);
        }
        
        return group;
      },
      
      hitTest: (point: Point): boolean => {
        // 选中视觉不参与hit test
        return false;
      }
    };
  }
  
  private calculateTextBounds(element: Element): BoundingBox {
    // 使用现有的文本边界计算逻辑
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };
  }
}
```

#### 选中问题解决方案
```typescript
// 彻底解决选中冲突
export const Canvas: Component = () => {
  const layerManager = useLayerManager();
  const selectionSystem = useSelectionSystem();
  const selectionRenderer = useSelectionRenderer();
  
  // 监听选中变化
  createEffect(() => {
    const unsubscribe = selectionSystem.subscribe('selection:changed', (event) => {
      // 清除旧的选中视觉
      event.deselected.forEach(id => {
        selectionRenderer.hideSelection(id);
      });
      
      // 显示新的选中视觉
      event.selected.forEach(id => {
        const element = elementManager.get(id);
        if (element) {
          selectionRenderer.showSelection(element, { selected: true });
        }
      });
    });
    
    onCleanup(unsubscribe);
  });
  
  return (
    <svg class="jasper-canvas">
      {/* 背景层 */}
      <CanvasBackground />
      
      {/* 内容层 - 纯净的元素内容 */}
      <g class="content-layer">
        <For each={elements()}>
          {(element) => (
            <PureElementRenderer element={element} />
          )}
        </For>
      </g>
      
      {/* 选中层 - 独立的选中效果 */}
      <g class="selection-layer" style="pointer-events: none;">
        {/* 由SelectionRenderer动态管理 */}
      </g>
      
      {/* 交互层 */}
      <InteractionLayer />
    </svg>
  );
};

// 纯净的元素渲染器 - 不包含任何选中逻辑
export const PureElementRenderer: Component<{element: Element}> = (props) => {
  return (
    <g class="element-content">
      <Switch>
        <Match when={props.element.type === 'Text'}>
          <TextRenderer element={props.element} />
        </Match>
        <Match when={props.element.type === 'Rectangle'}>
          <RectangleRenderer element={props.element} />
        </Match>
        {/* 其他元素类型... */}
      </Switch>
    </g>
  );
};
```

#### 交付标准
- ✅ 文本选中效果：紫色边框，无加粗，圆角
- ✅ 不同元素类型有差异化选中视觉
- ✅ 多选支持，状态管理正确
- ✅ 选中性能优化，无内存泄漏

---

## 📋 Phase B: 核心功能升级 (3-4周)

### 🎯 Milestone 4: 交互系统优化 (1.5周)
**目标**: 基于新架构重构交互系统，提升交互体验

#### 核心任务
```typescript
// 4. 优化的交互系统
src/v2/interaction/
├── interaction-system.ts   // 交互系统核心
├── interaction-handlers.ts // 交互处理器
├── tools/
│   ├── selection-tool.ts   // 选择工具
│   ├── move-tool.ts        // 移动工具
│   └── resize-tool.ts      // 调整工具
└── events/
    └── interaction-events.ts // 交互事件定义
```

#### 具体实现
```typescript
// 简化的交互系统
export class InteractionSystemImpl implements InteractionSystem {
  private handlers = new Map<string, InteractionHandler>();
  private activeTool: InteractionTool | null = null;
  private mode: InteractionMode = InteractionMode.SELECT;
  
  constructor(private eventBus: EventBus) {
    this.registerDefaultHandlers();
  }
  
  register(handler: InteractionHandler): void {
    this.handlers.set(handler.id, handler);
  }
  
  process(event: InteractionEvent): InteractionResult {
    // 按优先级排序处理器
    const sortedHandlers = Array.from(this.handlers.values())
      .sort((a, b) => b.priority - a.priority);
    
    for (const handler of sortedHandlers) {
      if (handler.canHandle(event)) {
        const result = handler.handle(event);
        if (result.consumed) {
          return result;
        }
      }
    }
    
    return { consumed: false };
  }
  
  activateTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (tool) {
      this.activeTool?.deactivate();
      this.activeTool = tool;
      tool.activate();
      
      this.eventBus.emit('tool:activated', { toolId, tool });
    }
  }
}

// 选择工具 - 处理点击选择和框选
export class SelectionTool implements InteractionTool {
  id = 'selection';
  name = 'Selection Tool';
  cursor = 'default';
  
  private isActive = false;
  private handlers: InteractionHandler[] = [];
  
  constructor(
    private selectionSystem: SelectionSystem,
    private elementManager: ElementManager,
    private eventBus: EventBus
  ) {
    this.handlers = [
      new ClickSelectionHandler(selectionSystem, elementManager),
      new RectangleSelectionHandler(selectionSystem, elementManager),
      new MultiSelectionHandler(selectionSystem)
    ];
  }
  
  activate(): void {
    this.isActive = true;
    // 注册处理器到交互系统
    this.handlers.forEach(handler => {
      this.eventBus.emit('interaction:register-handler', handler);
    });
  }
  
  deactivate(): void {
    this.isActive = false;
    // 注销处理器
    this.handlers.forEach(handler => {
      this.eventBus.emit('interaction:unregister-handler', handler.id);
    });
  }
  
  getHandlers(): InteractionHandler[] {
    return this.handlers;
  }
}

// 点击选择处理器
export class ClickSelectionHandler implements InteractionHandler {
  id = 'click-selection';
  priority = 100;
  
  constructor(
    private selectionSystem: SelectionSystem,
    private elementManager: ElementManager
  ) {}
  
  canHandle(event: InteractionEvent): boolean {
    return event.type === 'click' && !event.ctrlKey && !event.shiftKey;
  }
  
  handle(event: InteractionEvent): InteractionResult {
    const hitElements = this.getElementsAtPoint(event.point);
    
    if (hitElements.length > 0) {
      // 如果有多个重叠元素，选择最上层的
      const topElement = this.getTopMostElement(hitElements);
      this.selectionSystem.select([topElement.id]);
    } else {
      // 点击空白区域，清除选择
      this.selectionSystem.clear();
    }
    
    return { consumed: true };
  }
  
  private getElementsAtPoint(point: Point): Element[] {
    return this.elementManager.getAll()
      .filter(element => this.isPointInElement(point, element));
  }
}
```

#### 交付标准
- ✅ 选择交互流畅，无延迟
- ✅ 多选支持Ctrl和Shift键
- ✅ 框选功能正常工作
- ✅ 工具切换系统完善

---

### 🎯 Milestone 5: 元素管理系统 (1週)
**目标**: 统一的元素生命周期管理

#### 核心任务
```typescript
// 5. 元素管理系统
src/v2/elements/
├── element-manager.ts      // 元素管理核心
├── element-types.ts        // 元素类型定义
├── factories/
│   ├── element-factory.ts  // 元素工厂接口
│   ├── text-factory.ts     // 文本工厂
│   └── shape-factory.ts    // 形状工厂
└── operations/
    ├── element-operations.ts // 元素操作
    └── batch-operations.ts   // 批量操作
```

#### 具体实现
```typescript
// 元素管理器
export class ElementManagerImpl implements ElementManager {
  private elements = new Map<string, Element>();
  private factories = new Map<string, ElementFactory>();
  
  constructor(
    private stateEngine: StateEngine,
    private eventBus: EventBus
  ) {
    this.registerDefaultFactories();
  }
  
  create(type: string, data: ElementData): Element {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`No factory registered for element type: ${type}`);
    }
    
    const element = factory.create(data);
    this.elements.set(element.id, element);
    
    // 更新状态
    this.stateEngine.set(`elements.${element.id}`, element);
    
    // 发送事件
    this.eventBus.emit('element:created', { element });
    
    return element;
  }
  
  update(id: string, updates: Partial<Element>): void {
    const element = this.elements.get(id);
    if (!element) return;
    
    const updatedElement = { ...element, ...updates };
    this.elements.set(id, updatedElement);
    
    // 批量状态更新
    this.stateEngine.batch(() => {
      Object.entries(updates).forEach(([key, value]) => {
        this.stateEngine.set(`elements.${id}.${key}`, value);
      });
    });
    
    this.eventBus.emit('element:updated', { elementId: id, element: updatedElement, changes: updates });
  }
  
  delete(id: string): void {
    const element = this.elements.get(id);
    if (!element) return;
    
    this.elements.delete(id);
    this.stateEngine.set(`elements.${id}`, undefined);
    
    this.eventBus.emit('element:deleted', { elementId: id, element });
  }
  
  // 批量操作支持
  batchUpdate(updates: Array<{id: string, changes: Partial<Element>}>): void {
    this.stateEngine.batch(() => {
      updates.forEach(({ id, changes }) => {
        this.update(id, changes);
      });
    });
  }
  
  // 层次结构操作
  group(elementIds: string[]): GroupElement {
    const elements = elementIds.map(id => this.get(id)).filter(Boolean) as Element[];
    if (elements.length < 2) {
      throw new Error('Need at least 2 elements to create a group');
    }
    
    const bounds = this.calculateGroupBounds(elements);
    const group = this.create('Group', {
      position: { x: bounds.x, y: bounds.y },
      size: { width: bounds.width, height: bounds.height },
      children: elements
    }) as GroupElement;
    
    // 从元素管理器中移除子元素（它们现在属于组）
    elementIds.forEach(id => this.delete(id));
    
    return group;
  }
}

// 文本元素工厂
export class TextElementFactory implements ElementFactory {
  create(data: ElementData): Element {
    return {
      id: data.id || this.generateId(),
      type: 'Text',
      position: data.position || { x: 0, y: 0 },
      size: data.size || { width: 100, height: 30 },
      content: {
        type: 'Text',
        text: data.text || 'New Text',
        style: data.style || this.getDefaultTextStyle()
      },
      visible: true,
      locked: false,
      metadata: data.metadata || {}
    };
  }
  
  update(element: Element, updates: Partial<Element>): Element {
    return { ...element, ...updates };
  }
  
  private getDefaultTextStyle(): TextStyle {
    return {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left'
    };
  }
}
```

#### 交付标准
- ✅ 元素CRUD操作完善
- ✅ 批量操作性能优化
- ✅ 组合/取消组合功能
- ✅ 状态同步机制完善

---

### 🎯 Milestone 6: 应用层整合 (0.5周)
**目标**: 整合所有新系统，替换旧的应用入口

#### 核心任务
```typescript
// 6. 应用层整合
src/v2/
├── jasper-designer.ts      // 主应用类
├── designer-config.ts      // 配置管理
└── integration/
    ├── legacy-bridge.ts    // 遗留系统桥接
    └── migration-utils.ts  // 迁移工具
```

#### 具体实现
```typescript
// Jasper Designer V2 主应用
export class JasperDesignerV2 {
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
  
  constructor(config: DesignerConfig) {
    this.initializeCore();
    this.initializeFeatures();
    this.initializeRendering();
    this.setupEventHandlers();
    
    // 从遗留系统迁移数据
    this.migrateFromLegacy(config.legacyData);
  }
  
  // 公共API
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
  
  // 渐进式迁移支持
  enableV2Feature(feature: V2Feature): void {
    switch (feature) {
      case 'selection':
        this.useV2Selection = true;
        this.migrateSelectionState();
        break;
      case 'rendering':
        this.useV2Rendering = true;
        this.migrateRenderingState();
        break;
      case 'interaction':
        this.useV2Interaction = true;
        this.migrateInteractionState();
        break;
    }
  }
  
  private migrateFromLegacy(legacyData?: any): void {
    if (!legacyData) return;
    
    // 迁移元素数据
    if (legacyData.elements) {
      legacyData.elements.forEach((legacyElement: any) => {
        const migratedElement = this.migrateLegacyElement(legacyElement);
        this.elementManager.create(migratedElement.type, migratedElement);
      });
    }
    
    // 迁移选中状态
    if (legacyData.selectedIds) {
      this.selectionSystem.select(legacyData.selectedIds);
    }
    
    // 迁移画布配置
    if (legacyData.canvasConfig) {
      this.renderEngine.updateConfig(legacyData.canvasConfig);
    }
  }
}

// 遗留系统桥接器
export class LegacyBridge {
  constructor(
    private v2Designer: JasperDesignerV2,
    private legacyAppContext: any
  ) {}
  
  // 双向数据同步
  syncToV2(): void {
    const legacyState = this.legacyAppContext.state;
    
    // 同步元素数据
    legacyState.elements.forEach((element: any) => {
      if (!this.v2Designer.hasElement(element.id)) {
        this.v2Designer.createElement(element.type, this.convertElement(element));
      }
    });
    
    // 同步选中状态
    this.v2Designer.setSelection(legacyState.selected_ids);
  }
  
  syncToLegacy(): void {
    const v2Elements = this.v2Designer.getAllElements();
    const v2Selection = this.v2Designer.getSelection();
    
    // 更新遗留系统状态
    this.legacyAppContext.setState('elements', v2Elements.map(this.convertToLegacyFormat));
    this.legacyAppContext.setState('selected_ids', v2Selection);
  }
}
```

#### 交付标准
- ✅ V2系统功能完整
- ✅ 与遗留系统数据兼容
- ✅ 支持特性开关渐进迁移
- ✅ 性能不低于现有系统

---

## 📋 Phase C: 扩展能力建设 (2-3周)

### 🎯 Milestone 7: 基础插件系统 (1.5周)
**目标**: 实现简化但实用的插件架构

#### 核心任务
```typescript
// 7. 简化插件系统
src/v2/plugins/
├── plugin-manager.ts       // 插件管理器
├── plugin-types.ts         // 插件类型定义
├── core-plugins/
│   ├── core-elements.ts    // 核心元素插件
│   ├── core-tools.ts       // 核心工具插件
│   └── core-exporters.ts   // 核心导出插件
└── examples/
    └── custom-chart-plugin.ts // 示例插件
```

#### 具体实现
```typescript
// 简化的插件管理器
export class PluginManagerImpl implements PluginManager {
  private plugins = new Map<string, Plugin>();
  private capabilities = new Map<string, any>();
  
  constructor(
    private context: PluginContext
  ) {}
  
  async register(plugin: Plugin): Promise<void> {
    // 检查依赖
    if (!this.checkDependencies(plugin)) {
      throw new Error(`Plugin ${plugin.id} has unmet dependencies`);
    }
    
    // 安装插件
    await plugin.install(this.context);
    
    // 注册插件能力
    plugin.provides.forEach(capability => {
      this.registerCapability(capability);
    });
    
    this.plugins.set(plugin.id, plugin);
    
    console.log(`Plugin ${plugin.id} registered successfully`);
  }
  
  private registerCapability(capability: PluginCapability): void {
    switch (capability.type) {
      case 'element-type':
        this.context.contentRenderer.registerFactory(
          capability.elementType, 
          capability.factory
        );
        break;
        
      case 'tool':
        this.context.interactionSystem.registerTool(capability.tool);
        break;
        
      case 'selection-strategy':
        this.context.selectionRenderer.registerStrategy(
          capability.elementType,
          capability.strategy
        );
        break;
        
      case 'exporter':
        // 导出能力注册（Phase C后期）
        break;
        
      case 'data-source':
        // 数据源能力注册（按需实现）
        break;
    }
  }
}

// 核心元素插件
export class CoreElementsPlugin implements Plugin {
  id = 'core-elements';
  name = 'Core Elements Plugin';
  version = '1.0.0';
  dependencies = [];
  
  provides: PluginCapability[] = [
    {
      type: 'element-type',
      elementType: 'Text',
      factory: new TextElementFactory()
    },
    {
      type: 'element-type', 
      elementType: 'Rectangle',
      factory: new RectangleElementFactory()
    },
    {
      type: 'element-type',
      elementType: 'Line',
      factory: new LineElementFactory()
    },
    {
      type: 'selection-strategy',
      elementType: 'Text',
      strategy: new TextSelectionStrategy()
    },
    {
      type: 'selection-strategy',
      elementType: 'Rectangle', 
      strategy: new ShapeSelectionStrategy()
    }
  ];
  
  async install(context: PluginContext): Promise<void> {
    console.log('Core Elements Plugin installed');
    
    // 可以在这里进行额外的初始化
    context.eventBus.emit('plugin:core-elements:installed', {});
  }
}

// 自定义图表插件示例
export class CustomChartPlugin implements Plugin {
  id = 'custom-chart';
  name = 'Custom Chart Plugin';
  version = '1.0.0';
  dependencies = ['core-elements']; // 依赖核心元素
  
  provides: PluginCapability[] = [
    {
      type: 'element-type',
      elementType: 'CustomChart',
      factory: new CustomChartElementFactory()
    },
    {
      type: 'selection-strategy',
      elementType: 'CustomChart',
      strategy: new ChartSelectionStrategy()
    },
    {
      type: 'tool',
      tool: new ChartCreationTool()
    }
  ];
  
  async install(context: PluginContext): Promise<void> {
    // 注册图表相关的事件处理器
    context.eventBus.on('element:CustomChart:created', this.onChartCreated);
    
    console.log('Custom Chart Plugin installed');
  }
  
  private onChartCreated = (event: any) => {
    console.log('Custom chart created:', event.element);
    // 初始化图表数据等
  };
}
```

#### 交付标准
- ✅ 插件注册和卸载机制完善
- ✅ 5种核心能力类型支持
- ✅ 依赖管理和版本检查
- ✅ 示例插件可正常工作

---

### 🎯 Milestone 8: 数据绑定能力 (可选，1周)
**目标**: 按需实现基础的数据绑定功能

#### 核心任务
```typescript
// 8. 数据绑定系统（按需）
src/v2/data/
├── data-source-manager.ts  // 数据源管理
├── query-engine.ts         // 查询引擎
├── data-binding-manager.ts // 数据绑定管理
└── sources/
    ├── rest-data-source.ts  // REST API数据源
    ├── mock-data-source.ts  // 模拟数据源
    └── file-data-source.ts  // 文件数据源
```

#### 具体实现
```typescript
// 数据绑定管理器
export class DataBindingManagerImpl implements DataBindingManager {
  private bindings = new Map<string, DataBinding>();
  
  constructor(
    private dataSourceManager: DataSourceManager,
    private queryEngine: QueryEngine,
    private eventBus: EventBus
  ) {}
  
  bind(elementId: string, binding: DataBinding): void {
    this.bindings.set(elementId, binding);
    
    // 立即获取数据
    this.updateElementData(elementId);
    
    // 如果需要实时更新
    if (binding.realTime && binding.refreshInterval) {
      this.schedulePeriodicUpdate(elementId, binding.refreshInterval);
    }
  }
  
  async updateElementData(elementId: string): Promise<void> {
    const binding = this.bindings.get(elementId);
    if (!binding) return;
    
    try {
      const result = await this.queryEngine.execute(
        binding.dataSourceId,
        binding.query
      );
      
      const mappedData = this.applyDataMapping(result.data, binding.mapping);
      
      // 通知元素更新数据
      this.eventBus.emit('element:data-updated', {
        elementId,
        data: mappedData,
        binding
      });
      
    } catch (error) {
      console.error(`Failed to update data for element ${elementId}:`, error);
      
      this.eventBus.emit('element:data-error', {
        elementId,
        error,
        binding
      });
    }
  }
  
  private schedulePeriodicUpdate(elementId: string, interval: number): void {
    setInterval(() => {
      this.updateElementData(elementId);
    }, interval);
  }
}

// REST数据源实现
export class RestDataSource implements DataSource {
  id: string;
  type = 'rest' as const;
  name: string;
  
  constructor(private config: RestDataSourceConfig) {
    this.id = config.id;
    this.name = config.name;
  }
  
  async connect(): Promise<void> {
    // REST API通常不需要显式连接
    console.log(`Connected to REST API: ${this.config.baseUrl}`);
  }
  
  async query(query: DataQuery): Promise<DataResult> {
    const url = this.buildUrl(query);
    const options = this.buildRequestOptions(query);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      data: Array.isArray(data) ? data : [data],
      metadata: {
        totalCount: Array.isArray(data) ? data.length : 1,
        fetchTime: Date.now()
      }
    };
  }
  
  private buildUrl(query: DataQuery): string {
    let url = `${this.config.baseUrl}${query.endpoint || ''}`;
    
    if (query.parameters) {
      const searchParams = new URLSearchParams(query.parameters);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }
}
```

#### 交付标准
- ✅ 支持REST API数据源
- ✅ 基础数据绑定功能
- ✅ 错误处理机制完善
- ✅ 实时数据更新支持

---

## 📊 总体交付计划

### 🗓️ 时间线
```
Week 1:     M1 - 基础设施层
Week 2:     M2 - 渲染层分离 
Week 3:     M3 - 选中系统重构
Week 4:     M4 - 交互系统优化
Week 5:     M5 - 元素管理 + M6 - 应用整合
Week 6-7:   M7 - 插件系统
Week 8:     M8 - 数据绑定（可选）
```

### 🎯 关键成功指标
- ✅ 选中冲突问题100%解决
- ✅ 新系统性能≥现有系统
- ✅ 代码覆盖率≥80%
- ✅ 向后兼容性100%
- ✅ 插件系统可扩展性验证

### 🔄 风险控制
1. **每个Milestone都有回退方案**
2. **特性开关控制新功能启用**
3. **并行开发，渐进替换**
4. **持续集成和自动化测试**
5. **用户反馈收集机制**

---

这个渐进式规划确保了：
- **低风险实施** - 现有功能持续可用
- **持续交付** - 每周都有可见进展
- **架构优雅** - 最终达到优化架构的目标
- **可扩展性** - 为未来需求预留空间