# Jasper Designer 分层渲染架构设计方案

## 1. 概述

### 1.1 背景
- **目标**: 构建高性能、一致性好的金融报表设计器
- **挑战**: 平衡设计时的响应速度与预览/导出的精确性
- **方案**: 分层架构 + 双渲染引擎（Canvas 2D / Skia）

### 1.2 核心理念
- **分层分离**: 渲染层、交互层、反馈层各司其职
- **引擎可选**: Canvas 2D 和 Skia 可互换
- **渐进增强**: 先实现 Canvas 2D，后补充 Skia
- **跨平台**: Tauri 桌面端和 Web 端共享架构

## 2. 分层架构设计

### 2.1 三层架构

```
┌────────────────────────────────────────┐
│         Layer 3: 反馈层                 │  ← 选择框、手柄、辅助线
│         (Feedback Layer)                │     HTML/SVG 实现
├────────────────────────────────────────┤
│         Layer 2: 交互层                 │  ← 鼠标事件捕获、手势识别
│         (Interaction Layer)             │     透明 DIV 层
├────────────────────────────────────────┤
│         Layer 1: 渲染层                 │  ← 报表内容渲染
│         (Rendering Layer)               │     Canvas 2D / Skia
└────────────────────────────────────────┘
```

### 2.2 各层职责

#### 2.2.1 渲染层 (Rendering Layer)
**职责**: 纯粹的内容渲染
- 渲染报表元素（文字、表格、图表、图形）
- 不处理任何交互逻辑
- 支持 Canvas 2D 和 Skia 两种实现
- 懒更新机制（脏标记）

#### 2.2.2 交互层 (Interaction Layer)
**职责**: 事件捕获和分发
- Hit-testing（判断点击位置）
- 手势识别（拖拽、框选、缩放）
- 事件分发给其他层
- 完全透明，不可见

#### 2.2.3 反馈层 (Feedback Layer)
**职责**: 视觉反馈
- 选择框、调整手柄
- 拖拽预览、对齐辅助线
- 悬停高亮效果
- 使用 HTML/SVG 实现（快速响应）

## 3. 渲染器接口设计

### 3.1 统一接口定义

```typescript
// src/renderer/core/interfaces.ts

export interface IRenderer {
  // 生命周期
  initialize(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void>;
  dispose(): void;

  // 渲染核心
  render(elements: RenderableElement[]): void;
  clear(): void;
  flush(): void;

  // 视口管理
  setViewport(viewport: Viewport): void;
  getViewport(): Viewport;

  // 文字度量
  measureText(text: string, style: TextStyle): TextMetrics;

  // 导出能力
  exportToImage(format: 'png' | 'jpeg', quality?: number): Promise<Blob>;
  exportToSVG?(): string;

  // 性能优化
  markDirty(region?: Rectangle): void;
  setRenderQuality(quality: 'draft' | 'normal' | 'high'): void;

  // 缓存管理
  cacheElement?(elementId: string, data: any): void;
  clearCache?(): void;
}

export interface RendererOptions {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  alpha?: boolean;
  quality?: 'draft' | 'normal' | 'high';
}

export interface RenderableElement {
  id: string;
  type: ElementType;
  bounds: Rectangle;
  style: ElementStyle;
  transform?: Transform;
  data: any;
  visible: boolean;
  opacity?: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation?: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxLeft: number;
  actualBoundingBoxRight: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
  fontBoundingBoxAscent: number;
  fontBoundingBoxDescent: number;
}
```

### 3.2 渲染器工厂

```typescript
// src/renderer/core/factory.ts

export class RendererFactory {
  private static renderers = new Map<string, () => Promise<IRenderer>>();

  static register(type: string, factory: () => Promise<IRenderer>) {
    this.renderers.set(type, factory);
  }

  static async create(
    type: 'canvas' | 'skia' | 'auto',
    canvas: HTMLCanvasElement,
    options?: RendererOptions
  ): Promise<IRenderer> {
    if (type === 'auto') {
      type = this.autoSelect();
    }

    const factory = this.renderers.get(type);
    if (!factory) {
      throw new Error(`Renderer type '${type}' not registered`);
    }

    const renderer = await factory();
    await renderer.initialize(canvas, options);
    return renderer;
  }

  private static autoSelect(): 'canvas' | 'skia' {
    // 自动选择逻辑
    const isMobile = /mobile/i.test(navigator.userAgent);
    const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
    const memory = (performance as any).memory?.jsHeapSizeLimit || Infinity;

    if (isMobile || memory < 2_147_483_648) { // < 2GB
      return 'canvas';
    }

    if (!hasWebGL2) {
      return 'canvas';
    }

    return 'canvas'; // 默认使用 Canvas 2D
  }
}
```

## 4. Canvas 2D 默认实现

### 4.1 实现类

```typescript
// src/renderer/canvas2d/Canvas2DRenderer.ts

export class Canvas2DRenderer implements IRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private viewport: Viewport = { x: 0, y: 0, width: 0, height: 0, scale: 1 };
  private isDirty = false;
  private dirtyRegion: Rectangle | null = null;
  private quality: 'draft' | 'normal' | 'high' = 'normal';

  async initialize(canvas: HTMLCanvasElement, options?: RendererOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: options?.alpha ?? true,
      desynchronized: true, // 提高性能
    });

    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // 设置默认属性
    this.ctx.imageSmoothingEnabled = options?.antialias ?? true;
    this.viewport.width = canvas.width;
    this.viewport.height = canvas.height;
  }

  render(elements: RenderableElement[]) {
    if (!this.ctx || !this.isDirty) return;

    const ctx = this.ctx;

    // 保存状态
    ctx.save();

    // 应用视口变换
    this.applyViewport();

    // 清空画布或脏区域
    if (this.dirtyRegion) {
      this.clearRegion(this.dirtyRegion);
    } else {
      this.clear();
    }

    // 渲染元素
    for (const element of elements) {
      if (!element.visible) continue;
      if (!this.isInViewport(element)) continue;

      this.renderElement(element);
    }

    // 恢复状态
    ctx.restore();

    // 清除脏标记
    this.isDirty = false;
    this.dirtyRegion = null;
  }

  private renderElement(element: RenderableElement) {
    const ctx = this.ctx!;

    ctx.save();

    // 应用变换
    if (element.transform) {
      this.applyTransform(element.transform);
    }

    // 应用透明度
    if (element.opacity !== undefined && element.opacity < 1) {
      ctx.globalAlpha = element.opacity;
    }

    // 根据类型渲染
    switch (element.type) {
      case 'text':
        this.renderText(element);
        break;
      case 'rect':
        this.renderRect(element);
        break;
      case 'image':
        this.renderImage(element);
        break;
      case 'path':
        this.renderPath(element);
        break;
      // ... 其他类型
    }

    ctx.restore();
  }

  private renderText(element: RenderableElement) {
    const ctx = this.ctx!;
    const { style, data } = element;

    // 设置字体样式
    ctx.font = `${style.fontSize}px ${style.fontFamily}`;
    ctx.fillStyle = style.color || '#000';
    ctx.textBaseline = 'top'; // 统一基线
    ctx.textAlign = style.textAlign || 'left';

    // 渲染文字
    ctx.fillText(data.text, element.bounds.x, element.bounds.y);
  }

  measureText(text: string, style: TextStyle): TextMetrics {
    const ctx = this.ctx!;
    ctx.font = `${style.fontSize}px ${style.fontFamily}`;
    const metrics = ctx.measureText(text);

    return {
      width: metrics.width,
      height: style.fontSize * 1.2, // 估算行高
      actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
      actualBoundingBoxRight: metrics.actualBoundingBoxRight,
      actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
      actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
      fontBoundingBoxAscent: metrics.fontBoundingBoxAscent,
      fontBoundingBoxDescent: metrics.fontBoundingBoxDescent,
    };
  }

  markDirty(region?: Rectangle) {
    this.isDirty = true;
    if (region) {
      this.dirtyRegion = region;
    }
  }

  // ... 其他方法实现
}
```

## 5. 实施计划

### 5.1 Phase 1: 基础架构 (Week 1-2)
- [ ] 创建分层架构基础结构
- [ ] 定义 IRenderer 接口
- [ ] 实现 Canvas2DRenderer
- [ ] 创建 RendererFactory
- [ ] 基础测试用例

### 5.2 Phase 2: 分层实现 (Week 2-3)
- [ ] 实现 InteractionLayer
- [ ] 实现 FeedbackLayer
- [ ] 层间通信机制
- [ ] 坐标系统统一
- [ ] 集成到现有设计器

### 5.3 Phase 3: 优化和测试 (Week 3-4)
- [ ] 性能优化（脏区域、缓存）
- [ ] 虚拟滚动支持
- [ ] 批量渲染优化
- [ ] 性能基准测试
- [ ] 用户体验测试

### 5.4 Phase 4: Skia 集成 (Week 4-5)
- [ ] SkiaRenderer 实现
- [ ] 动态加载机制
- [ ] 渲染器切换功能
- [ ] 一致性测试
- [ ] 文档和示例

## 6. 关键技术决策

### 6.1 坐标系统
- 统一使用 Canvas 坐标系（左上角为原点）
- 所有层共享同一坐标转换矩阵
- 文字基线统一使用 'top'

### 6.2 事件处理
- 交互层负责所有事件捕获
- 使用事件委托，避免多层监听
- 支持 Touch 和 Mouse 事件

### 6.3 性能策略
- 脏标记机制，避免不必要的重绘
- 视口剔除，只渲染可见元素
- 批量渲染相似元素
- 使用 requestAnimationFrame 调度

### 6.4 内存管理
- 限制缓存大小
- 使用 WeakMap 存储临时数据
- 及时释放不用的资源

## 7. 风险和缓解

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 层间同步问题 | 显示错位 | 统一坐标系统，严格测试 |
| 性能回退 | 用户体验差 | 提供降级方案，性能监控 |
| 浏览器兼容 | 部分用户无法使用 | 最低要求 Chrome 90+ |
| 内存泄漏 | 应用崩溃 | 严格的资源管理，定期测试 |

### 7.2 项目风险
- **复杂度增加**: 通过清晰的接口设计降低
- **开发周期**: 采用渐进式开发，先 MVP
- **维护成本**: 完善的文档和测试

## 8. 成功指标

### 8.1 性能指标
- 设计模式: 60fps 交互
- 100页报表首次渲染 < 1s
- 内存占用 < 200MB
- 切换渲染器 < 500ms

### 8.2 质量指标
- 单元测试覆盖率 > 80%
- Canvas 2D 与 Skia 一致性 > 95%
- 无内存泄漏
- 跨浏览器兼容

## 9. API 示例

```typescript
// 使用示例
import { RendererFactory } from '@/renderer';

// 创建渲染器
const renderer = await RendererFactory.create('auto', canvas);

// 渲染元素
renderer.render(elements);

// 切换渲染器
const newRenderer = await RendererFactory.create('skia', canvas);
renderer.dispose();
renderer = newRenderer;

// 导出
const blob = await renderer.exportToImage('png', 0.9);
```

## 10. 下一步行动

1. **立即开始**: 创建基础目录结构和接口定义
2. **快速原型**: 一周内完成 Canvas2D 基础实现
3. **集成测试**: 两周内集成到现有设计器
4. **收集反馈**: 三周内进行用户测试
5. **迭代优化**: 根据反馈持续改进

---

*文档版本: 1.0*
*创建日期: 2024*
*作者: Jasper Designer Team*