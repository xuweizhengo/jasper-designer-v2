// === JSON数据源实现 - MVP核心 ===
use crate::data::types::*;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use std::path::PathBuf;

/// JSON数据源实现
pub struct JsonDataSource {
    id: String,
    name: String,
    source_type: DataSourceType,
    data: Value,
    schema: DataSchema,
    file_path: Option<PathBuf>,
    last_modified: Option<DateTime<Utc>>,
}

impl JsonDataSource {
    /// 从文件创建JSON数据源
    pub fn from_file(id: String, name: String, file_path: PathBuf) -> Result<Self, DataError> {
        let content = std::fs::read_to_string(&file_path)
            .map_err(|e| DataError::IoError { message: e.to_string() })?;
            
        let data: Value = serde_json::from_str(&content)
            .map_err(|e| DataError::ParseError { 
                message: e.to_string(),
                line: Some(e.line()),
                column: Some(e.column()),
            })?;
        
        let schema = Self::generate_schema(&data)?;
        
        let metadata = std::fs::metadata(&file_path).ok();
        let last_modified = metadata.and_then(|m| m.modified().ok())
            .map(|t| DateTime::<Utc>::from(t));
        
        Ok(Self {
            id,
            name,
            source_type: DataSourceType::Json,
            data,
            schema,
            file_path: Some(file_path),
            last_modified,
        })
    }
    
    /// 从内容创建JSON数据源
    pub fn from_content(id: String, name: String, content: &str) -> Result<Self, DataError> {
        let data: Value = serde_json::from_str(content)
            .map_err(|e| DataError::ParseError { 
                message: e.to_string(),
                line: Some(e.line()),
                column: Some(e.column()),
            })?;
            
        let schema = Self::generate_schema(&data)?;
        
        Ok(Self {
            id,
            name,
            source_type: DataSourceType::Json,
            data,
            schema,
            file_path: None,
            last_modified: Some(Utc::now()),
        })
    }
    
    /// 自动生成Schema
    fn generate_schema(data: &Value) -> Result<DataSchema, DataError> {
        let mut columns = Vec::new();
        
        match data {
            Value::Object(obj) => {
                // 处理对象：每个key作为一列
                for (key, value) in obj {
                    columns.push(DataColumn {
                        name: key.clone(),
                        display_name: Some(Self::humanize_name(key)),
                        data_type: Self::infer_data_type(value),
                        nullable: value.is_null(),
                        description: None,
                        format_hint: Self::infer_format_hint(key, value),
                        default_value: None,
                        constraints: vec![],
                        sample_values: vec![value.clone()],
                        source_column: Some(key.clone()),
                        source_table: None,
                        is_primary_key: false,
                        is_foreign_key: false,
                    });
                }
            }
            
            Value::Array(arr) => {
                // 处理数组：分析第一个元素的结构
                if let Some(first_item) = arr.first() {
                    if let Value::Object(obj) = first_item {
                        for (key, value) in obj {
                            columns.push(DataColumn {
                                name: key.clone(),
                                display_name: Some(Self::humanize_name(key)),
                                data_type: Self::infer_data_type(value),
                                nullable: Self::check_nullable(arr, key),
                                description: None,
                                format_hint: Self::infer_format_hint(key, value),
                                default_value: None,
                                constraints: vec![],
                                sample_values: Self::collect_sample_values(arr, key, 5),
                                source_column: Some(key.clone()),
                                source_table: None,
                                is_primary_key: false,
                                is_foreign_key: false,
                            });
                        }
                    } else {
                        // 数组包含基本类型
                        columns.push(DataColumn {
                            name: "value".to_string(),
                            display_name: Some("Value".to_string()),
                            data_type: Self::infer_data_type(first_item),
                            nullable: false,
                            description: None,
                            format_hint: None,
                            default_value: None,
                            constraints: vec![],
                            sample_values: arr.iter().take(5).cloned().collect(),
                            source_column: Some("value".to_string()),
                            source_table: None,
                            is_primary_key: false,
                            is_foreign_key: false,
                        });
                    }
                }
            }
            
            _ => {
                // 单个值
                columns.push(DataColumn {
                    name: "value".to_string(),
                    display_name: Some("Value".to_string()),
                    data_type: Self::infer_data_type(data),
                    nullable: data.is_null(),
                    description: None,
                    format_hint: None,
                    default_value: None,
                    constraints: vec![],
                    sample_values: vec![data.clone()],
                    source_column: Some("value".to_string()),
                    source_table: None,
                    is_primary_key: false,
                    is_foreign_key: false,
                });
            }
        }
        
        Ok(DataSchema {
            columns,
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
            version: "1.0.0".to_string(),
            last_updated: Utc::now(),
        })
    }
    
    /// 推断数据类型
    fn infer_data_type(value: &Value) -> DataType {
        match value {
            Value::Null => DataType::Null,
            Value::Bool(_) => DataType::Boolean,
            Value::Number(n) => {
                if n.is_f64() {
                    DataType::Number
                } else {
                    DataType::Number
                }
            },
            Value::String(s) => {
                // 尝试推断特殊类型
                if Self::looks_like_date(s) {
                    DataType::Date
                } else if Self::looks_like_datetime(s) {
                    DataType::DateTime
                } else {
                    DataType::String
                }
            },
            Value::Array(_) => DataType::Array,
            Value::Object(_) => DataType::Object,
        }
    }
    
    /// 推断格式提示
    fn infer_format_hint(key: &str, value: &Value) -> Option<String> {
        let key_lower = key.to_lowercase();
        
        // 基于字段名推断
        if key_lower.contains("email") {
            return Some("email".to_string());
        }
        if key_lower.contains("phone") || key_lower.contains("mobile") {
            return Some("phone".to_string());
        }
        if key_lower.contains("url") || key_lower.contains("link") {
            return Some("url".to_string());
        }
        if key_lower.contains("color") || key_lower.contains("colour") {
            return Some("color".to_string());
        }
        
        // 基于值内容推断
        if let Value::Number(n) = value {
            if key_lower.contains("amount") || key_lower.contains("price") || 
               key_lower.contains("cost") || key_lower.contains("balance") {
                return Some("currency".to_string());
            }
            if key_lower.contains("rate") || key_lower.contains("percent") {
                return Some("percentage".to_string());
            }
            if n.as_f64().map_or(false, |f| f >= 1_000_000_000.0) {
                // 可能是时间戳
                return Some("timestamp".to_string());
            }
        }
        
        None
    }
    
    /// 检查字段是否可为空
    fn check_nullable(arr: &[Value], key: &str) -> bool {
        arr.iter().any(|item| {
            if let Value::Object(obj) = item {
                obj.get(key).map_or(true, |v| v.is_null())
            } else {
                false
            }
        })
    }
    
    /// 收集示例值
    fn collect_sample_values(arr: &[Value], key: &str, max_samples: usize) -> Vec<Value> {
        arr.iter()
            .filter_map(|item| {
                if let Value::Object(obj) = item {
                    obj.get(key).cloned()
                } else {
                    None
                }
            })
            .take(max_samples)
            .collect()
    }
    
    /// 人性化字段名
    fn humanize_name(name: &str) -> String {
        name.replace('_', " ")
            .replace('-', " ")
            .split(' ')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<String>>()
            .join(" ")
    }
    
    /// 检查是否像日期
    fn looks_like_date(s: &str) -> bool {
        // 简单的日期格式检查
        s.matches('-').count() == 2 && s.len() == 10
    }
    
    /// 检查是否像日期时间
    fn looks_like_datetime(s: &str) -> bool {
        // 简单的日期时间格式检查
        s.contains('T') && (s.ends_with('Z') || s.contains('+') || s.contains('-'))
    }
    
    /// 执行JSONPath查询
    fn query_by_path(&self, path: &str) -> Result<Value, DataError> {
        let parts: Vec<&str> = path.split('.').collect();
        let mut current = &self.data;
        
        for part in parts {
            // 处理数组索引 users[0]
            if let Some(bracket_pos) = part.find('[') {
                let (field_name, index_part) = part.split_at(bracket_pos);
                
                // 获取字段
                if !field_name.is_empty() {
                    current = current.get(field_name)
                        .ok_or_else(|| DataError::PathNotFound { path: field_name.to_string() })?;
                }
                
                // 解析数组索引
                let index_str = index_part.trim_start_matches('[').trim_end_matches(']');
                let index: usize = index_str.parse()
                    .map_err(|_| DataError::ConfigError { 
                        message: format!("Invalid array index: {}", index_str), 
                        field: Some("path".to_string()) 
                    })?;
                
                // 获取数组元素
                if let Value::Array(arr) = current {
                    current = arr.get(index)
                        .ok_or_else(|| DataError::ArrayIndexOutOfBounds(index))?;
                } else {
                    return Err(DataError::ConfigError { 
                        message: format!("Not an array: {}", part), 
                        field: Some("path".to_string()) 
                    });
                }
            } else {
                // 普通字段访问
                if let Value::Object(obj) = current {
                    current = obj.get(part)
                        .ok_or_else(|| DataError::PathNotFound { path: part.to_string() })?;
                } else {
                    return Err(DataError::ConfigError { 
                        message: format!("Cannot access field '{}' on non-object", part), 
                        field: Some("path".to_string()) 
                    });
                }
            }
        }
        
        Ok(current.clone())
    }
    
    /// 转换为标准DataSet
    fn json_to_dataset(&self, data: Value) -> Result<DataSet, DataError> {
        match data {
            Value::Array(arr) => {
                // 数组数据
                let rows = arr;
                Ok(DataSet {
                    columns: self.schema.columns.clone(),
                    total_count: rows.len(),
                    rows,
                    metadata: Some(DataSetMetadata {
                        source_id: self.id.clone(),
                        execution_time: 0,
                        generated_at: Utc::now(),
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
            
            Value::Object(_) => {
                // 单个对象
                let rows = vec![data];
                Ok(DataSet {
                    columns: self.schema.columns.clone(),
                    total_count: 1,
                    rows,
                    metadata: Some(DataSetMetadata {
                        source_id: self.id.clone(),
                        execution_time: 0,
                        generated_at: Utc::now(),
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
            
            _ => {
                // 基本类型值
                let rows = vec![json!({"value": data})];
                let columns = vec![DataColumn {
                    name: "value".to_string(),
                    display_name: Some("Value".to_string()),
                    data_type: Self::infer_data_type(&data),
                    nullable: data.is_null(),
                    description: None,
                    format_hint: None,
                    default_value: None,
                    constraints: vec![],
                    sample_values: vec![data.clone()],
                    source_column: Some("value".to_string()),
                    source_table: None,
                    is_primary_key: false,
                    is_foreign_key: false,
                }];
                
                Ok(DataSet {
                    columns,
                    total_count: 1,
                    rows,
                    metadata: Some(DataSetMetadata {
                        source_id: self.id.clone(),
                        execution_time: 0,
                        generated_at: Utc::now(),
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
    }
    
    /// 应用查询参数
    fn apply_query_params(&self, mut dataset: DataSet, query: DataQuery) -> Result<DataSet, DataError> {
        // 应用偏移量和限制
        if let Some(offset) = query.offset {
            if offset < dataset.rows.len() {
                dataset.rows.drain(0..offset);
            } else {
                dataset.rows.clear();
            }
        }
        
        if let Some(limit) = query.limit {
            if dataset.rows.len() > limit {
                dataset.rows.truncate(limit);
            }
        }
        
        dataset.total_count = dataset.rows.len();
        
        // TODO: 实现过滤和排序
        if query.filter.is_some() {
            // 简单的过滤实现可以在这里添加
        }
        
        if query.sort.is_some() {
            // 简单的排序实现可以在这里添加
        }
        
        Ok(dataset)
    }
}

#[async_trait]
impl DataSource for JsonDataSource {
    fn get_id(&self) -> &str { 
        &self.id 
    }
    
    fn get_name(&self) -> &str { 
        &self.name 
    }
    
    fn get_type(&self) -> DataSourceType { 
        self.source_type.clone() 
    }
    
    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        let data = match query {
            Some(ref q) if q.path.is_some() => {
                // 使用JSONPath查询
                self.query_by_path(&q.path.as_ref().unwrap())?
            }
            _ => {
                // 返回完整数据
                self.data.clone()
            }
        };
        
        let mut dataset = self.json_to_dataset(data)?;
        
        // 应用查询参数
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
            // 检查文件是否存在和可读
            match std::fs::metadata(file_path) {
                Ok(metadata) => Ok(metadata.is_file()),
                Err(_) => Ok(false),
            }
        } else {
            // 内存中的数据总是可用的
            Ok(true)
        }
    }
    
    async fn refresh_schema(&mut self) -> Result<(), DataError> {
        if let Some(file_path) = &self.file_path {
            // 重新读取文件
            let content = std::fs::read_to_string(file_path)
                .map_err(|e| DataError::IoError { message: e.to_string() })?;
                
            let data: Value = serde_json::from_str(&content)
                .map_err(|e| DataError::ParseError { 
                    message: e.to_string(),
                    line: Some(e.line()),
                    column: Some(e.column()),
                })?;
            
            self.data = data;
            self.schema = Self::generate_schema(&self.data)?;
            
            let metadata = std::fs::metadata(file_path).ok();
            self.last_modified = metadata.and_then(|m| m.modified().ok())
                .map(|t| DateTime::<Utc>::from(t));
        }
        
        Ok(())
    }
    
    fn get_capabilities(&self) -> DataSourceCapabilities {
        DataSourceCapabilities {
            supports_query: true,
            supports_filter: true,
            supports_sort: true,
            supports_aggregation: false,
            supports_real_time: false,
            supports_schema_refresh: self.file_path.is_some(),
            max_concurrent_connections: 1,
            estimated_query_cost: QueryCost::Low,
        }
    }
    
    fn get_connection_info(&self) -> Option<Value> {
        Some(json!({
            "type": "json",
            "has_file": self.file_path.is_some(),
            "file_path": self.file_path.as_ref().map(|p| p.to_string_lossy()),
            "last_modified": self.last_modified,
            "record_count": self.data.as_array().map(|arr| arr.len()).unwrap_or(1),
        }))
    }
}

/// JSON数据源提供者
pub struct JsonDataSourceProvider {
    default_config: Value,
}

impl JsonDataSourceProvider {
    pub fn new() -> Self {
        Self {
            default_config: json!({
                "source_type": "content",
                "file_path": "",
                "json_content": "{\n  \"name\": \"示例数据\",\n  \"count\": 100,\n  \"active\": true\n}",
                "auto_refresh": false,
                "refresh_interval": 300
            }),
        }
    }
}

#[async_trait]
impl DataSourceProvider for JsonDataSourceProvider {
    fn get_type_name(&self) -> &'static str { 
        "json" 
    }
    
    fn get_display_name(&self) -> &'static str { 
        "JSON文件" 
    }
    
    fn get_description(&self) -> &'static str { 
        "从JSON文件或JSON内容加载数据" 
    }
    
    fn get_icon(&self) -> Option<&'static str> { 
        Some("file-json") 
    }
    
    fn get_version(&self) -> &'static str { 
        "1.0.0" 
    }
    
    fn get_config_schema(&self) -> ConfigSchema {
        ConfigSchema {
            version: "1.0.0".to_string(),
            fields: vec![
                ConfigField {
                    name: "source_type".to_string(),
                    display_name: "数据源类型".to_string(),
                    description: Some("选择JSON数据的来源".to_string()),
                    field_type: ConfigFieldType::Select {
                        options: vec![
                            SelectOption {
                                value: json!("file"),
                                label: "从文件加载".to_string(),
                                description: Some("从本地JSON文件加载数据".to_string()),
                                icon: Some("file".to_string()),
                                disabled: false,
                            },
                            SelectOption {
                                value: json!("content"),
                                label: "直接输入JSON".to_string(),
                                description: Some("直接粘贴JSON内容".to_string()),
                                icon: Some("edit".to_string()),
                                disabled: false,
                            },
                        ],
                        searchable: false,
                    },
                    default_value: Some(json!("file")),
                    required: true,
                    depends_on: None,
                    validation: None,
                    placeholder: None,
                    group: Some("source".to_string()),
                    order: 1,
                },
                ConfigField {
                    name: "file_path".to_string(),
                    display_name: "JSON文件路径".to_string(),
                    description: Some("选择要加载的JSON文件".to_string()),
                    field_type: ConfigFieldType::File {
                        accept: ".json".to_string(),
                        multiple: false,
                        max_size: Some(10_000_000), // 10MB
                    },
                    default_value: None,
                    required: false,
                    depends_on: Some("source_type".to_string()),
                    validation: Some(FieldValidation {
                        required_if: Some("source_type == 'file'".to_string()),
                        pattern: None,
                        min_length: None,
                        max_length: None,
                        custom: None,
                    }),
                    placeholder: Some("选择JSON文件...".to_string()),
                    group: Some("source".to_string()),
                    order: 2,
                },
                ConfigField {
                    name: "json_content".to_string(),
                    display_name: "JSON内容".to_string(),
                    description: Some("直接输入或粘贴JSON内容".to_string()),
                    field_type: ConfigFieldType::Code {
                        language: "json".to_string(),
                        theme: Some("vs-dark".to_string()),
                    },
                    default_value: Some(json!("{}")),
                    required: false,
                    depends_on: Some("source_type".to_string()),
                    validation: Some(FieldValidation {
                        required_if: Some("source_type == 'content'".to_string()),
                        pattern: None,
                        min_length: Some(2),
                        max_length: Some(1_000_000), // 1MB
                        custom: Some("valid_json".to_string()),
                    }),
                    placeholder: Some("输入JSON内容...".to_string()),
                    group: Some("source".to_string()),
                    order: 3,
                },
                ConfigField {
                    name: "auto_refresh".to_string(),
                    display_name: "自动刷新".to_string(),
                    description: Some("文件修改时自动刷新数据".to_string()),
                    field_type: ConfigFieldType::Boolean,
                    default_value: Some(json!(false)),
                    required: false,
                    depends_on: Some("source_type".to_string()),
                    validation: None,
                    placeholder: None,
                    group: Some("refresh".to_string()),
                    order: 4,
                },
                ConfigField {
                    name: "refresh_interval".to_string(),
                    display_name: "刷新间隔(秒)".to_string(),
                    description: Some("自动刷新的时间间隔".to_string()),
                    field_type: ConfigFieldType::Number {
                        min: Some(10.0),
                        max: Some(3600.0),
                        step: Some(10.0),
                    },
                    default_value: Some(json!(300)),
                    required: false,
                    depends_on: Some("auto_refresh".to_string()),
                    validation: None,
                    placeholder: Some("300".to_string()),
                    group: Some("refresh".to_string()),
                    order: 5,
                },
            ],
            required_fields: vec!["source_type".to_string()],
            field_groups: vec![
                ConfigGroup {
                    name: "source".to_string(),
                    display_name: "数据源配置".to_string(),
                    description: Some("配置JSON数据的来源".to_string()),
                    fields: vec!["source_type".to_string(), "file_path".to_string(), "json_content".to_string()],
                    collapsible: false,
                },
                ConfigGroup {
                    name: "refresh".to_string(),
                    display_name: "刷新设置".to_string(),
                    description: Some("配置数据自动刷新选项".to_string()),
                    fields: vec!["auto_refresh".to_string(), "refresh_interval".to_string()],
                    collapsible: true,
                },
            ],
            validation_rules: vec![
                ValidationRule {
                    name: "source_required".to_string(),
                    description: "必须指定文件路径或JSON内容".to_string(),
                    expression: "(source_type == 'file' && file_path != null) || (source_type == 'content' && json_content != null)".to_string(),
                    error_message: "请指定JSON文件路径或直接输入JSON内容".to_string(),
                },
            ],
            examples: vec![
                ConfigExample {
                    name: "简单对象".to_string(),
                    description: "单个JSON对象示例".to_string(),
                    config: json!({
                        "source_type": "content",
                        "json_content": r#"{"name": "Alice", "age": 30, "active": true}"#
                    }),
                },
                ConfigExample {
                    name: "对象数组".to_string(),
                    description: "JSON对象数组示例".to_string(),
                    config: json!({
                        "source_type": "content",
                        "json_content": r#"[
                            {"id": 1, "name": "Alice", "score": 95.5},
                            {"id": 2, "name": "Bob", "score": 87.2}
                        ]"#
                    }),
                },
                ConfigExample {
                    name: "从文件加载".to_string(),
                    description: "从本地文件加载JSON数据".to_string(),
                    config: json!({
                        "source_type": "file",
                        "file_path": "/path/to/data.json",
                        "auto_refresh": true,
                        "refresh_interval": 60
                    }),
                },
            ],
        }
    }
    
    fn validate_config(&self, config: &Value) -> Result<(), ConfigError> {
        let source_type = config.get("source_type")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ConfigError::MissingField("source_type".to_string()))?;
        
        match source_type {
            "file" => {
                let file_path = config.get("file_path")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| ConfigError::MissingField("file_path".to_string()))?;
                
                if file_path.is_empty() {
                    return Err(ConfigError::InvalidValue {
                        field: "file_path".to_string(),
                        message: "文件路径不能为空".to_string(),
                    });
                }
                
                if !std::path::Path::new(file_path).exists() {
                    return Err(ConfigError::InvalidValue {
                        field: "file_path".to_string(),
                        message: "文件不存在".to_string(),
                    });
                }
            }
            
            "content" => {
                let json_content = config.get("json_content")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| ConfigError::MissingField("json_content".to_string()))?;
                
                if json_content.trim().is_empty() {
                    return Err(ConfigError::InvalidValue {
                        field: "json_content".to_string(),
                        message: "JSON内容不能为空".to_string(),
                    });
                }
                
                // 验证JSON格式
                serde_json::from_str::<Value>(json_content)
                    .map_err(|e| ConfigError::InvalidValue {
                        field: "json_content".to_string(),
                        message: format!("无效的JSON格式: {}", e),
                    })?;
            }
            
            _ => {
                return Err(ConfigError::InvalidValue {
                    field: "source_type".to_string(),
                    message: "无效的数据源类型".to_string(),
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
        let source_type = config["source_type"].as_str()
            .ok_or_else(|| ProviderError::ConfigError("Missing source_type".to_string()))?;
        
        let source: JsonDataSource = match source_type {
            "file" => {
                let file_path = config["file_path"].as_str()
                    .ok_or_else(|| ProviderError::ConfigError("Missing file_path".to_string()))?;
                
                JsonDataSource::from_file(id, name, PathBuf::from(file_path))
                    .map_err(|e| ProviderError::CreationError(e.to_string()))?
            }
            
            "content" => {
                let json_content = config["json_content"].as_str()
                    .ok_or_else(|| ProviderError::ConfigError("Missing json_content".to_string()))?;
                
                JsonDataSource::from_content(id, name, json_content)
                    .map_err(|e| ProviderError::CreationError(e.to_string()))?
            }
            
            _ => {
                return Err(ProviderError::ConfigError("Invalid source_type".to_string()));
            }
        };
        
        Ok(Box::new(source))
    }
    
    async fn test_connection(&self, config: &Value) -> Result<bool, ProviderError> {
        let source_type = config["source_type"].as_str()
            .ok_or_else(|| ProviderError::ConfigError("Missing source_type".to_string()))?;
        
        match source_type {
            "file" => {
                let file_path = config["file_path"].as_str()
                    .ok_or_else(|| ProviderError::ConfigError("Missing file_path".to_string()))?;
                
                // 检查文件是否存在且可读
                match std::fs::read_to_string(file_path) {
                    Ok(content) => {
                        // 验证JSON格式
                        serde_json::from_str::<Value>(&content)
                            .map(|_| true)
                            .map_err(|e| ProviderError::TestError(format!("Invalid JSON: {}", e)))
                    }
                    Err(e) => Err(ProviderError::TestError(format!("Cannot read file: {}", e)))
                }
            }
            
            "content" => {
                let json_content = config["json_content"].as_str()
                    .ok_or_else(|| ProviderError::ConfigError("Missing json_content".to_string()))?;
                
                // 验证JSON格式
                serde_json::from_str::<Value>(json_content)
                    .map(|_| true)
                    .map_err(|e| ProviderError::TestError(format!("Invalid JSON: {}", e)))
            }
            
            _ => Err(ProviderError::ConfigError("Invalid source_type".to_string()))
        }
    }
    
    async fn discover_schema(&self, config: &Value) -> Result<DataSchema, ProviderError> {
        // 创建临时数据源实例来获取Schema
        let temp_source = self.create_source(
            "temp".to_string(),
            "temp".to_string(),
            config
        ).await?;
        
        Ok(temp_source.get_schema())
    }
    
    fn supports_wizard(&self) -> bool { 
        true 
    }
    
    async fn get_wizard_steps(&self) -> Result<Vec<WizardStep>, ProviderError> {
        Ok(vec![
            WizardStep {
                id: "source_type".to_string(),
                title: "选择数据源类型".to_string(),
                description: "选择JSON数据的来源方式".to_string(),
                fields: vec!["source_type".to_string()],
                validation_required: true,
            },
            WizardStep {
                id: "data_input".to_string(),
                title: "配置数据输入".to_string(),
                description: "指定JSON文件路径或直接输入JSON内容".to_string(),
                fields: vec!["file_path".to_string(), "json_content".to_string()],
                validation_required: true,
            },
            WizardStep {
                id: "advanced_options".to_string(),
                title: "高级选项".to_string(),
                description: "配置自动刷新等高级功能".to_string(),
                fields: vec!["auto_refresh".to_string(), "refresh_interval".to_string()],
                validation_required: false,
            },
        ])
    }
    
    fn get_example_configs(&self) -> Vec<(String, Value)> {
        vec![
            ("简单对象".to_string(), json!({
                "source_type": "content",
                "json_content": r#"{"name": "Alice", "age": 30, "active": true}"#
            })),
            ("对象数组".to_string(), json!({
                "source_type": "content", 
                "json_content": r#"[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]"#
            })),
            ("从文件".to_string(), json!({
                "source_type": "file",
                "file_path": "/path/to/data.json",
                "auto_refresh": true
            })),
        ]
    }
}