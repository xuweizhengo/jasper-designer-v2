// === Data Source API Client - 简化版本 ===
import { invoke } from '@tauri-apps/api/tauri';

// 基础接口定义
export interface DataSourceInfo {
  id: string;
  name: string;
  type_name: string;
  provider_type: string;
  status: 'active' | 'error' | 'disabled';
  config?: any;
  description?: string;
  created_at: string;
  updated_at?: string;
  last_updated: string;
  created_by?: string;
  tags?: string[];
}

export interface DataSourceTypeInfo {
  type_name: string;
  display_name: string;
  description: string;
  category: 'file' | 'network' | 'database' | 'api';
  capabilities: string[];
}

export interface DatabaseConfig {
  database_type: 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_enabled?: boolean;
  ssl_cert_path?: string;
  ssl_key_path?: string;
  ssl_ca_path?: string;
  max_connections?: number;
  min_connections?: number;
  connection_timeout?: number;
  idle_timeout?: number;
  sql?: string;
  use_custom_sql?: boolean;
  query_timeout?: number;
  default_limit?: number;
  enable_caching?: boolean;
  cache_ttl?: number;
}

export interface DatabaseSchema {
  database_name: string;
  schemas: any[];
  loaded_at: string;
  connection_info: any;
}

export interface DatabaseColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  execution_time: number;
  query: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
  is_safe?: boolean;
  security_issues?: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  connection_info?: any;
  error_details?: string;
}

export interface DataQuery {
  path?: string;
  filter?: any;
  limit?: number;
  offset?: number;
  sort?: any;
  aggregation?: any;
  context?: any;
}

export interface DataSet {
  rows: any[];
  columns: any[];
  total_count: number;
  total_rows: number; // 确保这个字段不是可选的
  cached: boolean;
  cache_time?: string;
  checksum?: string;
  metadata?: any;
}

export interface DataSchema {
  version: string;
  last_updated: string;
  columns: any[];
  primary_key?: string;
  indexes: any[];
  relationships: any[];
}

export interface SaveDataSourceRequest {
  name: string;
  description?: string;
  config: any;
  selected_tables: string[];
  sql: string;
  tags?: string[];
  validate_before_save?: boolean;
  capture_schema_snapshot?: boolean;
  capture_data_preview?: boolean;
  preview_row_limit?: number;
}

export interface SaveDataSourceResponse {
  success: boolean;
  data_source_id?: string;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface DataSourceValidation {
  connection_valid: boolean;
  sql_valid: boolean;
  security_passed: boolean;
  performance_acceptable: boolean;
  warnings: string[];
  errors: string[];
  suggestions?: string[];
}

export interface DataPreview {
  sample_data: any[];
  column_info: DatabaseColumnInfo[];
  total_estimated_rows: number;
  execution_stats: {
    execution_time: number;
    memory_usage?: number;
    network_io?: number;
  };
  query_plan?: string;
}

export interface ExpressionResult {
  expression: string;
  result?: any;
  error?: string;
}

// API Client
export class DataSourceAPI {
  // 基础数据源操作
  static async listDataSources(): Promise<DataSourceInfo[]> {
    return invoke('list_data_sources');
  }

  static async deleteDataSource(sourceId: string): Promise<void> {
    // 兼容不同后端参数命名（source_id vs sourceId）
    return invoke('delete_data_source', { source_id: sourceId, sourceId });
  }

  static async updateConfig(sourceId: string, config: any): Promise<void> {
    return invoke('update_data_source_config', { source_id: sourceId, config });
  }

  static async queryDataSource(sourceId: string, query: DataQuery): Promise<DataSet> {
    return invoke('query_data_source', { source_id: sourceId, query });
  }

  static async getDataPreview(sourceId: string, limit?: number): Promise<DataSet> {
    return invoke('get_data_preview', { source_id: sourceId, limit });
  }

  static async testConnection(providerType: string, config: any): Promise<boolean> {
    return invoke('test_data_source_connection', { provider_type: providerType, config });
  }

  static async discoverSchema(providerType: string, config: any): Promise<DataSchema> {
    return invoke('discover_schema', { provider_type: providerType, config });
  }

  // 数据库特定操作
  static async testDatabaseConnection(config: any): Promise<ConnectionTestResult> {
    return invoke('test_database_connection', { config });
  }

  static async loadDatabaseSchema(config: any): Promise<any> {
    return invoke('load_database_schema', { config });
  }

  static async executeDatabasePreview(config: any, sql: string, limit?: number): Promise<any> {
    return invoke('execute_database_preview', { config, sql, limit });
  }

  static async validateSqlSyntax(sql: string, databaseType: string): Promise<ValidationResult> {
    console.log('🔍 验证SQL语法 - 参数:', { sql: sql.length + ' 字符', databaseType });
    
    // 验证参数有效性
    if (!sql || sql.trim().length === 0) {
      throw new Error('SQL不能为空');
    }
    
    if (!databaseType) {
      console.error('❌ databaseType参数为空或未定义:', databaseType);
      throw new Error('数据库类型不能为空');
    }
    
    // 尝试使用正确的参数名调用
    try {
      // 临时修复：直接使用当前运行版本期望的参数名
      const params = {
        "sql": sql,
        "databaseType": databaseType  // 使用运行版本期望的键名
      };
      console.log('🔍 将传递给Rust的参数:', params);
      console.log('🔍 参数对象的键:', Object.keys(params));
      console.log('🔍 参数JSON:', JSON.stringify(params));
      
      return await invoke('validate_sql_syntax', params);
    } catch (error) {
      console.error('❌ 调用失败:', error);
      
      // 如果失败，尝试使用标准的参数名
      console.log('🔄 尝试使用database_type键名...');
      try {
        const fallbackParams = {
          "sql": sql,
          "database_type": databaseType
        };
        return await invoke('validate_sql_syntax', fallbackParams);
      } catch (fallbackError) {
        console.error('❌ 容错调用也失败:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static async formatSql(sql: string, databaseType: string): Promise<string> {
    return invoke('format_sql', { sql, databaseType: databaseType });
  }

  // 数据源创建和保存
  static async saveDataSource(request: SaveDataSourceRequest): Promise<SaveDataSourceResponse> {
    try {
      // 从数据库配置中提取参数
      const config = request.config;
      
      // 添加调试日志
      console.log('🔍 saveDataSource 请求参数:', {
        name: request.name,
        selected_tables: request.selected_tables,
        selected_tables_type: typeof request.selected_tables,
        selected_tables_length: request.selected_tables?.length,
        sql_length: request.sql?.length,
      });
      
      // 确保 selectedTables 永远不是 undefined
      const selectedTables = request.selected_tables || [];
      console.log('🔍 实际传递的 selectedTables:', selectedTables);
      
      const dataSourceId = await invoke('create_database_source', {
        name: request.name,
        description: request.description || null,
        databaseType: config.database_type,  // camelCase 格式，Tauri 自动转换
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password || null,
        sql: request.sql,
        selectedTables: selectedTables,  // 使用确保不为 undefined 的值
        tags: request.tags ? request.tags : null,
      });

      return {
        success: true,
        data_source_id: String(dataSourceId),
        message: `数据源 "${request.name}" 创建成功`,
        warnings: [],
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        data_source_id: '',
        message: `保存数据源失败: ${error}`,
        warnings: [],
        errors: [String(error)]
      };
    }
  }

  // 兼容性方法
  static async createDataSource(name: string, type: string, config: any): Promise<string> {
    return invoke('create_data_source', { name, provider_type: type, config });
  }

  static async getPreview(sourceId: string, _path?: string, limit?: number): Promise<DataSet> {
    return this.getDataPreview(sourceId, limit);
  }

  static async queryData(sourceId: string, query?: DataQuery): Promise<DataSet> {
    return this.queryDataSource(sourceId, query || {});
  }

  static async evaluateExpression(sourceId: string, expression: string, context?: any): Promise<any> {
    return invoke('evaluate_expression', { source_id: sourceId, expression, context });
  }

  static async getAvailableTypes(): Promise<DataSourceTypeInfo[]> {
    return invoke('get_available_data_source_types');
  }

  static async getSchema(sourceId: string): Promise<DataSchema> {
    return invoke('get_data_source_schema', { source_id: sourceId });
  }

  static async getConfigSchema(providerType: string): Promise<any> {
    return invoke('get_config_schema', { provider_type: providerType });
  }

  static async getDefaultConfig(providerType: string): Promise<any> {
    return invoke('get_default_config', { provider_type: providerType });
  }

  static async validateConfig(providerType: string, config: any): Promise<any> {
    return invoke('validate_config', { provider_type: providerType, config });
  }

  static async captureDataPreview(config: any, sql: string): Promise<any> {
    return this.executeDatabasePreview(config, sql, 50);
  }

  static async validateDataSourceBeforeSave(request: SaveDataSourceRequest): Promise<DataSourceValidation> {
    try {
      console.log('🔍 开始验证数据源保存前检查');
      console.log('🔍 请求配置:', request.config);
      console.log('🔍 数据库类型:', request.config.database_type);
      
      // 验证连接
      const connectionTest = await this.testDatabaseConnection(request.config);
      
      // 验证SQL
      const sqlValidation = await this.validateSqlSyntax(request.sql, request.config.database_type);
      
      // 安全检查
      const securityCheck = await this.performSecurityCheck(request.config, request.sql);
      
      return {
        connection_valid: connectionTest.success,
        sql_valid: sqlValidation.valid,
        security_passed: securityCheck.is_safe,
        performance_acceptable: true,
        warnings: [
          ...(sqlValidation.warnings || []),
          ...(securityCheck.warnings || [])
        ],
        errors: []
      };
    } catch (error) {
      return {
        connection_valid: false,
        sql_valid: false,
        security_passed: false,
        performance_acceptable: false,
        warnings: [],
        errors: [String(error)]
      };
    }
  }

  // 安全检查
  static async performSecurityCheck(_config: any, sql: string) {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // 基础安全检查
    const dangerousPatterns = [
      /drop\s+table/i, /truncate\s+table/i, /delete\s+from/i,
      /update\s+.*set/i, /insert\s+into/i, /alter\s+table/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        issues.push('包含可能危险的SQL操作');
        break;
      }
    }
    
    return {
      is_safe: issues.length === 0,
      security_issues: issues,
      warnings
    };
  }
}

// 工具函数
export function isDataSourceConnected(source: DataSourceInfo): boolean {
  return source.status === 'active';
}

export function handleDataSourceError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return '数据源操作失败，请检查配置或网络连接';
}
