# 🚀 数据源层MVP实施指南

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-21
- **维护团队**: 数据服务团队
- **预计工期**: 2周 (M1 MVP)
- **依赖文档**: `04-data-gateway-layer-design.md`

---

## 🎯 MVP目标与范围

### **核心目标**
- ✅ 验证JSON数据绑定架构可行性
- ✅ 建立数据源扩展基础框架
- ✅ 实现基础数据预览和绑定功能
- ✅ 为后续数据源扩展打下基础

### **功能范围**
```yaml
包含功能:
  ✅ JSON文件数据源支持
  ✅ 简单JSONPath表达式解析
  ✅ 数据预览和Schema自动推断
  ✅ DataField元素数据绑定
  ✅ 数据源管理UI基础版

不包含功能:
  ❌ 数据库连接支持
  ❌ 复杂查询和聚合
  ❌ 实时数据更新
  ❌ 高级表达式函数
```

---

## 📅 实施时间表

### **Week 1: 核心基础设施 (5个工作日)**

#### **Day 1: 项目结构与基础类型**
```yaml
上午 (4小时):
  - 创建数据模块目录结构
  - 定义核心trait和类型
  - 实现错误处理机制
  
下午 (4小时):
  - 实现DataQuery和DataSet结构
  - 创建基础测试用例
  - 设置日志和调试工具

预期产出:
  - src-tauri/src/data/mod.rs
  - 基础类型定义完成
  - 单元测试框架搭建
```

#### **Day 2: JsonDataSource核心实现**
```yaml
上午 (4小时):
  - 实现JsonDataSource结构体
  - JSON文件读取和解析
  - Schema自动推断逻辑
  
下午 (4小时):
  - 实现JSONPath简单查询
  - json_to_dataset转换逻辑
  - 数据类型推断算法

预期产出:
  - JsonDataSource完整实现
  - 支持基础JSONPath查询
  - Schema推断功能可用
```

#### **Day 3: DataSourceRegistry实现**
```yaml
上午 (4小时):
  - 实现DataSourceRegistry核心功能
  - 数据源注册和管理机制
  - 配置存储接口设计
  
下午 (4小时):
  - 实现JsonDataSourceProvider
  - 配置验证和测试连接
  - 缓存管理基础版

预期产出:
  - DataSourceRegistry完整实现
  - JsonDataSourceProvider可用
  - 配置管理功能就绪
```

#### **Day 4: Tauri接口层**
```yaml
上午 (4小时):
  - 实现核心Tauri commands
  - 错误处理和类型转换
  - 异步调用优化
  
下午 (4小时):
  - 前端API封装函数
  - TypeScript类型定义
  - API调用测试

预期产出:
  - 完整的Tauri commands接口
  - 前端data-api.ts模块
  - 接口集成测试通过
```

#### **Day 5: 集成测试与优化**
```yaml
上午 (4小时):
  - 端到端功能测试
  - 性能基准测试
  - 内存泄漏检查
  
下午 (4小时):
  - Bug修复和优化
  - 代码重构和清理
  - 文档更新

预期产出:
  - 核心功能稳定可用
  - 性能指标达标
  - Week 1交付完成
```

### **Week 2: 用户界面与体验 (5个工作日)**

#### **Day 6-7: 数据面板UI组件**
```yaml
Day 6上午: DataPanel基础组件
  - 数据源列表显示
  - 文件上传界面
  - 基础样式设计

Day 6下午: 数据预览功能
  - 表格形式数据展示
  - Schema信息显示
  - 数据类型标识

Day 7上午: 交互功能完善
  - 数据源选择和切换
  - 预览数据刷新
  - 错误信息展示

Day 7下午: 用户体验优化
  - 加载状态指示
  - 响应式设计适配
  - 无障碍访问支持

预期产出:
  - DataPanel组件完全可用
  - 良好的用户交互体验
  - 响应式设计支持
```

#### **Day 8-9: 数据绑定集成**
```yaml
Day 8上午: 现有DataField集成
  - 修改DataField支持表达式
  - 实现数据绑定渲染
  - 与现有属性面板集成

Day 8下午: 表达式编辑器
  - 简单的表达式输入框
  - JSONPath语法提示
  - 实时表达式验证

Day 9上午: 拖拽绑定功能
  - 从数据面板拖拽字段
  - 自动生成DataField元素
  - 可视化绑定提示

Day 9下午: 数据绑定调试
  - 绑定状态可视化
  - 数据值实时预览
  - 错误状态处理

预期产出:
  - 完整的数据绑定工作流
  - 用户友好的绑定界面
  - 可靠的错误处理机制
```

#### **Day 10: 最终集成与发布**
```yaml
上午 (4小时):
  - 完整功能测试
  - 用户接受度测试
  - 性能压力测试
  
下午 (4小时):
  - 最终Bug修复
  - 文档完善
  - MVP版本发布

预期产出:
  - MVP功能完整可用
  - 用户文档齐全
  - 准备进入M2阶段
```

---

## 🛠️ 详细实施步骤

### **阶段1: 核心基础设施搭建**

#### **步骤1.1: 创建项目结构**
```bash
# 创建目录结构
mkdir -p src-tauri/src/data/{providers,storage,cache}
mkdir -p src/components/Panels
mkdir -p src/utils/data
mkdir -p examples/sample-data

# 创建基础文件
touch src-tauri/src/data/mod.rs
touch src-tauri/src/data/types.rs
touch src-tauri/src/data/registry.rs
touch src-tauri/src/data/providers/mod.rs
touch src-tauri/src/data/providers/json.rs
```

#### **步骤1.2: 基础类型定义**
```rust
// === src-tauri/src/data/types.rs ===
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use anyhow::Result;

// 核心数据源trait
#[async_trait::async_trait]
pub trait DataSource: Send + Sync {
    fn get_id(&self) -> &str;
    fn get_name(&self) -> &str;
    fn get_type(&self) -> DataSourceType;
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError>;
    fn get_schema(&self) -> DataSchema;
    async fn test_connection(&self) -> Result<bool, DataError>;
    fn get_capabilities(&self) -> DataSourceCapabilities;
}

// 核心数据类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataSourceType {
    Json,
    Database(String),
    Api(String), 
    File(String),
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataQuery {
    pub path: Option<String>,
    pub filter: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSet {
    pub columns: Vec<DataColumn>,
    pub rows: Vec<serde_json::Value>,
    pub total_count: usize,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataColumn {
    pub name: String,
    pub display_name: Option<String>,
    pub data_type: DataType,
    pub nullable: bool,
    pub format_hint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataType {
    String, Number, Boolean, Date, DateTime, 
    Object, Array, Binary, Null
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSchema {
    pub columns: Vec<DataColumn>,
}

// 错误类型
#[derive(Debug, thiserror::Error)]
pub enum DataError {
    #[error("IO error: {0}")]
    IoError(String),
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("Path not found: {0}")]
    PathNotFound(String),
    #[error("Invalid path: {0}")]
    InvalidPath(String),
    #[error("Connection failed")]
    ConnectionFailed,
    #[error("Query error: {0}")]
    QueryError(String),
}

// 数据源能力描述
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceCapabilities {
    pub supports_query: bool,
    pub supports_filter: bool,
    pub supports_sort: bool,
    pub supports_aggregation: bool,
    pub supports_real_time: bool,
    pub max_concurrent_connections: usize,
}
```

#### **步骤1.3: JsonDataSource实现**
```rust
// === src-tauri/src/data/providers/json.rs ===
use super::super::types::*;
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use serde_json;

pub struct JsonDataSource {
    id: String,
    name: String,
    data: serde_json::Value,
    schema: DataSchema,
    file_path: Option<PathBuf>,
    last_modified: Option<DateTime<Utc>>,
}

impl JsonDataSource {
    pub fn from_file(id: String, name: String, file_path: PathBuf) -> Result<Self, DataError> {
        let content = std::fs::read_to_string(&file_path)
            .map_err(|e| DataError::IoError(e.to_string()))?;
            
        let data: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| DataError::ParseError(e.to_string()))?;
        
        let schema = Self::generate_schema(&data)?;
        
        Ok(Self {
            id,
            name,
            data,
            schema,
            file_path: Some(file_path),
            last_modified: Some(Utc::now()),
        })
    }
    
    pub fn from_content(id: String, name: String, content: &str) -> Result<Self, DataError> {
        let data: serde_json::Value = serde_json::from_str(content)
            .map_err(|e| DataError::ParseError(e.to_string()))?;
            
        let schema = Self::generate_schema(&data)?;
        
        Ok(Self {
            id,
            name,
            data,
            schema,
            file_path: None,
            last_modified: Some(Utc::now()),
        })
    }
    
    fn generate_schema(data: &serde_json::Value) -> Result<DataSchema, DataError> {
        let mut columns = Vec::new();
        
        match data {
            serde_json::Value::Object(obj) => {
                for (key, value) in obj {
                    columns.push(DataColumn {
                        name: key.clone(),
                        display_name: Some(Self::humanize_name(key)),
                        data_type: Self::infer_data_type(value),
                        nullable: value.is_null(),
                        format_hint: Self::infer_format_hint(key, value),
                    });
                }
            }
            serde_json::Value::Array(arr) => {
                if let Some(first_item) = arr.first() {
                    if let serde_json::Value::Object(obj) = first_item {
                        for (key, value) in obj {
                            columns.push(DataColumn {
                                name: key.clone(),
                                display_name: Some(Self::humanize_name(key)),
                                data_type: Self::infer_data_type(value),
                                nullable: Self::check_nullable(arr, key),
                                format_hint: Self::infer_format_hint(key, value),
                            });
                        }
                    }
                }
            }
            _ => {
                columns.push(DataColumn {
                    name: "value".to_string(),
                    display_name: Some("Value".to_string()),
                    data_type: Self::infer_data_type(data),
                    nullable: data.is_null(),
                    format_hint: None,
                });
            }
        }
        
        Ok(DataSchema { columns })
    }
    
    fn humanize_name(name: &str) -> String {
        name.replace('_', " ")
            .split(' ')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }
    
    fn infer_data_type(value: &serde_json::Value) -> DataType {
        match value {
            serde_json::Value::Null => DataType::Null,
            serde_json::Value::Bool(_) => DataType::Boolean,
            serde_json::Value::Number(_) => DataType::Number,
            serde_json::Value::String(s) => {
                if Self::looks_like_date(s) {
                    DataType::Date
                } else if Self::looks_like_datetime(s) {
                    DataType::DateTime
                } else {
                    DataType::String
                }
            },
            serde_json::Value::Array(_) => DataType::Array,
            serde_json::Value::Object(_) => DataType::Object,
        }
    }
    
    fn looks_like_date(s: &str) -> bool {
        // 简单的日期格式检测
        let date_patterns = [
            r"^\d{4}-\d{2}-\d{2}$",
            r"^\d{2}/\d{2}/\d{4}$",
            r"^\d{4}/\d{2}/\d{2}$",
        ];
        
        date_patterns.iter().any(|pattern| {
            regex::Regex::new(pattern)
                .map(|re| re.is_match(s))
                .unwrap_or(false)
        })
    }
    
    fn looks_like_datetime(s: &str) -> bool {
        // 简单的日期时间格式检测
        s.contains('T') || s.contains(' ') && s.contains(':')
    }
    
    fn check_nullable(arr: &[serde_json::Value], key: &str) -> bool {
        arr.iter().any(|item| {
            if let serde_json::Value::Object(obj) = item {
                obj.get(key).map_or(true, |v| v.is_null())
            } else {
                false
            }
        })
    }
    
    fn infer_format_hint(name: &str, value: &serde_json::Value) -> Option<String> {
        let lower_name = name.to_lowercase();
        
        if matches!(value, serde_json::Value::Number(_)) {
            if lower_name.contains("amount") || lower_name.contains("price") || lower_name.contains("cost") {
                return Some("currency".to_string());
            }
            if lower_name.contains("percent") || lower_name.contains("rate") {
                return Some("percentage".to_string());
            }
        }
        
        if matches!(value, serde_json::Value::String(_)) {
            if lower_name.contains("email") {
                return Some("email".to_string());
            }
            if lower_name.contains("phone") {
                return Some("phone".to_string());
            }
            if lower_name.contains("url") || lower_name.contains("link") {
                return Some("url".to_string());
            }
        }
        
        None
    }
    
    fn query_by_path(&self, path: &str) -> Result<serde_json::Value, DataError> {
        let parts: Vec<&str> = path.split('.').collect();
        let mut current = &self.data;
        
        for part in parts {
            if let Some(bracket_pos) = part.find('[') {
                let (field_name, index_part) = part.split_at(bracket_pos);
                
                if !field_name.is_empty() {
                    current = current.get(field_name)
                        .ok_or_else(|| DataError::PathNotFound(field_name.to_string()))?;
                }
                
                let index_str = index_part.trim_start_matches('[').trim_end_matches(']');
                let index: usize = index_str.parse()
                    .map_err(|_| DataError::InvalidPath(format!("Invalid array index: {}", index_str)))?;
                
                if let serde_json::Value::Array(arr) = current {
                    current = arr.get(index)
                        .ok_or_else(|| DataError::InvalidPath(format!("Array index out of bounds: {}", index)))?;
                } else {
                    return Err(DataError::InvalidPath(format!("Not an array: {}", part)));
                }
            } else {
                if let serde_json::Value::Object(obj) = current {
                    current = obj.get(part)
                        .ok_or_else(|| DataError::PathNotFound(part.to_string()))?;
                } else {
                    return Err(DataError::InvalidPath(format!("Not an object: {}", part)));
                }
            }
        }
        
        Ok(current.clone())
    }
    
    fn json_to_dataset(&self, data: serde_json::Value) -> Result<DataSet, DataError> {
        match data {
            serde_json::Value::Array(arr) => {
                Ok(DataSet {
                    columns: self.schema.columns.clone(),
                    rows: arr,
                    total_count: arr.len(),
                    metadata: Some(serde_json::json!({
                        "source_type": "json_array",
                        "last_modified": self.last_modified
                    })),
                })
            }
            serde_json::Value::Object(_) => {
                let rows = vec![data];
                Ok(DataSet {
                    columns: self.schema.columns.clone(),
                    rows,
                    total_count: 1,
                    metadata: Some(serde_json::json!({
                        "source_type": "json_object",
                        "last_modified": self.last_modified
                    })),
                })
            }
            _ => {
                let rows = vec![serde_json::json!({"value": data})];
                let columns = vec![DataColumn {
                    name: "value".to_string(),
                    display_name: Some("Value".to_string()),
                    data_type: Self::infer_data_type(&data),
                    nullable: data.is_null(),
                    format_hint: None,
                }];
                
                Ok(DataSet {
                    columns,
                    rows,
                    total_count: 1,
                    metadata: Some(serde_json::json!({
                        "source_type": "json_value",
                        "last_modified": self.last_modified
                    })),
                })
            }
        }
    }
    
    fn apply_query_params(&self, mut dataset: DataSet, query: DataQuery) -> Result<DataSet, DataError> {
        // 应用过滤器 (简单实现)
        if let Some(filter) = query.filter {
            // TODO: 实现简单的过滤逻辑
            // 例如: "age > 18", "name = 'John'"
        }
        
        // 应用分页
        if let Some(offset) = query.offset {
            if offset < dataset.rows.len() {
                dataset.rows = dataset.rows.into_iter().skip(offset).collect();
            }
        }
        
        if let Some(limit) = query.limit {
            dataset.rows.truncate(limit);
        }
        
        Ok(dataset)
    }
}

#[async_trait::async_trait]
impl DataSource for JsonDataSource {
    fn get_id(&self) -> &str { &self.id }
    fn get_name(&self) -> &str { &self.name }
    fn get_type(&self) -> DataSourceType { DataSourceType::Json }
    
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let data = match &query {
            Some(q) if q.path.is_some() => {
                self.query_by_path(&q.path.as_ref().unwrap())?
            }
            _ => self.data.clone()
        };
        
        let mut dataset = self.json_to_dataset(data)?;
        
        if let Some(q) = query {
            dataset = self.apply_query_params(dataset, q)?;
        }
        
        Ok(dataset)
    }
    
    fn get_schema(&self) -> DataSchema {
        self.schema.clone()
    }
    
    async fn test_connection(&self) -> Result<bool, DataError> {
        if let Some(file_path) = &self.file_path {
            match std::fs::metadata(file_path) {
                Ok(metadata) => Ok(metadata.is_file()),
                Err(_) => Ok(false),
            }
        } else {
            Ok(true) // 内存中的数据总是可用
        }
    }
    
    fn get_capabilities(&self) -> DataSourceCapabilities {
        DataSourceCapabilities {
            supports_query: true,
            supports_filter: true,
            supports_sort: false,
            supports_aggregation: false,
            supports_real_time: false,
            max_concurrent_connections: 1,
        }
    }
}
```

#### **步骤1.4: DataSourceRegistry实现**
```rust
// === src-tauri/src/data/registry.rs ===
use super::types::*;
use super::providers::json::JsonDataSource;
use std::collections::HashMap;
use std::sync::Arc;

pub struct DataSourceRegistry {
    sources: HashMap<String, Box<dyn DataSource>>,
    default_source: Option<String>,
}

impl DataSourceRegistry {
    pub fn new() -> Self {
        Self {
            sources: HashMap::new(),
            default_source: None,
        }
    }
    
    pub fn register_json_file(
        &mut self, 
        id: String, 
        name: String, 
        file_path: std::path::PathBuf
    ) -> Result<(), DataError> {
        let source = JsonDataSource::from_file(id.clone(), name, file_path)?;
        self.sources.insert(id.clone(), Box::new(source));
        
        if self.default_source.is_none() {
            self.default_source = Some(id);
        }
        
        Ok(())
    }
    
    pub fn register_json_content(
        &mut self,
        id: String,
        name: String,
        content: &str
    ) -> Result<(), DataError> {
        let source = JsonDataSource::from_content(id.clone(), name, content)?;
        self.sources.insert(id.clone(), Box::new(source));
        
        if self.default_source.is_none() {
            self.default_source = Some(id);
        }
        
        Ok(())
    }
    
    pub fn get_source(&self, id: &str) -> Option<&dyn DataSource> {
        self.sources.get(id).map(|s| s.as_ref())
    }
    
    pub async fn query_data(
        &self,
        source_id: Option<String>,
        query: Option<DataQuery>
    ) -> Result<DataSet, DataError> {
        let id = source_id.or_else(|| self.default_source.clone())
            .ok_or_else(|| DataError::QueryError("No data source available".to_string()))?;
            
        let source = self.sources.get(&id)
            .ok_or_else(|| DataError::QueryError(format!("Data source not found: {}", id)))?;
            
        source.get_data(query).await
    }
    
    pub fn list_sources(&self) -> Vec<(String, String, DataSourceType)> {
        self.sources.iter()
            .map(|(id, source)| (id.clone(), source.get_name().to_string(), source.get_type()))
            .collect()
    }
    
    pub fn remove_source(&mut self, id: &str) -> bool {
        if let Some(removed_id) = &self.default_source {
            if removed_id == id {
                // 如果删除的是默认数据源，选择另一个作为默认
                self.default_source = self.sources.keys()
                    .find(|&k| k != id)
                    .cloned();
            }
        }
        
        self.sources.remove(id).is_some()
    }
}
```

### **阶段2: Tauri接口集成**

#### **步骤2.1: Tauri Commands实现**
```rust
// === src-tauri/src/commands/data.rs ===
use crate::data::{DataSourceRegistry, DataQuery, DataSet};
use tauri::State;
use tokio::sync::Mutex;

type DataRegistry = Mutex<DataSourceRegistry>;

#[tauri::command]
pub async fn register_json_file(
    path: String,
    name: String,
    data_manager: State<'_, DataRegistry>
) -> Result<String, String> {
    let id = format!("json_{}", uuid::Uuid::new_v4().to_string()[..8].to_string());
    let mut manager = data_manager.lock().await;
    
    manager.register_json_file(id.clone(), name, std::path::PathBuf::from(path))
        .map_err(|e| format!("Failed to register JSON file: {}", e))?;
    
    Ok(id)
}

#[tauri::command]
pub async fn register_json_content(
    content: String,
    name: String,
    data_manager: State<'_, DataRegistry>
) -> Result<String, String> {
    let id = format!("json_{}", uuid::Uuid::new_v4().to_string()[..8].to_string());
    let mut manager = data_manager.lock().await;
    
    manager.register_json_content(id.clone(), name, &content)
        .map_err(|e| format!("Failed to register JSON content: {}", e))?;
    
    Ok(id)
}

#[tauri::command]
pub async fn get_data_preview(
    source_id: Option<String>,
    path: Option<String>,
    data_manager: State<'_, DataRegistry>
) -> Result<DataSet, String> {
    let query = DataQuery {
        path,
        filter: None,
        limit: Some(50),
        offset: None,
    };
    
    let manager = data_manager.lock().await;
    manager.query_data(source_id, Some(query)).await
        .map_err(|e| format!("Failed to get data preview: {}", e))
}

#[tauri::command]
pub async fn evaluate_expression(
    expression: String,
    source_id: Option<String>,
    data_manager: State<'_, DataRegistry>
) -> Result<serde_json::Value, String> {
    let query = DataQuery {
        path: Some(expression),
        filter: None, 
        limit: Some(1),
        offset: None,
    };
    
    let manager = data_manager.lock().await;
    let dataset = manager.query_data(source_id, Some(query)).await
        .map_err(|e| format!("Expression evaluation failed: {}", e))?;
    
    Ok(dataset.rows.into_iter().next().unwrap_or(serde_json::Value::Null))
}

#[tauri::command]
pub async fn list_data_sources(
    data_manager: State<'_, DataRegistry>
) -> Result<Vec<(String, String, String)>, String> {
    let manager = data_manager.lock().await;
    let sources = manager.list_sources();
    
    Ok(sources.into_iter()
        .map(|(id, name, ds_type)| (id, name, format!("{:?}", ds_type)))
        .collect())
}

#[tauri::command]
pub async fn remove_data_source(
    source_id: String,
    data_manager: State<'_, DataRegistry>
) -> Result<bool, String> {
    let mut manager = data_manager.lock().await;
    Ok(manager.remove_source(&source_id))
}
```

#### **步骤2.2: 前端API封装**
```typescript
// === src/utils/data-api.ts ===
import { invoke } from '@tauri-apps/api/tauri';

export interface DataColumn {
  name: string;
  display_name?: string;
  data_type: 'String' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'Object' | 'Array' | 'Binary' | 'Null';
  nullable: boolean;
  format_hint?: string;
}

export interface DataSet {
  columns: DataColumn[];
  rows: any[];
  total_count: number;
  metadata?: any;
}

export interface DataSourceInfo {
  id: string;
  name: string;
  type: string;
}

// 注册JSON文件数据源
export async function registerJsonFile(filePath: string, name: string): Promise<string> {
  try {
    return await invoke<string>('register_json_file', { 
      path: filePath, 
      name 
    });
  } catch (error) {
    console.error('Failed to register JSON file:', error);
    throw new Error(`Failed to register JSON file: ${error}`);
  }
}

// 注册JSON内容数据源
export async function registerJsonContent(content: string, name: string): Promise<string> {
  try {
    return await invoke<string>('register_json_content', { 
      content, 
      name 
    });
  } catch (error) {
    console.error('Failed to register JSON content:', error);
    throw new Error(`Failed to register JSON content: ${error}`);
  }
}

// 获取数据预览
export async function getDataPreview(
  sourceId?: string, 
  path?: string
): Promise<DataSet> {
  try {
    return await invoke<DataSet>('get_data_preview', {
      source_id: sourceId,
      path
    });
  } catch (error) {
    console.error('Failed to get data preview:', error);
    throw new Error(`Failed to get data preview: ${error}`);
  }
}

// 求值表达式
export async function evaluateExpression(
  expression: string,
  sourceId?: string
): Promise<any> {
  try {
    return await invoke('evaluate_expression', {
      expression,
      source_id: sourceId
    });
  } catch (error) {
    console.error('Failed to evaluate expression:', error);
    throw new Error(`Failed to evaluate expression: ${error}`);
  }
}

// 列出所有数据源
export async function listDataSources(): Promise<DataSourceInfo[]> {
  try {
    const sources = await invoke<[string, string, string][]>('list_data_sources');
    return sources.map(([id, name, type]) => ({ id, name, type }));
  } catch (error) {
    console.error('Failed to list data sources:', error);
    throw new Error(`Failed to list data sources: ${error}`);
  }
}

// 删除数据源
export async function removeDataSource(sourceId: string): Promise<boolean> {
  try {
    return await invoke<boolean>('remove_data_source', {
      source_id: sourceId
    });
  } catch (error) {
    console.error('Failed to remove data source:', error);
    throw new Error(`Failed to remove data source: ${error}`);
  }
}

// 数据绑定辅助函数
export function createDataBinding(
  expression: string,
  format?: string
): any {
  return {
    type: 'DataField',
    expression,
    format,
    style: {
      font_family: 'Arial',
      font_size: 12,
      font_weight: 'normal',
      color: '#000000',
      align: 'Left'
    }
  };
}

// 验证JSONPath表达式
export function validateJsonPath(expression: string): { valid: boolean; error?: string } {
  try {
    // 简单的JSONPath验证
    if (!expression || expression.trim().length === 0) {
      return { valid: false, error: 'Expression cannot be empty' };
    }
    
    // 检查基本语法
    if (expression.includes('..') && !expression.match(/\.\.[a-zA-Z_]/)) {
      return { valid: false, error: 'Invalid recursive descent syntax' };
    }
    
    // 检查数组访问语法
    const bracketMatches = expression.match(/\[|\]/g);
    if (bracketMatches && bracketMatches.length % 2 !== 0) {
      return { valid: false, error: 'Unmatched brackets' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid expression syntax' };
  }
}

// 生成示例表达式
export function generateSampleExpressions(columns: DataColumn[]): string[] {
  return columns
    .filter(col => col.data_type !== 'Object' && col.data_type !== 'Array')
    .map(col => col.name)
    .slice(0, 5); // 只显示前5个字段
}
```

### **阶段3: 用户界面实现**

#### **步骤3.1: 数据面板组件**
```typescript
// === src/components/Panels/DataPanel.tsx ===
import { createSignal, createEffect, For, Show } from 'solid-js';
import { 
  registerJsonFile, 
  registerJsonContent,
  getDataPreview, 
  listDataSources,
  removeDataSource,
  type DataSet,
  type DataSourceInfo,
  type DataColumn
} from '../../utils/data-api';

interface DataPanelProps {
  onFieldSelect?: (expression: string, column: DataColumn) => void;
}

export function DataPanel(props: DataPanelProps) {
  const [dataSources, setDataSources] = createSignal<DataSourceInfo[]>([]);
  const [selectedSource, setSelectedSource] = createSignal<string>();
  const [previewData, setPreviewData] = createSignal<DataSet>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string>();
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [addMode, setAddMode] = createSignal<'file' | 'content'>('file');
  const [jsonContent, setJsonContent] = createSignal('');

  // 加载数据源列表
  const loadDataSources = async () => {
    try {
      const sources = await listDataSources();
      setDataSources(sources);
      if (sources.length > 0 && !selectedSource()) {
        setSelectedSource(sources[0].id);
      }
    } catch (error) {
      setError(`Failed to load data sources: ${error}`);
    }
  };

  // 加载预览数据
  const loadPreview = async () => {
    const sourceId = selectedSource();
    if (!sourceId) return;

    setLoading(true);
    setError(undefined);
    
    try {
      const data = await getDataPreview(sourceId);
      setPreviewData(data);
    } catch (error) {
      setError(`Failed to load preview: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(undefined);

    try {
      // 读取文件内容
      const text = await file.text();
      
      // 验证JSON格式
      JSON.parse(text);
      
      // 注册数据源
      const sourceId = await registerJsonContent(text, file.name);
      
      // 刷新数据源列表
      await loadDataSources();
      setSelectedSource(sourceId);
      setShowAddForm(false);
      
      // 清理文件输入
      input.value = '';
    } catch (error) {
      setError(`Failed to load file: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理JSON内容添加
  const handleContentAdd = async () => {
    const content = jsonContent().trim();
    if (!content) {
      setError('JSON content cannot be empty');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      // 验证JSON格式
      JSON.parse(content);
      
      // 生成名称
      const name = `JSON_${new Date().toISOString().slice(0, 16).replace('T', '_')}`;
      
      // 注册数据源
      const sourceId = await registerJsonContent(content, name);
      
      // 刷新数据源列表
      await loadDataSources();
      setSelectedSource(sourceId);
      setShowAddForm(false);
      setJsonContent('');
    } catch (error) {
      setError(`Invalid JSON or registration failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除数据源
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    setLoading(true);
    try {
      await removeDataSource(sourceId);
      await loadDataSources();
      
      if (selectedSource() === sourceId) {
        setSelectedSource(dataSources()[0]?.id);
        setPreviewData(undefined);
      }
    } catch (error) {
      setError(`Failed to delete data source: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理字段选择
  const handleFieldClick = (column: DataColumn) => {
    if (props.onFieldSelect) {
      props.onFieldSelect(column.name, column);
    }
  };

  // 初始加载和监听选择变化
  createEffect(() => {
    loadDataSources();
  });

  createEffect(() => {
    if (selectedSource()) {
      loadPreview();
    }
  });

  return (
    <div class="data-panel">
      {/* 头部 */}
      <div class="data-panel-header">
        <h3>Data Sources</h3>
        <div class="header-actions">
          <button 
            class="btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm())}
            disabled={loading()}
          >
            {showAddForm() ? 'Cancel' : '+ Add JSON'}
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      <Show when={error()}>
        <div class="error-message">
          {error()}
          <button class="error-close" onClick={() => setError(undefined)}>×</button>
        </div>
      </Show>

      {/* 添加数据源表单 */}
      <Show when={showAddForm()}>
        <div class="add-form">
          <div class="form-tabs">
            <button 
              class={`tab ${addMode() === 'file' ? 'active' : ''}`}
              onClick={() => setAddMode('file')}
            >
              Upload File
            </button>
            <button 
              class={`tab ${addMode() === 'content' ? 'active' : ''}`}
              onClick={() => setAddMode('content')}
            >
              Paste JSON
            </button>
          </div>

          <Show when={addMode() === 'file'}>
            <div class="file-upload">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading()}
              />
              <p class="help-text">Select a JSON file to upload as data source</p>
            </div>
          </Show>

          <Show when={addMode() === 'content'}>
            <div class="content-input">
              <textarea
                placeholder="Paste your JSON content here..."
                value={jsonContent()}
                onInput={(e) => setJsonContent(e.currentTarget.value)}
                rows="8"
                disabled={loading()}
              />
              <button 
                class="btn-primary"
                onClick={handleContentAdd}
                disabled={loading() || !jsonContent().trim()}
              >
                {loading() ? 'Adding...' : 'Add Data Source'}
              </button>
            </div>
          </Show>
        </div>
      </Show>

      {/* 数据源列表 */}
      <div class="data-sources-list">
        <Show when={dataSources().length === 0 && !loading()}>
          <div class="empty-state">
            <p>No data sources available</p>
            <p class="help-text">Add a JSON file or paste JSON content to get started</p>
          </div>
        </Show>

        <For each={dataSources()}>
          {source => (
            <div 
              class={`data-source-item ${selectedSource() === source.id ? 'selected' : ''}`}
              onClick={() => setSelectedSource(source.id)}
            >
              <div class="source-info">
                <span class="source-name">{source.name}</span>
                <span class="source-type">{source.type}</span>
              </div>
              <button 
                class="source-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSource(source.id);
                }}
                title="Delete data source"
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>

      {/* 数据预览 */}
      <Show when={previewData()}>
        <div class="data-preview">
          <div class="preview-header">
            <h4>Data Preview</h4>
            <span class="row-count">
              {previewData()!.total_count} row(s)
            </span>
          </div>

          {/* 字段列表 */}
          <div class="fields-list">
            <h5>Fields</h5>
            <For each={previewData()!.columns}>
              {column => (
                <div 
                  class="field-item"
                  onClick={() => handleFieldClick(column)}
                  title={`Click to use: ${column.name}`}
                >
                  <span class="field-name">{column.display_name || column.name}</span>
                  <span class={`field-type type-${column.data_type.toLowerCase()}`}>
                    {column.data_type}
                  </span>
                </div>
              )}
            </For>
          </div>

          {/* 数据表格 */}
          <div class="preview-table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <For each={previewData()!.columns}>
                    {column => (
                      <th title={`${column.data_type}${column.nullable ? ' (nullable)' : ''}`}>
                        {column.display_name || column.name}
                        <span class={`type-indicator type-${column.data_type.toLowerCase()}`}>
                          {column.data_type[0]}
                        </span>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={previewData()!.rows.slice(0, 5)}>
                  {row => (
                    <tr>
                      <For each={previewData()!.columns}>
                        {column => (
                          <td>
                            <span class="cell-content">
                              {formatCellValue(row[column.name], column)}
                            </span>
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
            
            <Show when={previewData()!.total_count > 5}>
              <div class="preview-info">
                Showing first 5 rows of {previewData()!.total_count} total rows
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* 加载状态 */}
      <Show when={loading()}>
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </Show>
    </div>
  );
}

// 格式化单元格值
function formatCellValue(value: any, column: DataColumn): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (column.format_hint) {
    switch (column.format_hint) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value);
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value);
      case 'email':
      case 'url':
        return String(value);
      default:
        break;
    }
  }

  if (column.data_type === 'Object' || column.data_type === 'Array') {
    return JSON.stringify(value, null, 0);
  }

  return String(value);
}
```

#### **步骤3.2: 数据面板样式**
```css
/* === src/components/Panels/DataPanel.css === */
.data-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
}

.data-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.error-message {
  background: #e74c3c;
  color: white;
  padding: 12px;
  margin: 8px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-form {
  margin: 16px;
  padding: 16px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: #f8f9fa;
}

.form-tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #e1e5e9;
}

.tab {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: #6c757d;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.file-upload input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
}

.content-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 12px;
}

.help-text {
  font-size: 12px;
  color: #6c757d;
  margin: 8px 0 0 0;
}

.data-sources-list {
  flex: 0 0 auto;
  max-height: 200px;
  overflow-y: auto;
  border-bottom: 1px solid #e1e5e9;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #6c757d;
}

.empty-state p {
  margin: 0 0 8px 0;
}

.data-source-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.data-source-item:hover {
  background: #f8f9fa;
}

.data-source-item.selected {
  background: #e3f2fd;
  border-left: 3px solid #3498db;
}

.source-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2px;
}

.source-type {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.source-delete {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.source-delete:hover {
  opacity: 1;
  background: #ffeaea;
}

.data-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.row-count {
  font-size: 12px;
  color: #6c757d;
  padding: 4px 8px;
  background: #e9ecef;
  border-radius: 12px;
}

.fields-list {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background: #fafbfc;
}

.fields-list h5 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.field-item:hover {
  background: #e3f2fd;
}

.field-name {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
}

.field-type {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
}

.type-string { background: #27ae60; }
.type-number { background: #3498db; }
.type-boolean { background: #9b59b6; }
.type-date { background: #e67e22; }
.type-datetime { background: #f39c12; }
.type-object { background: #34495e; }
.type-array { background: #e74c3c; }
.type-null { background: #95a5a6; }

.preview-table-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th {
  background: #f8f9fa;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid #e1e5e9;
  font-weight: 600;
  color: #2c3e50;
  position: relative;
}

.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f4;
  max-width: 200px;
}

.cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-indicator {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 2px;
  color: white;
  font-weight: bold;
}

.preview-info {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-panel-header {
    padding: 12px;
  }
  
  .add-form {
    margin: 12px;
    padding: 12px;
  }
  
  .preview-table-container {
    padding: 12px;
  }
  
  .preview-table th,
  .preview-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .cell-content {
    max-width: 120px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .data-panel {
    background: #2c3e50;
    color: #ecf0f1;
  }
  
  .data-panel-header {
    background: #34495e;
    border-bottom-color: #4a5f7a;
  }
  
  .data-panel-header h3 {
    color: #ecf0f1;
  }
  
  .add-form {
    background: #34495e;
    border-color: #4a5f7a;
  }
  
  .data-source-item {
    border-bottom-color: #4a5f7a;
  }
  
  .data-source-item:hover {
    background: #34495e;
  }
  
  .data-source-item.selected {
    background: #2c3e50;
  }
  
  .source-name {
    color: #ecf0f1;
  }
  
  .preview-table th {
    background: #34495e;
    color: #ecf0f1;
    border-bottom-color: #4a5f7a;
  }
  
  .preview-table td {
    border-bottom-color: #4a5f7a;
  }
}
```

---

**文档状态**: MVP实施指南完成  
**下一步**: 开始第一阶段开发，建议按日程表逐步实施  
**预计完成**: 2周内完成JSON数据源MVP版本