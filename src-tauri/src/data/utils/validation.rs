// === 数据验证工具 ===
use crate::data::types::{DataType, DataError, ValidationViolation};
use serde_json::Value;
use std::collections::HashMap;

/// 数据验证器
pub struct DataValidator;

impl DataValidator {
    /// 验证数据类型
    pub fn validate_data_type(value: &Value, expected_type: &DataType) -> Result<(), DataError> {
        let valid = match (value, expected_type) {
            (Value::Null, _) => true, // Null可以匹配任何类型（如果允许nullable）
            (Value::Bool(_), DataType::Boolean) => true,
            (Value::Number(_), DataType::Number) => true,
            (Value::String(_), DataType::String) => true,
            (Value::String(s), DataType::Date) => Self::is_valid_date(s),
            (Value::String(s), DataType::DateTime) => Self::is_valid_datetime(s),
            (Value::Array(_), DataType::Array) => true,
            (Value::Object(_), DataType::Object) => true,
            _ => false,
        };
        
        if !valid {
            return Err(DataError::ValidationError {
                message: format!(
                    "Type mismatch: expected {:?}, got {:?}", 
                    expected_type,
                    Self::infer_value_type(value)
                ),
                violations: vec![ValidationViolation {
                    field: "value".to_string(),
                    message: "Type mismatch".to_string(),
                    violation_type: "type_error".to_string(),
                }],
            });
        }
        
        Ok(())
    }
    
    /// 验证数据完整性
    pub fn validate_dataset(
        rows: &[Value],
        expected_columns: &[String]
    ) -> Result<Vec<ValidationViolation>, DataError> {
        let mut violations = Vec::new();
        
        for (row_index, row) in rows.iter().enumerate() {
            if let Value::Object(obj) = row {
                // 检查缺失的列
                for expected_col in expected_columns {
                    if !obj.contains_key(expected_col) {
                        violations.push(ValidationViolation {
                            field: format!("row[{}].{}", row_index, expected_col),
                            message: "Missing required field".to_string(),
                            violation_type: "missing_field".to_string(),
                        });
                    }
                }
                
                // 检查额外的列
                for actual_col in obj.keys() {
                    if !expected_columns.contains(actual_col) {
                        violations.push(ValidationViolation {
                            field: format!("row[{}].{}", row_index, actual_col),
                            message: "Unexpected field".to_string(),
                            violation_type: "extra_field".to_string(),
                        });
                    }
                }
            } else {
                violations.push(ValidationViolation {
                    field: format!("row[{}]", row_index),
                    message: "Row must be an object".to_string(),
                    violation_type: "type_error".to_string(),
                });
            }
        }
        
        Ok(violations)
    }
    
    /// 验证字符串格式
    pub fn validate_format(value: &str, format_hint: &str) -> bool {
        match format_hint {
            "email" => Self::is_valid_email(value),
            "phone" => Self::is_valid_phone(value),
            "url" => Self::is_valid_url(value),
            "date" => Self::is_valid_date(value),
            "datetime" => Self::is_valid_datetime(value),
            "uuid" => Self::is_valid_uuid(value),
            "color" => Self::is_valid_color(value),
            "currency" => Self::is_valid_currency(value),
            _ => true, // 未知格式默认通过
        }
    }
    
    /// 推断值的数据类型
    pub fn infer_value_type(value: &Value) -> DataType {
        match value {
            Value::Null => DataType::Null,
            Value::Bool(_) => DataType::Boolean,
            Value::Number(_) => DataType::Number,
            Value::String(s) => {
                if Self::is_valid_date(s) {
                    DataType::Date
                } else if Self::is_valid_datetime(s) {
                    DataType::DateTime
                } else {
                    DataType::String
                }
            },
            Value::Array(_) => DataType::Array,
            Value::Object(_) => DataType::Object,
        }
    }
    
    /// 检查数据质量
    pub fn assess_data_quality(rows: &[Value]) -> HashMap<String, f64> {
        let mut quality_metrics = HashMap::new();
        
        if rows.is_empty() {
            return quality_metrics;
        }
        
        let total_rows = rows.len() as f64;
        let mut completeness_sum = 0.0;
        let consistency_violations = 0;
        
        for row in rows {
            if let Value::Object(obj) = row {
                let non_null_fields = obj.values()
                    .filter(|v| !v.is_null())
                    .count() as f64;
                let total_fields = obj.len() as f64;
                
                if total_fields > 0.0 {
                    completeness_sum += non_null_fields / total_fields;
                }
            }
        }
        
        // 计算完整性指标 (非空值比例)
        let completeness = if total_rows > 0.0 { 
            completeness_sum / total_rows 
        } else { 
            0.0 
        };
        
        // 计算一致性指标 (简化版)
        let consistency = if consistency_violations == 0 {
            1.0
        } else {
            1.0 - (consistency_violations as f64 / total_rows).min(1.0)
        };
        
        quality_metrics.insert("completeness".to_string(), completeness);
        quality_metrics.insert("consistency".to_string(), consistency);
        quality_metrics.insert("validity".to_string(), 1.0); // 简化：假设通过基础验证的数据都有效
        quality_metrics.insert("accuracy".to_string(), 0.9); // 简化：无法自动检测准确性
        quality_metrics.insert("uniqueness".to_string(), 0.95); // 简化：需要更复杂的重复检测
        quality_metrics.insert("timeliness".to_string(), 1.0); // 简化：假设数据是及时的
        
        quality_metrics
    }
    
    // ========== 私有辅助方法 ==========
    
    fn is_valid_date(s: &str) -> bool {
        // 简单的日期格式验证 YYYY-MM-DD
        s.len() == 10 && 
        s.chars().enumerate().all(|(i, c)| {
            match i {
                4 | 7 => c == '-',
                _ => c.is_ascii_digit()
            }
        })
    }
    
    fn is_valid_datetime(s: &str) -> bool {
        // 简单的ISO 8601格式验证
        s.contains('T') && (s.ends_with('Z') || s.contains('+') || s.rfind('-').map_or(false, |i| i > 10))
    }
    
    fn is_valid_email(s: &str) -> bool {
        // 简化的邮箱验证
        s.contains('@') && s.contains('.') && s.len() > 5
    }
    
    fn is_valid_phone(s: &str) -> bool {
        // 简化的电话号码验证
        s.chars().any(|c| c.is_ascii_digit()) && s.len() >= 10
    }
    
    fn is_valid_url(s: &str) -> bool {
        // 简化的URL验证
        s.starts_with("http://") || s.starts_with("https://")
    }
    
    fn is_valid_uuid(s: &str) -> bool {
        // 简化的UUID验证
        let parts: Vec<&str> = s.split('-').collect();
        parts.len() == 5 && parts.iter().all(|p| p.chars().all(|c| c.is_ascii_hexdigit()))
    }
    
    fn is_valid_color(s: &str) -> bool {
        // 简化的颜色验证 (十六进制)
        s.starts_with('#') && s.len() == 7 && s[1..].chars().all(|c| c.is_ascii_hexdigit())
    }
    
    fn is_valid_currency(s: &str) -> bool {
        // 简化的货币格式验证
        s.chars().any(|c| c.is_ascii_digit()) && 
        (s.contains('$') || s.contains('¥') || s.contains('€') || s.contains('£'))
    }
}

/// 数据清洗器
pub struct DataCleaner;

impl DataCleaner {
    /// 清理空值
    pub fn clean_nulls(value: &mut Value, strategy: NullHandlingStrategy) {
        match strategy {
            NullHandlingStrategy::Remove => {
                if let Value::Object(obj) = value {
                    obj.retain(|_, v| !v.is_null());
                } else if let Value::Array(arr) = value {
                    arr.retain(|v| !v.is_null());
                }
            },
            NullHandlingStrategy::ReplaceWithDefault(ref default_val) => {
                Self::replace_nulls_recursive(value, default_val);
            },
            NullHandlingStrategy::Keep => {
                // 保持原样
            }
        }
    }
    
    /// 标准化字符串
    pub fn normalize_strings(value: &mut Value) {
        match value {
            Value::String(s) => {
                *s = s.trim().to_lowercase();
            },
            Value::Object(obj) => {
                for v in obj.values_mut() {
                    Self::normalize_strings(v);
                }
            },
            Value::Array(arr) => {
                for v in arr.iter_mut() {
                    Self::normalize_strings(v);
                }
            },
            _ => {}
        }
    }
    
    /// 递归替换空值
    fn replace_nulls_recursive(value: &mut Value, default_value: &Value) {
        match value {
            Value::Null => *value = default_value.clone(),
            Value::Object(obj) => {
                for v in obj.values_mut() {
                    Self::replace_nulls_recursive(v, default_value);
                }
            },
            Value::Array(arr) => {
                for v in arr.iter_mut() {
                    Self::replace_nulls_recursive(v, default_value);
                }
            },
            _ => {}
        }
    }
}

/// 空值处理策略
#[derive(Debug, Clone)]
pub enum NullHandlingStrategy {
    Remove,
    ReplaceWithDefault(Value),
    Keep,
}

// 注意: 使用简化的验证方法，避免额外依赖