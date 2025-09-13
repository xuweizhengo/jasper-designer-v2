// === 简化的数据库API实现 ===
use serde::{Deserialize, Serialize};
use serde_json::Value;
use chrono::{DateTime, Utc};
use sqlx::{MySqlPool, Row, Column};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub database_type: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
    pub ssl_enabled: bool,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            database_type: "mysql".to_string(),
            host: "localhost".to_string(),
            port: 3306,
            database: String::new(),
            username: String::new(),
            password: String::new(),
            ssl_enabled: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub message: String,
    pub connection_info: Option<ConnectionInfo>,
    pub error_details: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionInfo {
    pub database_version: Option<String>,
    pub server_info: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseSchema {
    pub database_name: String,
    pub schemas: Vec<SchemaInfo>,
    pub loaded_at: DateTime<Utc>,
    pub connection_info: ConnectionSummary,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SchemaInfo {
    pub name: String,
    pub tables: Vec<TableInfo>,
    pub views: Vec<ViewInfo>,
    pub functions: Option<Vec<FunctionInfo>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub schema: String,
    pub full_name: String,
    pub columns: Vec<DatabaseColumnInfo>,
    pub primary_keys: Vec<String>,
    pub foreign_keys: Vec<ForeignKeyInfo>,
    pub indexes: Vec<IndexInfo>,
    pub row_count_estimate: u64,
    pub size_estimate: String,
    pub comment: Option<String>,
    pub table_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub default_value: Option<String>,
    pub character_maximum_length: Option<usize>,
    pub numeric_precision: Option<usize>,
    pub numeric_scale: Option<usize>,
    pub is_primary_key: bool,
    pub is_foreign_key: bool,
    pub comment: Option<String>,
    pub distinct_count_estimate: Option<usize>,
    pub sample_values: Option<Vec<Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ForeignKeyInfo {
    pub constraint_name: String,
    pub column_name: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexInfo {
    pub name: String,
    pub columns: Vec<String>,
    pub unique: bool,
    pub index_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViewInfo {
    pub name: String,
    pub schema: String,
    pub definition: String,
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub name: String,
    pub return_type: String,
    pub parameters: Vec<ParameterInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParameterInfo {
    pub name: String,
    pub data_type: String,
    pub mode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionSummary {
    pub host: String,
    pub database: String,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<HashMap<String, Value>>,
    pub total_rows: usize,
    pub execution_time: u64,
    pub query: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SqlValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub suggestions: Vec<String>,
    pub is_safe: bool,
    pub security_issues: Vec<String>,
    pub formatted_sql: Option<String>,
}

// 真实的数据库连接测试实现
pub async fn test_database_connection_simple(config: DatabaseConfig) -> Result<ConnectionTestResult, String> {
    // 参数验证
    if config.database.is_empty() || config.username.is_empty() {
        return Ok(ConnectionTestResult {
            success: false,
            message: "数据库名称和用户名不能为空".to_string(),
            connection_info: None,
            error_details: Some("缺少必需的连接参数".to_string()),
        });
    }

    // 构建连接字符串
    let connection_string = format!(
        "mysql://{}:{}@{}:{}/{}?connect_timeout=10",
        config.username, 
        config.password, 
        config.host, 
        config.port, 
        config.database
    );
    
    println!("🔄 测试数据库连接: {}@{}:{}/{}", config.username, config.host, config.port, config.database);
    
    // 尝试真实连接
    match MySqlPool::connect(&connection_string).await {
        Ok(pool) => {
            // 执行简单查询验证连接
            match sqlx::query("SELECT VERSION() as version, CONNECTION_ID() as conn_id")
                .fetch_one(&pool)
                .await {
                Ok(row) => {
                    let version: String = row.try_get("version").unwrap_or_default();
                    let conn_id: u32 = row.try_get("conn_id").unwrap_or(0);
                    
                    println!("✅ 数据库连接成功: {} (连接ID: {})", version, conn_id);
                    
                    Ok(ConnectionTestResult {
                        success: true,
                        message: "数据库连接成功".to_string(),
                        connection_info: Some(ConnectionInfo {
                            database_version: Some(version),
                            server_info: Some(format!("{}:{}", config.host, config.port)),
                        }),
                        error_details: None,
                    })
                }
                Err(e) => {
                    println!("❌ 查询测试失败: {}", e);
                    Ok(ConnectionTestResult {
                        success: false,
                        message: "连接成功但查询失败".to_string(),
                        connection_info: None,
                        error_details: Some(e.to_string()),
                    })
                }
            }
        }
        Err(e) => {
            println!("❌ 数据库连接失败: {}", e);
            Ok(ConnectionTestResult {
                success: false,
                message: "数据库连接失败".to_string(),
                connection_info: None,
                error_details: Some(e.to_string()),
            })
        }
    }
}

// 真实的数据库架构加载实现
pub async fn load_database_schema_simple(config: DatabaseConfig) -> Result<DatabaseSchema, String> {
    // 参数验证
    if config.database.is_empty() {
        return Err("数据库名称不能为空".to_string());
    }

    // 构建连接字符串
    let connection_string = format!(
        "mysql://{}:{}@{}:{}/{}?connect_timeout=10",
        config.username, 
        config.password, 
        config.host, 
        config.port, 
        config.database
    );
    
    println!("🔄 加载数据库架构: {}/{}", config.host, config.database);
    
    // 连接数据库
    let pool = match MySqlPool::connect(&connection_string).await {
        Ok(pool) => pool,
        Err(e) => {
            println!("❌ 连接数据库失败: {}", e);
            return Err(format!("连接数据库失败: {}", e));
        }
    };
    
    // 查询所有表信息
    let tables_query = format!(
        "SELECT 
            TABLE_NAME, 
            TABLE_TYPE,
            TABLE_ROWS,
            DATA_LENGTH,
            TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '{}'
        ORDER BY TABLE_NAME",
        config.database
    );
    
    let table_rows = sqlx::query(&tables_query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("查询表信息失败: {}", e))?;
    
    let mut tables = Vec::new();
    
    for table_row in table_rows {
        let table_name: String = table_row.try_get("TABLE_NAME").unwrap_or_default();
        let table_type: String = table_row.try_get("TABLE_TYPE").unwrap_or_default();
        let row_count: Option<i64> = table_row.try_get("TABLE_ROWS").ok();
        let data_length: Option<i64> = table_row.try_get("DATA_LENGTH").ok();
        let table_comment: Option<String> = table_row.try_get("TABLE_COMMENT").ok();
        
        // 查询表的列信息
        let columns_query = format!(
            "SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE,
                COLUMN_KEY,
                EXTRA,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}'
            ORDER BY ORDINAL_POSITION",
            config.database, table_name
        );
        
        let column_rows = sqlx::query(&columns_query)
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("查询列信息失败: {}", e))?;
        
        let mut columns = Vec::new();
        let mut primary_keys = Vec::new();
        
        for col_row in column_rows {
            let column_name: String = col_row.try_get("COLUMN_NAME").unwrap_or_default();
            let data_type: String = col_row.try_get("DATA_TYPE").unwrap_or_default();
            let is_nullable: String = col_row.try_get("IS_NULLABLE").unwrap_or_default();
            let column_default: Option<String> = col_row.try_get("COLUMN_DEFAULT").ok();
            let char_max_len: Option<i64> = col_row.try_get("CHARACTER_MAXIMUM_LENGTH").ok();
            let num_precision: Option<i64> = col_row.try_get("NUMERIC_PRECISION").ok();
            let num_scale: Option<i64> = col_row.try_get("NUMERIC_SCALE").ok();
            let column_key: String = col_row.try_get("COLUMN_KEY").unwrap_or_default();
            let column_comment: Option<String> = col_row.try_get("COLUMN_COMMENT").ok();
            
            let is_primary = column_key == "PRI";
            let is_foreign = column_key == "MUL";
            
            if is_primary {
                primary_keys.push(column_name.clone());
            }
            
            columns.push(DatabaseColumnInfo {
                name: column_name,
                data_type,
                nullable: is_nullable == "YES",
                default_value: column_default,
                character_maximum_length: char_max_len.map(|v| v as usize),
                numeric_precision: num_precision.map(|v| v as usize),
                numeric_scale: num_scale.map(|v| v as usize),
                is_primary_key: is_primary,
                is_foreign_key: is_foreign,
                comment: column_comment,
                distinct_count_estimate: None,
                sample_values: None,
            });
        }
        
        // 查询外键信息
        let fk_query = format!(
            "SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}' 
                AND REFERENCED_TABLE_NAME IS NOT NULL",
            config.database, table_name
        );
        
        let fk_rows = sqlx::query(&fk_query)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();
        
        let foreign_keys: Vec<ForeignKeyInfo> = fk_rows.iter().map(|row| {
            ForeignKeyInfo {
                constraint_name: row.try_get("CONSTRAINT_NAME").unwrap_or_default(),
                column_name: row.try_get("COLUMN_NAME").unwrap_or_default(),
                referenced_table: row.try_get("REFERENCED_TABLE_NAME").unwrap_or_default(),
                referenced_column: row.try_get("REFERENCED_COLUMN_NAME").unwrap_or_default(),
            }
        }).collect();
        
        // 查询索引信息
        let index_query = format!(
            "SELECT DISTINCT
                INDEX_NAME,
                NON_UNIQUE,
                INDEX_TYPE
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}'",
            config.database, table_name
        );
        
        let index_rows = sqlx::query(&index_query)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();
        
        let mut indexes = Vec::new();
        for idx_row in index_rows {
            let index_name: String = idx_row.try_get("INDEX_NAME").unwrap_or_default();
            let non_unique: i8 = idx_row.try_get("NON_UNIQUE").unwrap_or(1);
            let index_type: String = idx_row.try_get("INDEX_TYPE").unwrap_or_default();
            
            // 获取索引列
            let idx_cols_query = format!(
                "SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}' AND INDEX_NAME = '{}'
                ORDER BY SEQ_IN_INDEX",
                config.database, table_name, index_name
            );
            
            let idx_col_rows = sqlx::query(&idx_cols_query)
                .fetch_all(&pool)
                .await
                .unwrap_or_default();
            
            let index_columns: Vec<String> = idx_col_rows.iter().map(|row| {
                row.try_get("COLUMN_NAME").unwrap_or_default()
            }).collect();
            
            indexes.push(IndexInfo {
                name: index_name,
                columns: index_columns,
                unique: non_unique == 0,
                index_type,
            });
        }
        
        // 计算表大小
        let size_str = if let Some(length) = data_length {
            if length < 1024 {
                format!("{} B", length)
            } else if length < 1024 * 1024 {
                format!("{:.2} KB", length as f64 / 1024.0)
            } else {
                format!("{:.2} MB", length as f64 / (1024.0 * 1024.0))
            }
        } else {
            "Unknown".to_string()
        };
        
        tables.push(TableInfo {
            name: table_name.clone(),
            schema: config.database.clone(),
            full_name: format!("{}.{}", config.database, table_name),
            columns,
            primary_keys,
            foreign_keys,
            indexes,
            row_count_estimate: row_count.unwrap_or(0) as u64,
            size_estimate: size_str,
            comment: table_comment,
            table_type,
        });
    }
    
    // 查询视图信息
    let views_query = format!(
        "SELECT 
            TABLE_NAME,
            VIEW_DEFINITION,
            CHECK_OPTION,
            IS_UPDATABLE
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_SCHEMA = '{}'",
        config.database
    );
    
    let view_rows = sqlx::query(&views_query)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    
    let views: Vec<ViewInfo> = view_rows.iter().map(|row| {
        ViewInfo {
            name: row.try_get("TABLE_NAME").unwrap_or_default(),
            schema: config.database.clone(),
            definition: row.try_get("VIEW_DEFINITION").unwrap_or_default(),
            comment: None,
        }
    }).collect();
    
    println!("✅ 成功加载数据库架构: {} 个表, {} 个视图", tables.len(), views.len());
    
    let schemas = vec![
        SchemaInfo {
            name: config.database.clone(),
            tables,
            views,
            functions: None,
        },
    ];

    Ok(DatabaseSchema {
        database_name: config.database.clone(),
        schemas,
        loaded_at: chrono::Utc::now(),
        connection_info: ConnectionSummary {
            host: config.host,
            database: config.database,
            username: config.username,
        },
    })
}

// 真实的数据库查询执行实现
pub async fn execute_database_query(config: DatabaseConfig, sql: String, limit: Option<u32>) -> Result<QueryResult, String> {
    use std::time::Instant;
    
    // 参数验证
    if sql.trim().is_empty() {
        return Err("SQL查询不能为空".to_string());
    }
    
    // 构建连接字符串
    let connection_string = format!(
        "mysql://{}:{}@{}:{}/{}?connect_timeout=10",
        config.username, 
        config.password, 
        config.host, 
        config.port, 
        config.database
    );
    
    println!("🔄 执行SQL查询: {}/{}", config.host, config.database);
    
    // 连接数据库
    let pool = match MySqlPool::connect(&connection_string).await {
        Ok(pool) => pool,
        Err(e) => {
            println!("❌ 连接数据库失败: {}", e);
            return Err(format!("连接数据库失败: {}", e));
        }
    };
    
    // 确保查询有LIMIT限制
    let final_sql = if !sql.to_uppercase().contains("LIMIT") {
        let limit_value = limit.unwrap_or(50);
        format!("{} LIMIT {}", sql, limit_value)
    } else {
        sql.clone()
    };
    
    // 记录开始时间
    let start_time = Instant::now();
    
    // 执行查询
    let rows = match sqlx::query(&final_sql).fetch_all(&pool).await {
        Ok(rows) => rows,
        Err(e) => {
            println!("❌ 查询执行失败: {}", e);
            return Err(format!("查询执行失败: {}", e));
        }
    };
    
    // 计算执行时间
    let execution_time = start_time.elapsed().as_millis() as u64;
    
    // 处理结果集
    let mut result_rows = Vec::new();
    let mut columns = Vec::new();
    
    if !rows.is_empty() {
        // 获取列信息
        let first_row = &rows[0];
        for column in first_row.columns() {
            columns.push(column.name().to_string());
        }
        
        // 转换每一行数据
        for row in rows {
            let mut row_map = HashMap::new();
            for (i, column) in row.columns().iter().enumerate() {
                let column_name = column.name();
                
                // 尝试获取不同类型的值
                let value = if let Ok(v) = row.try_get::<Option<String>, _>(i) {
                    v.map(Value::String).unwrap_or(Value::Null)
                } else if let Ok(v) = row.try_get::<Option<i64>, _>(i) {
                    v.map(|n| Value::Number(serde_json::Number::from(n))).unwrap_or(Value::Null)
                } else if let Ok(v) = row.try_get::<Option<f64>, _>(i) {
                    v.and_then(|n| serde_json::Number::from_f64(n))
                        .map(Value::Number)
                        .unwrap_or(Value::Null)
                } else if let Ok(v) = row.try_get::<Option<bool>, _>(i) {
                    v.map(Value::Bool).unwrap_or(Value::Null)
                } else {
                    Value::Null
                };
                
                row_map.insert(column_name.to_string(), value);
            }
            result_rows.push(row_map);
        }
    }
    
    let total_rows = result_rows.len();
    
    println!("✅ 查询执行成功: {} 行结果, 耗时 {} ms", total_rows, execution_time);
    
    Ok(QueryResult {
        columns,
        rows: result_rows,
        total_rows,
        execution_time,
        query: final_sql,
    })
}