// === 数据库数据源实例实现 - 修复版本 ===
use crate::data::types::*;
use async_trait::async_trait;
use serde_json::{json, Value};
use sqlx::{MySql, Pool, Row, Column, TypeInfo};
use chrono::Utc;

pub struct DatabaseSource {
    id: String,
    name: String,
    config: Value,
    schema: Option<DataSchema>,
}

impl DatabaseSource {
    pub fn new(id: String, name: String, config: Value) -> Self {
        Self {
            id,
            name,
            config,
            schema: None,
        }
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
        let host = self.config["host"].as_str().unwrap_or("localhost");
        let port = self.config["port"].as_u64().unwrap_or(3306) as u16;
        let database = self.config["database"].as_str().unwrap_or("");
        let username = self.config["username"].as_str().unwrap_or("");
        let password = self.config["password"].as_str().unwrap_or("");
        
        let connection_string = format!(
            "mysql://{}:{}@{}:{}/{}?connect_timeout=10&socket_timeout=30",
            username, password, host, port, database
        );
        
        println!("🔄 正在查询数据库: {}:{}@{}:{}/{}", username, "***", host, port, database);
        
        let pool = sqlx::MySqlPool::connect(&connection_string).await
            .map_err(|e| {
                println!("❌ 数据库连接失败: {}", e);
                DataError::ConnectionError { 
                    message: e.to_string(),
                    retry_after: Some(std::time::Duration::from_secs(5))
                }
            })?;
        
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
        let rows_result = sqlx::query(&sql)
            .fetch_all(&pool)
            .await
            .map_err(|e| {
                println!("❌ SQL查询失败: {}", e);
                DataError::QueryError { 
                    message: format!("查询执行失败: {}", e), 
                    query: Some(sql.clone()) 
                }
            })?;
        
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
            "mysql://{}:{}@{}:{}/{}",
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
        // 重新获取schema信息，目前简化处理
        self.schema = Some(DataSchema {
            version: "1.0".to_string(),
            last_updated: Utc::now(),
            columns: vec![],
            primary_key: None,
            indexes: vec![],
            relationships: vec![],
        });
        Ok(())
    }
}