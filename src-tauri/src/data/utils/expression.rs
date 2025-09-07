// === 表达式解析工具 ===
use crate::data::types::DataError;
use serde_json::Value;

/// 表达式求值器
pub struct ExpressionEvaluator;

impl ExpressionEvaluator {
    /// 验证JSONPath表达式
    pub fn validate_json_path(expression: &str) -> Result<(), DataError> {
        if expression.is_empty() {
            return Err(DataError::ConfigError {
                message: "Expression cannot be empty".to_string(),
                field: Some("expression".to_string()),
            });
        }
        
        // 基本语法检查
        let bracket_count = expression.matches('[').count();
        let close_bracket_count = expression.matches(']').count();
        
        if bracket_count != close_bracket_count {
            return Err(DataError::ConfigError {
                message: "Unmatched brackets in expression".to_string(),
                field: Some("expression".to_string()),
            });
        }
        
        // 检查非法字符
        if !expression.chars().all(|c| c.is_alphanumeric() || ".[]_\"'".contains(c)) {
            return Err(DataError::ConfigError {
                message: "Invalid characters in expression".to_string(),
                field: Some("expression".to_string()),
            });
        }
        
        Ok(())
    }
    
    /// 评估表达式复杂度
    pub fn estimate_complexity(expression: &str) -> ExpressionComplexity {
        let depth = expression.matches('.').count();
        let array_accesses = expression.matches('[').count();
        
        match depth + array_accesses {
            0..=2 => ExpressionComplexity::Simple,
            3..=5 => ExpressionComplexity::Medium,
            6..=10 => ExpressionComplexity::Complex,
            _ => ExpressionComplexity::VeryComplex,
        }
    }
    
    /// 提取表达式中的字段名
    pub fn extract_field_names(expression: &str) -> Vec<String> {
        let mut fields = Vec::new();
        let parts: Vec<&str> = expression.split('.').collect();
        
        for part in parts {
            if let Some(bracket_pos) = part.find('[') {
                let field_name = &part[..bracket_pos];
                if !field_name.is_empty() {
                    fields.push(field_name.to_string());
                }
            } else {
                fields.push(part.to_string());
            }
        }
        
        fields
    }
    
    /// 生成示例表达式
    pub fn generate_sample_expressions(schema_columns: &[String]) -> Vec<String> {
        let mut expressions = Vec::new();
        
        // 添加简单字段访问
        for column in schema_columns.iter().take(5) {
            expressions.push(column.clone());
        }
        
        // 添加一些常见的嵌套访问模式
        expressions.extend(vec![
            "data.items".to_string(),
            "result.records".to_string(),
            "response.data[0]".to_string(),
            "users[0].name".to_string(),
            "settings.database.host".to_string(),
        ]);
        
        expressions
    }
}

/// 表达式复杂度
#[derive(Debug, Clone, Copy)]
pub enum ExpressionComplexity {
    Simple,      // 1-2层
    Medium,      // 3-5层
    Complex,     // 6-10层
    VeryComplex, // >10层
}

/// 表达式解析结果
#[derive(Debug, Clone)]
pub struct ParsedExpression {
    pub original: String,
    pub parts: Vec<ExpressionPart>,
    pub complexity: ExpressionComplexity,
    pub estimated_cost: u32, // 预估执行成本 (ms)
}

/// 表达式部分
#[derive(Debug, Clone)]
pub enum ExpressionPart {
    Field(String),
    ArrayAccess { field: String, index: usize },
    Wildcard,
    Filter { condition: String },
}

impl ExpressionEvaluator {
    /// 解析表达式为结构化部分
    pub fn parse_expression(expression: &str) -> Result<ParsedExpression, DataError> {
        Self::validate_json_path(expression)?;
        
        let mut parts = Vec::new();
        let segments: Vec<&str> = expression.split('.').collect();
        
        for segment in segments {
            if segment.is_empty() {
                continue;
            }
            
            if segment == "*" {
                parts.push(ExpressionPart::Wildcard);
            } else if let Some(bracket_pos) = segment.find('[') {
                let field_name = &segment[..bracket_pos];
                let bracket_content = &segment[bracket_pos+1..segment.len()-1];
                
                if let Ok(index) = bracket_content.parse::<usize>() {
                    parts.push(ExpressionPart::ArrayAccess {
                        field: field_name.to_string(),
                        index,
                    });
                } else {
                    parts.push(ExpressionPart::Filter {
                        condition: bracket_content.to_string(),
                    });
                }
            } else {
                parts.push(ExpressionPart::Field(segment.to_string()));
            }
        }
        
        let complexity = Self::estimate_complexity(expression);
        let estimated_cost = match complexity {
            ExpressionComplexity::Simple => 1,
            ExpressionComplexity::Medium => 5,
            ExpressionComplexity::Complex => 20,
            ExpressionComplexity::VeryComplex => 100,
        };
        
        Ok(ParsedExpression {
            original: expression.to_string(),
            parts,
            complexity,
            estimated_cost,
        })
    }
    
    /// 优化表达式
    pub fn optimize_expression(expression: &str) -> String {
        // 移除多余的空格和点
        expression
            .trim()
            .replace(" ", "")
            .replace("..", ".")
            .trim_matches('.')
            .to_string()
    }
    
    /// 检查表达式是否可以缓存
    pub fn is_cacheable(expression: &str) -> bool {
        // 静态表达式可以缓存
        !expression.contains("now()") && 
        !expression.contains("random()") &&
        !expression.contains("uuid()")
    }
}