# 🔗 数据绑定架构设计 - 可扩展三层模式

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-23
- **维护团队**: 前端架构团队
- **审核状态**: 设计确认
- **实现阶段**: Phase 4 - 数据绑定核心功能

---

## 🎯 设计背景与目标

### **核心挑战**
在报表设计器中，数据字段组件需要同时满足：
- **设计时**: 显示表达式便于编辑 `{customer.name}`
- **预览时**: 显示真实数据验证效果 `张三`
- **多数据源**: JSON文件、Excel、SQL数据库等不同类型
- **大数据集**: 数据库查询、分页浏览等复杂场景

### **设计目标**
1. **统一用户体验** - 不同数据源使用相同的绑定语法
2. **扩展架构** - 支持任意数据源类型的插件化扩展
3. **性能友好** - 大数据集场景下的合理采样和缓存
4. **错误隔离** - 数据源问题不影响设计画布的使用

---

## 🏗️ 三层架构设计

### **架构概览**

```
┌─────────────────────────────────────────┐
│  🎨 设计层 (Design Layer)                │
│  画布显示: {customer.name}               │
│  功能: 表达式编辑、可视化设计             │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│  📋 数据上下文层 (Data Context Layer)    │
│  数据面板: 当前记录预览、字段浏览         │
│  功能: 数据源管理、记录导航、错误处理     │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│  🔍 预览层 (Preview Layer)               │
│  画布显示: 张三                          │
│  功能: 真实数据渲染、最终效果验证         │
└─────────────────────────────────────────┘
```

### **1. 设计层 (Design Layer)**

**职责**: 保持设计画布的简洁性，统一显示表达式语法

```typescript
// 统一表达式语法，不区分数据源类型
interface DataFieldExpression {
  // JSON数据源
  json: "{user.name}"
  
  // Excel数据源  
  excel: "{customers.name}" | "{Sheet1.A2}"
  
  // SQL数据源
  sql: "{customer_name}"
  
  // XML数据源
  xml: "{root.customer.name}"
}
```

**设计原则**:
- ✅ 始终显示表达式，便于编辑
- ✅ 提供数据连接状态指示器
- ✅ 不处理复杂的数据逻辑
- ✅ 支持表达式语法高亮和验证

### **2. 数据上下文层 (Data Context Layer)**

**职责**: 处理不同数据源的复杂逻辑，提供统一的数据预览

#### **JSON数据源上下文**
```
┌─ JSON数据上下文 ──────────────┐
│ 数据源: [用户列表.json ▼]      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔢 记录导航: [← 2/5 →]         │
│ 📋 当前数据预览:               │
│   {                          │
│     "name": "张三",           │
│     "age": 28,               │
│     "department": "开发部"    │
│   }                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔍 可用字段:                   │
│   • name (String)            │
│   • age (Number)             │
│   • department (String)      │
└─────────────────────────────┘
```

#### **Excel数据源上下文**
```
┌─ Excel数据上下文 ─────────────┐
│ 文件: [客户数据.xlsx ▼]        │
│ 工作表: [客户信息 ▼]           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔢 行导航: [← 2/100 →]         │
│ 📋 当前行数据:                 │
│   A: "张三" (name)            │
│   B: "28" (age)              │
│   C: "开发部" (department)    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔍 列映射:                     │
│   A → name                   │
│   B → age                    │
│   C → department             │
└─────────────────────────────┘
```

#### **SQL数据源上下文**
```
┌─ SQL数据上下文 ───────────────┐
│ 连接: [用户数据库 ▼]           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📝 SQL查询编辑器:              │
│ ┌─────────────────────────┐   │
│ │ SELECT name, age, dept  │   │
│ │ FROM customers          │   │
│ │ WHERE active = 1        │   │
│ │ ORDER BY created_at     │   │
│ │ LIMIT 100              │   │
│ └─────────────────────────┘   │
│ [🔄 执行查询] [💾 保存查询]     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ✅ 查询成功 (23条记录)         │
│ 🔢 记录导航: [← 1/23 →]        │
│ 📋 当前记录:                   │
│   name: "张三"                │
│   age: 28                     │
│   dept: "开发部"              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ❌ 错误处理:                   │
│   SQL语法错误: 缺少FROM子句    │
└─────────────────────────────┘
```

### **3. 预览层 (Preview Layer)**

**职责**: 将表达式渲染为真实数据，提供最终效果预览

**预览模式切换**:
```typescript
// 工具栏预览按钮
interface PreviewMode {
  design: boolean;    // 设计模式: 显示 {customer.name}
  preview: boolean;   // 预览模式: 显示 "张三"
}

// 预览状态指示
type PreviewStatus = 
  | "design"          // 🎨 设计模式
  | "loading"         // ⏳ 数据加载中
  | "preview"         // 🔍 预览模式
  | "error";          // ❌ 数据错误
```

---

## 🔧 技术实现架构

### **数据源插件化接口**

```typescript
interface DataSourceContextPanel {
  // 数据源类型标识
  readonly type: 'json' | 'excel' | 'sql' | 'xml' | 'csv';
  
  // 渲染上下文面板UI
  renderContextPanel(): Component;
  
  // 获取当前记录数据
  getCurrentRecord(): Promise<Record<string, any>>;
  
  // 获取可用字段列表
  getAvailableFields(): Promise<DataField[]>;
  
  // 记录导航
  navigateToRecord(index: number): Promise<void>;
  navigateNext(): Promise<boolean>;
  navigatePrevious(): Promise<boolean>;
  
  // 数据验证和错误处理
  validateConnection(): Promise<ValidationResult>;
  handleError(error: DataSourceError): void;
}
```

### **表达式求值引擎**

```typescript
interface ExpressionEvaluator {
  // 统一表达式求值，支持所有数据源
  evaluate(
    expression: string,           // "{customer.name}"
    context: DataContext,         // 当前数据上下文
    dataSource: DataSourceType    // 数据源类型
  ): Promise<EvaluationResult>;
  
  // 表达式验证
  validate(expression: string): ValidationResult;
  
  // 字段提示和自动完成
  getFieldSuggestions(partial: string, context: DataContext): string[];
}

interface EvaluationResult {
  success: boolean;
  value?: any;
  error?: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
}
```

### **数据上下文管理**

```typescript
interface DataContext {
  // 数据源信息
  dataSource: {
    id: string;
    type: DataSourceType;
    name: string;
    status: 'connected' | 'connecting' | 'error' | 'disconnected';
  };
  
  // 当前记录信息
  currentRecord: {
    index: number;
    total: number;
    data: Record<string, any>;
  };
  
  // 采样策略（处理大数据集）
  sampling: {
    strategy: 'all' | 'first_n' | 'random_sample';
    size: number;
    isComplete: boolean;
  };
  
  // 错误信息
  error?: {
    type: 'connection' | 'query' | 'parsing' | 'permission';
    message: string;
    details?: any;
  };
}
```

---

## 🚀 实现计划

### **Phase 1: JSON数据绑定基础** (本期实现)
- ✅ JSON数据源上下文面板
- ✅ 基础表达式求值引擎
- ✅ 设计/预览模式切换
- ✅ 数据字段组件渲染

### **Phase 2: 扩展数据源支持**
- 📋 Excel数据源插件
- 📋 CSV数据源插件  
- 📋 XML数据源插件

### **Phase 3: 数据库集成**
- 📋 SQL数据源插件
- 📋 查询编辑器集成
- 📋 大数据集优化

### **Phase 4: 高级功能**
- 📋 复杂表达式支持 `{customer.name | upper}`
- 📋 条件渲染 `{age > 25 ? '成人' : '青少年'}`
- 📋 列表渲染和数据重复

---

## 🔍 关键设计决策

### **1. 为什么选择三层架构？**
- **设计层专注设计**: 避免数据复杂性干扰UI设计
- **上下文层处理数据**: 不同数据源的差异被封装
- **预览层验证效果**: 用户可以清晰看到最终渲染结果

### **2. 为什么数据上下文独立面板？**
- **SQL查询需要编辑器**: 复杂查询不适合内联显示
- **大数据集需要分页**: 数据库查询结果需要导航控制
- **错误处理就近原则**: 数据问题在数据面板解决

### **3. 为什么表达式始终显示在设计层？**
- **编辑便利性**: 用户需要修改绑定字段
- **一致性体验**: 所有数据源使用相同语法
- **性能考虑**: 避免大量数据计算影响设计响应

---

## 📊 性能优化策略

### **数据采样策略**
```typescript
interface SamplingStrategy {
  // 小数据集 (< 1000条): 全量加载
  small: {
    threshold: 1000;
    strategy: 'load_all';
  };
  
  // 中等数据集 (1000-10000条): 首批采样
  medium: {
    threshold: 10000;
    strategy: 'first_n';
    size: 100;
  };
  
  // 大数据集 (> 10000条): 随机采样
  large: {
    threshold: Infinity;
    strategy: 'random_sample';
    size: 50;
  };
}
```

### **缓存优化**
- **数据缓存**: 当前记录数据缓存，避免重复查询
- **字段缓存**: 可用字段列表缓存，减少元数据查询
- **表达式缓存**: 求值结果缓存，提升预览性能

---

## 🎯 用户体验亮点

1. **无缝模式切换**: 一键切换设计/预览模式
2. **智能字段提示**: 输入表达式时自动提示可用字段
3. **实时错误反馈**: 数据源问题立即在上下文面板显示
4. **记录导航友好**: 支持键盘快捷键和分页导航
5. **多数据源统一**: 不同类型数据源使用体验一致

---

## 📋 后续扩展方向

1. **更多数据源**: MongoDB、Redis、REST API等
2. **高级表达式**: 支持函数调用、条件逻辑等
3. **数据变换**: 数据清洗、格式化、聚合等
4. **实时数据**: WebSocket、Server-Sent Events等
5. **协作功能**: 数据源共享、团队配置等

---

*本文档将随着功能实现不断更新和完善。*