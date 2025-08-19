# 🎯 交互系统集成指南

## 概述

新的交互系统彻底解决了原有的鼠标光标冲突和事件混乱问题，提供了统一的、专业级的交互体验。

## 🚀 快速开始

### 1. 基本集成

```typescript
import { InteractionLayer, SelectionIndicator } from '../interaction';
import type { InteractionMode } from '../interaction/types';

function MyCanvas() {
  const [elements, setElements] = createSignal<ReportElement[]>([]);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [mode, setMode] = createSignal<InteractionMode>(InteractionMode.IDLE);
  
  let canvasRef: HTMLDivElement;

  return (
    <div ref={canvasRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 你的元素渲染 */}
      {elements().map(element => <ElementRenderer element={element} />)}
      
      {/* 选择指示器 */}
      <SelectionIndicator 
        selectedElements={getSelectedElements()}
        showResizeHandles={mode() === InteractionMode.SELECTED}
      />
      
      {/* 交互层 - 这是核心！ */}
      <InteractionLayer
        canvasRef={canvasRef}
        getAllElements={() => elements()}
        onElementsSelect={setSelectedIds}
        onElementMove={handleElementMove}
        onElementResize={handleElementResize}
        onModeChange={setMode}
        enableDebugMode={import.meta.env.DEV}
      />
    </div>
  );
}
```

### 2. 移除旧的事件处理

**❌ 删除这些旧代码:**
```typescript
// 删除所有直接的鼠标事件处理
onMouseDown={handleMouseDown}
onMouseMove={handleMouseMove}
onMouseUp={handleMouseUp}

// 删除ResizeHandles组件的直接使用
<ResizeHandles element={element} onResize={...} />

// 删除任何直接的cursor设置
element.style.cursor = '...'
```

**✅ 现在都由InteractionLayer统一管理!**

## 🎯 核心概念

### 交互模式 (InteractionMode)

系统定义了6种清晰的交互模式:

```typescript
enum InteractionMode {
  IDLE = 'idle',           // 空闲状态
  HOVER_ELEMENT = 'hover_element',  // 悬停在元素上
  SELECTED = 'selected',    // 已选中元素
  DRAGGING = 'dragging',    // 正在拖拽
  RESIZING = 'resizing',    // 正在调整大小
  BOX_SELECTING = 'box_selecting'  // 正在框选
}
```

### 优先级碰撞检测

系统按以下优先级顺序检测鼠标事件:

1. **Resize控制点** (优先级1) - 最高优先级
2. **拖拽区域** (优先级2) - 元素中心区域
3. **元素边界** (优先级3) - 元素可点击区域  
4. **画布背景** (优先级4) - 默认区域

### 光标管理

光标管理采用优先级堆栈系统:

```typescript
// 高优先级操作光标
cursorManager.setCursorWithPriority('grabbing', 8, 'dragging');

// 普通光标
cursorManager.setCursor('pointer');

// 锁定光标(操作期间)
cursorManager.lockCursor('grabbing');
```

## 🔧 详细配置

### InteractionLayer配置

```typescript
<InteractionLayer
  // 必需属性
  canvasRef={canvasElement}           // 画布DOM引用
  getAllElements={() => elements}     // 获取所有元素的函数
  
  // 事件回调
  onElementsSelect={(ids) => {...}}   // 选择变化
  onElementMove={(id, pos) => {...}}  // 元素移动
  onElementResize={(id, bounds) => {...}}  // 元素调整大小
  onCanvasClick={(point) => {...}}    // 点击画布
  onModeChange={(mode) => {...}}      // 模式变化
  
  // 功能开关
  enableDebugMode={false}             // 调试模式
  enableBoxSelection={true}           // 框选功能
  enableMultiSelect={true}            // 多选功能
  enableResize={true}                 // 调整大小功能
  
  // 样式
  class="custom-interaction-layer"    // 自定义样式类
/>
```

### SelectionIndicator配置

```typescript
<SelectionIndicator
  selectedElements={selectedElements}  // 选中的元素
  showResizeHandles={true}           // 显示resize控制点
  borderColor="#007acc"              // 边框颜色
  borderWidth={2}                    // 边框宽度
  handleSize={8}                     // 控制点大小
  handleColor="#007acc"              // 控制点颜色
  onHandleMouseDown={handleResize}   // 控制点鼠标按下
/>
```

## 📝 迁移清单

### Step 1: 安装交互层
- [ ] 在Canvas组件中添加`<InteractionLayer>`
- [ ] 设置正确的`canvasRef`引用
- [ ] 配置所需的事件回调函数

### Step 2: 移除旧代码  
- [ ] 删除所有直接的鼠标事件处理器
- [ ] 删除`ResizeHandles`组件的直接使用
- [ ] 删除任何手动的cursor设置代码
- [ ] 删除旧的选择状态管理逻辑

### Step 3: 更新状态管理
- [ ] 使用InteractionMode枚举替代自定义状态
- [ ] 通过回调函数更新元素数据
- [ ] 使用统一的选择状态管理

### Step 4: 测试验证
- [ ] 测试单元素选择和拖拽
- [ ] 测试多元素框选
- [ ] 测试resize功能
- [ ] 测试键盘快捷键
- [ ] 验证光标不再闪烁

## 🐛 故障排除

### 问题: 光标仍然闪烁
**解决方案:** 确保没有其他组件设置cursor样式，让CursorManager统一管理

### 问题: 事件不响应
**解决方案:** 检查InteractionLayer的z-index和pointer-events设置

### 问题: 选择不正确
**解决方案:** 确保`getAllElements()`返回最新的元素数据

### 问题: Resize不工作  
**解决方案:** 检查`enableResize`配置和`onElementResize`回调

## 🎨 自定义样式

```css
/* 自定义选择指示器 */
.selection-indicator {
  /* 自定义选择边框样式 */
}

.resize-handle {
  /* 自定义resize控制点样式 */  
}

.box-selection-indicator {
  /* 自定义框选矩形样式 */
}

.interaction-layer {
  /* 自定义交互层样式 */
}
```

## 🚀 高级功能

### 自定义光标

```typescript
const cursorManager = new CursorManager({
  customCursors: {
    'my-custom': 'url(cursor.png), auto'
  }
});
```

### 调试模式

开启`enableDebugMode={true}`查看实时交互状态:

- 当前交互模式
- 鼠标位置和状态
- 碰撞检测结果
- 选择信息
- 性能数据

### 事件优先级

```typescript
// 高优先级事件处理
interactionManager.handleMouseDown(point, 0);

// 取消当前操作
interactionManager.handleKeyDown('Escape');
```

## 📊 性能优化

1. **碰撞检测缓存**: 16ms自动缓存避免重复计算
2. **事件节流**: 内置节流机制避免过度更新
3. **优先级剪枝**: 高优先级匹配后立即返回
4. **内存清理**: 自动清理过期缓存和事件监听器

## 🎉 完成!

现在你有了一个专业级的交互系统，完全消除了光标冲突和事件混乱问题。享受丝滑的用户体验吧! ✨