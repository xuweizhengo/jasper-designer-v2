# 🔌 数据源扩展开发指南

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-21
- **维护团队**: 数据服务团队
- **目标受众**: 扩展开发者、第三方集成商
- **依赖文档**: `data-gateway-api-specification.md`

---

## 🎯 扩展开发概述

### **扩展机制设计**
Jasper Designer的数据源层采用基于Trait的插件式架构，允许开发者轻松添加新的数据源类型，而无需修改核心代码。

### **支持的扩展类型**
```yaml
内置数据源:
  ✅ JSON文件/内容
  ✅ 静态数据

扩展数据源:
  🔧 关系型数据库 (MySQL, PostgreSQL, SQLite等)
  🔧 NoSQL数据库 (MongoDB, Redis等)
  🔧 REST API服务
  🔧 GraphQL API
  🔧 文件系统 (CSV, Excel, Parquet等)
  🔧 云服务 (AWS S3, Google Cloud等)
  🔧 消息队列 (Kafka, RabbitMQ等)
  🔧 自定义协议数据源
```

### **扩展开发优势**
- ✅ **热插拔支持** - 运行时动态加载数据源
- ✅ **统一接口** - 所有数据源提供相同的使用体验
- ✅ **配置驱动** - 通过配置Schema自动生成UI
- ✅ **类型安全** - Rust类型系统保证运行时安全
- ✅ **错误处理** - 统一的错误处理和用户反馈

---

## 🛠️ 开发环境准备

### **1. 开发依赖**
```toml
# Cargo.toml - 扩展开发所需依赖
[dependencies]
# 核心依赖
async-trait = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
anyhow = "1.0"
thiserror = "1.0"

# 数据库驱动 (按需添加)
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "mysql", "postgres"], optional = true }
mongodb = { version = "2.0", optional = true }
redis = { version = "0.23", features = ["tokio-comp"], optional = true }

# HTTP客户端
reqwest = { version = "0.11", features = ["json"], optional = true }

# 文件处理
csv = { version = "1.2", optional = true }
calamine = { version = "0.21", optional = true } # Excel文件

# 时间处理
chrono = { version = "0.4", features = ["serde"] }

# 日志
log = "0.4"
tracing = "0.1"

[features]
default = ["json"]
json = []
mysql = ["sqlx/mysql"]
postgres = ["sqlx/postgres"]
mongodb_support = ["mongodb"]
redis_support = ["redis"]
rest_api = ["reqwest"]
file_formats = ["csv", "calamine"]
```

### **2. 项目结构**
```
src-tauri/src/data/
├── mod.rs                    # 模块根文件
├── types.rs                  # 核心类型定义
├── registry.rs               # 注册表实现
├── providers/                # 数据源提供者
│   ├── mod.rs               # 提供者模块根
│   ├── json.rs              # JSON数据源 (内置)
│   ├── mysql.rs             # MySQL扩展
│   ├── postgres.rs          # PostgreSQL扩展
│   ├── mongodb.rs           # MongoDB扩展
│   ├── rest_api.rs          # REST API扩展
│   ├── csv_file.rs          # CSV文件扩展
│   └── custom/              # 自定义扩展目录
│       └── my_source.rs
├── storage/                  # 存储抽象
│   ├── mod.rs
│   ├── config_storage.rs    # 配置存储
│   └── cache_storage.rs     # 缓存存储
├── cache/                    # 缓存管理
│   ├── mod.rs
│   └── cache_manager.rs
└── utils/                    # 工具函数
    ├── mod.rs
    ├── expression.rs         # 表达式解析
    └── validation.rs         # 数据验证
```

### **3. 开发工具推荐**
```bash
# Rust开发工具
cargo install cargo-watch      # 自动重构建
cargo install cargo-expand     # 宏展开调试
cargo install cargo-audit      # 安全审计

# 数据库客户端 (调试用)
cargo install sqlx-cli         # SQL数据库CLI
brew install mongodb/brew/mongodb-community  # MongoDB

# HTTP调试工具
brew install httpie           # HTTP客户端
```

---

## 📝 扩展开发详细步骤

### **步骤1: 实现DataSourceProvider**

#### **基础模板**
```rust
// === src-tauri/src/data/providers/my_custom_source.rs ===
use super::super::types::*;
use async_trait::async_trait;
use serde_json::{json, Value};
use std::collections::HashMap;

/// 自定义数据源提供者
pub struct MyCustomDataSourceProvider {
    // 提供者可以包含配置、连接池等
    default_config: Value,
}

impl MyCustomDataSourceProvider {
    pub fn new() -> Self {
        Self {
            default_config: json!({
                "server_url": "https://api.example.com",
                "timeout": 30,
                "retry_count": 3
            })
        }
    }
}

#[async_trait]
impl DataSourceProvider for MyCustomDataSourceProvider {
    fn get_type_name(&self) -> &'static str { 
        "my_custom_source" 
    }
    
    fn get_display_name(&self) -> &'static str { 
        "My Custom API" 
    }
    
    fn get_description(&self) -> &'static str { 
        "Connect to My Custom API service for data retrieval" 
    }
    
    fn get_icon(&self) -> Option<&'static str> { 
        Some("api") 
    }
    
    fn get_version(&self) -> &'static str { 
        "1.0.0" 
    }
    
    fn get_config_schema(&self) -> ConfigSchema {
        ConfigSchema {
            version: "1.0.0".to_string(),
            fields: vec![
                ConfigField {
                    name: "server_url".to_string(),
                    display_name: "Server URL".to_string(),
                    description: Some("API server base URL".to_string()),
                    field_type: ConfigFieldType::Url,
                    default_value: Some(json!("https://api.example.com")),
                    required: true,
                    depends_on: None,
                    validation: Some(FieldValidation {
                        required_if: None,
                        pattern: Some("^https?://".to_string()),
                        min_length: Some(10),
                        max_length: Some(500),
                        custom: None,
                    }),
                    placeholder: Some("https://api.example.com".to_string()),
                    group: Some("connection".to_string()),
                    order: 1,
                },
                ConfigField {
                    name: "api_key".to_string(),
                    display_name: "API Key".to_string(),
                    description: Some("Authentication API key".to_string()),
                    field_type: ConfigFieldType::Password,
                    default_value: None,
                    required: true,
                    depends_on: None,
                    validation: Some(FieldValidation {
                        required_if: None,
                        pattern: None,
                        min_length: Some(10),
                        max_length: Some(100),
                        custom: None,
                    }),
                    placeholder: Some("Enter your API key".to_string()),
                    group: Some("authentication".to_string()),
                    order: 2,
                },
                ConfigField {
                    name: "timeout".to_string(),
                    display_name: "Request Timeout (seconds)".to_string(),
                    description: Some("HTTP request timeout".to_string()),
                    field_type: ConfigFieldType::Number {
                        min: Some(1.0),
                        max: Some(300.0),
                        step: Some(1.0),
                    },
                    default_value: Some(json!(30)),
                    required: false,
                    depends_on: None,
                    validation: None,
                    placeholder: None,
                    group: Some("advanced".to_string()),
                    order: 3,
                },
                ConfigField {
                    name: "enable_cache".to_string(),
                    display_name: "Enable Caching".to_string(),
                    description: Some("Cache API responses for better performance".to_string()),
                    field_type: ConfigFieldType::Boolean,
                    default_value: Some(json!(true)),
                    required: false,
                    depends_on: None,
                    validation: None,
                    placeholder: None,
                    group: Some("performance".to_string()),
                    order: 4,
                },
            ],
            required_fields: vec!["server_url".to_string(), "api_key".to_string()],
            field_groups: vec![
                ConfigGroup {
                    name: "connection".to_string(),
                    display_name: "Connection Settings".to_string(),
                    description: Some("API connection configuration".to_string()),
                    fields: vec!["server_url".to_string()],
                    collapsible: false,
                },
                ConfigGroup {
                    name: "authentication".to_string(),
                    display_name: "Authentication".to_string(),
                    description: Some("API authentication settings".to_string()),
                    fields: vec!["api_key".to_string()],
                    collapsible: false,
                },
                ConfigGroup {
                    name: "advanced".to_string(),
                    display_name: "Advanced Settings".to_string(),
                    description: Some("Advanced configuration options".to_string()),
                    fields: vec!["timeout".to_string()],
                    collapsible: true,
                },
                ConfigGroup {
                    name: "performance".to_string(),
                    display_name: "Performance".to_string(),
                    description: Some("Performance optimization settings".to_string()),
                    fields: vec!["enable_cache".to_string()],
                    collapsible: true,
                },
            ],
            validation_rules: vec![
                ValidationRule {
                    name: "url_reachable".to_string(),
                    description: "Server URL must be reachable".to_string(),
                    expression: "test_connection(server_url)".to_string(),
                    error_message: "Cannot connect to the specified server URL".to_string(),
                },
            ],
            examples: vec![
                ConfigExample {
                    name: "Development Environment".to_string(),
                    description: "Configuration for development API".to_string(),
                    config: json!({
                        "server_url": "https://dev-api.example.com",
                        "api_key": "dev_key_12345",
                        "timeout": 10,
                        "enable_cache": false
                    }),
                },
                ConfigExample {
                    name: "Production Environment".to_string(),
                    description: "Configuration for production API".to_string(),
                    config: json!({
                        "server_url": "https://api.example.com",
                        "api_key": "prod_key_67890",
                        "timeout": 30,
                        "enable_cache": true
                    }),
                },
            ],
        }
    }
    
    fn validate_config(&self, config: &Value) -> Result<(), ConfigError> {
        // 验证必填字段
        let server_url = config.get("server_url")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ConfigError::MissingField("server_url".to_string()))?;
        
        let api_key = config.get("api_key")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ConfigError::MissingField("api_key".to_string()))?;
        
        // 验证URL格式
        if !server_url.starts_with("http") {
            return Err(ConfigError::InvalidValue {
                field: "server_url".to_string(),
                message: "URL must start with http:// or https://".to_string(),
            });
        }
        
        // 验证API Key长度
        if api_key.len() < 10 {
            return Err(ConfigError::InvalidValue {
                field: "api_key".to_string(),
                message: "API key must be at least 10 characters".to_string(),
            });
        }
        
        // 验证超时时间
        if let Some(timeout) = config.get("timeout").and_then(|v| v.as_u64()) {
            if timeout == 0 || timeout > 300 {
                return Err(ConfigError::InvalidValue {
                    field: "timeout".to_string(),
                    message: "Timeout must be between 1 and 300 seconds".to_string(),
                });
            }
        }
        
        Ok(())
    }
    
    fn get_default_config(&self) -> Value {
        self.default_config.clone()
    }
    
    async fn create_source(
        &self,
        id: String,
        name: String,
        config: &Value
    ) -> Result<Box<dyn DataSource>, ProviderError> {
        // 创建数据源实例
        let source = MyCustomDataSource::new(id, name, config.clone())
            .await
            .map_err(|e| ProviderError::CreationError(e.to_string()))?;
        
        Ok(Box::new(source))
    }
    
    async fn test_connection(&self, config: &Value) -> Result<bool, ProviderError> {
        let server_url = config["server_url"].as_str()
            .ok_or_else(|| ProviderError::ConfigError("Missing server_url".to_string()))?;
        
        let api_key = config["api_key"].as_str()
            .ok_or_else(|| ProviderError::ConfigError("Missing api_key".to_string()))?;
        
        let timeout = config.get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(30);
        
        // 创建HTTP客户端
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(timeout))
            .build()
            .map_err(|e| ProviderError::TestError(e.to_string()))?;
        
        // 测试连接
        let test_url = format!("{}/health", server_url);
        let response = client
            .get(&test_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| ProviderError::TestError(e.to_string()))?;
        
        Ok(response.status().is_success())
    }
    
    async fn discover_schema(&self, config: &Value) -> Result<DataSchema, ProviderError> {
        // 可选：自动发现Schema
        let server_url = config["server_url"].as_str()
            .ok_or_else(|| ProviderError::ConfigError("Missing server_url".to_string()))?;
        
        // 请求Schema端点
        let schema_url = format!("{}/schema", server_url);
        let client = reqwest::Client::new();
        let response = client.get(&schema_url).send().await
            .map_err(|e| ProviderError::TestError(e.to_string()))?;
        
        if response.status().is_success() {
            let schema_data: Value = response.json().await
                .map_err(|e| ProviderError::TestError(e.to_string()))?;
            
            // 解析API返回的Schema
            self.parse_api_schema(schema_data)
        } else {
            Err(ProviderError::NotSupported("Schema discovery not available".to_string()))
        }
    }
    
    fn supports_wizard(&self) -> bool { 
        true 
    }
    
    async fn get_wizard_steps(&self) -> Result<Vec<WizardStep>, ProviderError> {
        Ok(vec![
            WizardStep {
                id: "connection".to_string(),
                title: "API Connection".to_string(),
                description: "Configure your API connection settings".to_string(),
                fields: vec!["server_url".to_string()],
                validation_required: true,
            },
            WizardStep {
                id: "authentication".to_string(),
                title: "Authentication".to_string(),
                description: "Provide your API credentials".to_string(),
                fields: vec!["api_key".to_string()],
                validation_required: true,
            },
            WizardStep {
                id: "options".to_string(),
                title: "Additional Options".to_string(),
                description: "Configure timeout and caching options".to_string(),
                fields: vec!["timeout".to_string(), "enable_cache".to_string()],
                validation_required: false,
            },
        ])
    }
    
    fn get_example_configs(&self) -> Vec<(String, Value)> {
        vec![
            ("Development".to_string(), json!({
                "server_url": "https://dev-api.example.com",
                "api_key": "dev_key_12345",
                "timeout": 10
            })),
            ("Production".to_string(), json!({
                "server_url": "https://api.example.com", 
                "api_key": "prod_key_67890",
                "timeout": 30,
                "enable_cache": true
            })),
        ]
    }
}

impl MyCustomDataSourceProvider {
    fn parse_api_schema(&self, schema_data: Value) -> Result<DataSchema, ProviderError> {
        // 实现API Schema解析逻辑
        // 这里是示例实现
        let mut columns = Vec::new();
        
        if let Some(fields) = schema_data.get("fields").and_then(|f| f.as_array()) {
            for field in fields {
                if let Some(field_obj) = field.as_object() {
                    let name = field_obj.get("name")
                        .and_then(|n| n.as_str())
                        .unwrap_or("unknown")
                        .to_string();
                    
                    let type_str = field_obj.get("type")
                        .and_then(|t| t.as_str())
                        .unwrap_or("string");
                    
                    let data_type = match type_str {
                        "string" => DataType::String,
                        "number" | "integer" | "float" => DataType::Number,
                        "boolean" => DataType::Boolean,
                        "date" => DataType::Date,
                        "datetime" => DataType::DateTime,
                        "object" => DataType::Object,
                        "array" => DataType::Array,
                        _ => DataType::String,
                    };
                    
                    let nullable = field_obj.get("nullable")
                        .and_then(|n| n.as_bool())
                        .unwrap_or(false);
                    
                    columns.push(DataColumn {
                        name,
                        display_name: field_obj.get("displayName")
                            .and_then(|d| d.as_str())
                            .map(|s| s.to_string()),
                        data_type,
                        nullable,
                        description: field_obj.get("description")
                            .and_then(|d| d.as_str())
                            .map(|s| s.to_string()),
                        format_hint: field_obj.get("format")
                            .and_then(|f| f.as_str())
                            .map(|s| s.to_string()),
                        default_value: field_obj.get("defaultValue").cloned(),
                        constraints: vec![],
                        sample_values: vec![],
                    });
                }
            }
        }
        
        Ok(DataSchema {
            columns,
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
            version: "1.0.0".to_string(),
            last_updated: chrono::Utc::now(),
        })
    }
}
```

### **步骤2: 实现DataSource**

```rust
/// 自定义数据源实现
pub struct MyCustomDataSource {
    id: String,
    name: String,
    config: Value,
    client: reqwest::Client,
    schema: DataSchema,
    last_updated: chrono::DateTime<chrono::Utc>,
}

impl MyCustomDataSource {
    pub async fn new(id: String, name: String, config: Value) -> Result<Self, DataError> {
        let timeout = config.get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(30);
        
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(timeout))
            .build()
            .map_err(|e| DataError::ConnectionError {
                message: e.to_string(),
                retry_after: Some(std::time::Duration::from_secs(60)),
            })?;
        
        // 获取初始Schema
        let schema = Self::fetch_schema(&client, &config).await?;
        
        Ok(Self {
            id,
            name,
            config,
            client,
            schema,
            last_updated: chrono::Utc::now(),
        })
    }
    
    async fn fetch_schema(client: &reqwest::Client, config: &Value) -> Result<DataSchema, DataError> {
        let server_url = config["server_url"].as_str()
            .ok_or_else(|| DataError::ConfigError {
                message: "Missing server_url".to_string(),
                field: Some("server_url".to_string()),
            })?;
        
        let api_key = config["api_key"].as_str()
            .ok_or_else(|| DataError::ConfigError {
                message: "Missing api_key".to_string(),
                field: Some("api_key".to_string()),
            })?;
        
        let schema_url = format!("{}/schema", server_url);
        let response = client
            .get(&schema_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| DataError::ConnectionError {
                message: format!("Failed to fetch schema: {}", e),
                retry_after: Some(std::time::Duration::from_secs(30)),
            })?;
        
        if !response.status().is_success() {
            return Err(DataError::QueryError {
                message: format!("Schema request failed: {}", response.status()),
                query: Some(schema_url),
            });
        }
        
        let schema_data: Value = response.json().await
            .map_err(|e| DataError::ParseError {
                message: format!("Failed to parse schema response: {}", e),
                line: None,
                column: None,
            })?;
        
        // 解析Schema (复用Provider中的逻辑)
        Self::parse_schema(schema_data)
    }
    
    fn parse_schema(schema_data: Value) -> Result<DataSchema, DataError> {
        // Schema解析逻辑 (与Provider中的实现类似)
        let mut columns = Vec::new();
        
        if let Some(fields) = schema_data.get("fields").and_then(|f| f.as_array()) {
            for field in fields {
                // ... 解析逻辑 (同Provider实现)
            }
        }
        
        Ok(DataSchema {
            columns,
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
            version: "1.0.0".to_string(),
            last_updated: chrono::Utc::now(),
        })
    }
    
    async fn make_api_request(&self, path: &str, query_params: &HashMap<String, String>) -> Result<Value, DataError> {
        let server_url = self.config["server_url"].as_str().unwrap();
        let api_key = self.config["api_key"].as_str().unwrap();
        
        let mut url = format!("{}/{}", server_url.trim_end_matches('/'), path.trim_start_matches('/'));
        
        // 添加查询参数
        if !query_params.is_empty() {
            let query_string: String = query_params.iter()
                .map(|(k, v)| format!("{}={}", 
                    urlencoding::encode(k), 
                    urlencoding::encode(v)
                ))
                .collect::<Vec<_>>()
                .join("&");
            url = format!("{}?{}", url, query_string);
        }
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| DataError::ConnectionError {
                message: format!("API request failed: {}", e),
                retry_after: Some(std::time::Duration::from_secs(30)),
            })?;
        
        if !response.status().is_success() {
            return Err(DataError::QueryError {
                message: format!("API returned error: {} {}", response.status(), response.status().canonical_reason().unwrap_or("Unknown")),
                query: Some(url),
            });
        }
        
        response.json::<Value>().await
            .map_err(|e| DataError::ParseError {
                message: format!("Failed to parse API response: {}", e),
                line: None,
                column: None,
            })
    }
    
    fn parse_api_response(&self, api_response: Value) -> Result<DataSet, DataError> {
        let mut rows = Vec::new();
        
        match api_response {
            Value::Array(arr) => {
                rows = arr;
            }
            Value::Object(obj) => {
                // 检查是否有分页信息
                if let Some(data) = obj.get("data") {
                    if let Value::Array(arr) = data {
                        rows = arr.clone();
                    }
                } else {
                    // 单个对象
                    rows = vec![Value::Object(obj)];
                }
            }
            _ => {
                return Err(DataError::ParseError {
                    message: "Unexpected API response format".to_string(),
                    line: None,
                    column: None,
                });
            }
        }
        
        Ok(DataSet {
            columns: self.schema.columns.clone(),
            rows,
            total_count: rows.len(),
            metadata: Some(DataSetMetadata {
                source_id: self.id.clone(),
                execution_time: 0, // 实际应用中应该记录执行时间
                generated_at: chrono::Utc::now(),
                version: None,
                warnings: vec![],
                pagination: None,
                quality_metrics: None,
            }),
            cached: false,
            cache_time: None,
            checksum: None,
        })
    }
}

#[async_trait]
impl DataSource for MyCustomDataSource {
    fn get_id(&self) -> &str { &self.id }
    fn get_name(&self) -> &str { &self.name }
    fn get_type(&self) -> DataSourceType { DataSourceType::Api("custom".to_string()) }
    
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let mut query_params = HashMap::new();
        
        if let Some(q) = &query {
            // 处理路径参数
            if let Some(path) = &q.path {
                // 对于REST API，路径可能对应不同的端点
                // 这里简化处理，实际应用中可能需要更复杂的路径解析
            }
            
            // 处理过滤参数
            if let Some(filter) = &q.filter {
                query_params.insert("filter".to_string(), filter.clone());
            }
            
            // 处理分页参数
            if let Some(limit) = q.limit {
                query_params.insert("limit".to_string(), limit.to_string());
            }
            
            if let Some(offset) = q.offset {
                query_params.insert("offset".to_string(), offset.to_string());
            }
            
            // 处理排序参数
            if let Some(sort) = &q.sort {
                let sort_param = sort.iter()
                    .map(|s| format!("{}:{}", s.field, if s.direction == SortDirection::Asc { "asc" } else { "desc" }))
                    .collect::<Vec<_>>()
                    .join(",");
                query_params.insert("sort".to_string(), sort_param);
            }
        }
        
        // 默认数据端点
        let endpoint = "data";
        let api_response = self.make_api_request(endpoint, &query_params).await?;
        
        self.parse_api_response(api_response)
    }
    
    fn get_schema(&self) -> DataSchema {
        self.schema.clone()
    }
    
    async fn test_connection(&self) -> Result<bool, DataError> {
        match self.make_api_request("health", &HashMap::new()).await {
            Ok(_) => Ok(true),
            Err(DataError::ConnectionError { .. }) => Ok(false),
            Err(DataError::QueryError { .. }) => Ok(false),
            Err(e) => Err(e),
        }
    }
    
    async fn refresh_schema(&mut self) -> Result<(), DataError> {
        self.schema = Self::fetch_schema(&self.client, &self.config).await?;
        self.last_updated = chrono::Utc::now();
        Ok(())
    }
    
    fn supports_real_time(&self) -> bool {
        false // 可以根据API能力返回true
    }
    
    fn get_capabilities(&self) -> DataSourceCapabilities {
        DataSourceCapabilities {
            supports_query: true,
            supports_filter: true,
            supports_sort: true,
            supports_aggregation: false, // 根据API能力设置
            supports_real_time: false,
            supports_schema_refresh: true,
            max_concurrent_connections: 10,
            estimated_query_cost: QueryCost::Medium,
        }
    }
    
    fn get_connection_info(&self) -> Option<Value> {
        Some(json!({
            "server_url": self.config["server_url"],
            "timeout": self.config.get("timeout").unwrap_or(&json!(30)),
            "cache_enabled": self.config.get("enable_cache").unwrap_or(&json!(true)),
            "last_updated": self.last_updated.to_rfc3339(),
        }))
    }
}
```

### **步骤3: 注册数据源扩展**

```rust
// === src-tauri/src/data/providers/mod.rs ===
mod json;
mod my_custom_source;

pub use json::*;
pub use my_custom_source::*;

// 注册所有提供者的便捷函数
use super::registry::DataSourceRegistry;

pub fn register_all_providers(registry: &mut DataSourceRegistry) -> Result<(), crate::data::types::RegistryError> {
    // 注册内置提供者
    registry.register_provider(JsonDataSourceProvider::new())?;
    
    // 注册扩展提供者
    registry.register_provider(MyCustomDataSourceProvider::new())?;
    
    // 可以继续添加其他提供者
    // registry.register_provider(MySqlDataSourceProvider::new())?;
    // registry.register_provider(RestApiDataSourceProvider::new())?;
    
    log::info!("Registered {} data source providers", 
        registry.get_available_types().len());
    
    Ok(())
}
```

```rust
// === src-tauri/src/main.rs ===
mod data;

use data::registry::DataSourceRegistry;
use data::storage::ConfigStorage;
use data::providers::register_all_providers;

#[tokio::main]
async fn main() {
    // 创建配置存储
    let config_storage = Box::new(data::storage::FileConfigStorage::new("data_sources.json"));
    
    // 创建数据源注册表
    let mut registry = DataSourceRegistry::new(config_storage);
    
    // 注册所有数据源提供者
    if let Err(e) = register_all_providers(&mut registry) {
        eprintln!("Failed to register data source providers: {}", e);
        std::process::exit(1);
    }
    
    // 在Tauri应用中使用注册表
    tauri::Builder::default()
        .manage(tokio::sync::Mutex::new(registry))
        .invoke_handler(tauri::generate_handler![
            // 数据源管理commands
            crate::commands::data::get_available_data_source_types,
            crate::commands::data::create_data_source,
            crate::commands::data::test_data_source_connection,
            // ... 其他commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 🧪 扩展开发最佳实践

### **1. 错误处理**
```rust
// 良好的错误处理示例
impl MyCustomDataSource {
    async fn handle_api_error(&self, error: reqwest::Error) -> DataError {
        if error.is_timeout() {
            DataError::Timeout {
                message: "API request timed out".to_string(),
                duration: std::time::Duration::from_secs(30),
            }
        } else if error.is_connect() {
            DataError::ConnectionError {
                message: format!("Cannot connect to API: {}", error),
                retry_after: Some(std::time::Duration::from_secs(60)),
            }
        } else if let Some(status) = error.status() {
            match status.as_u16() {
                401 => DataError::AuthError {
                    message: "API key is invalid or expired".to_string(),
                    error_code: Some("INVALID_API_KEY".to_string()),
                },
                429 => DataError::RateLimited {
                    message: "API rate limit exceeded".to_string(),
                    retry_after: std::time::Duration::from_secs(300), // 5分钟
                },
                404 => DataError::ResourceNotFound {
                    resource_type: "endpoint".to_string(),
                    resource_id: "unknown".to_string(),
                },
                _ => DataError::QueryError {
                    message: format!("API request failed: {}", status),
                    query: None,
                }
            }
        } else {
            DataError::Internal {
                message: format!("Unexpected error: {}", error),
                error_id: Some(uuid::Uuid::new_v4().to_string()),
            }
        }
    }
}
```

### **2. 性能优化**
```rust
// 连接池管理
pub struct MyCustomDataSource {
    // ... 其他字段
    connection_pool: Arc<tokio::sync::RwLock<ConnectionPool>>,
}

impl MyCustomDataSource {
    // 使用连接池
    async fn get_connection(&self) -> Result<Connection, DataError> {
        let pool = self.connection_pool.read().await;
        pool.get().await
            .map_err(|e| DataError::ConnectionError {
                message: format!("Failed to get connection from pool: {}", e),
                retry_after: Some(std::time::Duration::from_secs(10)),
            })
    }
    
    // 批量请求优化
    async fn batch_request(&self, queries: Vec<String>) -> Result<Vec<DataSet>, DataError> {
        // 并发执行多个查询
        let futures: Vec<_> = queries.into_iter()
            .map(|query| self.single_query(query))
            .collect();
        
        let results = futures::future::try_join_all(futures).await?;
        Ok(results)
    }
}
```

### **3. 缓存策略**
```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub struct CachedDataSource {
    inner: MyCustomDataSource,
    cache: Arc<tokio::sync::RwLock<HashMap<String, CacheEntry>>>,
    cache_ttl: Duration,
}

#[derive(Clone)]
struct CacheEntry {
    data: DataSet,
    timestamp: Instant,
}

impl CachedDataSource {
    async fn get_data_with_cache(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let cache_key = self.build_cache_key(&query);
        
        // 检查缓存
        {
            let cache = self.cache.read().await;
            if let Some(entry) = cache.get(&cache_key) {
                if entry.timestamp.elapsed() < self.cache_ttl {
                    let mut cached_data = entry.data.clone();
                    cached_data.cached = true;
                    cached_data.cache_time = Some(chrono::Utc::now());
                    return Ok(cached_data);
                }
            }
        }
        
        // 缓存未命中，执行实际查询
        let data = self.inner.get_data(query).await?;
        
        // 更新缓存
        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, CacheEntry {
                data: data.clone(),
                timestamp: Instant::now(),
            });
        }
        
        Ok(data)
    }
    
    fn build_cache_key(&self, query: &Option<DataQuery>) -> String {
        // 根据查询参数生成缓存键
        match query {
            Some(q) => {
                let mut key = String::new();
                if let Some(path) = &q.path { key.push_str(&format!("path:{},", path)); }
                if let Some(filter) = &q.filter { key.push_str(&format!("filter:{},", filter)); }
                if let Some(limit) = q.limit { key.push_str(&format!("limit:{},", limit)); }
                if let Some(offset) = q.offset { key.push_str(&format!("offset:{},", offset)); }
                key
            }
            None => "default".to_string()
        }
    }
}
```

### **4. 日志和监控**
```rust
use tracing::{info, warn, error, debug, instrument};

impl MyCustomDataSource {
    #[instrument(skip(self), fields(source_id = %self.id))]
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let start_time = Instant::now();
        
        debug!("Starting data query: {:?}", query);
        
        match self.execute_query(query).await {
            Ok(data) => {
                let duration = start_time.elapsed();
                info!(
                    rows = data.rows.len(),
                    duration_ms = duration.as_millis(),
                    "Query completed successfully"
                );
                Ok(data)
            }
            Err(e) => {
                let duration = start_time.elapsed();
                error!(
                    error = %e,
                    duration_ms = duration.as_millis(),
                    "Query failed"
                );
                Err(e)
            }
        }
    }
    
    #[instrument(skip(self))]
    async fn test_connection(&self) -> Result<bool, DataError> {
        info!("Testing connection to API");
        
        match self.make_api_request("health", &HashMap::new()).await {
            Ok(_) => {
                info!("Connection test successful");
                Ok(true)
            }
            Err(e) => {
                warn!(error = %e, "Connection test failed");
                Ok(false)
            }
        }
    }
}
```

### **5. 配置验证**
```rust
impl MyCustomDataSourceProvider {
    fn validate_config(&self, config: &Value) -> Result<(), ConfigError> {
        // 使用验证器链模式
        ConfigValidator::new()
            .required_field("server_url", |v| v.as_str())
            .required_field("api_key", |v| v.as_str())
            .optional_field("timeout", |v| v.as_u64())
            .custom_validation("server_url", |url: &str| {
                if !url.starts_with("http") {
                    return Err("URL must start with http:// or https://".to_string());
                }
                Ok(())
            })
            .custom_validation("api_key", |key: &str| {
                if key.len() < 10 {
                    return Err("API key must be at least 10 characters".to_string());
                }
                Ok(())
            })
            .validate(config)
    }
}

// 验证器辅助结构
struct ConfigValidator {
    errors: Vec<ConfigError>,
}

impl ConfigValidator {
    fn new() -> Self {
        Self { errors: Vec::new() }
    }
    
    fn required_field<T, F>(mut self, field: &str, extractor: F) -> Self 
    where 
        F: Fn(&Value) -> Option<T>
    {
        // 验证必填字段
        self
    }
    
    fn custom_validation<T, F>(mut self, field: &str, validator: F) -> Self
    where
        F: Fn(T) -> Result<(), String>
    {
        // 自定义验证逻辑
        self
    }
    
    fn validate(self, config: &Value) -> Result<(), ConfigError> {
        if self.errors.is_empty() {
            Ok(())
        } else {
            Err(self.errors.into_iter().next().unwrap())
        }
    }
}
```

---

## 🧪 测试策略

### **1. 单元测试**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tokio_test;
    
    #[tokio::test]
    async fn test_provider_config_validation() {
        let provider = MyCustomDataSourceProvider::new();
        
        // 测试有效配置
        let valid_config = json!({
            "server_url": "https://api.example.com",
            "api_key": "test_key_12345",
            "timeout": 30
        });
        
        assert!(provider.validate_config(&valid_config).is_ok());
        
        // 测试无效配置
        let invalid_config = json!({
            "server_url": "invalid_url",
            "api_key": "short"
        });
        
        assert!(provider.validate_config(&invalid_config).is_err());
    }
    
    #[tokio::test]
    async fn test_data_source_creation() {
        let provider = MyCustomDataSourceProvider::new();
        let config = json!({
            "server_url": "https://api.example.com",
            "api_key": "test_key_12345"
        });
        
        // Mock HTTP服务器可以使用wiremock crate
        let result = provider.create_source(
            "test_id".to_string(),
            "Test Source".to_string(),
            &config
        ).await;
        
        assert!(result.is_ok());
    }
    
    #[tokio::test] 
    async fn test_query_execution() {
        // 创建测试数据源
        let source = create_test_source().await;
        
        // 测试基础查询
        let result = source.get_data(None).await;
        assert!(result.is_ok());
        
        let data = result.unwrap();
        assert!(!data.columns.is_empty());
        assert!(!data.rows.is_empty());
        
        // 测试过滤查询
        let filtered_query = DataQuery {
            filter: Some("status = 'active'".to_string()),
            limit: Some(10),
            ..Default::default()
        };
        
        let filtered_result = source.get_data(Some(filtered_query)).await;
        assert!(filtered_result.is_ok());
    }
    
    async fn create_test_source() -> MyCustomDataSource {
        let config = json!({
            "server_url": "http://localhost:8080",
            "api_key": "test_key"
        });
        
        MyCustomDataSource::new(
            "test".to_string(),
            "Test".to_string(),
            config
        ).await.unwrap()
    }
}
```

### **2. 集成测试**
```rust
// tests/integration_test.rs
use jasper_data_gateway::*;

#[tokio::test]
async fn test_full_data_source_lifecycle() {
    // 创建注册表
    let storage = Box::new(MemoryConfigStorage::new());
    let mut registry = DataSourceRegistry::new(storage);
    
    // 注册提供者
    registry.register_provider(MyCustomDataSourceProvider::new()).unwrap();
    
    // 创建数据源
    let config = serde_json::json!({
        "server_url": "https://jsonplaceholder.typicode.com",
        "api_key": "dummy_key"
    });
    
    let source_id = registry.create_data_source(
        "test_id".to_string(),
        "Test API".to_string(),
        "my_custom_source".to_string(),
        config
    ).await.unwrap();
    
    // 查询数据
    let data = registry.query_data(&source_id, None).await.unwrap();
    assert!(!data.rows.is_empty());
    
    // 测试Schema
    let source = registry.get_data_source(&source_id).unwrap();
    let schema = source.get_schema();
    assert!(!schema.columns.is_empty());
    
    // 清理
    registry.remove_data_source(&source_id).await.unwrap();
}
```

---

## 📚 扩展示例库

### **MySQL数据源扩展**
```rust
// 完整的MySQL数据源实现示例
pub struct MySqlDataSourceProvider;

#[async_trait]
impl DataSourceProvider for MySqlDataSourceProvider {
    fn get_type_name(&self) -> &'static str { "mysql" }
    fn get_display_name(&self) -> &'static str { "MySQL Database" }
    fn get_description(&self) -> &'static str { "Connect to MySQL database" }
    fn get_icon(&self) -> Option<&'static str> { Some("database") }
    
    fn get_config_schema(&self) -> ConfigSchema {
        // MySQL特定的配置字段
        ConfigSchema {
            // ... 配置定义
        }
    }
    
    async fn create_source(&self, id: String, name: String, config: &Value) -> Result<Box<dyn DataSource>, ProviderError> {
        let source = MySqlDataSource::new(id, name, config).await?;
        Ok(Box::new(source))
    }
    
    // ... 其他实现
}

pub struct MySqlDataSource {
    id: String,
    name: String,
    pool: sqlx::MySqlPool,
    schema: DataSchema,
}

impl MySqlDataSource {
    async fn new(id: String, name: String, config: &Value) -> Result<Self, DataError> {
        let database_url = Self::build_connection_string(config)?;
        let pool = sqlx::MySqlPool::connect(&database_url).await?;
        let schema = Self::discover_schema(&pool).await?;
        
        Ok(Self { id, name, pool, schema })
    }
    
    async fn discover_schema(pool: &sqlx::MySqlPool) -> Result<DataSchema, DataError> {
        // 查询信息Schema获取表结构
        let query = r#"
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLUMN_COMMENT
            FROM 
                INFORMATION_SCHEMA.COLUMNS 
            WHERE 
                TABLE_SCHEMA = DATABASE()
            ORDER BY 
                TABLE_NAME, ORDINAL_POSITION
        "#;
        
        let rows = sqlx::query(query).fetch_all(pool).await?;
        // ... 解析Schema
        
        Ok(DataSchema { /* ... */ })
    }
}

#[async_trait]
impl DataSource for MySqlDataSource {
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let sql = self.build_sql_query(query)?;
        let rows = sqlx::query(&sql).fetch_all(&self.pool).await?;
        self.convert_sql_rows_to_dataset(rows)
    }
    
    // ... 其他实现
}
```

### **CSV文件数据源扩展**
```rust
pub struct CsvDataSourceProvider;

impl CsvDataSourceProvider {
    pub fn new() -> Self { Self }
}

#[async_trait]
impl DataSourceProvider for CsvDataSourceProvider {
    fn get_type_name(&self) -> &'static str { "csv_file" }
    fn get_display_name(&self) -> &'static str { "CSV File" }
    fn get_description(&self) -> &'static str { "Read data from CSV files" }
    fn get_icon(&self) -> Option<&'static str> { Some("file-text") }
    
    // ... 实现其他方法
}

pub struct CsvDataSource {
    id: String,
    name: String,
    file_path: PathBuf,
    schema: DataSchema,
    delimiter: u8,
    has_headers: bool,
}

#[async_trait]
impl DataSource for CsvDataSource {
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let mut rdr = csv::ReaderBuilder::new()
            .delimiter(self.delimiter)
            .has_headers(self.has_headers)
            .from_path(&self.file_path)?;
        
        let mut rows = Vec::new();
        for result in rdr.records() {
            let record = result?;
            let row_data = self.convert_record_to_json(record)?;
            rows.push(row_data);
            
            // 应用限制
            if let Some(query) = &query {
                if let Some(limit) = query.limit {
                    if rows.len() >= limit {
                        break;
                    }
                }
            }
        }
        
        Ok(DataSet {
            columns: self.schema.columns.clone(),
            rows,
            total_count: rows.len(),
            // ... 其他字段
        })
    }
    
    // ... 其他实现
}
```

---

**文档状态**: 扩展开发指南完成  
**包含内容**: 完整的扩展开发流程、最佳实践、测试策略、示例代码  
**下一步**: 根据此指南开发具体的数据源扩展