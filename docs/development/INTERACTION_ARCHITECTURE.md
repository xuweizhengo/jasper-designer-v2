# 🏗️ 交互系统架构文档

## 🎯 设计目标

### 解决的核心问题
1. **鼠标光标冲突** - ResizeHandles和ElementRenderer争夺光标控制
2. **事件系统混乱** - 多个组件独立处理鼠标事件
3. **状态管理分散** - 交互状态散布在不同组件中
4. **用户体验问题** - 光标闪烁、操作不一致

### 设计原则
- **单一职责**: 每个模块只负责特定功能
- **优先级驱动**: 基于优先级的冲突解决机制
- **状态集中**: 统一的交互状态管理
- **分层架构**: 清晰的系统分层

## 🏢 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    交互系统架构                                │
├─────────────────────────────────────────────────────────────┤
│  🎨 展示层 (Presentation Layer)                             │
│  ├─ InteractionLayer.tsx        (事件捕获和分发)             │
│  ├─ SelectionIndicator.tsx      (选择可视化)               │
│  ├─ BoxSelectionIndicator.tsx   (框选指示器)               │
│  └─ DebugOverlay.tsx           (调试界面)                   │
├─────────────────────────────────────────────────────────────┤
│  🧠 管理层 (Management Layer)                              │
│  ├─ InteractionManager.tsx      (核心交互管理)             │
│  ├─ SelectionManager.tsx        (选择状态管理)             │
│  └─ CursorManager.tsx          (光标优先级管理)             │
├─────────────────────────────────────────────────────────────┤
│  🔧 引擎层 (Engine Layer)                                  │
│  └─ HitTestEngine.tsx          (碰撞检测引擎)               │
├─────────────────────────────────────────────────────────────┤
│  🛠️ 工具层 (Utility Layer)                                │
│  ├─ GeometryUtils.ts           (几何计算)                  │
│  ├─ BoundsCalculator.ts        (边界计算)                  │
│  └─ HitTestUtils.ts           (碰撞检测工具)               │
├─────────────────────────────────────────────────────────────┤
│  📋 类型层 (Type Layer)                                    │
│  ├─ geometry-types.ts          (几何类型定义)              │
│  ├─ interaction-types.ts       (交互类型定义)              │
│  └─ state-types.ts            (状态类型定义)               │
└─────────────────────────────────────────────────────────────┘
```

## 🎛️ 核心模块详解

### 1. InteractionManager - 交互管理器

**职责**: 统一管理所有交互状态和操作模式

**核心功能**:
- 交互模式状态机 (IDLE → SELECTED → DRAGGING → ...)
- 鼠标事件统一分发
- 键盘快捷键处理
- 操作生命周期管理

**状态转换图**:
```
     IDLE ←──────────┐
       │             │
       ↓             │
  HOVER_ELEMENT      │
       │             │
       ↓             │
   SELECTED ←────────┤
    │    │           │
    ↓    ↓           │
DRAGGING RESIZING    │
    │    │           │
    └────┴───────────┘
       │
   BOX_SELECTING
       │
       └─────────────────→
```

### 2. HitTestEngine - 碰撞检测引擎

**职责**: 优先级驱动的鼠标碰撞检测

**检测优先级**:
```
1. Resize Controls (优先级 1) ── 最高优先级
   └─ 8个resize控制点的hitArea检测

2. Drag Zones (优先级 2) ──── 中等优先级  
   └─ 元素内部但避开resize区域

3. Elements (优先级 3) ────── 低优先级
   └─ 元素边界检测

4. Canvas Background (优先级 4) ── 默认
   └─ 背景区域
```

**性能优化**:
- 16ms缓存机制避免重复计算
- 早期剪枝 - 高优先级匹配后立即返回
- 空间索引 - 快速排除不可能的候选项

### 3. SelectionManager - 选择管理器

**职责**: 管理元素选择状态和多选逻辑

**选择模式**:
- **单选**: 直接替换当前选择
- **多选**: Ctrl+点击添加/移除
- **范围选择**: Shift+点击范围选择
- **框选**: 拖拽选择矩形内元素

**状态追踪**:
- `selectedIds` - 选中元素ID集合
- `primaryId` - 主选择元素(最后选中的)
- `lastSelectedId` - 用于范围选择的锚点

### 4. CursorManager - 光标管理器

**职责**: 解决光标冲突，提供优先级驱动的光标管理

**光标优先级表**:
```typescript
const PRIORITIES = {
  'not-allowed': 10,  // 禁止操作
  'wait': 9,          // 等待状态
  'grabbing': 8,      // 拖拽中
  '*-resize': 7,      // 调整大小
  'grab': 6,          // 可拖拽
  'crosshair': 5,     // 框选
  'pointer': 2,       // 可点击
  'default': 1        // 默认
}
```

**堆栈机制**:
- 每个光标设置包含：类型、优先级、来源
- 自动按优先级排序
- 移除特定来源的光标设置
- 锁定机制防止意外覆盖

## 🔄 数据流架构

```
用户操作 → InteractionLayer → InteractionManager
    ↓               ↓
  事件分发      HitTestEngine ←─┐
    ↓               ↓           │
状态更新       碰撞检测结果      │
    ↓               ↓           │
SelectionManager  CursorManager │
    ↓               ↓           │
  选择变化        光标更新       │
    ↓               ↓           │
   回调           DOM更新       │
    ↓                           │
业务逻辑更新 ──────────────────┘
```

## 🎨 组件集成策略

### 原有架构 (有冲突)
```
Canvas
├── ElementRenderer (独立事件处理)
│   ├── onMouseDown ❌
│   ├── onMouseMove ❌  
│   └── cursor设置 ❌
└── ResizeHandles (独立事件处理)
    ├── onMouseDown ❌
    ├── onMouseMove ❌
    └── cursor设置 ❌
```

### 新架构 (统一管理)
```
Canvas
├── ElementRenderer (仅渲染)
├── SelectionIndicator (视觉指示)
└── InteractionLayer (统一事件处理) ✅
    ├── 事件捕获 ✅
    ├── 状态管理 ✅
    └── 光标控制 ✅
```

## 🔍 碰撞检测算法

### 算法流程
```typescript
function performHitTest(point: Point): HitTestResult {
  // 1. 检查缓存
  const cached = getCache(point);
  if (cached && !expired(cached)) return cached.result;
  
  // 2. 优先级检测
  if (hasSelectedElements()) {
    // 2.1 Resize handles (最高优先级)
    const handleHit = testResizeHandles(point);
    if (handleHit) return cacheAndReturn(handleHit);
    
    // 2.2 Drag zones (中等优先级)
    const dragHit = testDragZones(point);  
    if (dragHit) return cacheAndReturn(dragHit);
  }
  
  // 2.3 Elements (低优先级)
  const elementHit = testElements(point);
  if (elementHit) return cacheAndReturn(elementHit);
  
  // 2.4 Canvas background (默认)
  return cacheAndReturn({ type: 'canvas' });
}
```

### Resize Handle检测
```typescript
// 为每个选中元素计算8个控制点
const handles = calculateResizeHandles(bounds);
const ordered = ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'];

for (const direction of ordered) {
  const handle = handles[direction];
  if (pointInRect(point, handle.hitArea)) {
    return {
      type: 'resize-handle',
      direction,
      cursor: handle.cursor,
      priority: 1
    };
  }
}
```

## 🚀 性能优化策略

### 1. 碰撞检测优化
- **缓存机制**: 16ms内重复查询直接返回缓存
- **空间分割**: 大量元素时使用空间索引
- **早期剪枝**: 优先级匹配后立即返回
- **边界预计算**: resize handle位置预计算并缓存

### 2. 事件处理优化  
- **事件节流**: mousemove事件限制在60fps
- **批量更新**: 状态变化批量提交
- **避免重排**: 使用transform而非layout属性

### 3. 内存管理
- **自动清理**: 过期缓存自动清理
- **弱引用**: DOM元素使用WeakMap存储
- **事件解绑**: 组件卸载时清理监听器

## 🔒 类型安全

### 核心类型定义
```typescript
// 几何类型
interface Point { x: number; y: number; }
interface Rectangle { x: number; y: number; width: number; height: number; }

// 交互状态
enum InteractionMode {
  IDLE, HOVER_ELEMENT, SELECTED, 
  DRAGGING, RESIZING, BOX_SELECTING
}

// 碰撞检测结果
interface HitTestResult {
  type: 'canvas' | 'element' | 'resize-handle' | 'drag-zone';
  priority: number;
  cursor: string;
  elementId?: string;
  direction?: HandleDirection;
  data?: any;
}
```

### 类型守卫
```typescript
function isResizeHandle(hit: HitTestResult): hit is ResizeHandleHit {
  return hit.type === 'resize-handle' && hit.direction != null;
}

function isDragZone(hit: HitTestResult): hit is DragZoneHit {
  return hit.type === 'drag-zone';
}
```

## 🧪 测试策略

### 单元测试
- GeometryUtils几何计算函数
- BoundsCalculator边界计算
- HitTestUtils碰撞检测逻辑
- SelectionManager选择状态管理

### 集成测试  
- InteractionManager状态转换
- HitTestEngine优先级检测
- CursorManager光标管理

### E2E测试
- 拖拽操作流程
- 多选和框选
- 键盘快捷键
- 光标状态验证

## 📊 监控和调试

### 调试模式
```typescript
<InteractionLayer enableDebugMode={true} />
```

显示信息:
- 当前交互模式
- 鼠标位置和状态  
- 碰撞检测结果
- 选择状态
- 光标堆栈
- 性能指标

### 性能监控
- 碰撞检测耗时
- 缓存命中率
- 事件处理频率
- 内存使用情况

## 🔮 未来扩展

### 计划中的功能
1. **触摸设备支持** - 适配移动端交互
2. **键盘导航** - 无鼠标操作支持
3. **撤销重做** - 操作历史管理
4. **吸附对齐** - 智能吸附系统
5. **协作冲突** - 多用户协作处理

### 扩展点
- 自定义交互模式
- 插件化碰撞检测
- 可配置的快捷键
- 主题化光标样式

---

这个架构提供了一个可扩展、高性能、类型安全的交互系统，彻底解决了原有的事件冲突和光标闪烁问题。🎉