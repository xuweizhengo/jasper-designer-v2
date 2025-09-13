# Jasper Designer 预览模式设计方案 v2.0

## 1. 设计理念

### 核心原则
- **性能优先**: 60fps 流畅渲染，毫秒级响应
- **极简界面**: 内容为主，工具为辅
- **专业体验**: 快捷键驱动，手势支持
- **渐进增强**: 基础功能优先，高级功能可选

### 架构分离
```
预览 (Preview)                    导出 (Export)
     ↓                                ↓
前端 Canvas/WebGL                 后端 Rust
     ↓                                ↓
实时渲染 (<16ms)                  精确生成 (1-5s)
     ↓                                ↓
交互式体验                        标准格式输出
```

## 2. 界面设计

### 2.1 布局结构
```
┌──────────────────────────────────────────────┐
│                                              │
│              预览视口 (100%)                  │
│          (Canvas/WebGL 渲染区)                │
│                                              │
│     ┌─────────────────────────┐             │
│     │ ◀ 1/10 ▶│ 75% │⊞│📄│🖨️│             │ <- 浮动工具栏
│     └─────────────────────────┘             │
│                                              │
│ [ESC 退出] [空格+拖动 平移] [滚轮 缩放]        │ <- 提示信息(3秒后淡出)
└──────────────────────────────────────────────┘
```

### 2.2 三种预览模式

#### 演示模式 (Presentation)
- 全屏无干扰显示
- 自动隐藏所有UI
- 适合展示和演示

#### 开发模式 (Development)
- 显示尺寸标注
- 显示间距信息
- 显示样式属性

#### 打印模式 (Print)
- 显示页边距
- 显示分页线
- 显示打印标记

## 3. 技术架构

### 3.1 渲染引擎选择

**方案对比**：
| 技术 | 性能 | 学习成本 | 生态 | 推荐度 |
|-----|------|---------|------|--------|
| Canvas2D | ★★★☆☆ | ★☆☆☆☆ | ★★★★★ | ★★★☆☆ |
| Konva.js | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | ★★★★★ |
| Pixi.js | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★★☆ |
| Three.js | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| 原生WebGL | ★★★★★ | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |

**选择：Konva.js**
- 平衡性能和易用性
- 专为2D图形设计
- 完善的事件系统
- 良好的文档支持

### 3.2 组件架构
```
PreviewMode/
├── PreviewViewport.tsx       # 主视口组件
├── renderers/
│   ├── KonvaRenderer.ts      # Konva渲染器
│   ├── CanvasRenderer.ts     # Canvas2D备选
│   └── ElementMapper.ts      # 元素映射器
├── controls/
│   ├── FloatingToolbar.tsx   # 浮动工具栏
│   ├── PageNavigator.tsx     # 页面导航
│   ├── ZoomControls.tsx      # 缩放控制
│   └── QuickActions.tsx      # 快速操作
├── interactions/
│   ├── PanZoomHandler.ts     # 平移缩放处理
│   ├── KeyboardShortcuts.ts  # 键盘快捷键
│   └── TouchGestures.ts      # 触摸手势
└── utils/
    ├── PageCalculator.ts      # 分页计算
    └── ViewportManager.ts     # 视口管理
```

## 4. 功能规格

### 4.1 核心功能

#### 渲染系统
- [x] Canvas/WebGL 快速渲染
- [x] 元素批量绘制优化
- [x] 视口裁剪优化
- [x] LOD (细节层次) 系统

#### 导航控制
- [x] 页面切换 (上一页/下一页/跳转)
- [x] 缩放控制 (放大/缩小/适应屏幕/实际大小)
- [x] 平移控制 (拖动/方向键)
- [x] 缩略图导航

#### 交互操作
- [x] 鼠标滚轮缩放
- [x] 空格+拖动平移
- [x] 双击放大
- [x] 触摸板手势

### 4.2 快捷键系统

| 快捷键 | 功能 |
|--------|-----|
| ESC | 退出预览 |
| Space + 拖动 | 平移画布 |
| F | 适应屏幕 |
| 1 | 实际大小 (100%) |
| + / - | 放大/缩小 |
| ← / → | 上一页/下一页 |
| Home / End | 第一页/最后一页 |
| Ctrl/Cmd + P | 打印 |
| Ctrl/Cmd + E | 导出 |
| D | 切换开发模式 |

### 4.3 性能指标

| 指标 | 目标值 | 测试条件 |
|-----|--------|---------|
| 首次渲染 | < 100ms | 100个元素 |
| 帧率 | 60 fps | 平移/缩放时 |
| 内存占用 | < 50MB | 基础状态 |
| 切换页面 | < 50ms | 缓存命中 |

## 5. 实现计划

### Phase 1: 基础渲染 (第1天)
1. 安装 Konva.js 依赖
2. 实现 KonvaRenderer 基础类
3. 实现元素到 Konva 对象的映射
4. 测试基础渲染性能

### Phase 2: 视口控制 (第2天)
1. 实现缩放功能
2. 实现平移功能
3. 实现适应屏幕
4. 添加鼠标/触摸交互

### Phase 3: 工具栏与导航 (第3天)
1. 实现浮动工具栏
2. 实现页面导航器
3. 实现快捷键系统
4. 添加自动隐藏逻辑

### Phase 4: 高级功能 (第4天)
1. 实现三种预览模式切换
2. 添加开发模式标注
3. 添加打印预览
4. 性能优化

### Phase 5: 集成测试 (第5天)
1. 集成到主应用
2. 完整功能测试
3. 性能测试
4. Bug修复

## 6. 代码示例

### 6.1 KonvaRenderer 核心实现
```typescript
import Konva from 'konva';
import type { ReportElement } from '../../types';

export class KonvaRenderer {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private elements: Map<string, Konva.Node>;
  
  constructor(container: HTMLDivElement) {
    this.stage = new Konva.Stage({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
    });
    
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.elements = new Map();
  }
  
  render(elements: ReportElement[]) {
    // 清除旧元素
    this.layer.destroyChildren();
    this.elements.clear();
    
    // 批量添加新元素
    elements.forEach(el => {
      const konvaElement = this.createElement(el);
      if (konvaElement) {
        this.layer.add(konvaElement);
        this.elements.set(el.id, konvaElement);
      }
    });
    
    // 批量绘制
    this.layer.batchDraw();
  }
  
  private createElement(element: ReportElement): Konva.Node | null {
    switch (element.type) {
      case 'text':
        return new Konva.Text({
          id: element.id,
          x: element.position.x,
          y: element.position.y,
          text: element.content,
          fontSize: element.style?.fontSize || 14,
          fill: element.style?.color || '#000',
          width: element.size.width,
        });
        
      case 'rectangle':
        return new Konva.Rect({
          id: element.id,
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height,
          fill: element.style?.backgroundColor,
          stroke: element.style?.borderColor,
          strokeWidth: element.style?.borderWidth,
        });
        
      case 'image':
        // 异步加载图片
        const image = new window.Image();
        image.src = element.content;
        return new Konva.Image({
          id: element.id,
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height,
          image,
        });
        
      default:
        return null;
    }
  }
}
```

### 6.2 浮动工具栏
```typescript
interface FloatingToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onExport: () => void;
  onPrint: () => void;
  onModeChange: (mode: PreviewMode) => void;
}

export const FloatingToolbar: Component<FloatingToolbarProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(true);
  const [opacity, setOpacity] = createSignal(1);
  
  // 自动隐藏逻辑
  let hideTimer: number;
  
  const startHideTimer = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      setOpacity(0.3);
    }, 3000);
  };
  
  onMount(() => {
    startHideTimer();
  });
  
  return (
    <div 
      class="floating-toolbar"
      style={{
        opacity: opacity(),
        transition: 'opacity 0.3s ease',
      }}
      onMouseEnter={() => {
        clearTimeout(hideTimer);
        setOpacity(1);
      }}
      onMouseLeave={() => {
        startHideTimer();
      }}
    >
      {/* 页面导航 */}
      <div class="page-nav">
        <button onClick={() => props.onPageChange(props.currentPage - 1)}>◀</button>
        <span>{props.currentPage} / {props.totalPages}</span>
        <button onClick={() => props.onPageChange(props.currentPage + 1)}>▶</button>
      </div>
      
      {/* 缩放控制 */}
      <div class="zoom-controls">
        <button onClick={() => props.onZoomChange(props.zoom - 25)}>−</button>
        <span>{props.zoom}%</span>
        <button onClick={() => props.onZoomChange(props.zoom + 25)}>+</button>
        <button onClick={() => props.onZoomChange(100)}>⊞</button>
      </div>
      
      {/* 快速操作 */}
      <div class="quick-actions">
        <button onClick={props.onExport} title="导出">📄</button>
        <button onClick={props.onPrint} title="打印">🖨️</button>
      </div>
    </div>
  );
};
```

## 7. 测试计划

### 7.1 功能测试
- [ ] 元素渲染正确性
- [ ] 缩放功能
- [ ] 平移功能
- [ ] 分页导航
- [ ] 快捷键响应
- [ ] 工具栏交互

### 7.2 性能测试
- [ ] 100个元素渲染时间
- [ ] 1000个元素渲染时间
- [ ] 缩放平移帧率
- [ ] 内存占用监控
- [ ] 页面切换速度

### 7.3 兼容性测试
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] 移动端浏览器

## 8. 未来扩展

### 8.1 高级功能
- 实时协作光标
- 版本对比视图
- 批注和评论
- 动画过渡效果

### 8.2 性能优化
- WebGL 2.0 渲染器
- Web Worker 离屏渲染
- WebAssembly 加速
- 虚拟滚动优化

### 8.3 导出增强
- 云端渲染服务
- 批量导出队列
- 自定义导出模板
- API 集成

---

**文档版本**: v2.0
**创建日期**: 2024-12-19
**状态**: 待实现