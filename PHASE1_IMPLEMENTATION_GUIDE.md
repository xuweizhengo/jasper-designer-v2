# 🎯 交互层重构 - 文件结构和实施清单

## 📁 新增文件结构

```
src/
├── interaction/                  # 新增交互系统目录
│   ├── managers/                # 管理器
│   │   ├── InteractionManager.tsx
│   │   ├── SelectionManager.tsx
│   │   ├── CursorManager.tsx
│   │   └── index.ts
│   ├── engines/                 # 引擎
│   │   ├── HitTestEngine.tsx
│   │   ├── GestureRecognizer.tsx
│   │   └── ActionDispatcher.tsx
│   ├── components/              # 交互组件
│   │   ├── InteractionLayer.tsx
│   │   ├── SelectionIndicator.tsx
│   │   ├── DragZone.tsx
│   │   ├── ResizeHandles.tsx
│   │   └── index.ts
│   ├── types/                   # 类型定义
│   │   ├── interaction-types.ts
│   │   ├── state-types.ts
│   │   ├── geometry-types.ts
│   │   └── index.ts
│   ├── utils/                   # 工具函数
│   │   ├── geometry-utils.ts
│   │   ├── bounds-calculator.ts
│   │   ├── hit-test-utils.ts
│   │   └── index.ts
│   └── index.ts                 # 统一导出
├── components/
│   └── Canvas/
│       ├── Canvas.tsx           # 重构
│       ├── ElementRenderLayer.tsx # 新增纯渲染层
│       ├── ElementRenderer.tsx  # 简化为纯渲染
│       └── SelectionRectLayer.tsx # 框选层
```

## 📋 Phase 1 详细任务清单 (Day 1)

### 🔧 1.1 核心类型定义 (2小时)

#### 创建: `src/interaction/types/geometry-types.ts`
```typescript
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

export interface Size {
  width: number;
  height: number;
}

export type HandleDirection = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';
```

#### 创建: `src/interaction/types/interaction-types.ts`
```typescript
export enum InteractionMode {
  IDLE = 'idle',
  HOVER_ELEMENT = 'hover_element',
  SELECTED = 'selected',
  DRAGGING = 'dragging',
  RESIZING = 'resizing',
  BOX_SELECTING = 'box_selecting'
}

export interface HitTestResult {
  type: 'resize-handle' | 'drag-zone' | 'element' | 'canvas';
  priority: number;
  cursor: string;
  direction?: HandleDirection;
  elementId?: string;
}

export interface InteractionContext {
  mode: InteractionMode;
  selectedElements: Set<string>;
  currentAction?: ActionContext;
  cursor: string;
  activeHandle?: HandleDirection;
}
```

#### 创建: `src/interaction/types/state-types.ts`
```typescript
export interface ActionContext {
  type: 'drag' | 'resize' | 'rotate';
  startPoint: Point;
  startTime: number;
  initialData: any;
}

export interface SelectionBounds {
  bounds: Rectangle;
  elements: string[];
  center: Point;
}
```

### 🛠️ 1.2 工具函数库 (2小时)

#### 创建: `src/interaction/utils/geometry-utils.ts`
```typescript
export class GeometryUtils {
  static pointInRect(point: Point, rect: Rectangle): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }

  static expandRect(rect: Rectangle, margin: number): Rectangle {
    return {
      x: rect.x - margin,
      y: rect.y - margin,
      width: rect.width + margin * 2,
      height: rect.height + margin * 2
    };
  }

  static rectCenter(rect: Rectangle): Point {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }
}
```

#### 创建: `src/interaction/utils/bounds-calculator.ts`
```typescript
export class BoundsCalculator {
  static calculateElementBounds(element: ReportElement): Rectangle {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };
  }

  static calculateSelectionBounds(elements: ReportElement[]): Rectangle {
    if (elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(element => {
      const bounds = this.calculateElementBounds(element);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}
```

### 🎯 1.3 碰撞检测引擎 (3小时)

#### 创建: `src/interaction/engines/HitTestEngine.tsx`
```typescript
import { Component } from 'solid-js';
import { GeometryUtils } from '../utils/geometry-utils';
import { HitTestResult, HandleDirection } from '../types';

export class HitTestEngine {
  private static readonly HANDLE_SIZE = 8;
  private static readonly HANDLE_HIT_SIZE = 16;
  private static readonly HANDLE_MARGIN = 12;

  constructor(
    private getSelectedElements: () => ReportElement[],
    private getAllElements: () => ReportElement[]
  ) {}

  performHitTest(point: Point): HitTestResult {
    const selectedElements = this.getSelectedElements();
    
    if (selectedElements.length > 0) {
      // 优先级1: 检测resize handles
      const handleResult = this.testResizeHandles(point, selectedElements);
      if (handleResult) return handleResult;
      
      // 优先级2: 检测drag zone
      const dragResult = this.testDragZone(point, selectedElements);
      if (dragResult) return dragResult;
    }
    
    // 优先级3: 检测元素
    const elementResult = this.testElements(point);
    if (elementResult) return elementResult;
    
    // 默认: canvas
    return {
      type: 'canvas',
      priority: 4,
      cursor: 'default'
    };
  }

  private testResizeHandles(point: Point, elements: ReportElement[]): HitTestResult | null {
    const bounds = BoundsCalculator.calculateSelectionBounds(elements);
    const handles = this.generateResizeHandles(bounds);
    
    for (const handle of handles) {
      if (GeometryUtils.pointInRect(point, handle.hitArea)) {
        return {
          type: 'resize-handle',
          direction: handle.direction,
          cursor: this.getResizeCursor(handle.direction),
          priority: 1
        };
      }
    }
    
    return null;
  }

  private testDragZone(point: Point, elements: ReportElement[]): HitTestResult | null {
    const bounds = BoundsCalculator.calculateSelectionBounds(elements);
    const dragZone = this.generateDragZone(bounds);
    
    if (GeometryUtils.pointInRect(point, dragZone)) {
      return {
        type: 'drag-zone',
        cursor: 'grab',
        priority: 2
      };
    }
    
    return null;
  }

  private generateResizeHandles(bounds: Rectangle) {
    const handles = [];
    const { HANDLE_HIT_SIZE } = HitTestEngine;
    const half = HANDLE_HIT_SIZE / 2;
    
    const positions = {
      nw: { x: bounds.x - half, y: bounds.y - half },
      n:  { x: bounds.x + bounds.width/2 - half, y: bounds.y - half },
      ne: { x: bounds.x + bounds.width - half, y: bounds.y - half },
      w:  { x: bounds.x - half, y: bounds.y + bounds.height/2 - half },
      e:  { x: bounds.x + bounds.width - half, y: bounds.y + bounds.height/2 - half },
      sw: { x: bounds.x - half, y: bounds.y + bounds.height - half },
      s:  { x: bounds.x + bounds.width/2 - half, y: bounds.y + bounds.height - half },
      se: { x: bounds.x + bounds.width - half, y: bounds.y + bounds.height - half }
    };
    
    Object.entries(positions).forEach(([direction, pos]) => {
      handles.push({
        direction: direction as HandleDirection,
        hitArea: {
          x: pos.x,
          y: pos.y,
          width: HANDLE_HIT_SIZE,
          height: HANDLE_HIT_SIZE
        }
      });
    });
    
    return handles;
  }
}
```

### 🎮 1.4 核心管理器 (3小时)

#### 创建: `src/interaction/managers/InteractionManager.tsx`
```typescript
import { createSignal, createEffect } from 'solid-js';
import { InteractionMode, InteractionContext, HitTestResult } from '../types';
import { HitTestEngine } from '../engines/HitTestEngine';
import { CursorManager } from './CursorManager';

export class InteractionManager {
  private hitTestEngine: HitTestEngine;
  private cursorManager = new CursorManager();
  
  // 响应式状态
  private [context, setContext] = createSignal<InteractionContext>({
    mode: InteractionMode.IDLE,
    selectedElements: new Set(),
    cursor: 'default'
  });

  constructor(
    private getSelectedElements: () => ReportElement[],
    private getAllElements: () => ReportElement[]
  ) {
    this.hitTestEngine = new HitTestEngine(
      this.getSelectedElements,
      this.getAllElements
    );
    
    this.setupEventListeners();
  }

  // 获取当前上下文
  getContext = () => this.context();
  
  // 状态转换
  transitionTo(newMode: InteractionMode, data?: any) {
    const currentContext = this.context();
    
    setContext({
      ...currentContext,
      mode: newMode,
      currentAction: data?.action,
      activeHandle: data?.handle
    });
    
    this.updateCursor();
  }

  // 处理鼠标移动
  handleMouseMove = (event: MouseEvent) => {
    const point = this.screenToCanvas(event);
    const hitResult = this.hitTestEngine.performHitTest(point);
    
    // 根据hit test结果更新光标
    this.cursorManager.setCursor(hitResult.cursor);
    
    // 处理当前动作
    this.processCurrentAction(event, hitResult);
  };

  // 处理鼠标按下
  handleMouseDown = (event: MouseEvent) => {
    const point = this.screenToCanvas(event);
    const hitResult = this.hitTestEngine.performHitTest(point);
    
    this.startAction(hitResult, event);
  };

  // 处理鼠标释放  
  handleMouseUp = (event: MouseEvent) => {
    this.endCurrentAction(event);
  };
}
```

## ✅ Phase 1 验收标准

完成Phase 1后应该达到：

1. **类型系统完整** - 所有交互相关类型定义清晰
2. **工具函数可用** - 几何计算和边界计算工具正常工作
3. **碰撞检测精确** - HitTestEngine能准确识别鼠标位置
4. **管理器架构清晰** - InteractionManager基础架构搭建完成

### 测试方法
```typescript
// 简单测试脚本
const testHitEngine = () => {
  const hitEngine = new HitTestEngine(getElements, getAllElements);
  const result = hitEngine.performHitTest({ x: 100, y: 100 });
  console.log('Hit test result:', result);
};
```

这样的详细方案够清晰吗？是否需要我继续制定Phase 2-4的详细实施计划？