// === 数据库数据源实例实现 - 修复版本 ===
use crate::data::types::*;
use async_trait::async_trait;
use serde_json::{json, Value};
use sqlx::{MySql, Pool, Row, Column, TypeInfo};
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct DatabaseSource {
    id: String,
    name: String,
    config: Value,
    schema: Option<DataSchema>,
    pool: Arc<RwLock<Option<Pool<MySql>>>>,
}

impl DatabaseSource {
    pub fn new(id: String, name: String, config: Value) -> Self {
        Self {
            id,
            name,
            config,
            schema: None,
            pool: Arc::new(RwLock::new(None)),
        }
    }
    
    async fn get_pool(&self) -> Result<Pool<MySql>, DataError> {
        // 先检查是否已有连接池
        {
            let pool_guard = self.pool.read().await;
            if let Some(pool) = pool_guard.as_ref() {
                // 测试连接是否有效
                if let Ok(_) = sqlx::query("SELECT 1").fetch_one(pool).await {
                    return Ok(pool.clone());
                }
                // 连接无效，继续创建新连接
                println!("⚠️ 检测到连接池失效，重新创建连接");
            }
        }
        
        // 创建新连接池
        let host = self.config["host"].as_str().unwrap_or("localhost");
        let port = self.config["port"].as_u64().unwrap_or(3306) as u16;
        let database = self.config["database"].as_str().unwrap_or("");
        let username = self.config["username"].as_str().unwrap_or("");
        let password = self.config["password"].as_str().unwrap_or("");
        
        let connection_string = format!(
            "mysql://{}:{}@{}:{}/{}?connect_timeout=30",
            username, password, host, port, database
        );
        
        println!("🔄 创建数据库连接池: {}@{}:{}/{}", username, host, port, database);
        
        // 创建连接池配置
        let pool = sqlx::mysql::MySqlPoolOptions::new()
            .max_connections(5)
            .min_connections(1)
            .acquire_timeout(std::time::Duration::from_secs(30))
            .test_before_acquire(true) // 获取前测试连接
            .connect(&connection_string)
            .await
            .map_err(|e| {
                println!("❌ 数据库连接失败: {}", e);
                DataError::ConnectionError { 
                    message: format!("数据库连接失败: {}", e),
                    retry_after: Some(std::time::Duration::from_secs(5))
                }
            })?;
        
        // 保存连接池
        let mut pool_guard = self.pool.write().await;
        *pool_guard = Some(pool.clone());
        
        println!("✅ 数据库连接池创建成功");
        Ok(pool)
    }
}

// 辅助函数：映射MySQL列类型到通用数据类型
fn map_column_type(mysql_type: &str) -> DataType {
    let lower = mysql_type.to_lowercase();
    match lower.as_str() {
        "tinyint" | "smallint" | "mediumint" | "int" | "bigint" => DataType::Number,
        "float" | "double" | "decimal" | "numeric" => DataType::Number,
        "char" | "varchar" | "text" | "tinytext" | "mediumtext" | "longtext" => DataType::String,
        "date" => DataType::Date,
        "datetime" | "timestamp" | "time" => DataType::DateTime,
        "bit" | "bool" | "boolean" => DataType::Boolean,
        "json" => DataType::Object,
        "blob" | "tinyblob" | "mediumblob" | "longblob" | "binary" | "varbinary" => DataType::Object,
        _ => DataType::String
    }
}

// 辅助函数：从数据库行中提取值
fn extract_column_value(row: &sqlx::mysql::MySqlRow, index: usize, data_type: &DataType) -> Value {
    match data_type {
        DataType::Number => {
            // 尝试不同的数字类型
            if let Ok(val) = row.try_get::<i64, _>(index) {
                return json!(val);
            }
            if let Ok(val) = row.try_get::<f64, _>(index) {
                return json!(val);
            }
            if let Ok(val) = row.try_get::<i32, _>(index) {
                return json!(val);
            }
        },
        DataType::Boolean => {
            if let Ok(val) = row.try_get::<bool, _>(index) {
                return json!(val);
            }
        },
        DataType::Date | DataType::DateTime => {
            if let Ok(val) = row.try_get::<chrono::NaiveDateTime, _>(index) {
                return json!(val.format("%Y-%m-%d %H:%M:%S").to_string());
            }
            if let Ok(val) = row.try_get::<chrono::NaiveDate, _>(index) {
                return json!(val.format("%Y-%m-%d").to_string());
            }
        },
        _ => {}
    }
    
    // 默认尝试字符串
    if let Ok(val) = row.try_get::<Option<String>, _>(index) {
        if let Some(s) = val {
            json!(s)
        } else {
            Value::Null
        }
    } else {
        Value::Null
    }
}

#[async_trait]
impl DataSource for DatabaseSource {
    fn get_id(&self) -> &str {
        &self.id
    }

    fn get_name(&self) -> &str {
        &self.name
    }

    fn get_type(&self) -> DataSourceType {
        DataSourceType::Database(DatabaseType::MySQL)
    }

    // 注意：get_config不在DataSource trait中，移除这个方法
    // fn get_config(&self) -> serde_json::Value {
    //     self.config.clone()
    // }

    fn get_schema(&self) -> DataSchema {
        self.schema.clone().unwrap_or_else(|| DataSchema {
            version: "1.0".to_string(),
            last_updated: Utc::now(),
            columns: vec![],
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
        })
    }

    async fn get_data(&self, query: Option<DataQuery>) -> Result<DataSet, DataError> {
        // 使用持久化连接池
        let pool = self.get_pool().await?;
        
        let database = self.config["database"].as_str().unwrap_or("");
        println!("🔄 正在查询数据库: {}", database);
        
        // 构建SQL查询
        let sql = if let Some(q) = &query {
            if let Some(path) = &q.path {
                // path包含自定义SQL查询
                let mut custom_sql = path.clone();
                
                // 添加LIMIT限制（如果没有的话）
                if let Some(limit) = q.limit {
                    if !custom_sql.to_uppercase().contains("LIMIT") {
                        custom_sql = format!("{} LIMIT {}", custom_sql.trim_end_matches(';'), limit);
                    }
                }
                custom_sql
            } else {
                // 构建基本查询
                let table_name = self.config["selected_table"].as_str()
                    .or(self.config["table"].as_str())
                    .unwrap_or("information_schema.tables");
                    
                let limit = q.limit.unwrap_or(100);
                format!("SELECT * FROM {} LIMIT {}", table_name, limit)
            }
        } else {
            // 默认查询 - 显示数据库中的表信息
            format!("SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = '{}' 
                    LIMIT 10", database)
        };
        
        println!("📋 执行SQL查询: {}", sql);
        
        let start_time = std::time::Instant::now();
        
        // 执行查询，如果失败尝试重连
        let rows_result = match sqlx::query(&sql).fetch_all(&pool).await {
            Ok(rows) => rows,
            Err(e) => {
                let error_str = e.to_string();
                println!("❌ SQL查询失败: {}", error_str);
                
                // 检查是否是连接错误
                if error_str.contains("EOF") || error_str.contains("Connection") || error_str.contains("closed") {
                    println!("🔄 检测到连接错误，尝试重新连接...");
                    
                    // 清除旧连接池
                    {
                        let mut pool_guard = self.pool.write().await;
                        *pool_guard = None;
                    }
                    
                    // 获取新连接池并重试
                    let new_pool = self.get_pool().await?;
                    sqlx::query(&sql)
                        .fetch_all(&new_pool)
                        .await
                        .map_err(|e| {
                            println!("❌ 重试后仍然失败: {}", e);
                            DataError::QueryError { 
                                message: format!("查询执行失败（重试后）: {}", e), 
                                query: Some(sql.clone()) 
                            }
                        })?
                } else {
                    return Err(DataError::QueryError { 
                        message: format!("查询执行失败: {}", e), 
                        query: Some(sql.clone()) 
                    });
                }
            }
        };
        
        let execution_time = start_time.elapsed();
        println!("✅ SQL查询完成，返回 {} 行数据，耗时 {:?}", rows_result.len(), execution_time);
        
        let mut rows = Vec::new();
        let mut columns = Vec::new();
        
        if let Some(first_row) = rows_result.first() {
            // 获取列信息并改进类型映射
            columns = first_row.columns().iter()
                .map(|col| {
                    let data_type = map_column_type(col.type_info().name());
                    DataColumn {
                        name: col.name().to_string(),
                        display_name: Some(col.name().to_string()),
                        data_type,
                        nullable: true, // MySQL列信息中可以获取，但这里简化处理
                        description: Some(format!("来自MySQL数据库的 {} 字段", col.name())),
                        constraints: vec![],
                        default_value: None,
                        format_hint: None,
                        sample_values: vec![],
                        source_column: Some(col.name().to_string()),
                        source_table: None,
                        is_primary_key: false,
                        is_foreign_key: false,
                    }
                })
                .collect();
        }
        
        // 转换行数据，改进数据类型处理
        for row in rows_result {
            let mut row_map = serde_json::Map::new();
            for (i, column) in columns.iter().enumerate() {
                let value = extract_column_value(&row, i, &column.data_type);
                row_map.insert(column.name.clone(), value);
            }
            rows.push(Value::Object(row_map));
        }
        
        let total_count = rows.len();
        println!("🎯 数据转换完成: {} 行 × {} 列", total_count, columns.len());
        
        Ok(DataSet {
            rows,
            columns,
            total_count,
            cached: false,
            cache_time: None,
            checksum: None,
            metadata: Some(DataSetMetadata {
                source_id: self.id.clone(),
                execution_time: execution_time.as_millis() as u64,
                generated_at: Utc::now(),
                version: None,
                warnings: vec![],
                pagination: None,
                quality_metrics: None,
            }),
        })
    }

    async fn test_connection(&self) -> Result<bool, DataError> {
        let host = self.config["host"].as_str().unwrap_or("localhost");
        let port = self.config["port"].as_u64().unwrap_or(3306) as u16;
        let database = self.config["database"].as_str().unwrap_or("");
        let username = self.config["username"].as_str().unwrap_or("");
        let password = self.config["password"].as_str().unwrap_or("");
        
        let connection_string = format!(
            "mysql://{}:{}@{}:{}/{}?connect_timeout=30&socket_timeout=30",
            username, password, host, port, database
        );
        
        match sqlx::MySqlPool::connect(&connection_string).await {
            Ok(_) => Ok(true),
            Err(e) => Err(DataError::ConnectionError { 
                message: e.to_string(),
                retry_after: Some(std::time::Duration::from_secs(5))
            })
        }
    }

    fn get_capabilities(&self) -> DataSourceCapabilities {
        DataSourceCapabilities {
            supports_query: true,
            supports_filter: true,
            supports_sort: true,
            supports_aggregation: true,
            supports_real_time: false,
            supports_schema_refresh: true,
            max_concurrent_connections: 10,
            estimated_query_cost: crate::data::types::QueryCost::Medium,
        }
    }

    async fn refresh_schema(&mut self) -> Result<(), DataError> {
        let database = self.config["database"].as_str().unwrap_or("");
        let table_name = self.config["table"].as_str();
        
        println!("🔄 正在获取数据库Schema: {}", database);
        
        // 使用持久化连接池
        let pool = self.get_pool().await?;
        
        // 获取表的列信息
        let mut columns = vec![];
        
        if let Some(table) = table_name {
            // 如果指定了表名，只获取该表的列信息
            let query = format!(
                "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, COLUMN_COMMENT 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}' 
                 ORDER BY ORDINAL_POSITION",
                database, table
            );
            
            let rows = sqlx::query(&query)
                .fetch_all(&pool)
                .await
                .map_err(|e| DataError::QueryError { 
                    message: format!("Failed to fetch schema: {}", e),
                    query: Some(query.clone())
                })?;
            
            for row in rows {
                let column_name: String = row.get(0);
                let data_type: String = row.get(1);
                let is_nullable: String = row.get(2);
                let column_default: Option<String> = row.try_get(3).ok();
                let column_key: String = row.get(4);
                let column_comment: Option<String> = row.try_get(5).ok();
                
                columns.push(DataColumn {
                    name: column_name.clone(),
                    display_name: Some(column_name.clone()),
                    data_type: map_column_type(&data_type),
                    nullable: is_nullable == "YES",
                    description: column_comment,
                    default_value: column_default.map(|v| json!(v)),
                    format_hint: None,
                    constraints: vec![],
                    sample_values: vec![],
                    source_column: Some(column_name.clone()),
                    source_table: Some(table.to_string()),
                    is_primary_key: column_key == "PRI",
                    is_foreign_key: column_key == "MUL",
                });
            }
            
            println!("✅ Schema获取成功: 表 {} 包含 {} 个字段", table, columns.len());
        } else {
            // 如果没有指定表名，获取数据库中所有表的第一个表的列信息
            let tables_query = format!(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = '{}' AND TABLE_TYPE = 'BASE TABLE' 
                 LIMIT 1",
                database
            );
            
            let table_row = sqlx::query(&tables_query)
                .fetch_optional(&pool)
                .await
                .map_err(|e| DataError::QueryError { 
                    message: format!("Failed to list tables: {}", e),
                    query: Some(tables_query.clone())
                })?;
            
            if let Some(table_row) = table_row {
                let first_table: String = table_row.get(0);
                
                let query = format!(
                    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, COLUMN_COMMENT 
                     FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = '{}' AND TABLE_NAME = '{}' 
                     ORDER BY ORDINAL_POSITION",
                    database, first_table
                );
                
                let rows = sqlx::query(&query)
                    .fetch_all(&pool)
                    .await
                    .map_err(|e| DataError::QueryError { 
                        message: format!("Failed to fetch schema: {}", e),
                        query: Some(query.clone())
                    })?;
                
                for row in rows {
                    let column_name: String = row.get(0);
                    let data_type: String = row.get(1);
                    let is_nullable: String = row.get(2);
                    let column_default: Option<String> = row.try_get(3).ok();
                    let column_key: String = row.get(4);
                    let column_comment: Option<String> = row.try_get(5).ok();
                    
                    columns.push(DataColumn {
                        name: column_name.clone(),
                        display_name: Some(column_name.clone()),
                        data_type: map_column_type(&data_type),
                        nullable: is_nullable == "YES",
                        description: column_comment,
                        default_value: column_default.map(|v| json!(v)),
                        format_hint: None,
                        constraints: vec![],
                        sample_values: vec![],
                        source_column: Some(column_name.clone()),
                        source_table: Some(first_table.clone()),
                        is_primary_key: column_key == "PRI",
                        is_foreign_key: column_key == "MUL",
                    });
                }
                
                println!("✅ Schema获取成功: 默认表 {} 包含 {} 个字段", first_table, columns.len());
            } else {
                println!("⚠️ 数据库 {} 中没有找到任何表", database);
            }
        }
        
        // 更新schema
        self.schema = Some(DataSchema {
            version: "1.0".to_string(),
            last_updated: Utc::now(),
            columns,
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
        });
        
        Ok(())
    }
}
