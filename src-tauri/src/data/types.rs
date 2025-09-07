// === 数据源层核心类型定义 ===
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use thiserror::Error;

// ========== 核心数据类型 ==========

/// 数据源类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataSourceType {
    Json,
    Database(DatabaseType),
    Api(String),
    File(FileType),
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DatabaseType {
    MySQL,
    PostgreSQL,
    Oracle,
    SQLServer,
    MongoDB,
    Redis,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FileType {
    Csv,
    Excel,
    Parquet,
    Xml,
}

/// 数据类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataType {
    String,
    Number,
    Boolean,
    Date,
    DateTime,
    Object,
    Array,
    Binary,
    Null,
    Custom(String),
}

/// 数据查询参数
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
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
    pub context: Option<serde_json::Value>,
}

/// 排序字段
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SortField {
    pub field: String,
    pub direction: SortDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortDirection {
    Asc,
    Desc,
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
    Count,
    Sum,
    Avg,
    Min,
    Max,
    First,
    Last,
}

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

/// 数据质量指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataQualityMetrics {
    pub completeness: f64,      // 完整性 (0-1)
    pub accuracy: f64,          // 准确性 (0-1)
    pub consistency: f64,       // 一致性 (0-1)
    pub validity: f64,          // 有效性 (0-1)
    pub uniqueness: f64,        // 唯一性 (0-1)
    pub timeliness: f64,        // 及时性 (0-1)
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
    /// 源列名 (用于数据库字段映射)
    pub source_column: Option<String>,
    /// 源表名 (用于数据库字段映射)
    pub source_table: Option<String>,
    /// 是否为主键
    pub is_primary_key: bool,
    /// 是否为外键
    pub is_foreign_key: bool,
}

/// 列约束
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ColumnConstraint {
    NotNull,
    Unique,
    PrimaryKey,
    ForeignKey { table: String, column: String },
    Check { expression: String },
    Length { min: Option<usize>, max: Option<usize> },
    Range { min: Option<f64>, max: Option<f64> },
    Pattern { regex: String },
    Custom { name: String, params: serde_json::Value },
}

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

/// 索引信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexInfo {
    pub name: String,
    pub columns: Vec<String>,
    pub unique: bool,
    pub partial: Option<String>, // WHERE clause for partial index
}

/// 关系定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipInfo {
    pub name: String,
    pub relationship_type: RelationshipType,
    pub local_columns: Vec<String>,
    pub foreign_table: String,
    pub foreign_columns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationshipType {
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
}

/// 数据源能力描述
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceCapabilities {
    pub supports_query: bool,
    pub supports_filter: bool,
    pub supports_sort: bool,
    pub supports_aggregation: bool,
    pub supports_real_time: bool,
    pub supports_schema_refresh: bool,
    pub max_concurrent_connections: usize,
    pub estimated_query_cost: QueryCost,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryCost {
    Low,    // < 100ms
    Medium, // 100ms - 1s
    High,   // 1s - 10s
    VeryHigh, // > 10s
}

// ========== 配置管理类型 ==========

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

/// 配置组定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigGroup {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub fields: Vec<String>,
    pub collapsible: bool,
}

/// 验证规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub name: String,
    pub description: String,
    pub expression: String,
    pub error_message: String,
}

/// 字段验证
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldValidation {
    pub required_if: Option<String>,
    pub pattern: Option<String>,
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
    pub custom: Option<String>,
}

/// 配置示例
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigExample {
    pub name: String,
    pub description: String,
    pub config: serde_json::Value,
}

/// 向导步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardStep {
    pub id: String,
    pub title: String,
    pub description: String,
    pub fields: Vec<String>,
    pub validation_required: bool,
}

// ========== 信息类型 ==========

/// 数据源类型信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceTypeInfo {
    pub type_name: String,
    pub display_name: String,
    pub description: String,
    pub icon: Option<String>,
    pub version: String,
    pub config_schema: ConfigSchema,
    pub capabilities: Vec<String>,
}

/// 数据源实例信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceInfo {
    pub id: String,
    pub name: String,
    pub provider_type: String,  // 改为 provider_type 以匹配前端
    pub status: String,         // 改为字符串类型以匹配前端
    pub created_at: String,     // 改为字符串格式
    pub last_updated: String,   // 改为 last_updated 匹配前端
    pub metadata: std::collections::HashMap<String, serde_json::Value>, // 添加 metadata 字段
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Connected,
    Disconnected,
    Error,
    Testing,
}

/// 数据源详细信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceDetail {
    pub id: String,
    pub name: String,
    pub type_name: String,
    pub config: serde_json::Value,
    pub schema: DataSchema,
    pub capabilities: DataSourceCapabilities,
    pub status: ConnectionStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_used: Option<DateTime<Utc>>,
    pub statistics: Option<DataStatistics>,
    pub health_status: HealthStatus,
}

/// 数据统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataStatistics {
    pub total_records: usize,
    pub column_stats: Vec<ColumnStatistics>,
    pub last_updated: DateTime<Utc>,
}

/// 列统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnStatistics {
    pub column_name: String,
    pub non_null_count: usize,
    pub null_count: usize,
    pub unique_count: usize,
    pub min_value: Option<serde_json::Value>,
    pub max_value: Option<serde_json::Value>,
    pub avg_value: Option<f64>,
}

/// 健康状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthStatus {
    pub is_healthy: bool,
    pub last_check: DateTime<Utc>,
    pub issues: Vec<String>,
    pub performance_metrics: Option<PerformanceMetrics>,
}

/// 性能指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_query_time: Duration,
    pub successful_queries: usize,
    pub failed_queries: usize,
    pub cache_hit_rate: f64,
}

/// 数据源配置存储 - 简化版本
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceConfig {
    pub id: String,
    pub name: String,
    pub source_type: DataSourceConfigType,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl DataSourceConfig {
    /// 获取提供者类型（兼容性方法）
    pub fn get_provider_type(&self) -> String {
        match &self.source_type {
            DataSourceConfigType::Database(_) => "database".to_string(),
            DataSourceConfigType::File(_) => "file".to_string(),
            DataSourceConfigType::Api(_) => "api".to_string(),
        }
    }
    
    /// 获取配置JSON（兼容性方法）
    pub fn get_config_json(&self) -> serde_json::Value {
        match &self.source_type {
            DataSourceConfigType::Database(db_config) => {
                serde_json::json!({
                    "database_type": db_config.database_type,
                    "host": db_config.host,
                    "port": db_config.port,
                    "database": db_config.database,
                    "username": db_config.username,
                    "password": db_config.password,
                })
            },
            DataSourceConfigType::File(file_config) => {
                serde_json::json!({
                    "file_type": file_config.file_type,
                    "path": file_config.path,
                    "sheet": file_config.sheet,
                    "range": file_config.range,
                    "delimiter": file_config.delimiter,
                    "encoding": file_config.encoding,
                })
            },
            DataSourceConfigType::Api(api_config) => {
                serde_json::json!({
                    "url": api_config.url,
                    "method": api_config.method,
                    "headers": api_config.headers,
                    "body": api_config.body,
                    "auth_type": api_config.auth_type,
                    "auth_token": api_config.auth_token,
                })
            },
        }
    }
}

/// 数据源配置类型枚举 - 支持多种数据源
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataSourceConfigType {
    Database(DatabaseSourceConfig),
    File(FileSourceConfig),
    Api(ApiSourceConfig),
}

/// 数据库数据源配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DatabaseSourceConfig {
    pub database_type: String,  // "mysql", "postgresql", "sqlite", etc.
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: Option<String>,
    pub sql: String,  // 核心：查询SQL
    pub selected_tables: Vec<String>, // 可选：用于UI显示已选择的表
}

/// 文件数据源配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileSourceConfig {
    pub file_type: String,      // "excel", "csv", "json"
    pub path: String,
    pub sheet: Option<String>,   // Excel专用
    pub range: Option<String>,   // Excel专用：如 "A1:Z1000"
    pub delimiter: Option<char>, // CSV专用
    pub encoding: Option<String>, // 文件编码
}

/// API数据源配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ApiSourceConfig {
    pub url: String,
    pub method: String,          // "GET", "POST", etc.
    pub headers: std::collections::HashMap<String, String>,
    pub body: Option<String>,
    pub auth_type: Option<String>, // "bearer", "basic", etc.
    pub auth_token: Option<String>,
}

/// 批量查询请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchQueryRequest {
    pub source_id: String,
    pub query: Option<DataQuery>,
    pub request_id: String,
}

/// 批量查询响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchQueryResponse {
    pub request_id: String,
    pub result: Result<DataSet, String>,
}

/// 表达式求值结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpressionResult {
    pub expression: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// 配置验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Schema验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaValidationResult {
    pub valid: bool,
    pub changes: Vec<SchemaChange>,
    pub warnings: Vec<String>,
}

/// Schema变更
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaChange {
    pub change_type: SchemaChangeType,
    pub column_name: String,
    pub old_type: Option<DataType>,
    pub new_type: Option<DataType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SchemaChangeType {
    Added,
    Removed,
    Modified,
}

/// Schema版本
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaVersion {
    pub version: String,
    pub schema: DataSchema,
    pub created_at: DateTime<Utc>,
    pub changes: Vec<SchemaChange>,
}

// ========== Trait定义 ==========

/// 核心数据源trait - 所有数据源必须实现
#[async_trait]
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

/// 数据源提供者trait - 用于扩展新类型数据源
#[async_trait]  
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
    async fn discover_schema(&self, _config: &serde_json::Value) -> Result<DataSchema, ProviderError> {
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

// ========== 错误类型 ==========

/// 数据源相关错误
#[derive(Error, Debug)]
pub enum DataError {
    #[error("IO error: {message}")]
    IoError { message: String },
    
    #[error("Parse error: {message}")]
    ParseError { message: String, line: Option<usize>, column: Option<usize> },
    
    #[error("Connection failed: {message}")]
    ConnectionError { message: String, retry_after: Option<Duration> },
    
    #[error("Authentication failed: {message}")]
    AuthError { message: String, error_code: Option<String> },
    
    #[error("Query error: {message}")]
    QueryError { message: String, query: Option<String> },
    
    #[error("Path not found: {path}")]
    PathNotFound { path: String },
    
    #[error("Array index out of bounds: {0}")]
    ArrayIndexOutOfBounds(usize),
    
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

/// 验证违规
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationViolation {
    pub field: String,
    pub message: String,
    pub violation_type: String,
}

/// 配置错误
#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("Missing field: {0}")]
    MissingField(String),
    
    #[error("Invalid value for field '{field}': {message}")]
    InvalidValue { field: String, message: String },
    
    #[error("Validation failed: {message}")]
    ValidationFailed { message: String },
    
    #[error("Parse error: {message}")]
    ParseError { message: String },
}

/// 提供者错误
#[derive(Error, Debug)]
pub enum ProviderError {
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Creation error: {0}")]
    CreationError(String),
    
    #[error("Test error: {0}")]
    TestError(String),
    
    #[error("Not supported: {0}")]
    NotSupported(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

/// 注册表错误
#[derive(Error, Debug)]
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
    
    #[error("Connection test failed: {0}")]
    ConnectionTestFailed(ProviderError),
    
    #[error("Connection failed")]
    ConnectionFailed,
    
    #[error("Creation failed: {0}")]
    CreationFailed(ProviderError),
}

// From implementations for RegistryError
impl From<ProviderError> for RegistryError {
    fn from(err: ProviderError) -> Self {
        RegistryError::CreationFailed(err)
    }
}