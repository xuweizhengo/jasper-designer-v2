// === 数据库相关数据类型定义 ===
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
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
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: u32,
    pub idle_timeout: u32,
    pub sql: String,
    pub use_custom_sql: bool,
    pub query_timeout: u32,
    pub default_limit: u32,
    pub enable_caching: bool,
    pub cache_ttl: u32,
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
            max_connections: 10,
            min_connections: 1,
            connection_timeout: 30,
            idle_timeout: 600,
            sql: String::new(),
            use_custom_sql: false,
            query_timeout: 60,
            default_limit: 1000,
            enable_caching: true,
            cache_ttl: 300,
        }
    }
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
    pub character_maximum_length: Option<u32>,
    pub numeric_precision: Option<u32>,
    pub numeric_scale: Option<u32>,
    pub is_primary_key: bool,
    pub is_foreign_key: bool,
    pub comment: Option<String>,
    pub distinct_count_estimate: Option<u64>,
    pub sample_values: Option<Vec<Value>>,
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
    pub schema: String,
    pub return_type: String,
    pub parameters: Vec<ParameterInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParameterInfo {
    pub name: String,
    pub data_type: String,
    pub default_value: Option<String>,
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
pub struct ConnectionSummary {
    pub host: String,
    pub database: String,
    pub username: String,
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
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<HashMap<String, Value>>,
    pub total_rows: usize,
    pub execution_time: u64,
    pub query: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub suggestions: Vec<String>,
    pub is_safe: bool,
    pub security_issues: Vec<String>,
}