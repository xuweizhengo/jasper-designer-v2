# 📋 数据源层示例和测试用例

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-21
- **维护团队**: 数据服务团队 + QA团队
- **适用范围**: 开发测试、集成测试、用户验收测试
- **依赖文档**: 所有数据源层设计文档

---

## 🎯 测试策略概览

### **测试金字塔**
```yaml
端到端测试 (E2E):
  - 完整数据绑定工作流
  - 用户界面交互测试
  - 性能基准测试

集成测试:
  - 数据源与注册表集成
  - Tauri Commands接口测试
  - 前后端数据流测试

单元测试:
  - 数据源Provider测试
  - 数据转换逻辑测试
  - 配置验证测试
  - 错误处理测试
```

### **测试覆盖目标**
- ✅ **代码覆盖率**: >85%
- ✅ **分支覆盖率**: >80%
- ✅ **API接口覆盖**: 100%
- ✅ **错误场景覆盖**: >90%

---

## 🧪 示例数据集

### **1. JSON测试数据**

#### **银行客户数据示例**
```json
// examples/sample-data/bank-customers.json
{
  "customers": [
    {
      "id": "C001",
      "name": "张三",
      "account_type": "savings",
      "balance": 15600.50,
      "credit_score": 750,
      "registration_date": "2023-01-15",
      "last_transaction": "2024-12-20T10:30:00Z",
      "address": {
        "street": "北京市朝阳区建国路88号",
        "city": "北京",
        "postal_code": "100025"
      },
      "transactions": [
        {
          "id": "T001",
          "type": "deposit",
          "amount": 5000.00,
          "date": "2024-12-20T10:30:00Z",
          "description": "工资入账"
        },
        {
          "id": "T002", 
          "type": "withdrawal",
          "amount": 1200.00,
          "date": "2024-12-19T14:15:00Z",
          "description": "ATM取款"
        }
      ],
      "contact": {
        "phone": "138****1234",
        "email": "zhang.san@email.com",
        "preferred_contact": "phone"
      },
      "risk_level": "low",
      "account_status": "active"
    },
    {
      "id": "C002",
      "name": "李四",
      "account_type": "checking",
      "balance": 8750.25,
      "credit_score": 680,
      "registration_date": "2023-03-22",
      "last_transaction": "2024-12-18T16:45:00Z",
      "address": {
        "street": "上海市浦东新区陆家嘴环路1000号",
        "city": "上海",
        "postal_code": "200120"
      },
      "transactions": [
        {
          "id": "T003",
          "type": "transfer",
          "amount": 2500.00,
          "date": "2024-12-18T16:45:00Z",
          "description": "转账给王五"
        }
      ],
      "contact": {
        "phone": "139****5678",
        "email": "li.si@email.com", 
        "preferred_contact": "email"
      },
      "risk_level": "medium",
      "account_status": "active"
    },
    {
      "id": "C003",
      "name": "王五",
      "account_type": "credit",
      "balance": -2300.75,
      "credit_score": 620,
      "registration_date": "2023-07-10",
      "last_transaction": "2024-12-17T09:20:00Z",
      "address": {
        "street": "深圳市南山区科技园南区",
        "city": "深圳",
        "postal_code": "518057"
      },
      "transactions": [
        {
          "id": "T004",
          "type": "purchase",
          "amount": 850.50,
          "date": "2024-12-17T09:20:00Z",
          "description": "网上购物"
        }
      ],
      "contact": {
        "phone": "137****9012",
        "email": "wang.wu@email.com",
        "preferred_contact": "phone"
      },
      "risk_level": "high",
      "account_status": "active"
    }
  ],
  "summary": {
    "total_customers": 3,
    "total_balance": 22050.00,
    "active_accounts": 3,
    "average_credit_score": 683,
    "last_updated": "2024-12-21T08:00:00Z"
  },
  "metadata": {
    "data_source": "core_banking_system",
    "generated_at": "2024-12-21T08:00:00Z",
    "version": "1.2.0",
    "region": "china",
    "currency": "CNY"
  }
}
```

#### **复杂嵌套数据示例**
```json
// examples/sample-data/complex-report-data.json
{
  "report_info": {
    "title": "2024年第四季度财务报表",
    "period": {
      "start": "2024-10-01",
      "end": "2024-12-31"
    },
    "generated_by": "财务部",
    "generation_time": "2024-12-21T10:00:00Z"
  },
  "financial_data": {
    "revenue": {
      "current_quarter": 12500000.00,
      "previous_quarter": 11200000.00,
      "year_over_year": 14300000.00,
      "breakdown": [
        {"department": "销售部", "amount": 7500000.00, "percentage": 60.0},
        {"department": "服务部", "amount": 3000000.00, "percentage": 24.0},
        {"department": "其他", "amount": 2000000.00, "percentage": 16.0}
      ]
    },
    "expenses": {
      "total": 8200000.00,
      "categories": [
        {"name": "人员成本", "amount": 4100000.00, "budget": 4000000.00},
        {"name": "运营成本", "amount": 2500000.00, "budget": 2800000.00},
        {"name": "营销费用", "amount": 1200000.00, "budget": 1500000.00},
        {"name": "其他费用", "amount": 400000.00, "budget": 500000.00}
      ]
    },
    "profit": {
      "gross_profit": 4300000.00,
      "net_profit": 3850000.00,
      "profit_margin": 30.8
    }
  },
  "kpi_metrics": [
    {"name": "客户满意度", "value": 8.5, "unit": "分", "target": 8.0, "trend": "up"},
    {"name": "员工效率", "value": 95.2, "unit": "%", "target": 90.0, "trend": "stable"},
    {"name": "市场份额", "value": 15.8, "unit": "%", "target": 15.0, "trend": "up"}
  ],
  "charts_data": {
    "monthly_revenue": [
      {"month": "2024-10", "revenue": 4200000.00, "expenses": 2800000.00},
      {"month": "2024-11", "revenue": 4100000.00, "expenses": 2700000.00},
      {"month": "2024-12", "revenue": 4200000.00, "expenses": 2700000.00}
    ],
    "department_performance": {
      "labels": ["销售部", "服务部", "技术部", "市场部"],
      "datasets": [
        {
          "label": "收入",
          "data": [7500000, 3000000, 1500000, 500000],
          "backgroundColor": ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"]
        }
      ]
    }
  }
}
```

#### **简单表格数据示例**
```json
// examples/sample-data/simple-table.json
[
  {"id": 1, "name": "产品A", "price": 299.99, "stock": 150, "category": "电子产品", "active": true},
  {"id": 2, "name": "产品B", "price": 199.50, "stock": 75, "category": "服装", "active": true},
  {"id": 3, "name": "产品C", "price": 89.99, "stock": 200, "category": "家居", "active": false},
  {"id": 4, "name": "产品D", "price": 459.00, "stock": 30, "category": "电子产品", "active": true},
  {"id": 5, "name": "产品E", "price": 39.99, "stock": 500, "category": "日用品", "active": true}
]
```

---

## 🧩 单元测试用例

### **1. JSON数据源测试**

```rust
// tests/unit/json_data_source_test.rs
use jasper_data_gateway::providers::json::*;
use jasper_data_gateway::types::*;
use serde_json::json;
use std::path::PathBuf;

#[cfg(test)]
mod json_data_source_tests {
    use super::*;

    #[tokio::test]
    async fn test_json_from_content_simple_object() {
        let content = r#"{"name": "John", "age": 30, "active": true}"#;
        let source = JsonDataSource::from_content(
            "test_id".to_string(),
            "Test Source".to_string(),
            content
        ).unwrap();

        assert_eq!(source.get_id(), "test_id");
        assert_eq!(source.get_name(), "Test Source");
        
        let schema = source.get_schema();
        assert_eq!(schema.columns.len(), 3);
        
        // 验证列定义
        let name_col = schema.columns.iter().find(|c| c.name == "name").unwrap();
        assert_eq!(name_col.data_type, DataType::String);
        assert!(!name_col.nullable);
        
        let age_col = schema.columns.iter().find(|c| c.name == "age").unwrap();
        assert_eq!(age_col.data_type, DataType::Number);
        
        let active_col = schema.columns.iter().find(|c| c.name == "active").unwrap();
        assert_eq!(active_col.data_type, DataType::Boolean);
    }

    #[tokio::test]
    async fn test_json_from_content_array() {
        let content = r#"[
            {"id": 1, "name": "Alice", "score": 95.5},
            {"id": 2, "name": "Bob", "score": 87.2}
        ]"#;
        
        let source = JsonDataSource::from_content(
            "array_test".to_string(),
            "Array Test".to_string(),
            content
        ).unwrap();

        let data = source.get_data(None).await.unwrap();
        assert_eq!(data.rows.len(), 2);
        assert_eq!(data.total_count, 2);
        
        // 验证数据内容
        let first_row = &data.rows[0];
        assert_eq!(first_row["id"], json!(1));
        assert_eq!(first_row["name"], json!("Alice"));
        assert_eq!(first_row["score"], json!(95.5));
    }

    #[tokio::test]
    async fn test_json_path_query() {
        let content = r#"{
            "users": [
                {"id": 1, "profile": {"name": "John", "age": 25}},
                {"id": 2, "profile": {"name": "Jane", "age": 30}}
            ],
            "metadata": {"total": 2}
        }"#;
        
        let source = JsonDataSource::from_content(
            "path_test".to_string(),
            "Path Test".to_string(),
            content
        ).unwrap();

        // 测试简单路径
        let query = DataQuery {
            path: Some("metadata.total".to_string()),
            ..Default::default()
        };
        let result = source.get_data(Some(query)).await.unwrap();
        assert_eq!(result.rows[0], json!({"value": 2}));

        // 测试数组路径
        let query = DataQuery {
            path: Some("users[0].profile.name".to_string()),
            ..Default::default()
        };
        let result = source.get_data(Some(query)).await.unwrap();
        assert_eq!(result.rows[0], json!({"value": "John"}));

        // 测试数组根路径
        let query = DataQuery {
            path: Some("users".to_string()),
            ..Default::default()
        };
        let result = source.get_data(Some(query)).await.unwrap();
        assert_eq!(result.rows.len(), 2);
    }

    #[tokio::test]
    async fn test_json_query_with_limit() {
        let content = r#"[
            {"id": 1, "value": 10},
            {"id": 2, "value": 20},
            {"id": 3, "value": 30},
            {"id": 4, "value": 40},
            {"id": 5, "value": 50}
        ]"#;
        
        let source = JsonDataSource::from_content(
            "limit_test".to_string(),
            "Limit Test".to_string(),
            content
        ).unwrap();

        let query = DataQuery {
            limit: Some(3),
            ..Default::default()
        };
        
        let result = source.get_data(Some(query)).await.unwrap();
        assert_eq!(result.rows.len(), 3);
        assert_eq!(result.total_count, 3); // 实际返回数量
    }

    #[tokio::test]
    async fn test_json_query_with_offset() {
        let content = r#"[
            {"id": 1}, {"id": 2}, {"id": 3}, {"id": 4}, {"id": 5}
        ]"#;
        
        let source = JsonDataSource::from_content(
            "offset_test".to_string(),
            "Offset Test".to_string(),
            content
        ).unwrap();

        let query = DataQuery {
            offset: Some(2),
            limit: Some(2),
            ..Default::default()
        };
        
        let result = source.get_data(Some(query)).await.unwrap();
        assert_eq!(result.rows.len(), 2);
        assert_eq!(result.rows[0]["id"], json!(3));
        assert_eq!(result.rows[1]["id"], json!(4));
    }

    #[tokio::test]
    async fn test_connection_test() {
        let content = r#"{"test": "data"}"#;
        let source = JsonDataSource::from_content(
            "connection_test".to_string(),
            "Connection Test".to_string(),
            content
        ).unwrap();

        let result = source.test_connection().await.unwrap();
        assert!(result); // 内存数据源总是可连接
    }

    #[tokio::test]
    async fn test_data_type_inference() {
        let content = r#"{
            "string_field": "hello",
            "number_field": 42,
            "float_field": 3.14,
            "boolean_field": true,
            "null_field": null,
            "date_field": "2024-12-21",
            "datetime_field": "2024-12-21T10:30:00Z",
            "array_field": [1, 2, 3],
            "object_field": {"nested": "value"}
        }"#;
        
        let source = JsonDataSource::from_content(
            "type_test".to_string(),
            "Type Test".to_string(),
            content
        ).unwrap();

        let schema = source.get_schema();
        
        let string_col = schema.columns.iter().find(|c| c.name == "string_field").unwrap();
        assert_eq!(string_col.data_type, DataType::String);
        
        let number_col = schema.columns.iter().find(|c| c.name == "number_field").unwrap();
        assert_eq!(number_col.data_type, DataType::Number);
        
        let boolean_col = schema.columns.iter().find(|c| c.name == "boolean_field").unwrap();
        assert_eq!(boolean_col.data_type, DataType::Boolean);
        
        let date_col = schema.columns.iter().find(|c| c.name == "date_field").unwrap();
        assert_eq!(date_col.data_type, DataType::Date);
        
        let datetime_col = schema.columns.iter().find(|c| c.name == "datetime_field").unwrap();
        assert_eq!(datetime_col.data_type, DataType::DateTime);
        
        let array_col = schema.columns.iter().find(|c| c.name == "array_field").unwrap();
        assert_eq!(array_col.data_type, DataType::Array);
        
        let object_col = schema.columns.iter().find(|c| c.name == "object_field").unwrap();
        assert_eq!(object_col.data_type, DataType::Object);
    }

    #[tokio::test]
    async fn test_format_hint_inference() {
        let content = r#"{
            "amount": 1299.99,
            "discount_rate": 0.15,
            "email_address": "test@example.com",
            "phone_number": "138-0013-8000",
            "website_url": "https://example.com"
        }"#;
        
        let source = JsonDataSource::from_content(
            "format_test".to_string(),
            "Format Test".to_string(),
            content
        ).unwrap();

        let schema = source.get_schema();
        
        let amount_col = schema.columns.iter().find(|c| c.name == "amount").unwrap();
        assert_eq!(amount_col.format_hint, Some("currency".to_string()));
        
        let rate_col = schema.columns.iter().find(|c| c.name == "discount_rate").unwrap();
        assert_eq!(rate_col.format_hint, Some("percentage".to_string()));
        
        let email_col = schema.columns.iter().find(|c| c.name == "email_address").unwrap();
        assert_eq!(email_col.format_hint, Some("email".to_string()));
        
        let phone_col = schema.columns.iter().find(|c| c.name == "phone_number").unwrap();
        assert_eq!(phone_col.format_hint, Some("phone".to_string()));
        
        let url_col = schema.columns.iter().find(|c| c.name == "website_url").unwrap();
        assert_eq!(url_col.format_hint, Some("url".to_string()));
    }

    #[test]
    fn test_invalid_json() {
        let content = r#"{"invalid": json content}"#;
        let result = JsonDataSource::from_content(
            "invalid_test".to_string(),
            "Invalid Test".to_string(),
            content
        );
        
        assert!(result.is_err());
        match result.unwrap_err() {
            DataError::ParseError { message, .. } => {
                assert!(message.contains("JSON"));
            }
            _ => panic!("Expected ParseError"),
        }
    }

    #[tokio::test]
    async fn test_path_not_found() {
        let content = r#"{"existing": "value"}"#;
        let source = JsonDataSource::from_content(
            "path_error_test".to_string(),
            "Path Error Test".to_string(),
            content
        ).unwrap();

        let query = DataQuery {
            path: Some("nonexistent.path".to_string()),
            ..Default::default()
        };
        
        let result = source.get_data(Some(query)).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            DataError::PathNotFound { path } => {
                assert_eq!(path, "nonexistent");
            }
            _ => panic!("Expected PathNotFound error"),
        }
    }

    #[tokio::test]
    async fn test_invalid_array_index() {
        let content = r#"{"items": [1, 2, 3]}"#;
        let source = JsonDataSource::from_content(
            "index_error_test".to_string(),
            "Index Error Test".to_string(),
            content
        ).unwrap();

        let query = DataQuery {
            path: Some("items[10]".to_string()),
            ..Default::default()
        };
        
        let result = source.get_data(Some(query)).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            DataError::ArrayIndexOutOfBounds(index) => {
                assert_eq!(index, 10);
            }
            _ => panic!("Expected ArrayIndexOutOfBounds error"),
        }
    }
}
```

### **2. 数据源提供者测试**

```rust
// tests/unit/json_provider_test.rs
use jasper_data_gateway::providers::json::*;
use jasper_data_gateway::types::*;
use serde_json::json;

#[cfg(test)]
mod json_provider_tests {
    use super::*;

    #[test]
    fn test_provider_basic_info() {
        let provider = JsonDataSourceProvider::new();
        
        assert_eq!(provider.get_type_name(), "json");
        assert_eq!(provider.get_display_name(), "JSON文件");
        assert!(provider.get_description().contains("JSON"));
        assert_eq!(provider.get_icon(), Some("file-json"));
        assert_eq!(provider.get_version(), "1.0.0");
    }

    #[test]
    fn test_config_schema() {
        let provider = JsonDataSourceProvider::new();
        let schema = provider.get_config_schema();
        
        assert_eq!(schema.version, "1.0.0");
        assert!(!schema.fields.is_empty());
        assert!(!schema.field_groups.is_empty());
        
        // 验证必填字段
        assert!(schema.required_fields.contains(&"source_type".to_string()));
        
        // 验证字段定义
        let source_type_field = schema.fields.iter()
            .find(|f| f.name == "source_type")
            .unwrap();
        assert!(source_type_field.required);
        
        match &source_type_field.field_type {
            ConfigFieldType::Select { options, .. } => {
                assert_eq!(options.len(), 2);
                assert!(options.iter().any(|o| o.value == json!("file")));
                assert!(options.iter().any(|o| o.value == json!("content")));
            }
            _ => panic!("Expected Select field type"),
        }
    }

    #[test]
    fn test_config_validation_valid() {
        let provider = JsonDataSourceProvider::new();
        
        // 测试有效的文件配置
        let file_config = json!({
            "source_type": "file",
            "file_path": "/path/to/test.json",
            "auto_refresh": true
        });
        assert!(provider.validate_config(&file_config).is_ok());
        
        // 测试有效的内容配置
        let content_config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "data"}"#,
            "auto_refresh": false
        });
        assert!(provider.validate_config(&content_config).is_ok());
    }

    #[test]
    fn test_config_validation_invalid() {
        let provider = JsonDataSourceProvider::new();
        
        // 缺少source_type
        let invalid_config1 = json!({
            "file_path": "/path/to/test.json"
        });
        assert!(provider.validate_config(&invalid_config1).is_err());
        
        // 文件类型但缺少file_path
        let invalid_config2 = json!({
            "source_type": "file"
        });
        let result = provider.validate_config(&invalid_config2);
        assert!(result.is_err());
        
        // 内容类型但json_content无效
        let invalid_config3 = json!({
            "source_type": "content",
            "json_content": "invalid json"
        });
        let result = provider.validate_config(&invalid_config3);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            ConfigError::InvalidValue { field, .. } => {
                assert_eq!(field, "json_content");
            }
            _ => panic!("Expected InvalidValue error"),
        }
    }

    #[test]
    fn test_default_config() {
        let provider = JsonDataSourceProvider::new();
        let default_config = provider.get_default_config();
        
        assert_eq!(default_config["source_type"], json!("file"));
        assert_eq!(default_config["file_path"], json!(""));
        assert_eq!(default_config["json_content"], json!("{}"));
        assert_eq!(default_config["auto_refresh"], json!(false));
        assert_eq!(default_config["refresh_interval"], json!(300));
    }

    #[tokio::test]
    async fn test_create_source_from_content() {
        let provider = JsonDataSourceProvider::new();
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"name": "test", "value": 123}"#
        });
        
        let result = provider.create_source(
            "test_id".to_string(),
            "Test Source".to_string(),
            &config
        ).await;
        
        assert!(result.is_ok());
        let source = result.unwrap();
        assert_eq!(source.get_id(), "test_id");
        assert_eq!(source.get_name(), "Test Source");
    }

    #[tokio::test]
    async fn test_test_connection_content() {
        let provider = JsonDataSourceProvider::new();
        
        // 有效JSON内容
        let valid_config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "data"}"#
        });
        let result = provider.test_connection(&valid_config).await;
        assert!(result.is_ok());
        assert!(result.unwrap());
        
        // 无效JSON内容
        let invalid_config = json!({
            "source_type": "content", 
            "json_content": "invalid json"
        });
        let result = provider.test_connection(&invalid_config).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_discover_schema() {
        let provider = JsonDataSourceProvider::new();
        let config = json!({
            "source_type": "content",
            "json_content": r#"{
                "users": [
                    {"id": 1, "name": "Alice", "active": true},
                    {"id": 2, "name": "Bob", "active": false}
                ]
            }"#
        });
        
        let result = provider.discover_schema(&config).await;
        assert!(result.is_ok());
        
        let schema = result.unwrap();
        assert_eq!(schema.columns.len(), 1); // "users" array
        
        let users_col = &schema.columns[0];
        assert_eq!(users_col.name, "users");
        assert_eq!(users_col.data_type, DataType::Array);
    }

    #[test]
    fn test_example_configs() {
        let provider = JsonDataSourceProvider::new();
        let examples = provider.get_example_configs();
        
        assert!(!examples.is_empty());
        
        for (name, config) in examples {
            assert!(!name.is_empty());
            assert!(provider.validate_config(&config).is_ok());
        }
    }

    #[test]
    fn test_supports_wizard() {
        let provider = JsonDataSourceProvider::new();
        assert!(provider.supports_wizard());
    }

    #[tokio::test]
    async fn test_wizard_steps() {
        let provider = JsonDataSourceProvider::new();
        let steps = provider.get_wizard_steps().await.unwrap();
        
        assert!(!steps.is_empty());
        
        // 验证步骤结构
        for step in steps {
            assert!(!step.id.is_empty());
            assert!(!step.title.is_empty());
            assert!(!step.fields.is_empty());
        }
    }
}
```

### **3. 数据源注册表测试**

```rust
// tests/unit/registry_test.rs
use jasper_data_gateway::registry::*;
use jasper_data_gateway::providers::json::*;
use jasper_data_gateway::storage::*;
use jasper_data_gateway::types::*;
use serde_json::json;
use std::sync::Arc;

#[cfg(test)]
mod registry_tests {
    use super::*;

    fn create_test_registry() -> DataSourceRegistry {
        let storage = Box::new(MemoryConfigStorage::new());
        let mut registry = DataSourceRegistry::new(storage);
        registry.register_provider(JsonDataSourceProvider::new()).unwrap();
        registry
    }

    #[test]
    fn test_provider_registration() {
        let mut registry = create_test_registry();
        
        let types = registry.get_available_types();
        assert_eq!(types.len(), 1);
        
        let json_type = &types[0];
        assert_eq!(json_type.type_name, "json");
        assert_eq!(json_type.display_name, "JSON文件");
    }

    #[test]
    fn test_duplicate_provider_registration() {
        let mut registry = create_test_registry();
        
        // 尝试重复注册相同类型的提供者
        let result = registry.register_provider(JsonDataSourceProvider::new());
        assert!(result.is_err());
        
        match result.unwrap_err() {
            RegistryError::ProviderExists { provider_type } => {
                assert_eq!(provider_type, "json");
            }
            _ => panic!("Expected ProviderExists error"),
        }
    }

    #[tokio::test]
    async fn test_create_data_source() {
        let mut registry = create_test_registry();
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "data"}"#
        });
        
        let result = registry.create_data_source(
            "test_source".to_string(),
            "Test Source".to_string(),
            "json".to_string(),
            config
        ).await;
        
        assert!(result.is_ok());
        let source_id = result.unwrap();
        assert_eq!(source_id, "test_source");
        
        // 验证数据源已创建
        let source = registry.get_data_source(&source_id);
        assert!(source.is_some());
        assert_eq!(source.unwrap().get_name(), "Test Source");
    }

    #[tokio::test]
    async fn test_create_data_source_invalid_provider() {
        let mut registry = create_test_registry();
        
        let config = json!({});
        
        let result = registry.create_data_source(
            "test_source".to_string(),
            "Test Source".to_string(),
            "nonexistent_provider".to_string(),
            config
        ).await;
        
        assert!(result.is_err());
        match result.unwrap_err() {
            RegistryError::ProviderNotFound { provider_type } => {
                assert_eq!(provider_type, "nonexistent_provider");
            }
            _ => panic!("Expected ProviderNotFound error"),
        }
    }

    #[tokio::test]
    async fn test_create_data_source_invalid_config() {
        let mut registry = create_test_registry();
        
        let invalid_config = json!({
            "source_type": "content",
            "json_content": "invalid json"
        });
        
        let result = registry.create_data_source(
            "test_source".to_string(),
            "Test Source".to_string(),
            "json".to_string(),
            invalid_config
        ).await;
        
        assert!(result.is_err());
        // 应该是配置错误或创建失败
        assert!(matches!(result.unwrap_err(), 
            RegistryError::ConfigError(_) | 
            RegistryError::ValidationFailed { .. }
        ));
    }

    #[tokio::test]
    async fn test_query_data() {
        let mut registry = create_test_registry();
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"[
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"}
            ]"#
        });
        
        let source_id = registry.create_data_source(
            "query_test".to_string(),
            "Query Test".to_string(),
            "json".to_string(),
            config
        ).await.unwrap();
        
        // 测试基础查询
        let result = registry.query_data(&source_id, None).await;
        assert!(result.is_ok());
        
        let data = result.unwrap();
        assert_eq!(data.rows.len(), 2);
        assert_eq!(data.total_count, 2);
        
        // 测试带参数查询
        let query = DataQuery {
            limit: Some(1),
            ..Default::default()
        };
        
        let result = registry.query_data(&source_id, Some(query)).await;
        assert!(result.is_ok());
        
        let data = result.unwrap();
        assert_eq!(data.rows.len(), 1);
    }

    #[tokio::test]
    async fn test_query_nonexistent_source() {
        let registry = create_test_registry();
        
        let result = registry.query_data("nonexistent", None).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            RegistryError::SourceNotFound { source_id } => {
                assert_eq!(source_id, "nonexistent");
            }
            _ => panic!("Expected SourceNotFound error"),
        }
    }

    #[tokio::test]
    async fn test_list_sources() {
        let mut registry = create_test_registry();
        
        // 初始状态应该为空
        let sources = registry.list_all_sources();
        assert!(sources.is_empty());
        
        // 创建数据源
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"test": true}"#
        });
        
        let _source_id = registry.create_data_source(
            "list_test".to_string(),
            "List Test".to_string(),
            "json".to_string(),
            config
        ).await.unwrap();
        
        // 验证列表包含新创建的数据源
        let sources = registry.list_all_sources();
        assert_eq!(sources.len(), 1);
        assert_eq!(sources[0].id, "list_test");
        assert_eq!(sources[0].name, "List Test");
        assert_eq!(sources[0].type_name, "json");
    }

    #[tokio::test]
    async fn test_remove_data_source() {
        let mut registry = create_test_registry();
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"test": true}"#
        });
        
        let source_id = registry.create_data_source(
            "remove_test".to_string(),
            "Remove Test".to_string(),
            "json".to_string(),
            config
        ).await.unwrap();
        
        // 验证数据源存在
        assert!(registry.get_data_source(&source_id).is_some());
        
        // 删除数据源
        let result = registry.remove_data_source(&source_id).await;
        assert!(result.is_ok());
        
        // 验证数据源已删除
        assert!(registry.get_data_source(&source_id).is_none());
        
        // 尝试删除不存在的数据源
        let result = registry.remove_data_source("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_data_source_config() {
        let mut registry = create_test_registry();
        
        let initial_config = json!({
            "source_type": "content",
            "json_content": r#"{"initial": "data"}"#
        });
        
        let source_id = registry.create_data_source(
            "update_test".to_string(),
            "Update Test".to_string(),
            "json".to_string(),
            initial_config
        ).await.unwrap();
        
        let updated_config = json!({
            "source_type": "content", 
            "json_content": r#"{"updated": "data"}"#
        });
        
        let result = registry.update_data_source_config(&source_id, updated_config).await;
        assert!(result.is_ok());
        
        // 验证配置已更新（通过查询数据验证）
        let data = registry.query_data(&source_id, None).await.unwrap();
        assert!(data.rows[0].get("updated").is_some());
        assert!(data.rows[0].get("initial").is_none());
    }

    #[tokio::test]
    async fn test_batch_query() {
        let mut registry = create_test_registry();
        
        // 创建多个数据源
        let config1 = json!({
            "source_type": "content",
            "json_content": r#"[{"id": 1, "value": "A"}]"#
        });
        
        let config2 = json!({
            "source_type": "content",
            "json_content": r#"[{"id": 2, "value": "B"}]"#
        });
        
        let source_id1 = registry.create_data_source(
            "batch_test_1".to_string(),
            "Batch Test 1".to_string(),
            "json".to_string(),
            config1
        ).await.unwrap();
        
        let source_id2 = registry.create_data_source(
            "batch_test_2".to_string(),
            "Batch Test 2".to_string(),
            "json".to_string(),
            config2
        ).await.unwrap();
        
        // 批量查询
        let batch_requests = vec![
            BatchQueryRequest {
                source_id: source_id1.clone(),
                query: None,
                request_id: "req1".to_string(),
            },
            BatchQueryRequest {
                source_id: source_id2.clone(),
                query: None,
                request_id: "req2".to_string(),
            },
        ];
        
        let results = registry.batch_query(batch_requests).await.unwrap();
        assert_eq!(results.len(), 2);
        
        // 验证结果
        let result1 = results.iter().find(|r| r.request_id == "req1").unwrap();
        assert!(result1.result.is_ok());
        
        let result2 = results.iter().find(|r| r.request_id == "req2").unwrap();
        assert!(result2.result.is_ok());
    }
}
```

---

## 🔗 集成测试用例

### **1. Tauri Commands集成测试**

```rust
// tests/integration/tauri_commands_test.rs
use jasper_data_gateway::commands::data::*;
use jasper_data_gateway::registry::*;
use jasper_data_gateway::providers::json::*;
use jasper_data_gateway::storage::*;
use serde_json::json;
use tauri::State;
use tokio::sync::Mutex;

type DataRegistry = Mutex<DataSourceRegistry>;

#[cfg(test)]
mod tauri_integration_tests {
    use super::*;
    
    async fn create_test_registry() -> DataRegistry {
        let storage = Box::new(MemoryConfigStorage::new());
        let mut registry = DataSourceRegistry::new(storage);
        registry.register_provider(JsonDataSourceProvider::new()).unwrap();
        Mutex::new(registry)
    }

    #[tokio::test]
    async fn test_get_available_data_source_types() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let result = get_available_data_source_types(registry_state).await;
        assert!(result.is_ok());
        
        let types = result.unwrap();
        assert_eq!(types.len(), 1);
        assert_eq!(types[0].type_name, "json");
    }

    #[tokio::test]
    async fn test_create_data_source_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "integration"}"#
        });
        
        let result = create_data_source(
            "Integration Test".to_string(),
            "json".to_string(),
            config,
            registry_state
        ).await;
        
        assert!(result.is_ok());
        let source_id = result.unwrap();
        assert!(!source_id.is_empty());
    }

    #[tokio::test]
    async fn test_test_data_source_connection_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let valid_config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "connection"}"#
        });
        
        let result = test_data_source_connection(
            "json".to_string(),
            valid_config,
            registry_state
        ).await;
        
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn test_get_data_preview_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        // 先创建数据源
        let config = json!({
            "source_type": "content",
            "json_content": r#"[
                {"id": 1, "name": "Preview Test 1"},
                {"id": 2, "name": "Preview Test 2"},
                {"id": 3, "name": "Preview Test 3"}
            ]"#
        });
        
        let source_id = create_data_source(
            "Preview Test".to_string(),
            "json".to_string(),
            config,
            State::from(&registry)
        ).await.unwrap();
        
        // 测试数据预览
        let result = get_data_preview(
            source_id,
            None,
            Some(2),
            registry_state
        ).await;
        
        assert!(result.is_ok());
        let data = result.unwrap();
        assert_eq!(data.rows.len(), 2);
        assert_eq!(data.total_count, 2);
    }

    #[tokio::test]
    async fn test_evaluate_expression_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{
                "user": {"name": "John", "age": 30},
                "settings": {"theme": "dark"}
            }"#
        });
        
        let source_id = create_data_source(
            "Expression Test".to_string(),
            "json".to_string(),
            config,
            State::from(&registry)
        ).await.unwrap();
        
        // 测试表达式求值
        let result = evaluate_expression(
            source_id,
            "user.name".to_string(),
            None,
            registry_state
        ).await;
        
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value, json!("John"));
    }

    #[tokio::test]
    async fn test_list_data_sources_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        // 创建几个数据源
        for i in 1..=3 {
            let config = json!({
                "source_type": "content",
                "json_content": format!(r#"{{"test": "source{}"}} "#, i)
            });
            
            create_data_source(
                format!("Test Source {}", i),
                "json".to_string(),
                config,
                State::from(&registry)
            ).await.unwrap();
        }
        
        let result = list_data_sources(registry_state).await;
        assert!(result.is_ok());
        
        let sources = result.unwrap();
        assert_eq!(sources.len(), 3);
        
        // 验证数据源信息
        for (i, source) in sources.iter().enumerate() {
            assert_eq!(source.name, format!("Test Source {}", i + 1));
            assert_eq!(source.type_name, "json");
        }
    }

    #[tokio::test]
    async fn test_delete_data_source_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{"test": "delete"}"#
        });
        
        let source_id = create_data_source(
            "Delete Test".to_string(),
            "json".to_string(),
            config,
            State::from(&registry)
        ).await.unwrap();
        
        // 验证数据源存在
        let sources = list_data_sources(State::from(&registry)).await.unwrap();
        assert_eq!(sources.len(), 1);
        
        // 删除数据源
        let result = delete_data_source(source_id, registry_state).await;
        assert!(result.is_ok());
        
        // 验证数据源已删除
        let sources = list_data_sources(State::from(&registry)).await.unwrap();
        assert_eq!(sources.len(), 0);
    }

    #[tokio::test]
    async fn test_get_data_source_schema_command() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        let config = json!({
            "source_type": "content",
            "json_content": r#"{
                "name": "Schema Test",
                "count": 42,
                "active": true,
                "created_at": "2024-12-21T10:30:00Z",
                "metadata": {"version": "1.0"}
            }"#
        });
        
        let source_id = create_data_source(
            "Schema Test".to_string(),
            "json".to_string(),
            config,
            State::from(&registry)
        ).await.unwrap();
        
        let result = get_data_source_schema(source_id, registry_state).await;
        assert!(result.is_ok());
        
        let schema = result.unwrap();
        assert_eq!(schema.columns.len(), 5);
        
        // 验证不同类型的字段
        let name_col = schema.columns.iter().find(|c| c.name == "name").unwrap();
        assert_eq!(name_col.data_type, DataType::String);
        
        let count_col = schema.columns.iter().find(|c| c.name == "count").unwrap();
        assert_eq!(count_col.data_type, DataType::Number);
        
        let active_col = schema.columns.iter().find(|c| c.name == "active").unwrap();
        assert_eq!(active_col.data_type, DataType::Boolean);
        
        let created_col = schema.columns.iter().find(|c| c.name == "created_at").unwrap();
        assert_eq!(created_col.data_type, DataType::DateTime);
        
        let metadata_col = schema.columns.iter().find(|c| c.name == "metadata").unwrap();
        assert_eq!(metadata_col.data_type, DataType::Object);
    }

    #[tokio::test]
    async fn test_command_error_handling() {
        let registry = create_test_registry().await;
        let registry_state = State::from(&registry);
        
        // 测试无效提供者类型
        let result = test_data_source_connection(
            "invalid_provider".to_string(),
            json!({}),
            State::from(&registry)
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Provider not found"));
        
        // 测试查询不存在的数据源
        let result = get_data_preview(
            "nonexistent_source".to_string(),
            None,
            None,
            registry_state
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Data source not found"));
    }
}
```

### **2. 前后端数据流集成测试**

```typescript
// tests/integration/frontend_integration_test.ts
import { DataSourceAPI } from '../../src/utils/data-api';
import type { DataSourceTypeInfo, DataSet } from '../../src/utils/data-types';

describe('Frontend Data API Integration', () => {
  let testSourceId: string;
  
  beforeAll(async () => {
    // 设置测试数据源
    const config = {
      source_type: 'content',
      json_content: JSON.stringify([
        { id: 1, name: 'Test User 1', active: true, score: 95.5 },
        { id: 2, name: 'Test User 2', active: false, score: 87.2 },
        { id: 3, name: 'Test User 3', active: true, score: 92.8 }
      ])
    };
    
    testSourceId = await DataSourceAPI.createDataSource(
      'Integration Test Source',
      'json',
      config
    );
  });
  
  afterAll(async () => {
    // 清理测试数据源
    if (testSourceId) {
      await DataSourceAPI.deleteDataSource(testSourceId);
    }
  });

  test('should get available data source types', async () => {
    const types = await DataSourceAPI.getAvailableTypes();
    
    expect(types).toHaveLength(1);
    expect(types[0].type_name).toBe('json');
    expect(types[0].display_name).toBe('JSON文件');
    expect(types[0]).toHaveProperty('config_schema');
  });

  test('should test connection successfully', async () => {
    const config = {
      source_type: 'content',
      json_content: '{"test": "connection"}'
    };
    
    const result = await DataSourceAPI.testConnection('json', config);
    expect(result).toBe(true);
  });

  test('should test connection failure', async () => {
    const config = {
      source_type: 'content',
      json_content: 'invalid json'
    };
    
    await expect(DataSourceAPI.testConnection('json', config))
      .rejects.toThrow();
  });

  test('should list data sources', async () => {
    const sources = await DataSourceAPI.listDataSources();
    
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe(testSourceId);
    expect(sources[0].name).toBe('Integration Test Source');
    expect(sources[0].type).toBe('json');
  });

  test('should get data source info', async () => {
    const info = await DataSourceAPI.getDataSourceInfo(testSourceId);
    
    expect(info.id).toBe(testSourceId);
    expect(info.name).toBe('Integration Test Source');
    expect(info.type).toBe('json');
    expect(info).toHaveProperty('schema');
    expect(info).toHaveProperty('capabilities');
  });

  test('should query data without parameters', async () => {
    const data = await DataSourceAPI.queryData(testSourceId);
    
    expect(data.rows).toHaveLength(3);
    expect(data.total_count).toBe(3);
    expect(data.columns).toHaveLength(4); // id, name, active, score
    
    // 验证数据类型
    const idCol = data.columns.find(c => c.name === 'id');
    expect(idCol?.data_type).toBe('Number');
    
    const nameCol = data.columns.find(c => c.name === 'name');
    expect(nameCol?.data_type).toBe('String');
    
    const activeCol = data.columns.find(c => c.name === 'active');
    expect(activeCol?.data_type).toBe('Boolean');
  });

  test('should query data with limit', async () => {
    const data = await DataSourceAPI.queryData(testSourceId, {
      limit: 2
    });
    
    expect(data.rows).toHaveLength(2);
    expect(data.total_count).toBe(2);
  });

  test('should query data with offset', async () => {
    const data = await DataSourceAPI.queryData(testSourceId, {
      offset: 1,
      limit: 2
    });
    
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0].id).toBe(2);
    expect(data.rows[1].id).toBe(3);
  });

  test('should get data preview', async () => {
    const preview = await DataSourceAPI.getDataPreview(testSourceId, undefined, 2);
    
    expect(preview.rows).toHaveLength(2);
    expect(preview.total_count).toBe(2);
  });

  test('should evaluate simple expression', async () => {
    // 创建对象数据源用于路径测试
    const objectConfig = {
      source_type: 'content',
      json_content: JSON.stringify({
        user: { name: 'John Doe', age: 30 },
        settings: { theme: 'dark', notifications: true }
      })
    };
    
    const objectSourceId = await DataSourceAPI.createDataSource(
      'Object Test Source',
      'json',
      objectConfig
    );
    
    try {
      const result = await DataSourceAPI.evaluateExpression(
        objectSourceId,
        'user.name'
      );
      
      expect(result).toBe('John Doe');
    } finally {
      await DataSourceAPI.deleteDataSource(objectSourceId);
    }
  });

  test('should evaluate expression with array access', async () => {
    const arrayConfig = {
      source_type: 'content',
      json_content: JSON.stringify({
        items: [
          { name: 'Item 1', value: 100 },
          { name: 'Item 2', value: 200 }
        ]
      })
    };
    
    const arraySourceId = await DataSourceAPI.createDataSource(
      'Array Test Source',
      'json',
      arrayConfig
    );
    
    try {
      const result = await DataSourceAPI.evaluateExpression(
        arraySourceId,
        'items[0].name'
      );
      
      expect(result).toBe('Item 1');
    } finally {
      await DataSourceAPI.deleteDataSource(arraySourceId);
    }
  });

  test('should batch evaluate expressions', async () => {
    const objectConfig = {
      source_type: 'content',
      json_content: JSON.stringify({
        user: { name: 'Alice', age: 25, active: true },
        stats: { score: 95.5, rank: 1 }
      })
    };
    
    const objectSourceId = await DataSourceAPI.createDataSource(
      'Batch Test Source',
      'json',
      objectConfig
    );
    
    try {
      const results = await DataSourceAPI.evaluateExpressionsBatch(
        objectSourceId,
        ['user.name', 'user.age', 'stats.score']
      );
      
      expect(results).toHaveLength(3);
      
      const nameResult = results.find(r => r.expression === 'user.name');
      expect(nameResult?.result).toBe('Alice');
      expect(nameResult?.error).toBeUndefined();
      
      const ageResult = results.find(r => r.expression === 'user.age');
      expect(ageResult?.result).toBe(25);
      
      const scoreResult = results.find(r => r.expression === 'stats.score');
      expect(scoreResult?.result).toBe(95.5);
    } finally {
      await DataSourceAPI.deleteDataSource(objectSourceId);
    }
  });

  test('should get data source schema', async () => {
    const schema = await DataSourceAPI.getSchema(testSourceId);
    
    expect(schema.columns).toHaveLength(4);
    expect(schema).toHaveProperty('version');
    expect(schema).toHaveProperty('last_updated');
    
    // 验证列属性
    for (const column of schema.columns) {
      expect(column).toHaveProperty('name');
      expect(column).toHaveProperty('data_type');
      expect(column).toHaveProperty('nullable');
    }
  });

  test('should refresh schema', async () => {
    const originalSchema = await DataSourceAPI.getSchema(testSourceId);
    const refreshedSchema = await DataSourceAPI.refreshSchema(testSourceId);
    
    expect(refreshedSchema.columns).toEqual(originalSchema.columns);
    expect(refreshedSchema.version).toBe(originalSchema.version);
  });

  test('should get config schema for provider', async () => {
    const configSchema = await DataSourceAPI.getConfigSchema('json');
    
    expect(configSchema).toHaveProperty('version');
    expect(configSchema).toHaveProperty('fields');
    expect(configSchema).toHaveProperty('required_fields');
    expect(configSchema).toHaveProperty('field_groups');
    
    expect(configSchema.fields.length).toBeGreaterThan(0);
    expect(configSchema.required_fields).toContain('source_type');
  });

  test('should validate config', async () => {
    const validConfig = {
      source_type: 'content',
      json_content: '{"valid": "json"}'
    };
    
    const result = await DataSourceAPI.validateConfig('json', validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail config validation for invalid config', async () => {
    const invalidConfig = {
      source_type: 'content',
      json_content: 'invalid json'
    };
    
    const result = await DataSourceAPI.validateConfig('json', invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should get default config', async () => {
    const defaultConfig = await DataSourceAPI.getDefaultConfig('json');
    
    expect(defaultConfig).toHaveProperty('source_type');
    expect(defaultConfig).toHaveProperty('file_path');
    expect(defaultConfig).toHaveProperty('json_content');
    expect(defaultConfig).toHaveProperty('auto_refresh');
  });

  test('should search data', async () => {
    const results = await DataSourceAPI.searchData(
      testSourceId,
      'Test User',
      ['name'],
      10
    );
    
    expect(results.rows.length).toBeGreaterThan(0);
    
    // 验证搜索结果包含搜索词
    for (const row of results.rows) {
      expect(row.name).toContain('Test User');
    }
  });

  test('should handle API errors gracefully', async () => {
    // 测试查询不存在的数据源
    await expect(DataSourceAPI.queryData('nonexistent_source'))
      .rejects.toThrow(/Data source not found/);
    
    // 测试无效的表达式
    await expect(DataSourceAPI.evaluateExpression(testSourceId, 'invalid.path'))
      .rejects.toThrow();
    
    // 测试删除不存在的数据源
    await expect(DataSourceAPI.deleteDataSource('nonexistent_source'))
      .rejects.toThrow();
  });

  test('should validate JSONPath expressions', () => {
    // 有效表达式
    expect(DataSourceAPI.validateJsonPath('user.name')).toEqual({
      valid: true
    });
    
    expect(DataSourceAPI.validateJsonPath('items[0].value')).toEqual({
      valid: true
    });
    
    // 无效表达式
    expect(DataSourceAPI.validateJsonPath('')).toEqual({
      valid: false,
      error: 'Expression cannot be empty'
    });
    
    expect(DataSourceAPI.validateJsonPath('test[unclosed')).toEqual({
      valid: false,
      error: 'Unmatched brackets'
    });
  });

  test('should format values correctly', () => {
    const currencyColumn = {
      name: 'price',
      data_type: 'Number' as const,
      nullable: false,
      format_hint: 'currency'
    };
    
    expect(DataSourceAPI.formatValue(299.99, currencyColumn)).toBe('$299.99');
    
    const percentageColumn = {
      name: 'rate',
      data_type: 'Number' as const,
      nullable: false,
      format_hint: 'percentage'
    };
    
    expect(DataSourceAPI.formatValue(0.15, percentageColumn)).toBe('15.0%');
    
    const booleanColumn = {
      name: 'active',
      data_type: 'Boolean' as const,
      nullable: false
    };
    
    expect(DataSourceAPI.formatValue(true, booleanColumn)).toBe('✓');
    expect(DataSourceAPI.formatValue(false, booleanColumn)).toBe('✗');
    
    expect(DataSourceAPI.formatValue(null, currencyColumn)).toBe('-');
  });
});
```

---

## 🚀 端到端测试用例

### **1. 完整工作流E2E测试**

```typescript
// tests/e2e/data_binding_workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Data Binding Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待应用加载完成
    await page.waitForSelector('[data-testid="main-canvas"]');
  });

  test('should complete full data binding workflow', async ({ page }) => {
    // 步骤1: 打开数据面板
    await page.click('[data-testid="data-panel-toggle"]');
    await page.waitForSelector('[data-testid="data-panel"]');

    // 步骤2: 添加JSON数据源
    await page.click('[data-testid="add-data-source"]');
    await page.waitForSelector('[data-testid="data-source-wizard"]');

    // 选择JSON文件类型
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');

    // 选择粘贴内容模式
    await page.click('[data-testid="json-source-content"]');
    
    // 输入测试数据
    const testData = {
      customers: [
        { id: 1, name: '张三', balance: 15600.50, active: true },
        { id: 2, name: '李四', balance: 8750.25, active: false }
      ],
      summary: { total_balance: 24350.75, count: 2 }
    };
    
    await page.fill('[data-testid="json-content"]', JSON.stringify(testData, null, 2));
    await page.click('[data-testid="wizard-next"]');

    // 测试连接
    await page.click('[data-testid="test-connection"]');
    await page.waitForSelector('[data-testid="connection-success"]');
    
    // 完成创建
    await page.click('[data-testid="wizard-finish"]');
    await page.waitForSelector('[data-testid="data-source-item"]');

    // 步骤3: 验证数据源已创建
    const dataSourceItem = page.locator('[data-testid="data-source-item"]');
    await expect(dataSourceItem).toBeVisible();
    await expect(dataSourceItem.locator('.source-name')).toContainText('JSON');

    // 步骤4: 查看数据预览
    await dataSourceItem.click();
    await page.waitForSelector('[data-testid="data-preview"]');
    
    // 验证预览表格
    const previewTable = page.locator('[data-testid="preview-table"]');
    await expect(previewTable).toBeVisible();
    
    const headerCells = previewTable.locator('thead th');
    await expect(headerCells.nth(0)).toContainText('customers');
    await expect(headerCells.nth(1)).toContainText('summary');

    // 步骤5: 拖拽创建数据字段
    const fieldsList = page.locator('[data-testid="fields-list"]');
    const customerField = fieldsList.locator('[data-field-name="customers"]');
    
    // 拖拽字段到画布
    const canvas = page.locator('[data-testid="main-canvas"]');
    await customerField.dragTo(canvas, { targetPosition: { x: 100, y: 100 } });

    // 验证数据字段已创建
    await page.waitForSelector('[data-testid="data-field-element"]');
    const dataFieldElement = page.locator('[data-testid="data-field-element"]');
    await expect(dataFieldElement).toBeVisible();

    // 步骤6: 编辑数据绑定表达式
    await dataFieldElement.dblclick();
    await page.waitForSelector('[data-testid="expression-editor"]');
    
    // 输入具体的路径表达式
    await page.fill('[data-testid="expression-input"]', 'customers[0].name');
    await page.press('[data-testid="expression-input"]', 'Enter');

    // 验证表达式求值结果
    await page.waitForSelector('[data-testid="expression-result"]');
    const result = page.locator('[data-testid="expression-result"]');
    await expect(result).toContainText('张三');

    // 应用表达式
    await page.click('[data-testid="apply-expression"]');

    // 步骤7: 验证数据字段显示
    await expect(dataFieldElement).toContainText('张三');

    // 步骤8: 创建更多数据绑定字段
    const summaryField = fieldsList.locator('[data-field-name="summary"]');
    await summaryField.dragTo(canvas, { targetPosition: { x: 300, y: 100 } });
    
    const summaryElement = page.locator('[data-testid="data-field-element"]').nth(1);
    await summaryElement.dblclick();
    await page.fill('[data-testid="expression-input"]', 'summary.total_balance');
    await page.press('[data-testid="expression-input"]', 'Enter');
    await page.click('[data-testid="apply-expression"]');

    // 验证货币格式化
    await expect(summaryElement).toContainText('24350.75');

    // 步骤9: 测试数据源切换
    // 添加另一个数据源进行切换测试
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');
    
    const alternativeData = {
      products: [
        { id: 1, name: '产品A', price: 299.99 },
        { id: 2, name: '产品B', price: 199.50 }
      ]
    };
    
    await page.fill('[data-testid="json-content"]', JSON.stringify(alternativeData, null, 2));
    await page.click('[data-testid="wizard-finish"]');

    // 切换到新数据源
    const newDataSource = page.locator('[data-testid="data-source-item"]').nth(1);
    await newDataSource.click();

    // 验证字段列表更新
    const newFieldsList = page.locator('[data-testid="fields-list"]');
    await expect(newFieldsList.locator('[data-field-name="products"]')).toBeVisible();

    // 步骤10: 删除数据源
    await page.click('[data-testid="data-source-delete"]');
    await page.click('[data-testid="confirm-delete"]');

    // 验证数据源已删除
    await expect(page.locator('[data-testid="data-source-item"]')).toHaveCount(1);
  });

  test('should handle data source errors gracefully', async ({ page }) => {
    // 打开数据面板
    await page.click('[data-testid="data-panel-toggle"]');
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');

    // 输入无效JSON
    await page.fill('[data-testid="json-content"]', 'invalid json content');
    await page.click('[data-testid="wizard-next"]');

    // 测试连接应该失败
    await page.click('[data-testid="test-connection"]');
    await page.waitForSelector('[data-testid="connection-error"]');
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid JSON');

    // 修正JSON内容
    await page.click('[data-testid="wizard-back"]');
    await page.fill('[data-testid="json-content"]', '{"valid": "json"}');
    await page.click('[data-testid="wizard-next"]');
    
    // 现在连接应该成功
    await page.click('[data-testid="test-connection"]');
    await page.waitForSelector('[data-testid="connection-success"]');
  });

  test('should support expression validation and auto-completion', async ({ page }) => {
    // 设置测试数据源
    await page.click('[data-testid="data-panel-toggle"]');
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');
    
    const complexData = {
      organization: {
        name: 'Test Company',
        departments: [
          { id: 1, name: 'Engineering', employees: 25 },
          { id: 2, name: 'Sales', employees: 15 }
        ],
        metadata: {
          founded: '2020-01-01',
          location: 'San Francisco'
        }
      }
    };
    
    await page.fill('[data-testid="json-content"]', JSON.stringify(complexData, null, 2));
    await page.click('[data-testid="wizard-finish"]');

    // 创建数据字段并测试表达式编辑
    const canvas = page.locator('[data-testid="main-canvas"]');
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // 从组件库拖拽数据字段组件
    const componentLibrary = page.locator('[data-testid="component-library"]');
    const dataFieldComponent = componentLibrary.locator('[data-component="DataField"]');
    await dataFieldComponent.dragTo(canvas, { targetPosition: { x: 150, y: 150 } });

    // 打开表达式编辑器
    const dataFieldElement = page.locator('[data-testid="data-field-element"]');
    await dataFieldElement.dblclick();

    const expressionInput = page.locator('[data-testid="expression-input"]');
    
    // 测试无效表达式
    await expressionInput.fill('invalid.expression.path');
    await page.waitForSelector('[data-testid="expression-error"]');
    await expect(page.locator('[data-testid="expression-error"]')).toContainText('Path not found');

    // 测试有效表达式
    await expressionInput.fill('organization.name');
    await page.waitForSelector('[data-testid="expression-success"]');
    await expect(page.locator('[data-testid="expression-result"]')).toContainText('Test Company');

    // 测试数组访问
    await expressionInput.fill('organization.departments[0].name');
    await expect(page.locator('[data-testid="expression-result"]')).toContainText('Engineering');

    // 测试自动完成提示
    await expressionInput.fill('organization.');
    await page.waitForSelector('[data-testid="autocomplete-suggestions"]');
    
    const suggestions = page.locator('[data-testid="autocomplete-suggestions"] .suggestion-item');
    await expect(suggestions).toHaveCountGreaterThan(0);
    await expect(suggestions.first()).toContainText('name');

    // 选择自动完成建议
    await suggestions.first().click();
    await expect(expressionInput).toHaveValue('organization.name');
  });

  test('should persist data sources between sessions', async ({ page }) => {
    // 创建数据源
    await page.click('[data-testid="data-panel-toggle"]');
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');
    await page.fill('[data-testid="json-content"]', '{"persistent": "data"}');
    await page.click('[data-testid="wizard-finish"]');

    // 获取创建的数据源ID
    const dataSourceItem = page.locator('[data-testid="data-source-item"]');
    const sourceId = await dataSourceItem.getAttribute('data-source-id');

    // 刷新页面
    await page.reload();
    await page.waitForSelector('[data-testid="main-canvas"]');

    // 打开数据面板
    await page.click('[data-testid="data-panel-toggle"]');

    // 验证数据源仍然存在
    await expect(page.locator('[data-testid="data-source-item"]')).toHaveCount(1);
    await expect(page.locator(`[data-source-id="${sourceId}"]`)).toBeVisible();
  });
});
```

### **2. 性能基准测试**

```typescript
// tests/performance/data_source_performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Data Source Performance', () => {
  test('should handle large datasets efficiently', async ({ page }) => {
    // 生成大型测试数据集
    const largeDataset = {
      records: Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Record ${i + 1}`,
        value: Math.random() * 1000,
        category: `Category ${Math.floor(i / 100) + 1}`,
        active: i % 2 === 0,
        created_at: new Date(2024, 0, 1 + i).toISOString()
      }))
    };

    await page.goto('/');
    await page.click('[data-testid="data-panel-toggle"]');
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');

    // 测量数据加载时间
    const startTime = Date.now();
    await page.fill('[data-testid="json-content"]', JSON.stringify(largeDataset));
    await page.click('[data-testid="wizard-finish"]');
    
    // 等待数据源创建完成
    await page.waitForSelector('[data-testid="data-source-item"]');
    const loadTime = Date.now() - startTime;

    // 验证加载时间在可接受范围内 (< 5秒)
    expect(loadTime).toBeLessThan(5000);

    // 测试数据预览性能
    const previewStartTime = Date.now();
    await page.click('[data-testid="data-source-item"]');
    await page.waitForSelector('[data-testid="data-preview"]');
    const previewTime = Date.now() - previewStartTime;

    // 预览应该在2秒内完成
    expect(previewTime).toBeLessThan(2000);

    // 验证分页预览只显示有限行数
    const previewRows = page.locator('[data-testid="preview-table"] tbody tr');
    const rowCount = await previewRows.count();
    expect(rowCount).toBeLessThanOrEqual(50); // 默认预览限制

    // 测试表达式求值性能
    const expressionStartTime = Date.now();
    const canvas = page.locator('[data-testid="main-canvas"]');
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // 创建数据字段
    const componentLibrary = page.locator('[data-testid="component-library"]');
    const dataFieldComponent = componentLibrary.locator('[data-component="DataField"]');
    await dataFieldComponent.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });

    const dataField = page.locator('[data-testid="data-field-element"]');
    await dataField.dblclick();
    await page.fill('[data-testid="expression-input"]', 'records[0].name');
    await page.press('[data-testid="expression-input"]', 'Enter');
    
    await page.waitForSelector('[data-testid="expression-result"]');
    const expressionTime = Date.now() - expressionStartTime;

    // 表达式求值应该在1秒内完成
    expect(expressionTime).toBeLessThan(1000);
  });

  test('should maintain performance with multiple data sources', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="data-panel-toggle"]');

    const createDataSource = async (name: string, data: any) => {
      await page.click('[data-testid="add-data-source"]');
      await page.click('[data-testid="data-source-type-json"]');
      await page.click('[data-testid="wizard-next"]');
      await page.click('[data-testid="json-source-content"]');
      await page.fill('[data-testid="json-content"]', JSON.stringify(data));
      await page.click('[data-testid="wizard-finish"]');
    };

    // 创建多个数据源
    const startTime = Date.now();
    for (let i = 0; i < 5; i++) {
      const data = {
        dataset: i + 1,
        items: Array.from({ length: 100 }, (_, j) => ({
          id: j + 1,
          value: Math.random() * 100
        }))
      };
      await createDataSource(`Dataset ${i + 1}`, data);
    }
    const totalTime = Date.now() - startTime;

    // 创建5个数据源应该在20秒内完成
    expect(totalTime).toBeLessThan(20000);

    // 验证所有数据源都已创建
    const dataSources = page.locator('[data-testid="data-source-item"]');
    await expect(dataSources).toHaveCount(5);

    // 测试数据源切换性能
    const switchStartTime = Date.now();
    for (let i = 0; i < 5; i++) {
      await dataSources.nth(i).click();
      await page.waitForSelector('[data-testid="data-preview"]');
    }
    const switchTime = Date.now() - switchStartTime;

    // 切换5个数据源应该在10秒内完成
    expect(switchTime).toBeLessThan(10000);
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    const testData = {
      concurrent_test: Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        data: `Test data ${i + 1}`
      }))
    };

    await page.goto('/');
    await page.click('[data-testid="data-panel-toggle"]');
    await page.click('[data-testid="add-data-source"]');
    await page.click('[data-testid="data-source-type-json"]');
    await page.click('[data-testid="wizard-next"]');
    await page.click('[data-testid="json-source-content"]');
    await page.fill('[data-testid="json-content"]', JSON.stringify(testData));
    await page.click('[data-testid="wizard-finish"]');

    // 等待数据源创建
    await page.waitForSelector('[data-testid="data-source-item"]');
    await page.click('[data-testid="data-source-item"]');
    await page.waitForSelector('[data-testid="data-preview"]');

    // 并发创建多个数据字段
    const canvas = page.locator('[data-testid="main-canvas"]');
    const componentLibrary = page.locator('[data-testid="component-library"]');
    const dataFieldComponent = componentLibrary.locator('[data-component="DataField"]');

    const startTime = Date.now();
    
    // 同时创建多个数据字段
    const createPromises = Array.from({ length: 10 }, async (_, i) => {
      const x = 100 + (i % 5) * 150;
      const y = 100 + Math.floor(i / 5) * 100;
      
      await dataFieldComponent.dragTo(canvas, { 
        targetPosition: { x, y } 
      });
    });

    await Promise.all(createPromises);
    const creationTime = Date.now() - startTime;

    // 并发创建10个数据字段应该在10秒内完成
    expect(creationTime).toBeLessThan(10000);

    // 验证所有数据字段都已创建
    const dataFields = page.locator('[data-testid="data-field-element"]');
    await expect(dataFields).toHaveCount(10);

    // 测试并发表达式求值
    const evaluationStartTime = Date.now();
    
    // 为每个数据字段设置不同的表达式
    for (let i = 0; i < 10; i++) {
      await dataFields.nth(i).dblclick();
      await page.fill('[data-testid="expression-input"]', `concurrent_test[${i}].data`);
      await page.press('[data-testid="expression-input"]', 'Enter');
      await page.click('[data-testid="apply-expression"]');
    }
    
    const evaluationTime = Date.now() - evaluationStartTime;

    // 10个表达式求值应该在15秒内完成
    expect(evaluationTime).toBeLessThan(15000);

    // 验证所有数据字段都显示正确的数据
    for (let i = 0; i < 10; i++) {
      await expect(dataFields.nth(i)).toContainText(`Test data ${i + 1}`);
    }
  });
});
```

---

**文档状态**: 示例和测试用例文档完成  
**覆盖范围**: 单元测试、集成测试、E2E测试、性能测试  
**包含内容**: 完整的测试数据集、测试用例、性能基准  
**使用方式**: 开发者可直接使用这些测试用例验证数据源层实现