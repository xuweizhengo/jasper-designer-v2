# Jasper在线报表设计器 MVP 设计文档

## 文档信息
- **项目名称**: Jasper在线报表设计器
- **版本**: v1.0 MVP
- **创建日期**: 2024-01-15
- **最后更新**: 2024-01-15
- **设计理念**: 基于Figma/墨刀的设计哲学，专注银行回单业务场景

---

## 目录
1. [项目概述](#1-项目概述)
2. [系统架构设计](#2-系统架构设计)
3. [UI/UX界面设计](#3-uiux界面设计)
4. [功能模块设计](#4-功能模块设计)
5. [数据模型设计](#5-数据模型设计)
6. [技术实现计划](#6-技术实现计划)
7. [开发路线图](#7-开发路线图)

---

## 1. 项目概述

### 1.1 项目背景
传统的JasperReports报表设计需要使用JasperStudio等专业工具，学习成本高，对业务人员不够友好。我们要设计一个基于Web的可视化报表设计器，让业务人员能够无需阅读文档，直观地完成报表设计。

### 1.2 设计理念
借鉴Figma/墨刀的设计哲学：
- **极简界面**: 隐藏复杂性，突出核心功能
- **即时反馈**: 所见即所得，实时预览
- **组件化思维**: 拖拽式组件库
- **智能引导**: 减少用户认知负担

### 1.3 核心目标
**MVP验证假设**: 用户能否在10分钟内创建一个包含标题、表格数据、页脚的银行回单？

### 1.4 目标用户
- **主要用户**: 银行业务人员、产品经理
- **次要用户**: 开发人员（后期扩展）
- **用户特征**: 熟悉Office软件，不熟悉专业报表工具

### 1.5 业务场景
**聚焦场景**: 银行回单通知书
- 包含银行抬头、Logo
- 交易信息（流水号、时间、类型）
- 账户信息（付款/收款账户、户名）
- 金额信息（交易金额、手续费、余额）
- 签章和备注区域

---

## 2. 系统架构设计

### 2.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端SPA       │    │   后端API       │    │   文件存储       │
│                 │    │                 │    │                 │
│ - React应用     │◄──►│ - Spring Boot   │◄──►│ - JRXML文件     │
│ - 可视化编辑器   │    │ - JasperReports │    │ - 生成的PDF     │
│ - 实时预览      │    │ - RESTful API   │    │ - 模拟数据      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 技术栈选择

#### 前端技术栈
```javascript
核心框架: React 18 + TypeScript
UI渲染: Konva.js (Canvas) + React-Konva
状态管理: Zustand (轻量级)
拖拽: @dnd-kit/core + @dnd-kit/sortable
样式: Tailwind CSS + Styled-components
图标: Lucide React
构建: Vite
```

#### 后端技术栈
```java
核心框架: Spring Boot 3.0
报表引擎: JasperReports 6.20
数据库: H2 (开发) / PostgreSQL (生产)
文件存储: 本地文件系统 (MVP)
API文档: Swagger/OpenAPI
```

### 2.3 系统模块划分
```
前端模块:
├── editor/ (编辑器核心)
│   ├── canvas/ (画布渲染)
│   ├── components/ (组件库)
│   ├── properties/ (属性面板)
│   └── toolbar/ (工具栏)
├── data/ (数据管理)
├── templates/ (模板管理)
└── preview/ (预览功能)

后端模块:
├── template-api/ (模板CRUD)
├── data-api/ (模拟数据)
├── generation-api/ (报表生成)
└── file-api/ (文件管理)
```

---

## 3. UI/UX界面设计

### 3.1 整体布局规范
```
视窗尺寸: 最小 1366×768, 推荐 1920×1080
布局方式: 三栏布局 (左20% + 中60% + 右20%)
主色调: #2563EB (蓝色系)
辅助色: #64748B (灰色系)
成功色: #059669 (绿色)
警告色: #D97706 (橙色)
```

### 3.2 组件设计规范

#### 3.2.1 按钮组件
```css
主要按钮: bg-blue-600 hover:bg-blue-700, 高度32px
次要按钮: border border-gray-300, 高度32px
文字按钮: text-blue-600 hover:text-blue-700
图标按钮: 24×24px, 圆角4px
```

#### 3.2.2 输入组件
```css
文本输入框: border border-gray-300, 高度32px, 圆角4px
下拉选择: 同输入框样式 + 下拉箭头
颜色选择器: 32×32px 色块 + 弹出面板
数字输入: 带增减按钮的输入框
```

#### 3.2.3 面板组件
```css
侧边面板: 背景#F8FAFC, 边框#E2E8F0
折叠面板: 标题栏高度36px, 内容区padding 12px
分组标题: 字体14px font-medium, 颜色#374151
```

### 3.3 交互设计规范

#### 3.3.1 拖拽交互
```
拖拽开始: 元素透明度50%, 显示虚线预览
拖拽进行: 目标区域高亮, 显示对齐线
拖拽结束: 平滑动画到目标位置
拖拽取消: ESC键或拖拽到无效区域
```

#### 3.3.2 选择交互
```
单选: 点击元素 → 显示边框 + 8个调整手柄
多选: Ctrl+点击 → 多个元素同时选中
框选: 拖拽空白区域 → 选中框内所有元素
取消: 点击空白区域 / ESC键
```

#### 3.3.3 编辑交互
```
双击文字: 进入内联编辑模式
属性修改: 实时反馈到画布
撤销重做: Ctrl+Z/Y, 最多50步历史
快捷键: Del删除, Ctrl+D复制, 方向键微调
```

---

## 4. 功能模块设计

### 4.1 画布模块 (Canvas)

#### 4.1.1 画布基础功能
```javascript
// 画布配置
const canvasConfig = {
  width: 595,      // A4宽度 (px)
  height: 842,     // A4高度 (px) 
  scale: 1.0,      // 缩放比例
  gridSize: 10,    // 网格大小
  showGrid: true,  // 显示网格
  showRuler: true, // 显示标尺
  snapToGrid: true // 网格吸附
}
```

#### 4.1.2 区域划分策略
```javascript
// 智能区域提示 (不显示Band概念)
const regions = {
  header: { y: 0, height: 120, hint: "通常放置标题、Logo" },
  content: { y: 120, height: 600, hint: "主要内容区域" },
  footer: { y: 720, height: 122, hint: "页脚、签章区域" }
}
```

#### 4.1.3 对齐和吸附
```javascript
// 智能对齐线
const alignmentLines = {
  elementEdges: true,    // 元素边缘对齐
  elementCenters: true,  // 元素中心对齐
  canvasCenters: true,   // 画布中心对齐
  gridSnap: true,        // 网格吸附
  tolerance: 5           // 吸附容差(px)
}
```

### 4.2 组件库模块 (Components)

#### 4.2.1 基础组件
```javascript
const basicComponents = [
  {
    id: 'text',
    name: '标题文字',
    icon: 'Type',
    category: 'basic',
    defaultProps: {
      text: '标题文字',
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000'
    }
  },
  {
    id: 'label', 
    name: '普通文字',
    icon: 'AlignLeft',
    category: 'basic',
    defaultProps: {
      text: '普通文字',
      fontSize: 12,
      color: '#000000'
    }
  },
  {
    id: 'field',
    name: '数据字段', 
    icon: 'Database',
    category: 'data',
    defaultProps: {
      expression: '',
      fontSize: 12,
      color: '#000000',
      placeholder: '[字段名]'
    }
  },
  {
    id: 'image',
    name: '银行Logo',
    icon: 'Image', 
    category: 'basic',
    defaultProps: {
      src: '',
      width: 60,
      height: 30
    }
  },
  {
    id: 'line',
    name: '分割线',
    icon: 'Minus',
    category: 'basic', 
    defaultProps: {
      width: 200,
      height: 1,
      color: '#000000'
    }
  },
  {
    id: 'rectangle',
    name: '表格框',
    icon: 'Square',
    category: 'basic',
    defaultProps: {
      width: 200,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1
    }
  }
]
```

#### 4.2.2 银行回单专用组件
```javascript
const bankComponents = [
  {
    id: 'bank-header',
    name: '银行抬头',
    icon: 'Building',
    category: 'bank',
    template: {
      type: 'group',
      children: [
        { type: 'image', props: { src: 'bank-logo.png', x: 0, y: 0 }},
        { type: 'text', props: { text: '中国工商银行', x: 80, y: 0, fontSize: 18 }},
        { type: 'text', props: { text: '电子回单', x: 80, y: 25, fontSize: 14 }}
      ]
    }
  },
  {
    id: 'amount-field',
    name: '金额显示', 
    icon: 'DollarSign',
    category: 'bank',
    defaultProps: {
      expression: '',
      fontSize: 14,
      color: '#000000',
      format: 'currency', // 货币格式化
      prefix: '¥'
    }
  },
  {
    id: 'info-table',
    name: '信息表格',
    icon: 'Table',
    category: 'bank', 
    template: {
      type: 'group',
      children: [
        // 2列表格的预设布局
      ]
    }
  }
]
```

### 4.3 属性面板模块 (Properties)

#### 4.3.1 属性分组设计
```javascript
const propertyGroups = {
  position: {
    title: '位置大小',
    icon: 'Move',
    properties: ['x', 'y', 'width', 'height']
  },
  appearance: {
    title: '外观样式', 
    icon: 'Palette',
    properties: ['fontSize', 'fontFamily', 'color', 'backgroundColor', 'border']
  },
  data: {
    title: '数据绑定',
    icon: 'Database', 
    properties: ['expression', 'format'],
    condition: (element) => element.type === 'field'
  }
}
```

#### 4.3.2 属性控件映射
```javascript
const propertyControls = {
  x: { type: 'number', unit: 'px', step: 1 },
  y: { type: 'number', unit: 'px', step: 1 },
  width: { type: 'number', unit: 'px', step: 1, min: 1 },
  height: { type: 'number', unit: 'px', step: 1, min: 1 },
  fontSize: { type: 'number', unit: 'px', step: 1, min: 8, max: 72 },
  fontFamily: { type: 'select', options: ['宋体', '黑体', '微软雅黑', 'Arial'] },
  color: { type: 'color' },
  backgroundColor: { type: 'color', allowTransparent: true },
  expression: { type: 'expression', autocomplete: true }
}
```

### 4.4 模拟数据模块 (MockData)

#### 4.4.1 银行回单数据结构
```javascript
const bankReceiptMockData = {
  bankInfo: {
    bankName: "中国工商银行",
    bankCode: "102100024506", 
    branchName: "北京分行营业部"
  },
  customerInfo: {
    customerName: "张三",
    accountNumber: "6222024200012345678",
    openingBank: "北京分行营业部"
  },
  transactionInfo: {
    amount: "1280.50",
    transactionTime: "2024-01-15 14:30:25",
    transactionType: "网银转账", 
    serialNumber: "20240115001122334",
    fee: "2.00",
    balance: "15240.30",
    remark: "工资发放"
  },
  recipientInfo: {
    recipientName: "李四",
    recipientAccount: "6222024200087654321",
    recipientBank: "上海分行"
  }
}
```

#### 4.4.2 字段映射关系
```javascript
const fieldMapping = {
  // 显示名称 → JasperReports字段名
  "银行名称": "bankName",
  "客户姓名": "customerName", 
  "账户号码": "accountNumber",
  "交易金额": "amount",
  "交易时间": "transactionTime",
  "交易类型": "transactionType",
  "流水号": "serialNumber",
  "手续费": "fee", 
  "余额": "balance",
  "备注": "remark",
  "收款姓名": "recipientName",
  "收款账户": "recipientAccount"
}
```

### 4.5 预设模板模块 (Templates)

#### 4.5.1 标准银行回单模板
```javascript
const standardBankReceiptTemplate = {
  id: 'standard-bank-receipt',
  name: '标准银行回单',
  category: 'bank',
  thumbnail: '/templates/standard-bank-receipt.png',
  elements: [
    // 银行抬头区域
    {
      id: 'bank-logo',
      type: 'image',
      props: { x: 50, y: 30, width: 60, height: 30, src: 'bank-logo.png' }
    },
    {
      id: 'bank-name', 
      type: 'text',
      props: { x: 130, y: 30, text: '中国工商银行', fontSize: 18, fontWeight: 'bold' }
    },
    {
      id: 'receipt-title',
      type: 'text', 
      props: { x: 130, y: 55, text: '电子回单', fontSize: 14 }
    },
    
    // 分割线
    {
      id: 'header-line',
      type: 'line',
      props: { x: 50, y: 80, width: 495, height: 1 }
    },
    
    // 交易信息区域
    {
      id: 'serial-label',
      type: 'text',
      props: { x: 50, y: 100, text: '交易流水号:', fontSize: 12 }
    },
    {
      id: 'serial-value',
      type: 'field', 
      props: { x: 130, y: 100, expression: 'serialNumber', fontSize: 12 }
    },
    
    // ... 更多元素定义
  ]
}
```

---

## 5. 数据模型设计

### 5.1 前端状态管理

#### 5.1.1 全局状态结构
```typescript
interface AppState {
  // 画布状态
  canvas: {
    config: CanvasConfig;
    elements: Element[];
    selectedIds: string[];
    scale: number;
    offset: { x: number; y: number };
  };
  
  // 历史记录
  history: {
    past: AppState[];
    present: AppState;
    future: AppState[];
  };
  
  // 模拟数据
  mockData: Record<string, any>;
  
  // UI状态
  ui: {
    showGrid: boolean;
    showRuler: boolean;
    leftPanelWidth: number;
    rightPanelWidth: number;
    activePanel: 'components' | 'data' | 'templates';
  };
}
```

#### 5.1.2 元素数据模型
```typescript
interface Element {
  id: string;
  type: 'text' | 'field' | 'image' | 'line' | 'rectangle' | 'group';
  props: {
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: any;
  };
  band?: 'title' | 'pageHeader' | 'columnHeader' | 'detail' | 'pageFooter';
  children?: Element[]; // 用于group类型
}
```

### 5.2 后端数据模型

#### 5.2.1 模板实体
```java
@Entity
public class Template {
    @Id
    private String id;
    
    private String name;
    private String description;
    private String category;
    private String thumbnail;
    
    @Lob
    private String jrxmlContent;
    
    @Lob 
    private String jsonContent; // 前端格式的模板数据
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // getters and setters
}
```

#### 5.2.2 生成请求模型
```java
public class GenerationRequest {
    private String templateId;
    private String jrxmlContent;
    private Map<String, Object> parameters;
    private List<Map<String, Object>> dataSource;
    private String format; // PDF, HTML, DOCX
}
```

### 5.3 API接口设计

#### 5.3.1 模板管理API
```typescript
// GET /api/templates - 获取模板列表
interface TemplateListResponse {
  templates: {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    createdAt: string;
  }[];
}

// POST /api/templates - 保存模板
interface SaveTemplateRequest {
  name: string;
  description?: string;
  category: string;
  jrxmlContent: string;
  jsonContent: string;
}

// GET /api/templates/{id} - 获取模板详情
interface TemplateDetailResponse {
  id: string;
  name: string;
  description: string;
  jsonContent: string;
}
```

#### 5.3.2 报表生成API
```typescript
// POST /api/generate - 生成报表
interface GenerateRequest {
  jrxmlContent: string;
  format: 'PDF' | 'HTML';
  data?: Record<string, any>;
}

interface GenerateResponse {
  success: boolean;
  fileUrl?: string;
  error?: string;
}
```

#### 5.3.3 数据源API
```typescript
// GET /api/mockdata/bank-receipt - 获取银行回单模拟数据
interface MockDataResponse {
  fields: {
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'date';
    sampleValue: any;
  }[];
  sampleData: Record<string, any>;
}
```

---

## 6. 技术实现计划

### 6.1 核心技术选择理由

#### 6.1.1 前端技术选择
```
React + TypeScript:
- 组件化开发，适合复杂UI
- 强类型支持，减少运行时错误
- 生态完善，社区活跃

Konva.js + React-Konva:
- 高性能Canvas渲染
- 丰富的图形操作API
- 良好的事件处理机制

Zustand:
- 轻量级状态管理
- 无样板代码
- TypeScript友好

@dnd-kit:
- 现代拖拽库
- 无障碍支持
- 高度可定制
```

#### 6.1.2 后端技术选择  
```
Spring Boot:
- 快速开发
- 丰富的生态
- 生产级特性

JasperReports:
- 成熟的报表引擎
- 丰富的输出格式
- 强大的表达式支持
```

### 6.2 关键技术难点

#### 6.2.1 拖拽系统实现
```typescript
// 拖拽状态管理
interface DragState {
  isDragging: boolean;
  dragType: 'component' | 'element' | 'resize';
  dragData: any;
  dropZones: DropZone[];
  alignmentLines: AlignmentLine[];
}

// 拖拽事件处理
const handleDragStart = (event: DragStartEvent) => {
  // 记录拖拽开始状态
  // 计算可能的放置区域
  // 显示对齐线
};

const handleDragMove = (event: DragMoveEvent) => {
  // 实时计算对齐
  // 更新对齐线显示
  // 高亮目标区域
};

const handleDragEnd = (event: DragEndEvent) => {
  // 创建新元素或移动现有元素
  // 更新画布状态
  // 记录历史操作
};
```

#### 6.2.2 撤销重做系统
```typescript
// 历史操作记录
interface HistoryAction {
  type: 'ADD_ELEMENT' | 'UPDATE_ELEMENT' | 'DELETE_ELEMENT' | 'MOVE_ELEMENT';
  payload: any;
  timestamp: number;
}

// 撤销重做实现
const useHistory = () => {
  const undo = () => {
    // 从history.past中取出上一个状态
    // 将当前状态放入history.future
    // 更新画布状态
  };
  
  const redo = () => {
    // 从history.future中取出下一个状态
    // 将当前状态放入history.past
    // 更新画布状态
  };
  
  return { undo, redo };
};
```

#### 6.2.3 表达式编辑器
```typescript
// 表达式智能提示
interface ExpressionSuggestion {
  label: string;
  value: string;
  type: 'field' | 'function' | 'operator';
  description?: string;
}

// 表达式验证
const validateExpression = (expression: string): ValidationResult => {
  // 解析表达式语法
  // 检查字段名是否存在
  // 检查函数调用是否正确
  // 返回验证结果
};
```

### 6.3 性能优化策略

#### 6.3.1 前端性能优化
```typescript
// 虚拟化渲染 - 大量元素时
const VirtualizedCanvas = () => {
  // 只渲染视窗内的元素
  // 使用React.memo避免不必要的重渲染
  // 防抖处理频繁的状态更新
};

// 状态更新优化
const useOptimizedState = () => {
  // 批量更新状态
  // 使用immer进行不可变更新
  // 选择性订阅状态变化
};
```

#### 6.3.2 后端性能优化
```java
// 报表生成缓存
@Service
public class ReportGenerationService {
    
    @Cacheable(value = "reports", key = "#jrxmlHash")
    public byte[] generateReport(String jrxmlContent, Map<String, Object> data) {
        // 生成报表
    }
    
    // 异步生成大报表
    @Async
    public CompletableFuture<String> generateReportAsync(GenerationRequest request) {
        // 异步生成并返回文件URL
    }
}
```

---

## 7. 开发路线图

### 7.1 MVP开发阶段 (4-6周)

#### Phase 1: 基础架构 (1周)
- [ ] 项目初始化和环境搭建
- [ ] 前端基础框架搭建
- [ ] 后端API框架搭建  
- [ ] 基础UI组件库
- [ ] 简单的拖拽demo

#### Phase 2: 核心画布功能 (2周)
- [ ] 画布渲染引擎
- [ ] 基础元素（文字、线条、矩形）
- [ ] 拖拽放置功能
- [ ] 元素选择和移动
- [ ] 基础属性面板

#### Phase 3: 数据绑定 (1周) 
- [ ] 模拟数据模块
- [ ] 数据字段组件
- [ ] 表达式编辑器
- [ ] 字段拖拽绑定

#### Phase 4: 模板和预览 (1-2周)
- [ ] 银行回单预设模板
- [ ] 模板保存和加载
- [ ] 后端报表生成
- [ ] PDF预览功能

### 7.2 优化完善阶段 (2-4周)

#### Phase 5: 体验优化
- [ ] 撤销重做功能
- [ ] 智能对齐线
- [ ] 快捷键支持
- [ ] 错误提示优化

#### Phase 6: 功能增强
- [ ] 组件库扩展
- [ ] 更多银行回单样式
- [ ] 批量操作功能
- [ ] 导出多种格式

### 7.3 测试验证阶段 (1周)
- [ ] 功能测试
- [ ] 性能测试  
- [ ] 用户体验测试
- [ ] 10分钟目标验证

### 7.4 部署上线阶段 (1周)
- [ ] 生产环境部署
- [ ] 监控和日志
- [ ] 文档编写
- [ ] 用户培训

---

## 总结

本设计文档详细规划了Jasper在线报表设计器MVP的架构、功能和实现计划。重点聚焦银行回单业务场景，通过借鉴Figma/墨刀的设计理念，力求为用户提供直观、易用的报表设计体验。

### 核心设计原则
1. **用户体验至上**: 10分钟无文档完成报表设计
2. **功能聚焦**: 专注银行回单场景，避免功能泛化
3. **技术务实**: 选择成熟稳定的技术栈
4. **迭代优化**: MVP先行，后续持续改进

### 成功指标
- 用户能够在10分钟内完成银行回单设计
- 界面操作流畅，无明显卡顿
- 生成的PDF报表格式正确
- 用户反馈积极，愿意持续使用

后续将按照此设计文档逐步实现各个功能模块，确保MVP按时上线并达到预期效果。