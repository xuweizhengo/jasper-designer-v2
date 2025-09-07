# Jasper 模板序列化格式设计文档

## 文档信息
- **项目名称**: Jasper在线报表设计器 V2.0
- **文档版本**: v1.0.0
- **创建日期**: 2025-08-25
- **设计理念**: 高性能 + JasperReports兼容 + 类型安全

---

## 1. 总体架构设计

### 1.1 双格式策略

```
┌─────────────────────────────────────────────────────────────┐
│                    Jasper 模板序列化系统                        │
├─────────────────────────────────────────────────────────────┤
│  主格式: .jasper (JSON)                                     │
│  • 高性能序列化/反序列化                                        │
│  • 类型安全的数据结构                                          │
│  • 优化的内存使用                                             │
│  • 直接映射到Rust/TypeScript类型                               │
├─────────────────────────────────────────────────────────────┤
│  交换格式: .jrxml (XML)                                     │
│  • JasperReports官方兼容                                     │
│  • 行业标准互操作性                                           │
│  • 第三方工具集成                                             │
│  • 导入导出桥梁                                               │
├─────────────────────────────────────────────────────────────┤
│  转换引擎                                                    │
│  • 双向无损转换                                               │
│  • 验证和错误处理                                             │
│  • 版本兼容性管理                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

**高性能优先**
- JSON格式原生支持，序列化性能优异
- 直接映射到内存结构，零拷贝反序列化
- 增量更新和差异化保存
- 懒加载大型模板资源

**完全兼容现有系统**
- 与现有DataContext和表达式引擎无缝集成
- 保持AppState数据结构一致性
- 支持现有数据源API和类型系统

**JasperReports生态集成**
- 标准JRXML格式完全兼容
- 支持主流JasperReports特性
- 平滑迁移路径

---

## 2. .jasper 格式设计（主格式）

### 2.1 文档结构

```json
{
  "metadata": {
    "version": "2.0.0",
    "format_version": "1.0",
    "created_at": "2025-08-25T10:30:00Z",
    "last_modified": "2025-08-25T15:45:00Z",
    "created_by": "jasper-designer-v2",
    "description": "销售报表模板",
    "tags": ["sales", "monthly", "revenue"],
    "compatibility": {
      "min_jasper_version": "2.0.0",
      "jasperreports_version": "6.20.0"
    }
  },
  "canvas": {
    "width": 595.0,
    "height": 842.0,
    "unit": "pt",
    "orientation": "portrait",
    "margins": {
      "top": 20.0,
      "bottom": 20.0,
      "left": 20.0,
      "right": 20.0
    },
    "grid": {
      "enabled": true,
      "size": 10.0,
      "snap": true,
      "visible": true
    },
    "background": {
      "color": "#ffffff",
      "image": null
    }
  },
  "data_sources": [
    {
      "id": "primary_db",
      "name": "销售数据库",
      "type": "sql",
      "provider_type": "postgresql",
      "config": {
        "host": "localhost",
        "port": 5432,
        "database": "sales_db",
        "username": "${DB_USER}",
        "password": "${DB_PASS}",
        "ssl_mode": "prefer"
      },
      "schema": {
        "columns": [
          {
            "name": "id",
            "data_type": "Number",
            "nullable": false,
            "description": "订单ID"
          },
          {
            "name": "customer_name",
            "data_type": "String",
            "nullable": false,
            "description": "客户名称"
          },
          {
            "name": "amount",
            "data_type": "Number",
            "nullable": false,
            "description": "订单金额"
          },
          {
            "name": "order_date",
            "data_type": "DateTime",
            "nullable": false,
            "description": "订单日期"
          }
        ]
      },
      "query": {
        "sql": "SELECT id, customer_name, amount, order_date FROM orders WHERE order_date >= $P{start_date} AND order_date <= $P{end_date} ORDER BY order_date DESC",
        "parameters": [
          {
            "name": "start_date",
            "type": "DateTime",
            "default": "2025-01-01",
            "description": "开始日期"
          },
          {
            "name": "end_date", 
            "type": "DateTime",
            "default": "2025-12-31",
            "description": "结束日期"
          }
        ]
      }
    }
  ],
  "elements": [
    {
      "id": "title-001",
      "type": "Text",
      "position": {
        "x": 50.0,
        "y": 50.0
      },
      "size": {
        "width": 495.0,
        "height": 30.0
      },
      "z_index": 1,
      "visible": true,
      "content": {
        "text": "月度销售报表",
        "expression": null,
        "font": {
          "family": "Arial",
          "size": 18.0,
          "weight": "bold",
          "style": "normal"
        },
        "alignment": {
          "horizontal": "center",
          "vertical": "middle"
        },
        "color": "#000000"
      },
      "style": {
        "background": {
          "color": null,
          "image": null
        },
        "border": {
          "width": 0.0,
          "color": "#000000",
          "style": "solid"
        },
        "padding": {
          "top": 0.0,
          "bottom": 0.0,
          "left": 0.0,
          "right": 0.0
        }
      }
    },
    {
      "id": "data-field-001",
      "type": "DataField",
      "position": {
        "x": 50.0,
        "y": 120.0
      },
      "size": {
        "width": 150.0,
        "height": 20.0
      },
      "z_index": 1,
      "visible": true,
      "content": {
        "text": null,
        "expression": "{customer_name}",
        "font": {
          "family": "Arial",
          "size": 12.0,
          "weight": "normal",
          "style": "normal"
        },
        "alignment": {
          "horizontal": "left",
          "vertical": "middle"
        },
        "color": "#000000",
        "format": null
      },
      "style": {
        "background": {
          "color": null,
          "image": null
        },
        "border": {
          "width": 0.0,
          "color": "#000000",
          "style": "solid"
        },
        "padding": {
          "top": 2.0,
          "bottom": 2.0,
          "left": 5.0,
          "right": 5.0
        }
      },
      "data_binding": {
        "source_id": "primary_db",
        "field_name": "customer_name",
        "validation": {
          "required": false,
          "max_length": 100
        }
      }
    },
    {
      "id": "rect-001",
      "type": "Rectangle",
      "position": {
        "x": 45.0,
        "y": 115.0
      },
      "size": {
        "width": 505.0,
        "height": 25.0
      },
      "z_index": 0,
      "visible": true,
      "content": {},
      "style": {
        "background": {
          "color": "#f5f5f5",
          "image": null
        },
        "border": {
          "width": 1.0,
          "color": "#cccccc",
          "style": "solid"
        }
      }
    }
  ],
  "parameters": [
    {
      "name": "report_title",
      "type": "String",
      "default": "默认报表标题",
      "description": "报表标题",
      "required": false
    },
    {
      "name": "show_footer",
      "type": "Boolean", 
      "default": true,
      "description": "是否显示页脚",
      "required": false
    }
  ],
  "variables": [
    {
      "name": "total_amount",
      "type": "Number",
      "expression": "SUM({amount})",
      "initial_value": 0.0,
      "description": "订单总金额"
    },
    {
      "name": "record_count",
      "type": "Number", 
      "expression": "COUNT({id})",
      "initial_value": 0,
      "description": "记录总数"
    }
  ],
  "groups": [
    {
      "name": "date_group",
      "expression": "{order_date}",
      "sort_order": "desc",
      "header": {
        "height": 25.0,
        "elements": ["group-header-001"]
      },
      "footer": {
        "height": 20.0,
        "elements": ["group-footer-001"]
      }
    }
  ]
}
```

### 2.2 类型系统映射

#### Rust类型定义
```rust
// src-tauri/src/core/template.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JasperTemplate {
    pub metadata: TemplateMetadata,
    pub canvas: Canvas,
    pub data_sources: Vec<DataSource>,
    pub elements: Vec<TemplateElement>,
    pub parameters: Vec<Parameter>,
    pub variables: Vec<Variable>,
    pub groups: Vec<Group>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateMetadata {
    pub version: String,
    pub format_version: String,
    pub created_at: String,
    pub last_modified: String,
    pub created_by: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub compatibility: CompatibilityInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateElement {
    pub id: String,
    pub element_type: ElementType,
    pub position: Position,
    pub size: Size,
    pub z_index: i32,
    pub visible: bool,
    pub content: ElementContent,
    pub style: ElementStyle,
    pub data_binding: Option<DataBinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ElementType {
    Text,
    DataField,
    Rectangle,
    Line,
    Image,
    Barcode,
    Chart,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataBinding {
    pub source_id: String,
    pub field_name: String,
    pub validation: Option<ValidationRules>,
}
```

#### TypeScript类型定义
```typescript
// src/types/template.ts
export interface JasperTemplate {
  readonly metadata: TemplateMetadata
  readonly canvas: Canvas
  readonly data_sources: ReadonlyArray<DataSource>
  readonly elements: ReadonlyArray<TemplateElement>
  readonly parameters: ReadonlyArray<Parameter>
  readonly variables: ReadonlyArray<Variable>
  readonly groups: ReadonlyArray<Group>
}

export interface TemplateElement {
  readonly id: string
  readonly type: ElementType
  readonly position: Position
  readonly size: Size
  readonly z_index: number
  readonly visible: boolean
  readonly content: ElementContent
  readonly style: ElementStyle
  readonly data_binding?: DataBinding
}

export type ElementType = 'Text' | 'DataField' | 'Rectangle' | 'Line' | 'Image' | 'Barcode' | 'Chart'
```

---

## 3. 表达式语法系统

### 3.1 与现有引擎完全兼容

基于现有的expression-engine.ts，jasper格式完全支持现有表达式语法：

```json
{
  "supported_expressions": {
    "simple_field": "{customer_name}",
    "nested_object": "{customer.address.city}",
    "array_access": "{orders[0].amount}",
    "deep_nesting": "{customer.orders[0].items[1].product.name}",
    "mixed_access": "{reports[0].summary.totals.grand_total}"
  }
}
```

### 3.2 表达式扩展语法

```json
{
  "extended_expressions": {
    "parameter_reference": "$P{report_date}",
    "variable_reference": "$V{total_count}",
    "function_calls": "$F{FORMAT_DATE({order_date}, 'yyyy-MM-dd')}",
    "conditional": "$C{amount > 1000 ? 'High' : 'Normal'}",
    "aggregation": "$A{SUM(amount) OVER (PARTITION BY customer_id)}",
    "resource_reference": "$R{images/logo.png}"
  }
}
```

### 3.3 类型安全验证

```rust
// 表达式验证器
impl ExpressionValidator {
    pub fn validate_expression(
        &self, 
        expression: &str, 
        context: &DataContext
    ) -> ValidationResult {
        // 基础语法检查
        let syntax_check = self.check_syntax(expression)?;
        
        // 字段存在性检查
        let field_check = self.validate_fields(expression, context)?;
        
        // 类型兼容性检查
        let type_check = self.validate_types(expression, context)?;
        
        ValidationResult {
            valid: syntax_check && field_check && type_check,
            errors: self.collect_errors(),
            warnings: self.collect_warnings(),
            suggestions: self.generate_suggestions(expression, context),
        }
    }
}
```

---

## 4. 数据源集成

### 4.1 与现有DataSource API集成

```json
{
  "data_source_mapping": {
    "jasper_config": {
      "id": "sales_db",
      "type": "sql",
      "provider_type": "postgresql",
      "config": {
        "connection_string": "postgresql://user:pass@localhost:5432/db"
      }
    },
    "api_integration": {
      "create_command": "create_data_source(name, provider_type, config)",
      "query_command": "query_data_source(source_id, query)",
      "schema_command": "get_data_source_schema(source_id)"
    }
  }
}
```

### 4.2 支持的数据源类型

```rust
// 完全兼容现有DataSourceType
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DataSourceType {
    Json,    // JSON文件和API
    Excel,   // Excel文件 (.xlsx, .xls)
    Sql,     // SQL数据库 (PostgreSQL, MySQL, SQLite)
    Xml,     // XML文件和服务
    Csv,     // CSV文件
}

// 扩展配置支持
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceConfig {
    // 数据库配置
    pub host: Option<String>,
    pub port: Option<u16>,
    pub database: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    
    // 文件配置
    pub file_path: Option<String>,
    pub sheet_name: Option<String>,
    pub delimiter: Option<String>,
    
    // API配置
    pub url: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub auth_method: Option<String>,
    
    // 通用配置
    pub timeout: Option<u64>,
    pub retry_count: Option<u32>,
}
```

---

## 5. AppState兼容性层

### 5.1 双向转换

```rust
// Template -> AppState 转换
impl From<JasperTemplate> for AppState {
    fn from(template: JasperTemplate) -> Self {
        let elements = template.elements
            .into_iter()
            .map(|elem| (elem.id.clone(), elem.into()))
            .collect();
            
        AppState {
            canvas: template.canvas.into(),
            elements,
            selected_ids: HashSet::new(),
            clipboard: Vec::new(),
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        }
    }
}

// AppState -> Template 转换
impl From<&AppState> for JasperTemplate {
    fn from(state: &AppState) -> Self {
        JasperTemplate {
            metadata: TemplateMetadata::default(),
            canvas: state.canvas.clone(),
            data_sources: Vec::new(), // 需要额外提供
            elements: state.elements.values().cloned().collect(),
            parameters: Vec::new(),
            variables: Vec::new(),
            groups: Vec::new(),
        }
    }
}
```

### 5.2 增量同步

```rust
#[derive(Debug, Clone)]
pub struct TemplateDiff {
    pub added_elements: Vec<TemplateElement>,
    pub modified_elements: Vec<(String, TemplateElement)>,
    pub removed_elements: Vec<String>,
    pub canvas_changes: Option<Canvas>,
    pub data_source_changes: Vec<DataSourceChange>,
}

impl TemplateDiff {
    pub fn apply_to_state(&self, state: &mut AppState) -> Result<(), ApplyError> {
        // 应用增量变更到AppState
        for element in &self.added_elements {
            state.elements.insert(element.id.clone(), element.clone().into());
        }
        
        for (id, element) in &self.modified_elements {
            if let Some(existing) = state.elements.get_mut(id) {
                *existing = element.clone().into();
            }
        }
        
        for id in &self.removed_elements {
            state.elements.remove(id);
            state.selected_ids.remove(id);
        }
        
        if let Some(canvas) = &self.canvas_changes {
            state.canvas = canvas.clone().into();
        }
        
        Ok(())
    }
}
```

---

## 6. JRXML兼容格式

### 6.1 标准JRXML生成

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports 
              http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
              name="SalesReport" 
              pageWidth="595" 
              pageHeight="842"
              columnWidth="555" 
              leftMargin="20" 
              rightMargin="20" 
              topMargin="20" 
              bottomMargin="20">
              
    <!-- 参数定义 -->
    <parameter name="report_title" class="java.lang.String">
        <defaultValueExpression><![CDATA["默认报表标题"]]></defaultValueExpression>
    </parameter>
    
    <parameter name="start_date" class="java.util.Date">
        <defaultValueExpression><![CDATA[new java.util.Date(125, 0, 1)]]></defaultValueExpression>
    </parameter>
    
    <!-- 数据源查询 -->
    <queryString>
        <![CDATA[SELECT id, customer_name, amount, order_date 
                 FROM orders 
                 WHERE order_date >= $P{start_date} AND order_date <= $P{end_date} 
                 ORDER BY order_date DESC]]>
    </queryString>
    
    <!-- 字段定义 -->
    <field name="id" class="java.lang.Long"/>
    <field name="customer_name" class="java.lang.String"/>
    <field name="amount" class="java.math.BigDecimal"/>
    <field name="order_date" class="java.util.Date"/>
    
    <!-- 变量定义 -->
    <variable name="total_amount" class="java.math.BigDecimal" calculation="Sum">
        <variableExpression><![CDATA[$F{amount}]]></variableExpression>
        <initialValueExpression><![CDATA[new java.math.BigDecimal(0)]]></initialValueExpression>
    </variable>
    
    <!-- 页面标题 -->
    <title>
        <band height="50" splitType="Stretch">
            <staticText>
                <reportElement x="50" y="20" width="495" height="30"/>
                <textElement textAlignment="Center">
                    <font fontName="Arial" size="18" isBold="true"/>
                </textElement>
                <text><![CDATA[月度销售报表]]></text>
            </staticText>
        </band>
    </title>
    
    <!-- 详细数据 -->
    <detail>
        <band height="25" splitType="Stretch">
            <rectangle>
                <reportElement x="45" y="0" width="505" height="25" backcolor="#F5F5F5"/>
                <graphicElement>
                    <pen lineWidth="1.0" lineColor="#CCCCCC"/>
                </graphicElement>
            </rectangle>
            
            <textField>
                <reportElement x="50" y="5" width="150" height="15"/>
                <textElement>
                    <font fontName="Arial" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{customer_name}]]></textFieldExpression>
            </textField>
            
            <textField pattern="#,##0.00">
                <reportElement x="220" y="5" width="100" height="15"/>
                <textElement textAlignment="Right">
                    <font fontName="Arial" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{amount}]]></textFieldExpression>
            </textField>
            
            <textField pattern="yyyy-MM-dd">
                <reportElement x="340" y="5" width="100" height="15"/>
                <textElement textAlignment="Center">
                    <font fontName="Arial" size="12"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{order_date}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
    
</jasperReport>
```

### 6.2 双向转换引擎

```rust
// Jasper -> JRXML 转换器
pub struct JrxmlConverter {
    template_version: String,
}

impl JrxmlConverter {
    pub fn to_jrxml(&self, template: &JasperTemplate) -> Result<String, ConversionError> {
        let mut jrxml = String::new();
        
        // XML头部
        jrxml.push_str(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
        jrxml.push_str(&self.generate_jasper_report_element(template)?);
        
        // 参数
        for param in &template.parameters {
            jrxml.push_str(&self.generate_parameter_element(param)?);
        }
        
        // 查询
        if let Some(primary_source) = template.data_sources.first() {
            jrxml.push_str(&self.generate_query_element(primary_source)?);
        }
        
        // 字段
        for source in &template.data_sources {
            for column in &source.schema.columns {
                jrxml.push_str(&self.generate_field_element(column)?);
            }
        }
        
        // 变量
        for variable in &template.variables {
            jrxml.push_str(&self.generate_variable_element(variable)?);
        }
        
        // 报表段落
        jrxml.push_str(&self.generate_bands(&template.elements)?);
        
        jrxml.push_str("</jasperReport>");
        
        Ok(jrxml)
    }
    
    pub fn from_jrxml(&self, jrxml: &str) -> Result<JasperTemplate, ConversionError> {
        let doc = roxmltree::Document::parse(jrxml)?;
        let root = doc.root_element();
        
        let metadata = self.extract_metadata(&root)?;
        let canvas = self.extract_canvas(&root)?;
        let data_sources = self.extract_data_sources(&root)?;
        let elements = self.extract_elements(&root)?;
        let parameters = self.extract_parameters(&root)?;
        let variables = self.extract_variables(&root)?;
        let groups = self.extract_groups(&root)?;
        
        Ok(JasperTemplate {
            metadata,
            canvas,
            data_sources,
            elements,
            parameters,
            variables,
            groups,
        })
    }
}
```

---

## 7. 性能优化策略

### 7.1 序列化性能

```rust
// 自定义序列化器优化
impl JasperTemplate {
    pub fn serialize_optimized(&self) -> Result<Vec<u8>, SerializationError> {
        // 使用二进制序列化提高性能
        let mut buffer = Vec::new();
        
        // 写入魔数和版本
        buffer.extend_from_slice(b"JASPER2\0");
        buffer.extend_from_slice(&self.get_format_version_bytes());
        
        // 压缩序列化
        let json_data = serde_json::to_vec(self)?;
        let compressed = lz4::block::compress(&json_data, None, true)?;
        
        buffer.extend_from_slice(&(compressed.len() as u32).to_le_bytes());
        buffer.extend_from_slice(&compressed);
        
        Ok(buffer)
    }
    
    pub fn deserialize_optimized(data: &[u8]) -> Result<Self, SerializationError> {
        // 验证魔数
        if !data.starts_with(b"JASPER2\0") {
            return Err(SerializationError::InvalidFormat);
        }
        
        let version = &data[8..12];
        let size = u32::from_le_bytes([data[12], data[13], data[14], data[15]]);
        let compressed = &data[16..16 + size as usize];
        
        // 解压缩
        let json_data = lz4::block::decompress(compressed, None)?;
        let template = serde_json::from_slice(&json_data)?;
        
        Ok(template)
    }
}
```

### 7.2 增量加载

```rust
// 懒加载模板部分
#[derive(Debug, Clone)]
pub struct LazyTemplate {
    pub metadata: TemplateMetadata,
    pub canvas: Canvas,
    elements_loader: Option<Box<dyn ElementLoader>>,
    data_sources_loader: Option<Box<dyn DataSourceLoader>>,
}

impl LazyTemplate {
    pub async fn load_elements(&mut self) -> Result<Vec<TemplateElement>, LoadError> {
        if let Some(loader) = &mut self.elements_loader {
            loader.load_elements().await
        } else {
            Ok(Vec::new())
        }
    }
    
    pub async fn load_element_by_id(&mut self, id: &str) -> Result<Option<TemplateElement>, LoadError> {
        if let Some(loader) = &mut self.elements_loader {
            loader.load_element(id).await
        } else {
            Ok(None)
        }
    }
}
```

### 7.3 缓存策略

```rust
// 模板缓存管理
pub struct TemplateCache {
    memory_cache: Arc<RwLock<HashMap<String, JasperTemplate>>>,
    disk_cache: Option<PathBuf>,
    max_memory_size: usize,
    max_disk_size: usize,
}

impl TemplateCache {
    pub async fn get_template(&self, path: &str) -> Result<JasperTemplate, CacheError> {
        // 内存缓存优先
        if let Some(template) = self.get_from_memory(path).await? {
            return Ok(template);
        }
        
        // 磁盘缓存其次
        if let Some(template) = self.get_from_disk(path).await? {
            self.store_in_memory(path, template.clone()).await?;
            return Ok(template);
        }
        
        // 从原始文件加载
        let template = self.load_from_file(path).await?;
        self.store_in_cache(path, template.clone()).await?;
        
        Ok(template)
    }
    
    async fn evict_if_needed(&self) -> Result<(), CacheError> {
        let cache = self.memory_cache.read().await;
        if cache.len() * std::mem::size_of::<JasperTemplate>() > self.max_memory_size {
            drop(cache);
            
            // LRU淘汰策略
            let mut cache = self.memory_cache.write().await;
            // ... 实现LRU淘汰逻辑
        }
        Ok(())
    }
}
```

---

## 8. 验证和错误处理

### 8.1 模板验证器

```rust
pub struct TemplateValidator {
    schema_version: String,
    strict_mode: bool,
}

impl TemplateValidator {
    pub fn validate_template(&self, template: &JasperTemplate) -> ValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        
        // 元数据验证
        self.validate_metadata(&template.metadata, &mut errors, &mut warnings);
        
        // Canvas验证
        self.validate_canvas(&template.canvas, &mut errors, &mut warnings);
        
        // 元素验证
        for element in &template.elements {
            self.validate_element(element, template, &mut errors, &mut warnings);
        }
        
        // 数据源验证
        for source in &template.data_sources {
            self.validate_data_source(source, &mut errors, &mut warnings);
        }
        
        // 表达式验证
        self.validate_expressions(template, &mut errors, &mut warnings);
        
        // 引用完整性验证
        self.validate_references(template, &mut errors, &mut warnings);
        
        ValidationResult {
            valid: errors.is_empty(),
            errors,
            warnings,
        }
    }
    
    fn validate_element(
        &self,
        element: &TemplateElement,
        template: &JasperTemplate,
        errors: &mut Vec<ValidationError>,
        warnings: &mut Vec<ValidationWarning>,
    ) {
        // 位置验证
        if element.position.x < 0.0 || element.position.y < 0.0 {
            errors.push(ValidationError::InvalidPosition(element.id.clone()));
        }
        
        // 尺寸验证
        if element.size.width <= 0.0 || element.size.height <= 0.0 {
            errors.push(ValidationError::InvalidSize(element.id.clone()));
        }
        
        // 数据绑定验证
        if let Some(binding) = &element.data_binding {
            let source_exists = template.data_sources
                .iter()
                .any(|s| s.id == binding.source_id);
                
            if !source_exists {
                errors.push(ValidationError::DataSourceNotFound {
                    element_id: element.id.clone(),
                    source_id: binding.source_id.clone(),
                });
            }
        }
        
        // 表达式语法验证
        if let ElementContent::DataField { expression, .. } = &element.content {
            if let Some(expr) = expression {
                if let Err(e) = self.validate_expression_syntax(expr) {
                    errors.push(ValidationError::InvalidExpression {
                        element_id: element.id.clone(),
                        expression: expr.clone(),
                        error: e.to_string(),
                    });
                }
            }
        }
    }
}
```

### 8.2 错误恢复策略

```rust
#[derive(Debug, Clone)]
pub enum RecoveryStrategy {
    IgnoreElement(String),
    UseDefaultValue(String, serde_json::Value),
    RepairExpression(String, String),
    CreateMissingDataSource(String),
}

pub struct ErrorRecovery {
    strategies: Vec<RecoveryStrategy>,
    auto_repair: bool,
}

impl ErrorRecovery {
    pub fn attempt_recovery(
        &self,
        template: &mut JasperTemplate,
        errors: &[ValidationError]
    ) -> RecoveryResult {
        let mut recovered_errors = Vec::new();
        let mut failed_recoveries = Vec::new();
        
        for error in errors {
            match self.apply_recovery_strategy(template, error) {
                Ok(strategy) => {
                    recovered_errors.push((error.clone(), strategy));
                }
                Err(e) => {
                    failed_recoveries.push((error.clone(), e));
                }
            }
        }
        
        RecoveryResult {
            recovered_errors,
            failed_recoveries,
            template_modified: !recovered_errors.is_empty(),
        }
    }
}
```

---

## 9. 集成和API设计

### 9.1 Tauri命令接口

```rust
// src-tauri/src/commands/template.rs
#[tauri::command]
pub async fn load_template(path: String) -> Result<JasperTemplate, CommandError> {
    let template_service = get_template_service();
    let template = template_service.load_template(&path).await?;
    Ok(template)
}

#[tauri::command]
pub async fn save_template(
    template: JasperTemplate,
    path: String
) -> Result<(), CommandError> {
    let template_service = get_template_service();
    template_service.save_template(template, &path).await?;
    Ok(())
}

#[tauri::command]
pub async fn validate_template(template: JasperTemplate) -> Result<ValidationResult, CommandError> {
    let validator = TemplateValidator::new();
    let result = validator.validate_template(&template);
    Ok(result)
}

#[tauri::command]
pub async fn convert_to_jrxml(template: JasperTemplate) -> Result<String, CommandError> {
    let converter = JrxmlConverter::new();
    let jrxml = converter.to_jrxml(&template)?;
    Ok(jrxml)
}

#[tauri::command]
pub async fn convert_from_jrxml(jrxml: String) -> Result<JasperTemplate, CommandError> {
    let converter = JrxmlConverter::new();
    let template = converter.from_jrxml(&jrxml)?;
    Ok(template)
}
```

### 9.2 前端集成

```typescript
// src/utils/template-api.ts
import { invoke } from '@tauri-apps/api/tauri'

export class TemplateAPI {
  static async loadTemplate(path: string): Promise<JasperTemplate> {
    return await invoke('load_template', { path })
  }
  
  static async saveTemplate(template: JasperTemplate, path: string): Promise<void> {
    await invoke('save_template', { template, path })
  }
  
  static async validateTemplate(template: JasperTemplate): Promise<ValidationResult> {
    return await invoke('validate_template', { template })
  }
  
  static async convertToJrxml(template: JasperTemplate): Promise<string> {
    return await invoke('convert_to_jrxml', { template })
  }
  
  static async convertFromJrxml(jrxml: string): Promise<JasperTemplate> {
    return await invoke('convert_from_jrxml', { jrxml })
  }
  
  static async exportToPdf(template: JasperTemplate): Promise<Uint8Array> {
    return await invoke('export_template_to_pdf', { template })
  }
}

// 与现有AppState集成
export function templateToAppState(template: JasperTemplate): AppState {
  return {
    elements: template.elements.map(elem => ({
      id: { value: elem.id },
      position: elem.position,
      size: elem.size,
      content: convertElementContent(elem.content),
      z_index: elem.z_index,
      visible: elem.visible,
    })),
    selectedIds: new Set(),
    canvasConfig: {
      width: template.canvas.width,
      height: template.canvas.height,
      unit: template.canvas.unit,
      margins: template.canvas.margins,
      grid: template.canvas.grid,
    }
  }
}

export function appStateToTemplate(
  state: AppState,
  metadata?: TemplateMetadata
): JasperTemplate {
  return {
    metadata: metadata || createDefaultMetadata(),
    canvas: {
      width: state.canvasConfig.width,
      height: state.canvasConfig.height,
      unit: state.canvasConfig.unit,
      orientation: 'portrait',
      margins: state.canvasConfig.margins,
      grid: state.canvasConfig.grid,
      background: { color: '#ffffff', image: null }
    },
    data_sources: [],
    elements: state.elements.map(elem => ({
      id: elem.id.value,
      type: elem.content.type,
      position: elem.position,
      size: elem.size,
      z_index: elem.z_index,
      visible: elem.visible,
      content: convertToTemplateContent(elem.content),
      style: createDefaultStyle(),
      data_binding: null,
    })),
    parameters: [],
    variables: [],
    groups: [],
  }
}
```

---

## 10. 部署和版本管理

### 10.1 文件格式版本控制

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatVersion {
    pub major: u16,
    pub minor: u16,
    pub patch: u16,
}

impl FormatVersion {
    pub const CURRENT: Self = FormatVersion { major: 1, minor: 0, patch: 0 };
    
    pub fn is_compatible(&self, other: &Self) -> bool {
        // 主版本号相同且次版本号向后兼容
        self.major == other.major && self.minor >= other.minor
    }
    
    pub fn needs_migration(&self, target: &Self) -> bool {
        self.major < target.major || 
        (self.major == target.major && self.minor < target.minor)
    }
}

// 版本迁移管理
pub struct TemplateMigrator {
    migrations: Vec<Box<dyn Migration>>,
}

impl TemplateMigrator {
    pub fn migrate(
        &self,
        template: JasperTemplate,
        target_version: &FormatVersion
    ) -> Result<JasperTemplate, MigrationError> {
        let mut current = template;
        
        for migration in &self.migrations {
            if migration.applies_to(&current.metadata.format_version, target_version) {
                current = migration.apply(current)?;
            }
        }
        
        // 更新格式版本
        current.metadata.format_version = target_version.to_string();
        current.metadata.last_modified = chrono::Utc::now().to_rfc3339();
        
        Ok(current)
    }
}
```

### 10.2 向后兼容性保证

```rust
// 兼容性测试套件
#[cfg(test)]
mod compatibility_tests {
    use super::*;
    
    #[test]
    fn test_load_v1_0_template() {
        let v1_template_json = include_str!("../test_data/template_v1_0.jasper");
        let template = serde_json::from_str::<JasperTemplate>(v1_template_json)
            .expect("Should load v1.0 template");
            
        assert_eq!(template.metadata.format_version, "1.0.0");
        assert!(!template.elements.is_empty());
    }
    
    #[test]
    fn test_migrate_template() {
        let old_template = create_test_template_v1_0();
        let migrator = TemplateMigrator::new();
        
        let migrated = migrator.migrate(old_template, &FormatVersion::CURRENT)
            .expect("Migration should succeed");
            
        assert_eq!(migrated.metadata.format_version, FormatVersion::CURRENT.to_string());
    }
    
    #[test]
    fn test_jrxml_roundtrip() {
        let original = create_test_template();
        let converter = JrxmlConverter::new();
        
        let jrxml = converter.to_jrxml(&original).expect("Should convert to JRXML");
        let recovered = converter.from_jrxml(&jrxml).expect("Should convert from JRXML");
        
        assert_templates_equivalent(&original, &recovered);
    }
}
```

---

## 11. 总结

### 11.1 核心优势

**高性能序列化**
- JSON格式原生支持，序列化/反序列化性能优异
- 可选的二进制压缩格式，进一步提升性能
- 增量更新和懒加载支持大型模板

**完全兼容现有系统**
- 与DataContext和表达式引擎无缝集成
- AppState双向转换，零修改集成
- 保持现有API和数据流不变

**JasperReports生态互操作**
- 标准JRXML格式完全兼容
- 双向无损转换保证
- 支持现有JasperReports工具链

**企业级质量保证**
- 严格的模板验证和错误恢复
- 完整的版本管理和迁移策略  
- 类型安全的端到端数据流

### 11.2 实施路线图

**Phase 1: 核心格式实现** (2-3周)
- JasperTemplate数据结构定义
- 基础序列化/反序列化功能
- 与现有表达式引擎集成测试

**Phase 2: 转换引擎开发** (2-3周)  
- AppState双向转换实现
- JRXML转换器开发
- 验证和错误处理系统

**Phase 3: 性能优化** (1-2周)
- 序列化性能优化
- 缓存和懒加载实现
- 内存使用优化

**Phase 4: 生产部署** (1周)
- 完整测试套件
- 文档和示例
- 版本发布

这个设计提供了一个完整、高性能、兼容性良好的模板序列化解决方案，为Jasper报表设计器的核心功能奠定了坚实基础。