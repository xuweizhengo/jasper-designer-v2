# 🔥 P0 级核心组件深度设计分析

**版本**: v1.0  
**创建日期**: 2025-01-20  
**状态**: ⏸️ **已暂停** - 参考用途  
**优先级**: 已调整为功能开发优先

---

## ⚠️ **重要说明 - 设计探索已暂停**

**暂停日期**: 2025-01-27  
**决策文档**: [P0设计讨论v2.4 - 暂停探索](./p0-design-discussion-v2.4.md)

**暂停原因**:
1. 📊 **现有架构质量被低估** - Solid.js + Tauri + 统一边界系统已经很优秀
2. 🎯 **原始问题已大部分解决** - 文本选中、交互冲突等核心问题已修复
3. 💰 **成本收益严重不匹配** - 重构需6-15周，但用户价值有限
4. 🚀 **业务发展需要功能创新** - 资源应投入新元素类型、导出系统等

**当前策略**: 基于现有架构进行1周精确优化，然后聚焦功能开发

---

## 📚 **文档用途说明**

本文档保留作为**技术参考和学习资料**:
- 🎓 **架构设计方法论参考**
- 📖 **企业级组件设计思路**  
- 🔍 **技术方案分析案例**
- ⚖️ **技术决策过程记录**

**注意**: 本文档中的设计方案**不再计划实施**，仅供未来技术决策时参考。

---

## 🎯 概述

基于优先级分析，P0级组件是整个架构的根基，必须优先且正确实现。让我深入分析这4个关键组件的设计细节。

**重要提醒**: 以下内容为架构设计参考，已决定暂停实施。

## 1. 🌐 EventBus - 系统神经网络 (评分: 14分)

### 核心设计理念
```typescript
/**
 * 设计目标：
 * 1. 高性能 - 支持高频事件而不影响性能
 * 2. 类型安全 - TypeScript泛型支持
 * 3. 命名空间 - 避免事件名冲突
 * 4. 内存安全 - 自动清理无效监听器
 */
interface EventBus {
  // 核心API
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: (payload: T) => void): () => void;
  off(event: string, handler: Function): void;
  once<T>(event: string, handler: (payload: T) => void): void;
  
  // 命名空间支持
  namespace(ns: string): EventBus;
  
  // 性能优化
  batch(events: Array<{event: string, payload: any}>): void;
  
  // 调试支持
  getEventStats(): EventStats;
}
```

### 详细实现策略

#### 1.1 高性能事件分发
```typescript
class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Function>>();
  private wildcardListeners = new Set<WildcardHandler>();
  private eventStats = new Map<string, number>();
  
  emit<T>(event: string, payload: T): void {
    // 🎯 性能优化：避免数组创建，直接迭代Set
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as any)(payload);
        } catch (error) {
          console.error(`EventBus: Handler error for ${event}:`, error);
          // 🛡️ 错误隔离：单个处理器错误不影响其他处理器
        }
      }
    }
    
    // 通配符处理
    this.processWildcardHandlers(event, payload);
    
    // 统计收集（开发模式）
    if (import.meta.env.DEV) {
      this.eventStats.set(event, (this.eventStats.get(event) || 0) + 1);
    }
  }
  
  on<T>(event: string, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler);
    
    // 🎯 返回取消函数，避免内存泄漏
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }
}
```

#### 1.2 命名空间实现
```typescript
class NamespacedEventBus implements EventBus {
  constructor(
    private parent: EventBus,
    private namespace: string
  ) {}
  
  emit<T>(event: string, payload: T): void {
    const namespacedEvent = `${this.namespace}:${event}`;
    this.parent.emit(namespacedEvent, payload);
  }
  
  on<T>(event: string, handler: (payload: T) => void): () => void {
    const namespacedEvent = `${this.namespace}:${event}`;
    return this.parent.on(namespacedEvent, handler);
  }
  
  namespace(ns: string): EventBus {
    return new NamespacedEventBus(this.parent, `${this.namespace}:${ns}`);
  }
}
```

#### 1.3 批量事件优化
```typescript
class BatchEventBus {
  private batchQueue: Array<{event: string, payload: any}> = [];
  private isBatching = false;
  
  batch(events: Array<{event: string, payload: any}>): void {
    // 🎯 批量处理，减少DOM更新
    this.isBatching = true;
    
    for (const {event, payload} of events) {
      this.emit(event, payload);
    }
    
    this.isBatching = false;
    this.flushBatch();
  }
  
  private flushBatch(): void {
    // 触发批量更新完成事件
    this.emit('batch:complete', { count: this.batchQueue.length });
    this.batchQueue = [];
  }
}
```

### 与现有代码对接
```typescript
// 现有AppContext的事件迁移
class EventBusMigration {
  migrateFromAppContext(appContext: AppContextType): void {
    // 将现有的状态变化转换为事件
    
    // 元素更新事件
    const originalUpdateElement = appContext.updateElement;
    appContext.updateElement = async (id: string, updates: Record<string, any>) => {
      const result = await originalUpdateElement(id, updates);
      this.eventBus.emit('element:updated', { elementId: id, updates });
      return result;
    };
    
    // 选中变化事件
    const originalSelectElement = appContext.selectElement;
    appContext.selectElement = async (id: string) => {
      const prevSelected = [...appContext.state.selected_ids];
      const result = await originalSelectElement(id);
      const newSelected = [...appContext.state.selected_ids];
      
      this.eventBus.emit('selection:changed', {
        previous: prevSelected,
        current: newSelected,
        added: newSelected.filter(id => !prevSelected.includes(id)),
        removed: prevSelected.filter(id => !newSelected.includes(id))
      });
      
      return result;
    };
  }
}
```

## 2. 🗄️ StateEngine - 状态管理基础 (评分: 16分)

### 核心设计理念
```typescript
/**
 * 设计目标：
 * 1. 响应式 - 自动追踪依赖和更新
 * 2. 性能优化 - 批量更新和脏检查
 * 3. 调试友好 - 状态变化跟踪
 * 4. 类型安全 - 强类型路径访问
 */
interface StateEngine {
  // 核心状态访问
  get<T>(path: string): T;
  set<T>(path: string, value: T): void;
  
  // 响应式订阅
  subscribe(path: string, callback: (value: any) => void): () => void;
  
  // 批量更新
  batch(updates: () => void): void;
  transaction(updates: Record<string, any>): void;
  
  // 历史管理
  checkpoint(name: string): void;
  undo(): boolean;
  redo(): boolean;
  
  // 调试支持
  getState(): any;
  getSubscriptions(): string[];
}
```

### 详细实现策略

#### 2.1 基于Solid.js的实现
```typescript
class SolidStateEngine implements StateEngine {
  private store: any;
  private setStore: (updates: any) => void;
  private subscriptions = new Map<string, Set<Function>>();
  private history: StateSnapshot[] = [];
  private historyIndex = -1;
  
  constructor(initialState: any) {
    const [store, setStore] = createStore(initialState);
    this.store = store;
    this.setStore = setStore;
    
    // 创建初始快照
    this.checkpoint('initial');
  }
  
  get<T>(path: string): T {
    // 🎯 路径解析：支持 'elements.0.position.x' 这样的路径
    return this.resolvePath(this.store, path);
  }
  
  set<T>(path: string, value: T): void {
    const pathParts = path.split('.');
    
    // 🎯 使用Solid的produce API确保响应式更新
    this.setStore(
      produce((draft: any) => {
        this.setNestedValue(draft, pathParts, value);
      })
    );
    
    // 通知订阅者
    this.notifySubscribers(path, value);
  }
  
  subscribe(path: string, callback: (value: any) => void): () => void {
    if (!this.subscriptions.has(path)) {
      this.subscriptions.set(path, new Set());
    }
    
    this.subscriptions.get(path)!.add(callback);
    
    // 🎯 立即调用，提供当前值
    callback(this.get(path));
    
    return () => {
      const subs = this.subscriptions.get(path);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(path);
        }
      }
    };
  }
  
  private resolvePath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
  
  private setNestedValue(obj: any, pathParts: string[], value: any): void {
    const lastKey = pathParts.pop()!;
    const target = pathParts.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }
}
```

#### 2.2 批量更新优化
```typescript
class BatchedStateEngine extends SolidStateEngine {
  private batchDepth = 0;
  private pendingUpdates = new Map<string, any>();
  
  batch(updates: () => void): void {
    this.batchDepth++;
    
    try {
      updates();
    } finally {
      this.batchDepth--;
      
      if (this.batchDepth === 0) {
        this.flushBatch();
      }
    }
  }
  
  set<T>(path: string, value: T): void {
    if (this.batchDepth > 0) {
      // 🎯 批量模式：收集更新
      this.pendingUpdates.set(path, value);
    } else {
      // 立即更新
      super.set(path, value);
    }
  }
  
  private flushBatch(): void {
    if (this.pendingUpdates.size === 0) return;
    
    // 🎯 单次Solid更新，包含所有变化
    const updates = Object.fromEntries(this.pendingUpdates);
    
    this.setStore(
      produce((draft: any) => {
        for (const [path, value] of this.pendingUpdates) {
          const pathParts = path.split('.');
          this.setNestedValue(draft, pathParts, value);
        }
      })
    );
    
    // 批量通知订阅者
    for (const [path, value] of this.pendingUpdates) {
      this.notifySubscribers(path, value);
    }
    
    this.pendingUpdates.clear();
  }
}
```

#### 2.3 历史管理
```typescript
interface StateSnapshot {
  name: string;
  timestamp: number;
  state: any;
}

class HistoryStateEngine extends BatchedStateEngine {
  private history: StateSnapshot[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;
  
  checkpoint(name: string): void {
    // 🎯 创建状态快照
    const snapshot: StateSnapshot = {
      name,
      timestamp: Date.now(),
      state: structuredClone(this.getState()) // 深拷贝
    };
    
    // 清理未来的历史（如果从中间位置创建新快照）
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // 添加新快照
    this.history.push(snapshot);
    this.historyIndex = this.history.length - 1;
    
    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
      this.historyIndex = this.history.length - 1;
    }
  }
  
  undo(): boolean {
    if (this.historyIndex <= 0) return false;
    
    this.historyIndex--;
    const snapshot = this.history[this.historyIndex];
    
    // 🎯 批量恢复状态
    this.batch(() => {
      this.restoreFromSnapshot(snapshot);
    });
    
    return true;
  }
  
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    
    this.historyIndex++;
    const snapshot = this.history[this.historyIndex];
    
    this.batch(() => {
      this.restoreFromSnapshot(snapshot);
    });
    
    return true;
  }
  
  private restoreFromSnapshot(snapshot: StateSnapshot): void {
    // 重置整个状态
    this.setStore(reconcile(snapshot.state));
  }
}
```

## 3. 📦 ElementManager - 业务逻辑核心 (评分: 16分)

### 核心设计理念
```typescript
/**
 * 设计目标：
 * 1. 统一元素生命周期管理
 * 2. 事件驱动的架构集成
 * 3. 高性能的批量操作
 * 4. 扩展性良好的元素类型系统
 */
interface ElementManager {
  // 基础CRUD
  create(type: string, data: ElementData): Element;
  get(id: string): Element | null;
  update(id: string, updates: Partial<Element>): void;
  delete(id: string): void;
  
  // 批量操作
  createBatch(elements: Array<{type: string, data: ElementData}>): Element[];
  updateBatch(updates: Array<{id: string, updates: Partial<Element>}>): void;
  deleteBatch(ids: string[]): void;
  
  // 查询操作
  getAll(): Element[];
  getByType(type: string): Element[];
  getInBounds(bounds: BoundingBox): Element[];
  
  // 层次操作
  group(elementIds: string[]): GroupElement;
  ungroup(groupId: string): Element[];
  
  // 事件集成
  onElementCreated(callback: (element: Element) => void): () => void;
  onElementUpdated(callback: (element: Element, changes: any) => void): () => void;
  onElementDeleted(callback: (elementId: string) => void): () => void;
}
```

### 详细实现策略

#### 3.1 元素生命周期管理
```typescript
class ElementManagerImpl implements ElementManager {
  private elements = new Map<string, Element>();
  private elementsByType = new Map<string, Set<string>>();
  private elementFactories = new Map<string, ElementFactory>();
  private eventBus: EventBus;
  private stateEngine: StateEngine;
  private idGenerator = new IdGenerator();
  
  constructor(stateEngine: StateEngine, eventBus: EventBus) {
    this.stateEngine = stateEngine;
    this.eventBus = eventBus;
    
    // 🎯 注册默认元素工厂
    this.registerDefaultFactories();
    
    // 监听状态变化，保持内存缓存同步
    this.synchronizeWithState();
  }
  
  create(type: string, data: ElementData): Element {
    const factory = this.elementFactories.get(type);
    if (!factory) {
      throw new Error(`Unknown element type: ${type}`);
    }
    
    // 🎯 使用工厂创建元素
    const element = factory.create({
      id: this.idGenerator.generate(),
      type,
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // 更新内存缓存
    this.elements.set(element.id, element);
    this.addToTypeIndex(element);
    
    // 🎯 更新状态引擎
    const elements = this.stateEngine.get<Element[]>('elements') || [];
    this.stateEngine.set('elements', [...elements, element]);
    
    // 🎯 发送事件
    this.eventBus.emit('element:created', element);
    
    return element;
  }
  
  update(id: string, updates: Partial<Element>): void {
    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element not found: ${id}`);
    }
    
    // 🎯 创建更新后的元素
    const updatedElement: Element = {
      ...element,
      ...updates,
      updatedAt: Date.now()
    };
    
    // 类型变化处理
    if (updates.type && updates.type !== element.type) {
      this.removeFromTypeIndex(element);
      this.addToTypeIndex(updatedElement);
    }
    
    // 更新缓存
    this.elements.set(id, updatedElement);
    
    // 🎯 更新状态引擎
    const elements = this.stateEngine.get<Element[]>('elements') || [];
    const index = elements.findIndex(el => el.id === id);
    if (index !== -1) {
      elements[index] = updatedElement;
      this.stateEngine.set('elements', [...elements]);
    }
    
    // 🎯 发送事件，包含变化信息
    this.eventBus.emit('element:updated', {
      element: updatedElement,
      previous: element,
      changes: updates
    });
  }
  
  delete(id: string): void {
    const element = this.elements.get(id);
    if (!element) return;
    
    // 清理缓存
    this.elements.delete(id);
    this.removeFromTypeIndex(element);
    
    // 🎯 从状态引擎移除
    const elements = this.stateEngine.get<Element[]>('elements') || [];
    const filtered = elements.filter(el => el.id !== id);
    this.stateEngine.set('elements', filtered);
    
    // 🎯 发送事件
    this.eventBus.emit('element:deleted', { elementId: id, element });
  }
  
  private addToTypeIndex(element: Element): void {
    if (!this.elementsByType.has(element.type)) {
      this.elementsByType.set(element.type, new Set());
    }
    this.elementsByType.get(element.type)!.add(element.id);
  }
  
  private removeFromTypeIndex(element: Element): void {
    const typeSet = this.elementsByType.get(element.type);
    if (typeSet) {
      typeSet.delete(element.id);
      if (typeSet.size === 0) {
        this.elementsByType.delete(element.type);
      }
    }
  }
}
```

#### 3.2 批量操作优化
```typescript
class BatchOptimizedElementManager extends ElementManagerImpl {
  
  updateBatch(updates: Array<{id: string, updates: Partial<Element>}>): void {
    // 🎯 批量更新，减少状态引擎调用
    this.stateEngine.batch(() => {
      const elements = this.stateEngine.get<Element[]>('elements') || [];
      const updatedElements = [...elements];
      const eventPayloads: any[] = [];
      
      for (const {id, updates: elementUpdates} of updates) {
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1) {
          const previous = elements[index];
          const updated = {
            ...previous,
            ...elementUpdates,
            updatedAt: Date.now()
          };
          
          updatedElements[index] = updated;
          this.elements.set(id, updated);
          
          eventPayloads.push({
            element: updated,
            previous,
            changes: elementUpdates
          });
        }
      }
      
      this.stateEngine.set('elements', updatedElements);
    });
    
    // 🎯 批量发送事件
    this.eventBus.batch(
      eventPayloads.map(payload => ({
        event: 'element:updated',
        payload
      }))
    );
  }
  
  createBatch(elementSpecs: Array<{type: string, data: ElementData}>): Element[] {
    const newElements: Element[] = [];
    
    this.stateEngine.batch(() => {
      const existingElements = this.stateEngine.get<Element[]>('elements') || [];
      
      for (const {type, data} of elementSpecs) {
        const factory = this.elementFactories.get(type);
        if (!factory) continue;
        
        const element = factory.create({
          id: this.idGenerator.generate(),
          type,
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        newElements.push(element);
        this.elements.set(element.id, element);
        this.addToTypeIndex(element);
      }
      
      this.stateEngine.set('elements', [...existingElements, ...newElements]);
    });
    
    // 批量创建事件
    this.eventBus.batch(
      newElements.map(element => ({
        event: 'element:created',
        payload: element
      }))
    );
    
    return newElements;
  }
}
```

#### 3.3 与现有代码对接
```typescript
class ElementManagerMigration {
  static migrateFromAppContext(
    appContext: AppContextType,
    elementManager: ElementManager
  ): void {
    // 🎯 将现有AppContext方法桥接到ElementManager
    
    const originalCreateElement = appContext.createElement;
    appContext.createElement = async (
      type: string,
      position: {x: number, y: number},
      size: {width: number, height: number},
      data?: any
    ): Promise<string> => {
      const element = elementManager.create(type, {
        position,
        size,
        content: data || {},
        visible: true
      });
      
      return element.id;
    };
    
    const originalUpdateElement = appContext.updateElement;
    appContext.updateElement = async (
      id: string,
      updates: Record<string, any>
    ): Promise<void> => {
      elementManager.update(id, updates);
    };
    
    const originalDeleteElement = appContext.deleteElement;
    appContext.deleteElement = async (id: string): Promise<void> => {
      elementManager.delete(id);
    };
  }
}
```

## 4. 🎨 RenderEngine - 视觉输出基础 (评分: 16分)

### 核心设计理念
```typescript
/**
 * 设计目标：
 * 1. 高性能分层渲染
 * 2. 灵活的渲染后端切换 (SVG/Canvas)
 * 3. 智能的渲染调度
 * 4. 清晰的渲染生命周期
 */
interface RenderEngine {
  // 层管理
  createLayer(id: string, zIndex: number): RenderLayer;
  getLayer(id: string): RenderLayer | null;
  removeLayer(id: string): void;
  setLayerOrder(layerIds: string[]): void;
  
  // 渲染控制
  render(): void;
  scheduleRender(): void;
  cancelRender(): void;
  
  // 渲染配置
  setRenderMode(mode: 'design' | 'preview' | 'print'): void;
  setViewport(viewport: Viewport): void;
  
  // 导出功能
  exportSVG(): string;
  exportDataURL(format: 'png' | 'jpg', scale?: number): string;
  
  // 性能监控
  getRenderStats(): RenderStats;
}
```

### 详细实现策略

#### 4.1 SVG渲染引擎实现
```typescript
class SVGRenderEngine implements RenderEngine {
  private layers = new Map<string, SVGRenderLayer>();
  private container: SVGElement;
  private renderScheduled = false;
  private renderMode: 'design' | 'preview' | 'print' = 'design';
  private viewport: Viewport = { x: 0, y: 0, width: 800, height: 600, zoom: 1 };
  
  constructor(container: SVGElement) {
    this.container = container;
    this.initializeContainer();
  }
  
  createLayer(id: string, zIndex: number): RenderLayer {
    const layer = new SVGRenderLayer(id, zIndex);
    this.layers.set(id, layer);
    
    // 🎯 按z-index插入到正确位置
    this.insertLayerInOrder(layer);
    
    return layer;
  }
  
  render(): void {
    // 🎯 性能优化：跳过不必要的渲染
    if (!this.hasChanges()) {
      return;
    }
    
    const startTime = performance.now();
    
    // 按z-index顺序渲染所有层
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
    
    for (const layer of sortedLayers) {
      if (layer.visible && layer.isDirty()) {
        layer.render();
        layer.markClean();
      }
    }
    
    // 应用视口变换
    this.applyViewportTransform();
    
    const renderTime = performance.now() - startTime;
    this.updateRenderStats(renderTime);
    
    this.renderScheduled = false;
  }
  
  scheduleRender(): void {
    if (this.renderScheduled) return;
    
    this.renderScheduled = true;
    
    // 🎯 使用requestAnimationFrame优化性能
    requestAnimationFrame(() => {
      this.render();
    });
  }
  
  private applyViewportTransform(): void {
    const { x, y, zoom } = this.viewport;
    const transform = `translate(${-x * zoom}, ${-y * zoom}) scale(${zoom})`;
    
    // 应用到容器的视图变换组
    const viewGroup = this.container.querySelector('.viewport-transform') as SVGGElement;
    if (viewGroup) {
      viewGroup.setAttribute('transform', transform);
    }
  }
  
  private insertLayerInOrder(layer: SVGRenderLayer): void {
    const layerElement = layer.getElement();
    const existingLayers = Array.from(this.container.children) as SVGGElement[];
    
    // 找到正确的插入位置
    let insertIndex = existingLayers.length;
    for (let i = 0; i < existingLayers.length; i++) {
      const existingLayer = existingLayers[i];
      const existingZIndex = parseInt(existingLayer.dataset.zIndex || '0');
      
      if (layer.zIndex < existingZIndex) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex < existingLayers.length) {
      this.container.insertBefore(layerElement, existingLayers[insertIndex]);
    } else {
      this.container.appendChild(layerElement);
    }
  }
}
```

#### 4.2 渲染层实现
```typescript
class SVGRenderLayer implements RenderLayer {
  private elements = new Map<string, RenderableElement>();
  private layerElement: SVGGElement;
  private dirty = true;
  
  constructor(
    public readonly id: string,
    public zIndex: number,
    public visible: boolean = true
  ) {
    this.layerElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.layerElement.setAttribute('data-layer-id', id);
    this.layerElement.setAttribute('data-z-index', zIndex.toString());
    this.layerElement.classList.add('render-layer');
  }
  
  addElement(element: RenderableElement): void {
    this.elements.set(element.id, element);
    this.markDirty();
  }
  
  removeElement(elementId: string): void {
    if (this.elements.delete(elementId)) {
      this.markDirty();
      
      // 从DOM中移除
      const domElement = this.layerElement.querySelector(`[data-element-id="${elementId}"]`);
      if (domElement) {
        domElement.remove();
      }
    }
  }
  
  updateElement(elementId: string, element: RenderableElement): void {
    if (this.elements.has(elementId)) {
      this.elements.set(elementId, element);
      this.markDirty();
    }
  }
  
  render(): void {
    // 🎯 增量渲染：只更新变化的元素
    this.performIncrementalRender();
  }
  
  private performIncrementalRender(): void {
    const existingElements = new Set<string>();
    
    // 收集现有DOM元素
    const domElements = this.layerElement.querySelectorAll('[data-element-id]');
    for (const domElement of domElements) {
      const elementId = domElement.getAttribute('data-element-id');
      if (elementId && this.elements.has(elementId)) {
        existingElements.add(elementId);
      } else if (domElement.parentNode) {
        // 移除不再存在的元素
        domElement.parentNode.removeChild(domElement);
      }
    }
    
    // 渲染新增和更新的元素
    for (const [elementId, element] of this.elements) {
      const existingDomElement = this.layerElement.querySelector(`[data-element-id="${elementId}"]`);
      
      if (existingDomElement) {
        // 更新现有元素
        const newElement = element.render();
        existingDomElement.replaceWith(newElement);
      } else {
        // 添加新元素
        const newElement = element.render();
        this.layerElement.appendChild(newElement);
      }
    }
  }
  
  isDirty(): boolean {
    return this.dirty;
  }
  
  markDirty(): void {
    this.dirty = true;
  }
  
  markClean(): void {
    this.dirty = false;
  }
  
  getElement(): SVGGElement {
    return this.layerElement;
  }
}
```

### 与现有代码对接
```typescript
class RenderEngineMigration {
  static migrateFromCurrentRendering(
    currentCanvasRef: HTMLElement,
    renderEngine: RenderEngine
  ): void {
    // 🎯 将现有的ElementRenderer渲染逻辑迁移
    
    // 创建标准渲染层
    const contentLayer = renderEngine.createLayer('content', 100);
    const selectionLayer = renderEngine.createLayer('selection', 200);
    
    // 监听元素变化，更新渲染
    const eventBus = new EventBusImpl();
    
    eventBus.on('element:created', (element: Element) => {
      const renderable = createRenderableElement(element);
      contentLayer.addElement(renderable);
      renderEngine.scheduleRender();
    });
    
    eventBus.on('element:updated', (event: any) => {
      const renderable = createRenderableElement(event.element);
      contentLayer.updateElement(event.element.id, renderable);
      renderEngine.scheduleRender();
    });
    
    eventBus.on('element:deleted', (event: any) => {
      contentLayer.removeElement(event.elementId);
      renderEngine.scheduleRender();
    });
  }
}

function createRenderableElement(element: Element): RenderableElement {
  return {
    id: element.id,
    type: element.type,
    bounds: element.bounds || { x: 0, y: 0, width: 0, height: 0 },
    
    render(): SVGElement {
      // 🎯 使用现有的ElementRenderer逻辑
      // 但抽离为纯函数，不依赖组件状态
      return renderElementToSVG(element);
    },
    
    hitTest(point: Point): boolean {
      return isPointInBounds(point, this.bounds);
    }
  };
}
```

## 🎯 总结和下一步

### P0组件设计特点总结：

1. **EventBus**: 高性能、类型安全、命名空间支持
2. **StateEngine**: 响应式、批量优化、历史管理
3. **ElementManager**: 事件驱动、批量操作、工厂模式
4. **RenderEngine**: 分层渲染、增量更新、性能优化

### 实施优先级：
1. **EventBus + StateEngine** - 系统基础，并行开发
2. **ElementManager** - 业务核心，依赖前两者
3. **RenderEngine** - 视觉基础，可与ElementManager并行

### 关键成功因素：
- 严格按照接口设计实现，避免临时修改
- 充分的单元测试覆盖
- 渐进式迁移，保持现有功能可用
- 性能基准测试，确保不降低性能

现在我们已经有了P0组件的详细设计，你希望我们接下来讨论什么？是开始具体的实施计划，还是深入某个特定组件的实现细节？