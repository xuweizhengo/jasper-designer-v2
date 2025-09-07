# 🗄️ 数据库数据源设计文档

## 📋 文档信息

- **文档版本**: v1.0.0
- **创建日期**: 2025-08-25
- **维护团队**: 数据源架构团队
- **审核状态**: 设计确认
- **实现阶段**: Phase 2 - 数据源扩展

---

## 🎯 设计背景与目标

### **业务需求**
企业级报表设计器需要直接连接数据库，支持：
- **多数据库类型**: MySQL、PostgreSQL、SQLite、SQL Server等
- **交互式查询构建**: 表浏览、字段选择、JOIN关系
- **安全访问控制**: 只读权限、查询限制、凭据管理
- **性能优化**: 连接池、查询缓存、结果分页

### **核心挑战**
1. **复杂性管理**: 数据库连接比文件数据源复杂10倍
2. **安全性**: SQL注入防护、凭据存储、权限控制
3. **用户体验**: 将复杂的数据库操作简化为引导流程
4. **性能考虑**: 大表查询、连接池管理、超时控制

---

## 🏗️ 系统架构设计

### **整体架构**
```
┌─────────────────────────────────────────────────────────┐
│  🎨 前端 - 数据库数据源向导                              │
│  ConnectionStep → SchemaStep → QueryStep → PreviewStep │
└─────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────┐
│  🔌 中间层 - 数据源管理API                              │
│  统一接口、参数验证、错误处理、安全控制                  │
└─────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────┐
│  🗄️ 后端 - 数据库连接引擎 (Rust)                       │
│  连接池管理、SQL执行、结果缓存、安全防护                 │
└─────────────────────────────────────────────────────────┘
```

### **数据流设计**
```
用户输入连接信息 → 测试连接 → 加载表结构 → 构建查询 → 预览结果 → 保存配置
     ↓              ↓         ↓          ↓        ↓         ↓
  验证格式     → 建立连接  → 缓存schema → SQL验证 → 执行查询 → 持久化存储
```

---

## 📊 数据模型设计

### **数据库配置接口**
```typescript
interface DatabaseDataSourceConfig {
  // 连接配置
  connection: {
    database_type: 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver' | 'oracle';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    
    // SSL配置
    ssl_enabled: boolean;
    ssl_cert_path?: string;
    ssl_key_path?: string;
    ssl_ca_path?: string;
    
    // 连接池配置
    max_connections: number;
    min_connections: number;
    connection_timeout: number;
    idle_timeout: number;
  };
  
  // 查询配置
  query: {
    // SQL查询定义
    sql: string;
    use_custom_sql: boolean;
    
    // 可视化查询构建结果
    visual_query?: {
      selected_tables: string[];
      selected_columns: ColumnSelection[];
      joins: JoinDefinition[];
      filters: FilterCondition[];
      sorting: SortDefinition[];
      grouping: GroupDefinition[];
    };
    
    // 执行控制
    query_timeout: number;
    default_limit: number;
    enable_caching: boolean;
    cache_ttl: number;
  };
  
  // 元数据
  metadata: {
    schema_loaded_at: string;
    last_test_result: TestResult;
    estimated_row_count: number;
    query_execution_stats: ExecutionStats;
  };
}
```

### **数据库架构模型**
```typescript
interface DatabaseSchema {
  database_name: string;
  schemas: SchemaInfo[];
  loaded_at: string;
  connection_info: ConnectionSummary;
}

interface SchemaInfo {
  name: string;
  tables: TableInfo[];
  views: ViewInfo[];
  functions?: FunctionInfo[];
}

interface TableInfo {
  name: string;
  schema: string;
  full_name: string; // schema.table
  columns: ColumnInfo[];
  primary_keys: string[];
  foreign_keys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  row_count_estimate: number;
  size_estimate: string;
  comment?: string;
  table_type: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW';
}

interface ColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  default_value?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  comment?: string;
  
  // 数据分析
  distinct_count_estimate?: number;
  sample_values?: any[];
}
```

---

## 🎨 用户界面设计

### **Step 1: 数据库连接配置**
```jsx
const DatabaseConnectionStep = () => {
  return (
    <div class="connection-config">
      <div class="form-section">
        <h3>🔌 数据库连接信息</h3>
        
        <div class="form-group">
          <label>数据库类型</label>
          <select value={databaseType()} onChange={setDatabaseType}>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
            <option value="sqlserver">SQL Server</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group flex-2">
            <label>主机地址</label>
            <input type="text" value={host()} onChange={setHost} 
                   placeholder="localhost" />
          </div>
          <div class="form-group flex-1">
            <label>端口</label>
            <input type="number" value={port()} onChange={setPort} 
                   placeholder="3306" />
          </div>
        </div>
        
        <div class="form-group">
          <label>数据库名</label>
          <input type="text" value={database()} onChange={setDatabase} 
                 placeholder="myapp_production" />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" value={username()} onChange={setUsername} />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" value={password()} onChange={setPassword} />
          </div>
        </div>
        
        <div class="advanced-options">
          <details>
            <summary>高级选项</summary>
            <div class="advanced-content">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" checked={sslEnabled()} 
                         onChange={setSslEnabled} />
                  启用SSL连接
                </label>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>连接超时 (秒)</label>
                  <input type="number" value={connectionTimeout()} 
                         onChange={setConnectionTimeout} />
                </div>
                <div class="form-group">
                  <label>最大连接数</label>
                  <input type="number" value={maxConnections()} 
                         onChange={setMaxConnections} />
                </div>
              </div>
            </div>
          </details>
        </div>
        
        <div class="connection-actions">
          <button class="test-connection-btn" onClick={testConnection} 
                  disabled={testing()}>
            {testing() ? '⏳ 测试中...' : '🔗 测试连接'}
          </button>
          
          <Show when={testResult()}>
            <div class={`test-result ${testResult()?.success ? 'success' : 'error'}`}>
              {testResult()?.success ? '✅ 连接成功' : `❌ ${testResult()?.error}`}
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
```

### **Step 2: 数据库架构浏览**
```jsx
const DatabaseSchemaStep = () => {
  return (
    <div class="schema-exploration">
      <div class="schema-header">
        <h3>🗂️ 数据库表结构浏览</h3>
        <div class="schema-stats">
          连接到: {schemaInfo()?.database_name} | 
          共 {schemaInfo()?.tables?.length || 0} 个表
        </div>
      </div>
      
      <div class="schema-content">
        <div class="schema-sidebar">
          <div class="search-box">
            <input type="text" placeholder="搜索表名..." 
                   value={searchQuery()} onChange={setSearchQuery} />
          </div>
          
          <div class="table-list">
            <For each={filteredTables()}>
              {(table) => (
                <div class={`table-item ${selectedTables().includes(table.name) ? 'selected' : ''}`}
                     onClick={() => toggleTableSelection(table.name)}>
                  <div class="table-header">
                    <input type="checkbox" 
                           checked={selectedTables().includes(table.name)}
                           onChange={() => toggleTableSelection(table.name)} />
                    <span class="table-name">{table.name}</span>
                    <span class="row-count">{formatNumber(table.row_count_estimate)}</span>
                  </div>
                  <div class="table-meta">
                    {table.columns.length} 列 | {table.size_estimate}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
        
        <div class="schema-preview">
          <Show when={selectedTables().length > 0}>
            <div class="selected-tables-preview">
              <h4>已选择的表和字段:</h4>
              <For each={getSelectedTablesInfo()}>
                {(table) => (
                  <div class="table-preview">
                    <div class="table-name">{table.name}</div>
                    <div class="columns-preview">
                      <For each={table.columns.slice(0, 5)}>
                        {(column) => (
                          <span class="column-tag" title={column.data_type}>
                            {column.name}
                          </span>
                        )}
                      </For>
                      <Show when={table.columns.length > 5}>
                        <span class="more-columns">
                          +{table.columns.length - 5} 更多...
                        </span>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
          
          <Show when={selectedTables().length === 0}>
            <div class="empty-selection">
              <div class="empty-icon">📋</div>
              <div class="empty-text">请从左侧选择要查询的表</div>
              <div class="empty-hint">
                支持多表关联查询，系统会自动识别外键关系
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
```

### **Step 3: SQL查询构建器**
```jsx
const DatabaseQueryStep = () => {
  return (
    <div class="query-builder">
      <div class="query-mode-selector">
        <div class="mode-tabs">
          <button class={`mode-tab ${queryMode() === 'visual' ? 'active' : ''}`}
                  onClick={() => setQueryMode('visual')}>
            🎯 可视化构建
          </button>
          <button class={`mode-tab ${queryMode() === 'custom' ? 'active' : ''}`}
                  onClick={() => setQueryMode('custom')}>
            💻 自定义SQL
          </button>
        </div>
      </div>
      
      <Show when={queryMode() === 'visual'}>
        <VisualQueryBuilder 
          tables={selectedTables()} 
          schema={schemaInfo()}
          onQueryChange={setGeneratedSQL} />
      </Show>
      
      <Show when={queryMode() === 'custom'}>
        <div class="custom-sql-editor">
          <div class="sql-editor">
            <textarea 
              class="sql-textarea"
              value={customSQL()}
              onChange={setCustomSQL}
              placeholder="请输入您的SQL查询语句..."
              spellcheck={false}
            />
          </div>
          
          <div class="sql-actions">
            <button onClick={formatSQL}>🎨 格式化</button>
            <button onClick={validateSQL}>✓ 验证语法</button>
            <button onClick={explainQuery}>📊 执行计划</button>
          </div>
        </div>
      </Show>
      
      <div class="query-preview">
        <div class="preview-header">
          <h4>📋 生成的SQL查询</h4>
          <div class="preview-actions">
            <button onClick={copySQL}>📋 复制</button>
            <button onClick={executePreview} disabled={executing()}>
              {executing() ? '⏳ 执行中...' : '▶️ 预览查询'}
            </button>
          </div>
        </div>
        
        <div class="sql-display">
          <pre><code>{finalSQL()}</code></pre>
        </div>
        
        <Show when={previewResult()}>
          <div class="preview-result">
            <div class="result-stats">
              查询成功 | 返回 {previewResult()?.rows?.length || 0} 行 | 
              耗时 {previewResult()?.execution_time}ms
            </div>
            <div class="result-table">
              <DatabaseResultTable data={previewResult()} limit={10} />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
```

---

## 🔧 后端实现架构

### **Rust数据库连接引擎**
```rust
// src-tauri/src/data/providers/database.rs
use sqlx::{Pool, Row, Database, Connect};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize, Serialize)]
pub struct DatabaseProvider {
    config: DatabaseConfig,
    pool: Option<Pool<AnyDatabase>>,
    schema_cache: Option<DatabaseSchema>,
    cache_expires_at: Option<SystemTime>,
}

impl DatabaseProvider {
    pub async fn new(config: DatabaseConfig) -> Result<Self, DatabaseError> {
        let mut provider = Self {
            config,
            pool: None,
            schema_cache: None,
            cache_expires_at: None,
        };
        
        provider.establish_connection().await?;
        Ok(provider)
    }
    
    async fn establish_connection(&mut self) -> Result<(), DatabaseError> {
        let connection_string = self.build_connection_string()?;
        
        let pool = Pool::connect(&connection_string)
            .await
            .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;
            
        self.pool = Some(pool);
        Ok(())
    }
    
    pub async fn test_connection(&self) -> Result<bool, DatabaseError> {
        match &self.pool {
            Some(pool) => {
                let row: (i32,) = sqlx::query_as("SELECT 1")
                    .fetch_one(pool)
                    .await
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                Ok(row.0 == 1)
            }
            None => Err(DatabaseError::NotConnected)
        }
    }
    
    pub async fn load_schema(&mut self) -> Result<DatabaseSchema, DatabaseError> {
        if let Some(schema) = &self.schema_cache {
            if let Some(expires_at) = self.cache_expires_at {
                if SystemTime::now() < expires_at {
                    return Ok(schema.clone());
                }
            }
        }
        
        let schema = match self.config.database_type {
            DatabaseType::MySQL => self.load_mysql_schema().await?,
            DatabaseType::PostgreSQL => self.load_postgres_schema().await?,
            DatabaseType::SQLite => self.load_sqlite_schema().await?,
            DatabaseType::SQLServer => self.load_sqlserver_schema().await?,
        };
        
        self.schema_cache = Some(schema.clone());
        self.cache_expires_at = Some(SystemTime::now() + Duration::from_secs(300)); // 5分钟缓存
        
        Ok(schema)
    }
    
    async fn load_mysql_schema(&self) -> Result<DatabaseSchema, DatabaseError> {
        let pool = self.pool.as_ref().ok_or(DatabaseError::NotConnected)?;
        
        // 查询所有表信息
        let tables_query = r#"
            SELECT 
                t.table_name,
                t.table_schema,
                t.table_type,
                t.table_comment,
                COALESCE(ts.table_rows, 0) as estimated_rows,
                COALESCE(ts.data_length + ts.index_length, 0) as estimated_size
            FROM information_schema.tables t
            LEFT JOIN information_schema.table_statistics ts 
                ON t.table_name = ts.table_name 
                AND t.table_schema = ts.table_schema
            WHERE t.table_schema = ?
            ORDER BY t.table_name
        "#;
        
        let tables: Vec<TableRow> = sqlx::query_as(tables_query)
            .bind(&self.config.database)
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::SchemaLoadFailed(e.to_string()))?;
        
        // 为每个表查询列信息
        let mut table_infos = Vec::new();
        for table_row in tables {
            let columns = self.load_table_columns(&table_row.table_name).await?;
            let foreign_keys = self.load_table_foreign_keys(&table_row.table_name).await?;
            
            table_infos.push(TableInfo {
                name: table_row.table_name.clone(),
                schema: table_row.table_schema.clone(),
                full_name: format!("{}.{}", table_row.table_schema, table_row.table_name),
                columns,
                primary_keys: self.load_primary_keys(&table_row.table_name).await?,
                foreign_keys,
                indexes: Vec::new(), // 可选实现
                row_count_estimate: table_row.estimated_rows,
                size_estimate: self.format_size(table_row.estimated_size),
                comment: table_row.table_comment,
                table_type: self.parse_table_type(&table_row.table_type),
            });
        }
        
        Ok(DatabaseSchema {
            database_name: self.config.database.clone(),
            schemas: vec![SchemaInfo {
                name: "default".to_string(),
                tables: table_infos,
                views: Vec::new(),
                functions: None,
            }],
            loaded_at: chrono::Utc::now().to_rfc3339(),
            connection_info: ConnectionSummary {
                host: self.config.host.clone(),
                database: self.config.database.clone(),
                username: self.config.username.clone(),
            },
        })
    }
    
    pub async fn execute_query(
        &self, 
        sql: &str, 
        limit: Option<u32>
    ) -> Result<QueryResult, DatabaseError> {
        let pool = self.pool.as_ref().ok_or(DatabaseError::NotConnected)?;
        
        // 添加LIMIT子句（如果没有的话）
        let final_sql = if limit.is_some() && !sql.to_uppercase().contains("LIMIT") {
            format!("{} LIMIT {}", sql, limit.unwrap_or(1000))
        } else {
            sql.to_string()
        };
        
        let start_time = Instant::now();
        
        let rows = sqlx::query(&final_sql)
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        
        let execution_time = start_time.elapsed().as_millis() as u64;
        
        // 转换结果
        let mut result_rows = Vec::new();
        let mut columns = Vec::new();
        
        if let Some(first_row) = rows.first() {
            columns = first_row.columns()
                .iter()
                .map(|col| col.name().to_string())
                .collect();
        }
        
        for row in rows {
            let mut row_data = HashMap::new();
            for column in row.columns() {
                let value = self.extract_column_value(&row, column)?;
                row_data.insert(column.name().to_string(), value);
            }
            result_rows.push(row_data);
        }
        
        Ok(QueryResult {
            columns,
            rows: result_rows,
            total_rows: result_rows.len(),
            execution_time,
            query: final_sql,
        })
    }
}

// Tauri命令接口
#[tauri::command]
pub async fn test_database_connection(
    config: DatabaseConfig,
    registry: State<'_, ManagedDataRegistry>
) -> Result<ConnectionTestResult, String> {
    let provider = DatabaseProvider::new(config).await
        .map_err(|e| format!("连接失败: {}", e))?;
        
    let success = provider.test_connection().await
        .map_err(|e| format!("测试失败: {}", e))?;
        
    Ok(ConnectionTestResult {
        success,
        message: if success { 
            "数据库连接测试成功".to_string() 
        } else { 
            "数据库连接测试失败".to_string() 
        },
        connection_info: Some(ConnectionInfo {
            database_version: provider.get_database_version().await.ok(),
            server_info: provider.get_server_info().await.ok(),
        })
    })
}

#[tauri::command]
pub async fn load_database_schema(
    config: DatabaseConfig,
    registry: State<'_, ManagedDataRegistry>
) -> Result<DatabaseSchema, String> {
    let mut provider = DatabaseProvider::new(config).await
        .map_err(|e| format!("连接失败: {}", e))?;
        
    provider.load_schema().await
        .map_err(|e| format!("加载架构失败: {}", e))
}

#[tauri::command]
pub async fn execute_database_preview(
    config: DatabaseConfig,
    sql: String,
    limit: Option<u32>,
    registry: State<'_, ManagedDataRegistry>
) -> Result<QueryResult, String> {
    let provider = DatabaseProvider::new(config).await
        .map_err(|e| format!("连接失败: {}", e))?;
        
    provider.execute_query(&sql, limit).await
        .map_err(|e| format!("查询执行失败: {}", e))
}

#[tauri::command]
pub async fn validate_sql_syntax(
    sql: String,
    database_type: String
) -> Result<ValidationResult, String> {
    // 基础SQL语法验证
    let validation_result = SqlValidator::validate(&sql, &database_type)
        .map_err(|e| format!("SQL验证失败: {}", e))?;
        
    Ok(validation_result)
}
```

---

## 🔒 安全性设计

### **SQL注入防护**
```rust
// 参数化查询强制执行
pub struct SafeQueryBuilder {
    query: String,
    params: Vec<SqlValue>,
}

impl SafeQueryBuilder {
    pub fn new(base_query: &str) -> Self {
        Self {
            query: base_query.to_string(),
            params: Vec::new(),
        }
    }
    
    pub fn add_where_clause(&mut self, column: &str, operator: &str, value: SqlValue) -> Result<(), SecurityError> {
        // 验证列名和操作符是否安全
        if !self.is_safe_column_name(column) {
            return Err(SecurityError::UnsafeColumnName(column.to_string()));
        }
        
        if !self.is_safe_operator(operator) {
            return Err(SecurityError::UnsafeOperator(operator.to_string()));
        }
        
        self.query.push_str(&format!(" AND {} {} ?", column, operator));
        self.params.push(value);
        Ok(())
    }
    
    fn is_safe_column_name(&self, column: &str) -> bool {
        // 只允许字母数字下划线，防止SQL注入
        column.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.')
            && !column.to_uppercase().contains("DROP")
            && !column.to_uppercase().contains("DELETE")
            && !column.to_uppercase().contains("UPDATE")
    }
}
```

### **凭据管理**
```rust
use keyring::Entry;

pub struct CredentialManager {
    app_name: String,
}

impl CredentialManager {
    pub fn store_password(&self, data_source_id: &str, password: &str) -> Result<(), SecurityError> {
        let entry = Entry::new(&self.app_name, data_source_id)?;
        entry.set_password(password)?;
        Ok(())
    }
    
    pub fn retrieve_password(&self, data_source_id: &str) -> Result<String, SecurityError> {
        let entry = Entry::new(&self.app_name, data_source_id)?;
        let password = entry.get_password()?;
        Ok(password)
    }
    
    pub fn delete_password(&self, data_source_id: &str) -> Result<(), SecurityError> {
        let entry = Entry::new(&self.app_name, data_source_id)?;
        entry.delete_password()?;
        Ok(())
    }
}
```

---

## ⚡ 性能优化策略

### **连接池管理**
```rust
pub struct ConnectionPoolConfig {
    pub min_connections: u32,
    pub max_connections: u32,
    pub acquire_timeout: Duration,
    pub idle_timeout: Duration,
    pub max_lifetime: Duration,
}

impl Default for ConnectionPoolConfig {
    fn default() -> Self {
        Self {
            min_connections: 1,
            max_connections: 10,
            acquire_timeout: Duration::from_secs(30),
            idle_timeout: Duration::from_secs(600), // 10分钟
            max_lifetime: Duration::from_secs(3600), // 1小时
        }
    }
}
```

### **查询结果缓存**
```rust
use lru::LruCache;
use std::num::NonZeroUsize;

pub struct QueryCache {
    cache: LruCache<String, (QueryResult, SystemTime)>,
    ttl: Duration,
}

impl QueryCache {
    pub fn new(capacity: usize, ttl: Duration) -> Self {
        Self {
            cache: LruCache::new(NonZeroUsize::new(capacity).unwrap()),
            ttl,
        }
    }
    
    pub fn get(&mut self, query_hash: &str) -> Option<&QueryResult> {
        if let Some((result, timestamp)) = self.cache.get(query_hash) {
            if SystemTime::now().duration_since(*timestamp).unwrap() < self.ttl {
                return Some(result);
            } else {
                self.cache.pop(query_hash);
            }
        }
        None
    }
    
    pub fn put(&mut self, query_hash: String, result: QueryResult) {
        self.cache.put(query_hash, (result, SystemTime::now()));
    }
}
```

---

## 🧪 测试策略

### **单元测试**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_mysql_connection() {
        let config = DatabaseConfig {
            database_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            database: "test_db".to_string(),
            username: "test_user".to_string(),
            password: "test_pass".to_string(),
            ..Default::default()
        };
        
        let provider = DatabaseProvider::new(config).await.unwrap();
        let result = provider.test_connection().await.unwrap();
        assert!(result);
    }
    
    #[tokio::test]
    async fn test_sql_injection_prevention() {
        let malicious_sql = "SELECT * FROM users WHERE id = '1' OR '1'='1'; DROP TABLE users; --";
        let validation = SqlValidator::validate(malicious_sql, "mysql").unwrap();
        assert!(!validation.is_safe);
        assert!(validation.security_issues.len() > 0);
    }
}
```

### **集成测试**
```typescript
// 前端集成测试
describe('DatabaseDataSource', () => {
  test('完整数据源创建流程', async () => {
    // 1. 测试连接配置
    const connectionResult = await testDatabaseConnection({
      database_type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass'
    });
    expect(connectionResult.success).toBe(true);
    
    // 2. 测试架构加载
    const schema = await loadDatabaseSchema(connectionConfig);
    expect(schema.tables.length).toBeGreaterThan(0);
    
    // 3. 测试查询执行
    const queryResult = await executePreviewQuery(
      connectionConfig,
      'SELECT * FROM users LIMIT 10'
    );
    expect(queryResult.rows.length).toBeLessThanOrEqual(10);
    
    // 4. 测试数据源保存
    const dataSourceId = await createDataSource(
      '测试数据库',
      'database',
      finalConfig
    );
    expect(dataSourceId).toBeTruthy();
  });
});
```

---

## 📋 实施计划

### **Phase 1: 核心连接功能** (Week 1-2)
- [ ] 基础数据库连接引擎 (Rust)
- [ ] MySQL/PostgreSQL支持
- [ ] 连接测试和错误处理
- [ ] 基础SQL执行功能

### **Phase 2: 架构浏览功能** (Week 3-4)  
- [ ] 数据库架构加载和缓存
- [ ] 表和列信息展示
- [ ] 外键关系识别
- [ ] 前端架构浏览界面

### **Phase 3: 查询构建器** (Week 5-6)
- [ ] 自定义SQL编辑器
- [ ] 可视化查询构建器
- [ ] SQL验证和格式化
- [ ] 查询预览和结果展示

### **Phase 4: 安全性和优化** (Week 7-8)
- [ ] SQL注入防护
- [ ] 凭据安全存储
- [ ] 连接池优化
- [ ] 查询缓存机制

### **Phase 5: 扩展和完善** (Week 9-10)
- [ ] SQLite/SQL Server支持
- [ ] 高级查询功能
- [ ] 性能监控
- [ ] 错误恢复机制

---

## 🔍 风险评估

### **技术风险**
- **连接复杂性**: 不同数据库的连接字符串和配置差异很大
- **性能问题**: 大表查询可能导致界面卡顿
- **兼容性**: 不同数据库版本的SQL语法差异

### **安全风险** 
- **凭据泄露**: 数据库密码需要安全存储
- **SQL注入**: 用户输入的SQL需要严格验证
- **权限滥用**: 需要确保只读权限控制

### **缓解措施**
- 使用成熟的数据库连接库 (sqlx)
- 实现查询超时和取消机制
- 采用参数化查询防止注入
- 使用系统密钥环存储凭据

---

## 📝 后续优化方向

### **短期优化** (1-3个月)
- 查询性能监控和优化建议
- 更丰富的可视化查询构建器
- 查询历史记录和收藏功能

### **中期扩展** (3-6个月)
- 数据库迁移工具
- 数据同步和增量更新
- 多租户和权限管理

### **长期愿景** (6-12个月)
- 数据库性能分析工具
- 智能查询优化建议
- 数据血缘关系分析

---

*本设计文档将根据实际开发过程中的发现和反馈持续更新完善。*