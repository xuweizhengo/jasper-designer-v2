// === 数据库工具函数 ===
use crate::data::types::DataType;
use regex::Regex;

/// 将数据库数据类型映射到通用数据类型
pub fn map_database_type(db_type: &str) -> DataType {
    match db_type.to_lowercase().as_str() {
        "varchar" | "char" | "text" | "longtext" | "mediumtext" | "tinytext" => DataType::String,
        "int" | "integer" | "bigint" | "smallint" | "tinyint" | "mediumint" => DataType::Number,
        "decimal" | "numeric" | "float" | "double" | "real" => DataType::Number,
        "boolean" | "bool" | "bit" => DataType::Boolean,
        "date" => DataType::Date,
        "datetime" | "timestamp" => DataType::DateTime,
        "json" => DataType::Object,
        _ => DataType::String,
    }
}

/// 基础SQL格式化
pub fn format_sql_basic(sql: &str) -> String {
    let mut formatted = sql.to_string();
    
    // 标准化关键字大写
    let keywords = [
        ("select", "SELECT"),
        ("from", "FROM"), 
        ("where", "WHERE"),
        ("join", "JOIN"),
        ("inner join", "INNER JOIN"),
        ("left join", "LEFT JOIN"),
        ("right join", "RIGHT JOIN"),
        ("full join", "FULL JOIN"),
        ("group by", "GROUP BY"),
        ("order by", "ORDER BY"),
        ("having", "HAVING"),
        ("union", "UNION"),
        ("limit", "LIMIT"),
        ("offset", "OFFSET"),
        ("and", "AND"),
        ("or", "OR"),
        ("not", "NOT"),
        ("in", "IN"),
        ("like", "LIKE"),
        ("is", "IS"),
        ("null", "NULL"),
        ("as", "AS"),
    ];
    
    for (from, to) in keywords.iter() {
        let pattern = format!(r"\b{}\b", regex::escape(from));
        if let Ok(re) = Regex::new(&format!("(?i){}", pattern)) {
            formatted = re.replace_all(&formatted, *to).to_string();
        }
    }
    
    // 添加适当的换行
    formatted = formatted
        .replace(" SELECT ", "\nSELECT ")
        .replace(" FROM ", "\nFROM ")
        .replace(" WHERE ", "\nWHERE ")
        .replace(" INNER JOIN ", "\nINNER JOIN ")
        .replace(" LEFT JOIN ", "\nLEFT JOIN ")
        .replace(" RIGHT JOIN ", "\nRIGHT JOIN")
        .replace(" FULL JOIN ", "\nFULL JOIN ")
        .replace(" GROUP BY ", "\nGROUP BY ")
        .replace(" ORDER BY ", "\nORDER BY ")
        .replace(" HAVING ", "\nHAVING ")
        .replace(" UNION ", "\nUNION ")
        .replace(" LIMIT ", "\nLIMIT ");
    
    // 清理多余的换行和空格
    formatted = formatted
        .split('\n')
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n");
    
    formatted
}

/// 获取数据库类型对应的默认端口
pub fn get_default_port(database_type: &str) -> u16 {
    match database_type {
        "mysql" => 3306,
        "postgresql" => 5432,
        "sqlserver" => 1433,
        "oracle" => 1521,
        "sqlite" => 0,
        _ => 3306,
    }
}

/// 检查SQL语句的安全性
pub fn validate_sql_security(sql: &str) -> (bool, Vec<String>) {
    let mut security_issues = Vec::new();
    let sql_upper = sql.to_uppercase();
    
    // 检查危险操作
    let dangerous_keywords = [
        "DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", 
        "CREATE", "ALTER", "EXEC", "EXECUTE", "SHUTDOWN",
        "GRANT", "REVOKE", "BACKUP", "RESTORE"
    ];
    
    for keyword in dangerous_keywords.iter() {
        if sql_upper.contains(keyword) {
            security_issues.push(format!("包含潜在危险操作: {}", keyword));
        }
    }
    
    // 检查SQL注入模式
    let injection_patterns = [
        (r"';.*--", "可能的SQL注入：单引号加注释"),
        (r"union\s+select", "可能的UNION注入"),
        (r"1\s*=\s*1", "可能的恒真条件注入"),
        (r"or\s+1\s*=\s*1", "可能的OR注入"),
        (r"and\s+1\s*=\s*0", "可能的AND注入"),
    ];
    
    for (pattern, description) in injection_patterns.iter() {
        if let Ok(re) = Regex::new(&format!("(?i){}", pattern)) {
            if re.is_match(sql) {
                security_issues.push(description.to_string());
            }
        }
    }
    
    // 检查过长的查询（可能是攻击）
    if sql.len() > 10000 {
        security_issues.push("查询过长，可能存在安全风险".to_string());
    }
    
    let is_safe = security_issues.is_empty();
    (is_safe, security_issues)
}