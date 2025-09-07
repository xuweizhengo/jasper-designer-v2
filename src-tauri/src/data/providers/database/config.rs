// === 数据库配置管理 - 简化版本 ===
use crate::data::types::*;
use serde_json::json;
use std::collections::HashMap;

/// 获取数据库配置Schema定义
pub fn get_database_config_schema() -> ConfigSchema {
    ConfigSchema {
        version: "1.0".to_string(),
        fields: vec![], // 简化版，暂时为空
        required_fields: vec![
            "host".to_string(),
            "port".to_string(),
            "database".to_string(),
            "username".to_string()
        ],
        field_groups: vec![], // 简化版，暂时为空
        validation_rules: vec![], // 简化版，暂时为空
        examples: vec![], // 简化版，暂时为空
    }
}

/// 获取默认数据库配置
pub fn get_default_database_config() -> serde_json::Value {
    json!({
        "host": "localhost",
        "port": 3306,
        "database": "",
        "username": "",
        "password": ""
    })
}