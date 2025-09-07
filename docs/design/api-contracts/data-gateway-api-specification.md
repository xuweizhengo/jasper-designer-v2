# 📡 数据源层API接口规范

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-21
- **维护团队**: 数据服务团队 + 前端团队
- **接口版本**: v1
- **适用范围**: MVP -> 生产环境

---

## 🎯 接口设计原则

### **设计理念**
```yaml
一致性: 所有接口遵循统一的命名和响应格式
可扩展: 预留扩展字段，向后兼容
类型安全: 严格的类型定义和验证
错误友好: 详细的错误信息和错误码
性能优先: 支持缓存、分页、过滤
```

### **通用约定**
- 所有异步操作使用Promise/Result模式
- 错误信息包含错误类型、消息和上下文
- 可选参数使用Option类型
- 时间戳统一使用ISO 8601格式
- ID统一使用字符串类型

---

## 🔧 Rust后端核心接口

### **1. 数据源管理接口**

#### **DataSource Trait**
```rust
/// 核心数据源trait - 所有数据源必须实现
#[async_trait::async_trait]
pub trait DataSource: Send + Sync {
    /// 获取数据源ID
    fn get_id(&self) -> &str;
    
    /// 获取数据源显示名称
    fn get_name(&self) -> &str;
    
    /// 获取数据源类型
    fn get_type(&self) -> DataSourceType;
    
    /// 查询数据 - 核心方法
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError>;
    
    /// 获取数据Schema
    fn get_schema(&self) -> DataSchema;
    
    /// 测试连接状态
    async fn test_connection(&self) -> Result<bool, DataError>;
    
    /// 获取数据源能力描述
    fn get_capabilities(&self) -> DataSourceCapabilities;
    
    /// 刷新Schema (可选)
    async fn refresh_schema(&mut self) -> Result<(), DataError> {
        Ok(())
    }
    
    /// 是否支持实时数据
    fn supports_real_time(&self) -> bool {
        false
    }
    
    /// 获取连接信息 (用于调试)
    fn get_connection_info(&self) -> Option<serde_json::Value> {
        None
    }
}
```

#### **DataSourceProvider Trait**
```rust
/// 数据源提供者trait - 用于扩展新类型数据源
#[async_trait::async_trait]  
pub trait DataSourceProvider: Send + Sync {
    /// 获取提供者类型名称 (全局唯一)
    fn get_type_name(&self) -> &'static str;
    
    /// 获取显示名称
    fn get_display_name(&self) -> &'static str;
    
    /// 获取描述信息
    fn get_description(&self) -> &'static str;
    
    /// 获取图标名称 (可选)
    fn get_icon(&self) -> Option<&'static str> { None }
    
    /// 获取版本信息
    fn get_version(&self) -> &'static str { "1.0.0" }
    
    /// 获取配置Schema
    fn get_config_schema(&self) -> ConfigSchema;
    
    /// 验证配置参数
    fn validate_config(&self, config: &serde_json::Value) -> Result<(), ConfigError>;
    
    /// 获取默认配置
    fn get_default_config(&self) -> serde_json::Value;
    
    /// 创建数据源实例
    async fn create_source(
        &self,
        id: String,
        name: String,
        config: &serde_json::Value
    ) -> Result<Box<dyn DataSource>, ProviderError>;
    
    /// 测试连接 (创建前验证)
    async fn test_connection(&self, config: &serde_json::Value) -> Result<bool, ProviderError>;
    
    /// Schema发现 (可选)
    async fn discover_schema(&self, config: &serde_json::Value) -> Result<DataSchema, ProviderError> {
        Err(ProviderError::NotSupported("Schema discovery not supported".to_string()))
    }
    
    /// 是否支持配置向导
    fn supports_wizard(&self) -> bool { false }
    
    /// 获取向导步骤 (可选)
    async fn get_wizard_steps(&self) -> Result<Vec<WizardStep>, ProviderError> {
        Ok(vec![])
    }
    
    /// 获取示例配置 (用于文档和测试)
    fn get_example_configs(&self) -> Vec<(String, serde_json::Value)> {
        vec![]
    }
}
```

#### **DataSourceRegistry API**
```rust
/// 数据源注册表 - 管理所有数据源实例
impl DataSourceRegistry {
    /// 创建新的注册表实例
    pub fn new(storage: Box<dyn ConfigStorage>) -> Self;
    
    /// 注册数据源提供者
    pub fn register_provider<T>(&mut self, provider: T) -> Result<(), RegistryError>
    where T: DataSourceProvider + 'static;
    
    /// 获取所有可用的数据源类型
    pub fn get_available_types(&self) -> Vec<DataSourceTypeInfo>;
    
    /// 创建数据源实例
    pub async fn create_data_source(
        &mut self,
        id: String,
        name: String,
        provider_type: String,
        config: serde_json::Value
    ) -> Result<String, RegistryError>;
    
    /// 获取数据源实例
    pub fn get_data_source(&self, id: &str) -> Option<&dyn DataSource>;
    
    /// 获取可变数据源实例
    pub fn get_data_source_mut(&mut self, id: &str) -> Option<&mut dyn DataSource>;
    
    /// 查询数据
    pub async fn query_data(
        &self,
        source_id: &str,
        query: Option<DataQuery>
    ) -> Result<DataSet, RegistryError>;
    
    /// 列出所有数据源
    pub fn list_all_sources(&self) -> Vec<DataSourceInfo>;
    
    /// 删除数据源
    pub async fn remove_data_source(&mut self, id: &str) -> Result<(), RegistryError>;
    
    /// 更新数据源配置
    pub async fn update_data_source_config(
        &mut self,
        id: &str,
        config: serde_json::Value
    ) -> Result<(), RegistryError>;
    
    /// 批量操作
    pub async fn batch_query(
        &self,
        requests: Vec<BatchQueryRequest>
    ) -> Result<Vec<BatchQueryResponse>, RegistryError>;
}
```

### **2. 核心数据类型定义**

#### **查询相关类型**
```rust
/// 数据查询参数
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DataQuery {
    /// JSONPath表达式或字段路径
    pub path: Option<String>,
    
    /// 过滤条件 (简单表达式)
    pub filter: Option<String>,
    
    /// 限制返回行数
    pub limit: Option<usize>,
    
    /// 偏移量 (分页)
    pub offset: Option<usize>,
    
    /// 排序字段
    pub sort: Option<Vec<SortField>>,
    
    /// 聚合查询 (高级功能)
    pub aggregation: Option<AggregationQuery>,
    
    /// 查询上下文 (用于权限控制)
    pub context: Option<QueryContext>,
}

/// 排序字段
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SortField {
    pub field: String,
    pub direction: SortDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortDirection {
    Asc, Desc
}

/// 聚合查询
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AggregationQuery {
    pub group_by: Vec<String>,
    pub aggregations: Vec<Aggregation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Aggregation {
    pub field: String,
    pub function: AggregateFunction,
    pub alias: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AggregateFunction {
    Count, Sum, Avg, Min, Max, First, Last
}
```

#### **数据集类型**
```rust
/// 统一数据集格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSet {
    /// 列定义
    pub columns: Vec<DataColumn>,
    
    /// 数据行 (JSON格式)
    pub rows: Vec<serde_json::Value>,
    
    /// 总行数 (可能大于rows长度)
    pub total_count: usize,
    
    /// 元数据
    pub metadata: Option<DataSetMetadata>,
    
    /// 是否来自缓存
    pub cached: bool,
    
    /// 缓存时间
    pub cache_time: Option<DateTime<Utc>>,
    
    /// 数据校验信息
    pub checksum: Option<String>,
}

/// 数据集元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSetMetadata {
    /// 数据源ID
    pub source_id: String,
    
    /// 查询执行时间 (毫秒)
    pub execution_time: u64,
    
    /// 数据生成时间
    pub generated_at: DateTime<Utc>,
    
    /// 数据版本 (用于缓存失效)
    pub version: Option<String>,
    
    /// 警告信息
    pub warnings: Vec<String>,
    
    /// 分页信息
    pub pagination: Option<PaginationInfo>,
    
    /// 数据质量指标
    pub quality_metrics: Option<DataQualityMetrics>,
}

/// 分页信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub current_page: usize,
    pub page_size: usize,
    pub total_pages: usize,
    pub has_next: bool,
    pub has_previous: bool,
}
```

#### **Schema类型**
```rust
/// 数据Schema定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSchema {
    /// 列定义
    pub columns: Vec<DataColumn>,
    
    /// 主键 (可选)
    pub primary_key: Option<Vec<String>>,
    
    /// 索引信息
    pub indexes: Vec<IndexInfo>,
    
    /// 关系定义
    pub relationships: Vec<RelationshipInfo>,
    
    /// Schema版本
    pub version: String,
    
    /// 最后更新时间
    pub last_updated: DateTime<Utc>,
}

/// 数据列定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataColumn {
    /// 列名 (程序中使用)
    pub name: String,
    
    /// 显示名称 (UI中显示)
    pub display_name: Option<String>,
    
    /// 数据类型
    pub data_type: DataType,
    
    /// 是否可为空
    pub nullable: bool,
    
    /// 描述信息
    pub description: Option<String>,
    
    /// 格式提示 (currency, percentage, email等)
    pub format_hint: Option<String>,
    
    /// 默认值
    pub default_value: Option<serde_json::Value>,
    
    /// 列约束
    pub constraints: Vec<ColumnConstraint>,
    
    /// 示例值
    pub sample_values: Vec<serde_json::Value>,
}

/// 数据类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataType {
    /// 字符串类型
    String,
    /// 数值类型 (整数或浮点数)
    Number,
    /// 布尔类型
    Boolean,
    /// 日期类型 (YYYY-MM-DD)
    Date,
    /// 日期时间类型
    DateTime,
    /// 对象类型
    Object,
    /// 数组类型
    Array,
    /// 二进制类型
    Binary,
    /// 空值类型
    Null,
    /// 自定义类型
    Custom(String),
}
```

### **3. 配置管理接口**

#### **配置Schema定义**
```rust
/// 配置Schema - 描述数据源配置参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSchema {
    /// Schema版本
    pub version: String,
    
    /// 配置字段定义
    pub fields: Vec<ConfigField>,
    
    /// 必填字段列表
    pub required_fields: Vec<String>,
    
    /// 字段分组 (用于UI展示)
    pub field_groups: Vec<ConfigGroup>,
    
    /// 验证规则
    pub validation_rules: Vec<ValidationRule>,
    
    /// 示例配置
    pub examples: Vec<ConfigExample>,
}

/// 配置字段定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigField {
    /// 字段名
    pub name: String,
    
    /// 显示名称
    pub display_name: String,
    
    /// 帮助文本
    pub description: Option<String>,
    
    /// 字段类型
    pub field_type: ConfigFieldType,
    
    /// 默认值
    pub default_value: Option<serde_json::Value>,
    
    /// 是否必填
    pub required: bool,
    
    /// 依赖字段 (条件显示)
    pub depends_on: Option<String>,
    
    /// 字段验证规则
    pub validation: Option<FieldValidation>,
    
    /// 字段提示信息
    pub placeholder: Option<String>,
    
    /// 字段分组
    pub group: Option<String>,
    
    /// 排序权重
    pub order: i32,
}

/// 配置字段类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigFieldType {
    /// 文本输入
    Text,
    /// 密码输入
    Password,
    /// 数值输入
    Number { 
        min: Option<f64>, 
        max: Option<f64>,
        step: Option<f64>,
    },
    /// 布尔开关
    Boolean,
    /// 单选下拉
    Select { 
        options: Vec<SelectOption>,
        searchable: bool,
    },
    /// 多选
    MultiSelect { 
        options: Vec<SelectOption>,
        max_selections: Option<usize>,
    },
    /// 文件选择
    File { 
        accept: String,
        multiple: bool,
        max_size: Option<usize>, // bytes
    },
    /// URL输入
    Url,
    /// JSON编辑器
    Json,
    /// 代码编辑器
    Code { 
        language: String,
        theme: Option<String>,
    },
    /// 颜色选择器
    Color,
    /// 日期选择器
    Date,
    /// 日期时间选择器
    DateTime,
    /// 键值对编辑器
    KeyValue,
    /// 自定义组件
    Custom(String),
}

/// 选择项定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectOption {
    pub value: serde_json::Value,
    pub label: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub disabled: bool,
}
```

### **4. 错误处理接口**

#### **错误类型定义**
```rust
/// 数据源相关错误
#[derive(Debug, thiserror::Error)]
pub enum DataError {
    #[error("IO error: {message}")]
    IoError { message: String, source: Option<std::io::ErrorKind> },
    
    #[error("Parse error: {message}")]
    ParseError { message: String, line: Option<usize>, column: Option<usize> },
    
    #[error("Connection failed: {message}")]
    ConnectionError { message: String, retry_after: Option<Duration> },
    
    #[error("Authentication failed: {message}")]
    AuthError { message: String, error_code: Option<String> },
    
    #[error("Query error: {message}")]
    QueryError { message: String, query: Option<String> },
    
    #[error("Path not found: {path}")]
    PathNotFound { path: String, available_paths: Vec<String> },
    
    #[error("Invalid configuration: {message}")]
    ConfigError { message: String, field: Option<String> },
    
    #[error("Timeout error: {message}")]
    Timeout { message: String, duration: Duration },
    
    #[error("Permission denied: {message}")]
    PermissionDenied { message: String, required_permission: Option<String> },
    
    #[error("Resource not found: {resource_type} {resource_id}")]
    ResourceNotFound { resource_type: String, resource_id: String },
    
    #[error("Rate limit exceeded: {message}")]
    RateLimited { message: String, retry_after: Duration },
    
    #[error("Data validation failed: {message}")]
    ValidationError { message: String, violations: Vec<ValidationViolation> },
    
    #[error("Internal error: {message}")]
    Internal { message: String, error_id: Option<String> },
}

/// 注册表错误
#[derive(Debug, thiserror::Error)]
pub enum RegistryError {
    #[error("Provider not found: {provider_type}")]
    ProviderNotFound { provider_type: String },
    
    #[error("Provider already exists: {provider_type}")]
    ProviderExists { provider_type: String },
    
    #[error("Data source not found: {source_id}")]
    SourceNotFound { source_id: String },
    
    #[error("Configuration error: {0}")]
    ConfigError(#[from] ConfigError),
    
    #[error("Data error: {0}")]
    DataError(#[from] DataError),
    
    #[error("Storage error: {message}")]
    StorageError { message: String },
    
    #[error("Validation failed: {message}")]
    ValidationFailed { message: String, errors: Vec<String> },
}

/// 统一错误响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    /// 错误类型
    pub error_type: String,
    
    /// 错误消息
    pub message: String,
    
    /// 错误详情
    pub details: Option<serde_json::Value>,
    
    /// 错误码
    pub error_code: Option<String>,
    
    /// 错误ID (用于追踪)
    pub error_id: Option<String>,
    
    /// 时间戳
    pub timestamp: DateTime<Utc>,
    
    /// 重试建议
    pub retry_after: Option<Duration>,
    
    /// 相关资源
    pub related_resources: Vec<String>,
}
```

---

## 📱 Tauri接口层API

### **1. 数据源管理Commands**

```rust
/// 获取所有可用的数据源类型
#[tauri::command]
pub async fn get_available_data_source_types(
    registry: State<'_, DataRegistry>
) -> Result<Vec<DataSourceTypeInfo>, String>;

/// 创建数据源实例
#[tauri::command]  
pub async fn create_data_source(
    name: String,
    provider_type: String,
    config: serde_json::Value,
    registry: State<'_, DataRegistry>
) -> Result<String, String>;

/// 测试数据源连接
#[tauri::command]
pub async fn test_data_source_connection(
    provider_type: String,
    config: serde_json::Value,
    registry: State<'_, DataRegistry>
) -> Result<bool, String>;

/// 列出所有数据源
#[tauri::command]
pub async fn list_data_sources(
    registry: State<'_, DataRegistry>
) -> Result<Vec<DataSourceInfo>, String>;

/// 获取数据源详情
#[tauri::command]
pub async fn get_data_source_info(
    source_id: String,
    registry: State<'_, DataRegistry>
) -> Result<DataSourceDetail, String>;

/// 更新数据源配置
#[tauri::command]
pub async fn update_data_source_config(
    source_id: String,
    config: serde_json::Value,
    registry: State<'_, DataRegistry>
) -> Result<(), String>;

/// 删除数据源
#[tauri::command]
pub async fn delete_data_source(
    source_id: String,
    registry: State<'_, DataRegistry>
) -> Result<(), String>;

/// 复制数据源
#[tauri::command]
pub async fn duplicate_data_source(
    source_id: String,
    new_name: String,
    registry: State<'_, DataRegistry>
) -> Result<String, String>;
```

### **2. 数据查询Commands**

```rust
/// 查询数据 (通用接口)
#[tauri::command]
pub async fn query_data_source(
    source_id: String,
    query: Option<DataQuery>,
    registry: State<'_, DataRegistry>
) -> Result<DataSet, String>;

/// 获取数据预览 (限制行数)
#[tauri::command]
pub async fn get_data_preview(
    source_id: String,
    path: Option<String>,
    limit: Option<usize>,
    registry: State<'_, DataRegistry>
) -> Result<DataSet, String>;

/// 求值表达式
#[tauri::command]
pub async fn evaluate_expression(
    source_id: String,
    expression: String,
    context: Option<serde_json::Value>,
    registry: State<'_, DataRegistry>
) -> Result<serde_json::Value, String>;

/// 批量表达式求值
#[tauri::command]
pub async fn evaluate_expressions_batch(
    source_id: String,
    expressions: Vec<String>,
    context: Option<serde_json::Value>,
    registry: State<'_, DataRegistry>
) -> Result<Vec<ExpressionResult>, String>;

/// 获取数据统计信息
#[tauri::command]
pub async fn get_data_statistics(
    source_id: String,
    fields: Option<Vec<String>>,
    registry: State<'_, DataRegistry>
) -> Result<DataStatistics, String>;

/// 搜索数据
#[tauri::command]
pub async fn search_data(
    source_id: String,
    search_term: String,
    fields: Option<Vec<String>>,
    limit: Option<usize>,
    registry: State<'_, DataRegistry>
) -> Result<DataSet, String>;
```

### **3. Schema管理Commands**

```rust
/// 获取数据源Schema
#[tauri::command]
pub async fn get_data_source_schema(
    source_id: String,
    registry: State<'_, DataRegistry>
) -> Result<DataSchema, String>;

/// 刷新数据源Schema
#[tauri::command]
pub async fn refresh_data_source_schema(
    source_id: String,
    registry: State<'_, DataRegistry>  
) -> Result<DataSchema, String>;

/// 发现Schema (自动推断)
#[tauri::command]
pub async fn discover_schema(
    provider_type: String,
    config: serde_json::Value,
    registry: State<'_, DataRegistry>
) -> Result<DataSchema, String>;

/// 验证Schema变更
#[tauri::command]
pub async fn validate_schema_changes(
    source_id: String,
    new_schema: DataSchema,
    registry: State<'_, DataRegistry>
) -> Result<SchemaValidationResult, String>;

/// 获取Schema历史
#[tauri::command]
pub async fn get_schema_history(
    source_id: String,
    limit: Option<usize>,
    registry: State<'_, DataRegistry>
) -> Result<Vec<SchemaVersion>, String>;
```

### **4. 配置管理Commands**

```rust
/// 获取配置Schema
#[tauri::command]
pub async fn get_config_schema(
    provider_type: String,
    registry: State<'_, DataRegistry>
) -> Result<ConfigSchema, String>;

/// 验证配置参数
#[tauri::command]
pub async fn validate_config(
    provider_type: String,
    config: serde_json::Value,
    registry: State<'_, DataRegistry>
) -> Result<ConfigValidationResult, String>;

/// 获取默认配置
#[tauri::command]
pub async fn get_default_config(
    provider_type: String,
    registry: State<'_, DataRegistry>
) -> Result<serde_json::Value, String>;

/// 获取示例配置
#[tauri::command]
pub async fn get_example_configs(
    provider_type: String,
    registry: State<'_, DataRegistry>
) -> Result<Vec<ConfigExample>, String>;

/// 导入配置
#[tauri::command]
pub async fn import_config(
    config_data: String,
    format: ConfigFormat,
    registry: State<'_, DataRegistry>
) -> Result<Vec<DataSourceConfig>, String>;

/// 导出配置
#[tauri::command]
pub async fn export_config(
    source_ids: Vec<String>,
    format: ConfigFormat,
    registry: State<'_, DataRegistry>
) -> Result<String, String>;
```

---

## 🔌 TypeScript前端接口

### **1. 核心类型定义**

```typescript
// === src/utils/data-types.ts ===

/** 数据源类型信息 */
export interface DataSourceTypeInfo {
  type_name: string;
  display_name: string;
  description: string;
  icon?: string;
  version: string;
  config_schema: ConfigSchema;
  capabilities: string[];
}

/** 数据源实例信息 */
export interface DataSourceInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
  last_used: string;
  connection_info?: Record<string, any>;
}

/** 数据源详细信息 */
export interface DataSourceDetail extends DataSourceInfo {
  config: Record<string, any>;
  schema: DataSchema;
  capabilities: DataSourceCapabilities;
  statistics?: DataStatistics;
  health_status: HealthStatus;
}

/** 数据查询参数 */
export interface DataQuery {
  path?: string;
  filter?: string;
  limit?: number;
  offset?: number;
  sort?: SortField[];
  aggregation?: AggregationQuery;
  context?: Record<string, any>;
}

/** 数据集 */
export interface DataSet {
  columns: DataColumn[];
  rows: any[];
  total_count: number;
  metadata?: DataSetMetadata;
  cached: boolean;
  cache_time?: string;
  checksum?: string;
}

/** 数据列 */
export interface DataColumn {
  name: string;
  display_name?: string;
  data_type: DataType;
  nullable: boolean;
  description?: string;
  format_hint?: string;
  default_value?: any;
  constraints: ColumnConstraint[];
  sample_values: any[];
}

/** 数据类型 */
export type DataType = 
  | 'String' | 'Number' | 'Boolean' 
  | 'Date' | 'DateTime' | 'Object' 
  | 'Array' | 'Binary' | 'Null' 
  | { Custom: string };

/** 配置Schema */
export interface ConfigSchema {
  version: string;
  fields: ConfigField[];
  required_fields: string[];
  field_groups: ConfigGroup[];
  validation_rules: ValidationRule[];
  examples: ConfigExample[];
}

/** 配置字段 */
export interface ConfigField {
  name: string;
  display_name: string;
  description?: string;
  field_type: ConfigFieldType;
  default_value?: any;
  required: boolean;
  depends_on?: string;
  validation?: FieldValidation;
  placeholder?: string;
  group?: string;
  order: number;
}

/** 配置字段类型 */
export type ConfigFieldType =
  | 'Text'
  | 'Password'
  | { Number: { min?: number; max?: number; step?: number } }
  | 'Boolean'
  | { Select: { options: SelectOption[]; searchable: boolean } }
  | { MultiSelect: { options: SelectOption[]; max_selections?: number } }
  | { File: { accept: string; multiple: boolean; max_size?: number } }
  | 'Url'
  | 'Json'
  | { Code: { language: string; theme?: string } }
  | 'Color'
  | 'Date'
  | 'DateTime'
  | 'KeyValue'
  | { Custom: string };

/** API错误 */
export interface ApiError {
  error_type: string;
  message: string;
  details?: any;
  error_code?: string;
  error_id?: string;
  timestamp: string;
  retry_after?: number;
  related_resources: string[];
}
```

### **2. API客户端封装**

```typescript
// === src/utils/data-api.ts ===
import { invoke } from '@tauri-apps/api/tauri';
import type {
  DataSourceTypeInfo,
  DataSourceInfo,
  DataSourceDetail,
  DataQuery,
  DataSet,
  DataSchema,
  ConfigSchema,
  ApiError
} from './data-types';

/**
 * 数据源API客户端
 * 封装所有与数据源相关的Tauri命令调用
 */
export class DataSourceAPI {
  
  // ========== 数据源管理 ==========
  
  /**
   * 获取所有可用的数据源类型
   */
  static async getAvailableTypes(): Promise<DataSourceTypeInfo[]> {
    try {
      return await invoke<DataSourceTypeInfo[]>('get_available_data_source_types');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 创建数据源实例
   */
  static async createDataSource(
    name: string,
    providerType: string,
    config: Record<string, any>
  ): Promise<string> {
    try {
      return await invoke<string>('create_data_source', {
        name,
        provider_type: providerType,
        config
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 测试数据源连接
   */
  static async testConnection(
    providerType: string,
    config: Record<string, any>
  ): Promise<boolean> {
    try {
      return await invoke<boolean>('test_data_source_connection', {
        provider_type: providerType,
        config
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 列出所有数据源
   */
  static async listDataSources(): Promise<DataSourceInfo[]> {
    try {
      return await invoke<DataSourceInfo[]>('list_data_sources');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取数据源详情
   */
  static async getDataSourceInfo(sourceId: string): Promise<DataSourceDetail> {
    try {
      return await invoke<DataSourceDetail>('get_data_source_info', {
        source_id: sourceId
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 删除数据源
   */
  static async deleteDataSource(sourceId: string): Promise<void> {
    try {
      await invoke<void>('delete_data_source', {
        source_id: sourceId
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========== 数据查询 ==========
  
  /**
   * 查询数据
   */
  static async queryData(
    sourceId: string,
    query?: DataQuery
  ): Promise<DataSet> {
    try {
      return await invoke<DataSet>('query_data_source', {
        source_id: sourceId,
        query
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取数据预览
   */
  static async getDataPreview(
    sourceId: string,
    path?: string,
    limit: number = 50
  ): Promise<DataSet> {
    try {
      return await invoke<DataSet>('get_data_preview', {
        source_id: sourceId,
        path,
        limit
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 求值表达式
   */
  static async evaluateExpression(
    sourceId: string,
    expression: string,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      return await invoke('evaluate_expression', {
        source_id: sourceId,
        expression,
        context
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 批量求值表达式
   */
  static async evaluateExpressionsBatch(
    sourceId: string,
    expressions: string[],
    context?: Record<string, any>
  ): Promise<Array<{ expression: string; result: any; error?: string }>> {
    try {
      return await invoke('evaluate_expressions_batch', {
        source_id: sourceId,
        expressions,
        context
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 搜索数据
   */
  static async searchData(
    sourceId: string,
    searchTerm: string,
    fields?: string[],
    limit: number = 50
  ): Promise<DataSet> {
    try {
      return await invoke<DataSet>('search_data', {
        source_id: sourceId,
        search_term: searchTerm,
        fields,
        limit
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========== Schema管理 ==========
  
  /**
   * 获取数据源Schema
   */
  static async getSchema(sourceId: string): Promise<DataSchema> {
    try {
      return await invoke<DataSchema>('get_data_source_schema', {
        source_id: sourceId
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 刷新Schema
   */
  static async refreshSchema(sourceId: string): Promise<DataSchema> {
    try {
      return await invoke<DataSchema>('refresh_data_source_schema', {
        source_id: sourceId
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 发现Schema
   */
  static async discoverSchema(
    providerType: string,
    config: Record<string, any>
  ): Promise<DataSchema> {
    try {
      return await invoke<DataSchema>('discover_schema', {
        provider_type: providerType,
        config
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========== 配置管理 ==========
  
  /**
   * 获取配置Schema
   */
  static async getConfigSchema(providerType: string): Promise<ConfigSchema> {
    try {
      return await invoke<ConfigSchema>('get_config_schema', {
        provider_type: providerType
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 验证配置
   */
  static async validateConfig(
    providerType: string,
    config: Record<string, any>
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      return await invoke('validate_config', {
        provider_type: providerType,
        config
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取默认配置
   */
  static async getDefaultConfig(providerType: string): Promise<Record<string, any>> {
    try {
      return await invoke('get_default_config', {
        provider_type: providerType
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========== 工具方法 ==========

  /**
   * 错误处理
   */
  private static handleError(error: any): Error {
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error && typeof error === 'object') {
      const apiError = error as ApiError;
      const message = apiError.message || 'Unknown error';
      const fullError = new Error(message);
      (fullError as any).details = apiError;
      return fullError;
    }
    
    return new Error('Unknown error occurred');
  }

  /**
   * 验证JSONPath表达式
   */
  static validateJsonPath(expression: string): { valid: boolean; error?: string } {
    if (!expression || expression.trim().length === 0) {
      return { valid: false, error: 'Expression cannot be empty' };
    }
    
    // 基本语法检查
    const bracketMatches = expression.match(/[\[\]]/g);
    if (bracketMatches && bracketMatches.length % 2 !== 0) {
      return { valid: false, error: 'Unmatched brackets' };
    }
    
    // 检查非法字符
    if (!/^[a-zA-Z0-9_.\[\]"']+$/.test(expression)) {
      return { valid: false, error: 'Invalid characters in expression' };
    }
    
    return { valid: true };
  }

  /**
   * 生成示例表达式
   */
  static generateSampleExpressions(columns: DataColumn[]): string[] {
    return columns
      .filter(col => col.data_type !== 'Object' && col.data_type !== 'Array')
      .map(col => col.name)
      .slice(0, 10);
  }

  /**
   * 格式化数据值
   */
  static formatValue(value: any, column: DataColumn): string {
    if (value === null || value === undefined) {
      return '-';
    }

    // 根据格式提示进行格式化
    if (column.format_hint) {
      switch (column.format_hint) {
        case 'currency':
          return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value);
        case 'percentage':
          return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value);
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'datetime':
          return new Date(value).toLocaleString();
        default:
          break;
      }
    }

    // 根据数据类型格式化
    switch (column.data_type) {
      case 'Object':
      case 'Array':
        return JSON.stringify(value, null, 0);
      case 'Boolean':
        return value ? '✓' : '✗';
      case 'Date':
        return new Date(value).toLocaleDateString();
      case 'DateTime':
        return new Date(value).toLocaleString();
      default:
        return String(value);
    }
  }
}

// 默认导出
export default DataSourceAPI;

// 便捷的函数导出
export const {
  getAvailableTypes,
  createDataSource,
  testConnection,
  listDataSources,
  getDataSourceInfo,
  deleteDataSource,
  queryData,
  getDataPreview,
  evaluateExpression,
  getSchema,
  refreshSchema,
  getConfigSchema,
  validateConfig,
  validateJsonPath,
  formatValue
} = DataSourceAPI;
```

### **3. React Hook封装 (可选)**

```typescript
// === src/hooks/useDataSources.ts ===
import { createSignal, createEffect, createResource } from 'solid-js';
import { DataSourceAPI } from '../utils/data-api';
import type { DataSourceInfo, DataSourceTypeInfo } from '../utils/data-types';

/**
 * 数据源管理Hook
 */
export function useDataSources() {
  const [sources, setSources] = createSignal<DataSourceInfo[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // 加载数据源列表
  const loadSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sourceList = await DataSourceAPI.listDataSources();
      setSources(sourceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  // 创建数据源
  const createSource = async (
    name: string,
    providerType: string,
    config: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const sourceId = await DataSourceAPI.createDataSource(name, providerType, config);
      await loadSources(); // 刷新列表
      return sourceId;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create data source';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除数据源
  const deleteSource = async (sourceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await DataSourceAPI.deleteDataSource(sourceId);
      await loadSources(); // 刷新列表
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete data source';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  createEffect(() => {
    loadSources();
  });

  return {
    sources,
    loading,
    error,
    loadSources,
    createSource,
    deleteSource
  };
}

/**
 * 数据源类型Hook
 */
export function useDataSourceTypes() {
  const [types] = createResource<DataSourceTypeInfo[]>(async () => {
    return await DataSourceAPI.getAvailableTypes();
  });

  return {
    types,
    loading: types.loading,
    error: types.error
  };
}
```

---

**文档状态**: API接口规范完成  
**涵盖范围**: Rust后端 + Tauri接口 + TypeScript前端  
**下一步**: 根据此规范进行具体实现开发