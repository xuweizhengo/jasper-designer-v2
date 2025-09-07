// === Tauri数据源管理命令 ===
use crate::data::{DataQuery, DataSet, DataSourceTypeInfo, DataSchema, DataSourceInfo, ConfigSchema, ManagedDataRegistry, DataSourceProvider, DataSourceConfig, DataSourceConfigType, DatabaseSourceConfig};
use crate::data::providers::database::DatabaseProvider;
use tauri::State;
use serde_json::Value;
use uuid::Uuid;
use serde::Deserialize;

// 使用统一的类型定义，确保与main.rs的.manage()类型匹配
// pub type DataRegistry = Mutex<DataSourceRegistry>; // 删除旧定义，使用统一定义

// ========== 数据源管理Commands ==========

/// 获取所有可用的数据源类型
#[tauri::command]
pub async fn get_available_data_source_types(
    registry: State<'_, ManagedDataRegistry>
) -> Result<Vec<DataSourceTypeInfo>, String> {
    let registry = registry.lock().await;
    Ok(registry.get_available_types())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateSourceReq {
    name: String,
    provider_type: String,
    config: Value,
}

/// 创建数据源实例
#[tauri::command]
pub async fn create_data_source(
    req: CreateSourceReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<String, String> {
    let id = format!("{}_{}", req.provider_type, Uuid::new_v4().to_string()[..8].to_string());
    let mut registry = registry.lock().await;
    registry
        .create_data_source(id.clone(), req.name, req.provider_type, req.config)
        .await
        .map_err(|e| format!("Failed to create data source: {}", e))?;
    Ok(id)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProviderConfigReq { provider_type: String, config: Value }

/// 测试数据源连接
#[tauri::command]
pub async fn test_data_source_connection(
    req: ProviderConfigReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<bool, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    provider.test_connection(&req.config).await
        .map_err(|e| format!("Connection test failed: {}", e))
}

/// 列出所有数据源
#[tauri::command]
pub async fn list_data_sources(
    registry: State<'_, ManagedDataRegistry>
) -> Result<Vec<DataSourceInfo>, String> {
    let registry = registry.lock().await;
    Ok(registry.list_all_sources())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct IdReq { source_id: String }

/// 删除数据源
#[tauri::command]
pub async fn delete_data_source(
    req: IdReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<(), String> {
    let mut registry = registry.lock().await;
    registry.remove_data_source(&req.source_id).await
        .map_err(|e| format!("Failed to delete data source: {}", e))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdateConfigReq { source_id: String, config: Value }

/// 更新数据源配置
#[tauri::command]
pub async fn update_data_source_config(
    req: UpdateConfigReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<(), String> {
    let mut registry = registry.lock().await;
    registry.update_data_source_config(&req.source_id, req.config).await
        .map_err(|e| format!("Failed to update data source config: {}", e))
}

// ========== 数据查询Commands ==========

/// 查询数据 (通用接口)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct QueryReq { source_id: String, query: Option<DataQuery> }

#[tauri::command]
pub async fn query_data_source(
    req: QueryReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSet, String> {
    let registry = registry.lock().await;
    registry.query_data(&req.source_id, req.query).await
        .map_err(|e| format!("Failed to query data source: {}", e))
}

/// 获取数据预览 (限制行数)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PreviewReq { source_id: String, path: Option<String>, limit: Option<usize> }

#[tauri::command]
pub async fn get_data_preview(
    req: PreviewReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSet, String> {
    let query = DataQuery {
        path: req.path,
        filter: None,
        limit: req.limit.or(Some(50)), // 默认预览50行
        offset: None,
        sort: None,
        aggregation: None,
        context: None,
    };
    
    let registry = registry.lock().await;
    registry.query_data(&req.source_id, Some(query)).await
        .map_err(|e| format!("Failed to get data preview: {}", e))
}

/// 求值表达式
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EvalReq { source_id: String, expression: String, context: Option<Value> }

#[tauri::command]
pub async fn evaluate_expression(
    req: EvalReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<Value, String> {
    let query = DataQuery {
        path: Some(req.expression),
        filter: None,
        limit: Some(1),
        offset: None,
        sort: None,
        aggregation: None,
        context: req.context,
    };
    
    let registry = registry.lock().await;
    let dataset = registry.query_data(&req.source_id, Some(query)).await
        .map_err(|e| format!("Expression evaluation failed: {}", e))?;
    
    Ok(dataset.rows.into_iter().next().unwrap_or(Value::Null))
}

/// 批量表达式求值
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EvalBatchReq { source_id: String, expressions: Vec<String>, context: Option<Value> }

#[tauri::command]
pub async fn evaluate_expressions_batch(
    req: EvalBatchReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<Vec<ExpressionResult>, String> {
    let registry = registry.lock().await;
    let mut results = Vec::new();
    
    for expression in req.expressions {
        let query = DataQuery {
            path: Some(expression.clone()),
            filter: None,
            limit: Some(1),
            offset: None,
            sort: None,
            aggregation: None,
            context: req.context.clone(),
        };
        
        match registry.query_data(&req.source_id, Some(query)).await {
            Ok(dataset) => {
                let result = dataset.rows.into_iter().next().unwrap_or(Value::Null);
                results.push(ExpressionResult {
                    expression,
                    result: Some(result),
                    error: None,
                });
            }
            Err(e) => {
                results.push(ExpressionResult {
                    expression,
                    result: None,
                    error: Some(e.to_string()),
                });
            }
        }
    }
    
    Ok(results)
}

/// 搜索数据
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SearchReq { source_id: String, search_term: String, fields: Option<Vec<String>>, limit: Option<usize> }

#[tauri::command]
pub async fn search_data(
    req: SearchReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSet, String> {
    // 构建简单的搜索过滤器
    let filter = if let Some(fields) = req.fields.clone() {
        // 在指定字段中搜索
        let conditions: Vec<String> = fields.iter()
            .map(|field| format!("{} LIKE '%{}%'", field, req.search_term))
            .collect();
        Some(conditions.join(" OR "))
    } else {
        // 在所有字段中搜索
        Some(format!("* LIKE '%{}%'", req.search_term))
    };
    
    let query = DataQuery {
        path: None,
        filter,
        limit: req.limit.or(Some(50)),
        offset: None,
        sort: None,
        aggregation: None,
        context: None,
    };
    
    let registry = registry.lock().await;
    registry.query_data(&req.source_id, Some(query)).await
        .map_err(|e| format!("Failed to search data: {}", e))
}

// ========== Schema管理Commands ==========

/// 获取数据源Schema
#[tauri::command]
pub async fn get_data_source_schema(
    req: IdReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSchema, String> {
    let registry = registry.lock().await;
    let source = registry.get_data_source(&req.source_id)
        .ok_or_else(|| format!("Data source not found: {}", req.source_id))?;
    
    Ok(source.get_schema())
}

/// 刷新数据源Schema
#[tauri::command]
pub async fn refresh_data_source_schema(
    req: IdReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSchema, String> {
    let mut registry = registry.lock().await;
    registry.refresh_data_source_schema(&req.source_id).await
        .map_err(|e| format!("Failed to refresh schema: {}", e))
}

/// 发现Schema (自动推断)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProviderReq { provider_type: String }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProviderConfigOnlyReq { provider_type: String, config: Value }

#[tauri::command]
pub async fn discover_schema(
    req: ProviderConfigOnlyReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DataSchema, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    provider.discover_schema(&req.config).await
        .map_err(|e| format!("Schema discovery failed: {}", e))
}

// ========== 配置管理Commands ==========

/// 获取配置Schema
#[tauri::command]
pub async fn get_config_schema(
    req: ProviderReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<ConfigSchema, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    
    Ok(provider.get_config_schema())
}

/// 验证配置参数
#[tauri::command]
pub async fn validate_config(
    req: ProviderConfigOnlyReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<ConfigValidationResult, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    
    match provider.validate_config(&req.config) {
        Ok(()) => Ok(ConfigValidationResult {
            valid: true,
            errors: vec![],
            warnings: vec![],
        }),
        Err(e) => Ok(ConfigValidationResult {
            valid: false,
            errors: vec![e.to_string()],
            warnings: vec![],
        }),
    }
}

/// 获取默认配置
#[tauri::command]
pub async fn get_default_config(
    req: ProviderReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<Value, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    
    Ok(provider.get_default_config())
}

/// 获取示例配置
#[tauri::command]
pub async fn get_example_configs(
    req: ProviderReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<Vec<ConfigExample>, String> {
    let registry = registry.lock().await;
    let provider = registry.get_provider(&req.provider_type)
        .ok_or_else(|| format!("Provider not found: {}", req.provider_type))?;
    
    let examples = provider.get_example_configs();
    Ok(examples.into_iter()
        .map(|(name, config)| ConfigExample {
            name,
            description: format!("Example configuration for {}", provider.get_display_name()),
            config,
        })
        .collect())
}

// ========== Response Types ==========

#[derive(Debug, Clone, serde::Serialize)]
pub struct ExpressionResult {
    pub expression: String,
    pub result: Option<Value>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConfigValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConfigExample {
    pub name: String,
    pub description: String,
    pub config: Value,
}

// ========== Database-specific Commands ==========

/// 测试数据库连接
#[tauri::command]
pub async fn test_database_connection(config: serde_json::Value) -> Result<crate::data::database_simple::ConnectionTestResult, String> {
    use crate::data::database_simple::{DatabaseConfig, test_database_connection_simple};
    
    let db_config: DatabaseConfig = serde_json::from_value(config)
        .map_err(|e| format!("配置解析失败: {}", e))?;
    
    test_database_connection_simple(db_config).await
}

/// 加载数据库架构
#[tauri::command]
pub async fn load_database_schema(config: serde_json::Value) -> Result<crate::data::database_simple::DatabaseSchema, String> {
    use crate::data::database_simple::{DatabaseConfig, load_database_schema_simple};
    
    let db_config: DatabaseConfig = serde_json::from_value(config)
        .map_err(|e| format!("配置解析失败: {}", e))?;
    
    load_database_schema_simple(db_config).await
}

/// 发现数据库架构
#[tauri::command]
pub async fn discover_database_schema(config: serde_json::Value) -> Result<DataSchema, String> {
    let provider = DatabaseProvider::new();
    provider.discover_schema(&config).await
        .map_err(|e| format!("Failed to discover database schema: {}", e))
}

/// 创建数据库数据源 - 重构版本
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateDbSourceReq {
    name: String,
    description: Option<String>,
    database_type: String,
    host: String,
    port: u16,
    database: String,
    username: String,
    password: Option<String>,
    sql: String,
    selected_tables: Vec<String>,
    tags: Option<Vec<String>>,
}

#[tauri::command]
pub async fn create_database_source(
    req: CreateDbSourceReq,
    registry: State<'_, ManagedDataRegistry>
) -> Result<String, String> {
    use uuid::Uuid;
    use chrono::Utc;
    
    println!("🔍 Rust端接收到create_database_source调用");
    println!("🔍 参数: name={}, databaseType={}", req.name, req.database_type);
    println!("🔍 selected_tables={:?}, sql长度={}", req.selected_tables, req.sql.len());
    
    // 生成唯一ID
    let id = Uuid::new_v4().to_string();
    println!("🔍 生成的ID: {}", id);
    
    // 构建数据库数据源配置
    let database_config = DatabaseSourceConfig {
        database_type: req.database_type.clone(),
        host: req.host,
        port: req.port,
        database: req.database,
        username: req.username,
        password: req.password,
        sql: req.sql,
        selected_tables: req.selected_tables,
    };
    
    // 构建完整数据源配置
    let data_source_config = DataSourceConfig {
        id: id.clone(),
        name: req.name,
        source_type: DataSourceConfigType::Database(database_config),
        description: req.description,
        tags: req.tags.unwrap_or_default(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    // 保存到注册表
    let mut registry = registry.lock().await;
    
    // 使用新的保存方法
    registry.save_data_source_config(data_source_config.clone()).await
        .map_err(|e| format!("Failed to save data source config: {:?}", e))?;
    
    println!("✅ 数据源创建成功: {} (ID: {})", data_source_config.name, id);
    
    Ok(id)
}

/// 格式化SQL (基础实现)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FormatSqlReq { sql: String, database_type: String }

#[tauri::command]
pub async fn format_sql(req: FormatSqlReq) -> Result<String, String> {
    // 基础SQL格式化
    let formatted = req.sql
        .replace(" WHERE ", "\nWHERE ")
        .replace(" FROM ", "\nFROM ")
        .replace(" JOIN ", "\nJOIN ")
        .replace(" ORDER BY ", "\nORDER BY ")
        .replace(" GROUP BY ", "\nGROUP BY ")
        .replace(" HAVING ", "\nHAVING ");
    
    Ok(formatted)
}

/// 验证SQL语法
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ValidateSqlReq { sql: String, database_type: String }

#[tauri::command]
pub async fn validate_sql_syntax(req: ValidateSqlReq) -> Result<ValidationResult, String> {
    use crate::data::providers::database::utils::{validate_sql_security, format_sql_basic};
    
    println!("🔍 Rust端接收到validate_sql_syntax调用");
    println!("🔍 参数 sql 长度: {} 字符", req.sql.len());
    println!("🔍 参数 databaseType: {}", req.database_type);
    
    let sql = req.sql.trim();
    if sql.is_empty() {
        return Ok(ValidationResult {
            valid: false,
            errors: vec!["SQL查询不能为空".to_string()],
            warnings: vec![],
            suggestions: vec!["请输入有效的SQL查询语句".to_string()],
            is_safe: false,
            security_issues: vec!["空查询".to_string()],
        });
    }

    let mut errors = Vec::new();
    let mut warnings = Vec::new();
    let mut suggestions = Vec::new();
    
    // 基础语法检查
    let sql_upper = sql.to_uppercase();
    
    // 检查是否是SELECT查询
    if !sql_upper.trim_start().starts_with("SELECT") {
        errors.push("当前只支持SELECT查询语句".to_string());
        suggestions.push("请使用SELECT语句查询数据".to_string());
    }
    
    // 检查基本的SQL结构
    if sql_upper.contains("SELECT") && !sql_upper.contains("FROM") {
        errors.push("SELECT查询缺少FROM子句".to_string());
    }
    
    // 检查括号匹配
    let open_parens = sql.chars().filter(|&c| c == '(').count();
    let close_parens = sql.chars().filter(|&c| c == ')').count();
    if open_parens != close_parens {
        errors.push("括号不匹配".to_string());
    }
    
    // 检查引号匹配
    let single_quotes = sql.chars().filter(|&c| c == '\'').count();
    if single_quotes % 2 != 0 {
        errors.push("单引号不匹配".to_string());
    }
    
    // 安全性检查
    let (is_safe, security_issues) = validate_sql_security(&sql);
    
    // 性能建议
    if sql_upper.contains("SELECT *") {
        warnings.push("使用 SELECT * 可能影响性能，建议明确指定需要的列".to_string());
        suggestions.push("考虑使用具体的列名替换 *".to_string());
    }
    
    if !sql_upper.contains("LIMIT") && !sql_upper.contains("TOP") {
        warnings.push("未使用LIMIT限制结果数量，可能返回大量数据".to_string());
        suggestions.push("建议添加 LIMIT 子句限制返回行数".to_string());
    }
    
    // 数据库特定检查
    match req.database_type.to_lowercase().as_str() {
        "mysql" => {
            if sql_upper.contains("ISNULL(") {
                warnings.push("MySQL中建议使用IFNULL()而不是ISNULL()".to_string());
            }
        }
        "postgresql" => {
            if sql_upper.contains("LIMIT") && !sql_upper.contains("OFFSET") {
                suggestions.push("PostgreSQL支持OFFSET子句进行分页".to_string());
            }
        }
        _ => {}
    }
    
    let valid = errors.is_empty();
    
    Ok(ValidationResult {
        valid,
        errors,
        warnings,
        suggestions,
        is_safe,
        security_issues,
    })
}

/// 执行数据库查询预览
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExecutePreviewReq { config: serde_json::Value, sql: String, limit: Option<u32> }

#[tauri::command]
pub async fn execute_database_preview(req: ExecutePreviewReq) -> Result<QueryResult, String> {
    use crate::data::database_simple::{DatabaseConfig, QueryResult as SimpleQueryResult};
    use std::time::Instant;
    
    let db_config: DatabaseConfig = serde_json::from_value(req.config)
        .map_err(|e| format!("配置解析失败: {}", e))?;
    
    let sql = req.sql.trim();
    if sql.is_empty() {
        return Err("SQL查询不能为空".to_string());
    }
    
    // 确保查询有LIMIT限制
    let final_sql = if !sql.to_uppercase().contains("LIMIT") {
        let limit_value = req.limit.unwrap_or(50);
        format!("{} LIMIT {}", sql, limit_value)
    } else {
        sql.to_string()
    };
    
    // 模拟查询执行
    let start_time = Instant::now();
    
    // 这里应该是真实的数据库查询，现在先返回模拟数据
    let execution_time = start_time.elapsed().as_millis() as u64;
    
    // 生成示例数据用于测试
    let columns = vec![
        "id".to_string(),
        "name".to_string(), 
        "email".to_string(),
        "created_at".to_string(),
        "status".to_string(),
    ];
    
    let mut rows = Vec::new();
    for i in 1..=std::cmp::min(req.limit.unwrap_or(10), 50) {
        let mut row = std::collections::HashMap::new();
        row.insert("id".to_string(), serde_json::Value::Number(serde_json::Number::from(i)));
        row.insert("name".to_string(), serde_json::Value::String(format!("用户{}", i)));
        row.insert("email".to_string(), serde_json::Value::String(format!("user{}@example.com", i)));
        row.insert("created_at".to_string(), serde_json::Value::String("2024-01-01 10:00:00".to_string()));
        row.insert("status".to_string(), serde_json::Value::String(if i % 2 == 0 { "active" } else { "inactive" }.to_string()));
        rows.push(row);
    }
    
    let total_rows = rows.len();
    
    Ok(QueryResult {
        columns,
        rows,
        total_rows,
        execution_time,
        query: final_sql,
    })
}

/// 获取查询执行计划 (简化版)
#[tauri::command]
pub async fn explain_query(config: serde_json::Value, sql: String) -> Result<serde_json::Value, String> {
    // 生成模拟的查询执行计划
    let plan = serde_json::json!({
        "query": sql,
        "execution_plan": [
            {
                "step": 1,
                "operation": "Table Scan",
                "table": "users", 
                "estimated_rows": 1000,
                "cost": 100.0
            },
            {
                "step": 2,
                "operation": "Filter",
                "condition": "WHERE条件",
                "estimated_rows": 100,
                "cost": 10.0
            },
            {
                "step": 3,
                "operation": "Sort",
                "columns": ["created_at DESC"],
                "estimated_rows": 100,
                "cost": 15.0
            }
        ],
        "total_cost": 125.0,
        "estimated_execution_time": "~50ms"
    });
    
    Ok(plan)
}

/// 获取表数据样本
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TableSampleReq { config: serde_json::Value, table_name: String, limit: Option<u32> }

#[tauri::command]
pub async fn get_table_sample(req: TableSampleReq) -> Result<QueryResult, String> {
    let limit = req.limit.unwrap_or(10);
    let sql = format!("SELECT * FROM {} LIMIT {}", req.table_name, limit);
    execute_database_preview(ExecutePreviewReq { config: req.config, sql, limit: Some(limit) }).await
}

// 需要的类型定义
#[derive(Debug, Clone, serde::Serialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub suggestions: Vec<String>,
    pub is_safe: bool,
    pub security_issues: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<std::collections::HashMap<String, serde_json::Value>>,
    pub total_rows: usize,
    pub execution_time: u64,
    pub query: String,
}
