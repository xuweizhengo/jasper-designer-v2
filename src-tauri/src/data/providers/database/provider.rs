// === 数据库提供者核心实现 - 修复版本 ===
use crate::data::types::*;
use async_trait::async_trait;
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::{MySql, Pool, Row, Column};
use std::collections::HashMap;

// 简化的数据库配置
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: Option<String>,
}

#[derive(Debug, Clone)]
pub struct DatabaseProvider {
    config: Option<DatabaseConfig>,
}

impl DatabaseProvider {
    pub fn new() -> Self {
        Self { config: None }
    }
}

// 辅助函数：映射MySQL类型到通用类型
fn map_mysql_type(mysql_type: &str) -> DataType {
    let lower = mysql_type.to_lowercase();
    if lower.contains("int") {
        DataType::Number
    } else if lower.contains("varchar") || lower.contains("text") || lower.contains("char") {
        DataType::String  
    } else if lower.contains("date") {
        DataType::Date
    } else if lower.contains("datetime") || lower.contains("timestamp") {
        DataType::DateTime
    } else if lower.contains("decimal") || lower.contains("float") || lower.contains("double") {
        DataType::Number
    } else if lower.contains("bool") {
        DataType::Boolean
    } else {
        DataType::String
    }
}

#[async_trait]
impl DataSourceProvider for DatabaseProvider {
    fn get_type_name(&self) -> &'static str {
        "database"
    }

    fn get_display_name(&self) -> &'static str {
        "MySQL数据库"
    }

    fn get_description(&self) -> &'static str {
        "连接MySQL数据库进行数据查询"
    }

    fn get_icon(&self) -> Option<&'static str> {
        Some("🗄️")
    }

    fn get_version(&self) -> &'static str {
        "1.0.0"
    }

    fn get_config_schema(&self) -> ConfigSchema {
        ConfigSchema {
            version: "1.0".to_string(),
            fields: vec![],
            required_fields: vec![
                "host".to_string(),
                "port".to_string(),
                "database".to_string(),
                "username".to_string()
            ],
            field_groups: vec![],
            validation_rules: vec![],
            examples: vec![],
        }
    }

    fn validate_config(&self, config: &serde_json::Value) -> Result<(), ConfigError> {
        if !config.is_object() {
            return Err(ConfigError::ValidationFailed { 
                message: "配置必须是对象格式".to_string() 
            });
        }
        
        let config_obj = config.as_object().unwrap();
        
        let required_fields = ["host", "port", "database", "username"];
        for field in required_fields {
            if !config_obj.contains_key(field) {
                return Err(ConfigError::MissingField(field.to_string()));
            }
        }
        
        if let Some(port_val) = config_obj.get("port") {
            if let Some(port_num) = port_val.as_u64() {
                if port_num == 0 || port_num > 65535 {
                    return Err(ConfigError::InvalidValue {
                        field: "port".to_string(),
                        message: "端口号必须在1-65535之间".to_string()
                    });
                }
            } else {
                return Err(ConfigError::InvalidValue {
                    field: "port".to_string(),
                    message: "端口号必须是数字".to_string()
                });
            }
        }
        
        Ok(())
    }

    fn get_default_config(&self) -> serde_json::Value {
        json!({
            "host": "localhost",
            "port": 3306,
            "database": "",
            "username": "",
            "password": ""
        })
    }

    async fn create_source(
        &self,
        id: String,
        name: String,
        config: &serde_json::Value
    ) -> Result<Box<dyn DataSource>, ProviderError> {
        self.validate_config(config).map_err(|e| ProviderError::ConfigError(e.to_string()))?;
        
        let source = crate::data::providers::database::source::DatabaseSource::new(
            id,
            name,
            config.clone(),
        );
        Ok(Box::new(source))
    }

    async fn test_connection(&self, config: &serde_json::Value) -> Result<bool, ProviderError> {
        let host = config["host"].as_str().unwrap_or("localhost");
        let port = config["port"].as_u64().unwrap_or(3306) as u16;
        let database = config["database"].as_str().unwrap_or("");
        let username = config["username"].as_str().unwrap_or("");
        let password = config["password"].as_str().unwrap_or("");
        
        let connection_string = format!(
            "mysql://{}:{}@{}:{}/{}?connect_timeout=10&socket_timeout=30",
            username, password, host, port, database
        );
        
        println!("🔄 正在测试MySQL连接: {}:{}@{}:{}/{}", username, "***", host, port, database);
        
        match sqlx::MySqlPool::connect(&connection_string).await {
            Ok(pool) => {
                println!("✅ MySQL连接测试成功");
                // 执行一个简单的查询来验证连接
                match sqlx::query("SELECT 1").fetch_one(&pool).await {
                    Ok(_) => {
                        println!("✅ 数据库查询测试成功");
                        Ok(true)
                    }
                    Err(e) => {
                        println!("❌ 数据库查询测试失败: {}", e);
                        Err(ProviderError::TestError(format!("查询测试失败: {}", e)))
                    }
                }
            }
            Err(e) => {
                println!("❌ MySQL连接失败: {}", e);
                Err(ProviderError::TestError(format!("连接失败: {}", e)))
            }
        }
    }

    async fn discover_schema(&self, config: &serde_json::Value) -> Result<DataSchema, ProviderError> {
        let host = config["host"].as_str().unwrap_or("localhost");
        let port = config["port"].as_u64().unwrap_or(3306) as u16;
        let database = config["database"].as_str().unwrap_or("");
        let username = config["username"].as_str().unwrap_or("");
        let password = config["password"].as_str().unwrap_or("");
        
        let connection_string = format!(
            "mysql://{}:{}@{}:{}/{}?connect_timeout=10&socket_timeout=30",
            username, password, host, port, database
        );
        
        println!("🔄 正在发现数据库结构: {}:{}@{}:{}/{}", username, "***", host, port, database);
        
        let pool = sqlx::MySqlPool::connect(&connection_string).await
            .map_err(|e| {
                println!("❌ 连接数据库失败: {}", e);
                ProviderError::TestError(format!("连接失败: {}", e))
            })?;
        
        let mut columns = Vec::new();
        
        // 查询所有表及其字段信息
        let tables_query = format!(
            "SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                COLUMN_KEY,
                EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '{}' 
            ORDER BY TABLE_NAME, ORDINAL_POSITION", 
            database
        );
        
        let table_rows = sqlx::query(&tables_query)
            .fetch_all(&pool)
            .await
            .map_err(|e| {
                println!("❌ 查询表结构失败: {}", e);
                ProviderError::Internal(format!("查询表失败: {}", e))
            })?;
        
        for row in table_rows {
            let table_name: String = row.get("TABLE_NAME");
            let column_name: String = row.get("COLUMN_NAME");
            let data_type: String = row.get("DATA_TYPE");
            let is_nullable: String = row.get("IS_NULLABLE");
            let column_key: String = row.get("COLUMN_KEY");
            
            let full_column_name = format!("{}.{}", table_name, column_name);
            
            columns.push(DataColumn {
                name: full_column_name,
                display_name: Some(column_name.clone()),
                data_type: map_mysql_type(&data_type),
                nullable: is_nullable == "YES",
                description: Some(format!("来自表 {} 的 {} 字段", table_name, column_name)),
                format_hint: None,
                default_value: None,
                constraints: vec![],
                sample_values: vec![],
                source_column: Some(column_name),
                source_table: Some(table_name),
                is_primary_key: column_key == "PRI",
                is_foreign_key: column_key == "MUL",
            });
        }
        
        // 查询主键信息
        let primary_key_query = format!(
            "SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = '{}' AND CONSTRAINT_NAME = 'PRIMARY'
            ORDER BY TABLE_NAME, ORDINAL_POSITION", 
            database
        );
        
        let primary_keys = sqlx::query(&primary_key_query)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();
        
        // 查询索引信息
        let indexes_query = format!(
            "SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = '{}' 
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX", 
            database
        );
        
        let index_rows = sqlx::query(&indexes_query)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();
        
        let mut indexes = Vec::new();
        for row in index_rows {
            let table_name: String = row.get("TABLE_NAME");
            let index_name: String = row.get("INDEX_NAME");
            let column_name: String = row.get("COLUMN_NAME");
            let non_unique: i32 = row.get("NON_UNIQUE");
            
            indexes.push(IndexInfo {
                name: format!("{}.{}", table_name, index_name),
                columns: vec![format!("{}.{}", table_name, column_name)],
                unique: non_unique == 0,
                partial: None,
            });
        }
        
        println!("✅ 数据库结构发现成功: {} 个字段, {} 个索引", columns.len(), indexes.len());
        
        Ok(DataSchema {
            version: "1.0".to_string(),
            last_updated: Utc::now(),
            columns,
            primary_key: if primary_keys.is_empty() {
                None
            } else {
                Some(primary_keys.iter().map(|pk| {
                    let table_name: String = pk.get("TABLE_NAME");
                    let column_name: String = pk.get("COLUMN_NAME");
                    format!("{}.{}", table_name, column_name)
                }).collect())
            },
            indexes,
            relationships: vec![], // 外键关系后续可以扩展
        })
    }
}