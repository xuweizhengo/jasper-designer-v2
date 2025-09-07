// === 数据上下文管理器实现 ===
import { createSignal } from 'solid-js';
import { DataSourceAPI } from '../api/data-sources';
import { expressionEngine } from '../utils/expression-engine';
import type { 
  DataContext, 
  DataContextManager, 
  DataSourceType,
  DataSourceStatus,
  EvaluationResult,
  ExpressionValidationResult,
  DataField 
} from '../types/data-binding';

export class DataContextManagerImpl implements DataContextManager {
  private context = createSignal<DataContext | null>(null);
  private subscribers: Array<(context: DataContext | null) => void> = [];

  constructor() {
    // 初始化时设置空上下文
    this.context[1](null);
  }

  getCurrentContext(): DataContext | null {
    return this.context[0]();
  }

  async setActiveDataSource(dataSourceId: string): Promise<void> {
    try {
      // 获取数据源信息
      const dataSources = await DataSourceAPI.listDataSources();
      const dataSource = dataSources.find(ds => ds.id === dataSourceId);
      
      if (!dataSource) {
        throw new Error(`数据源不存在: ${dataSourceId}`);
      }

      console.log('🔍 找到数据源:', dataSource);

      // 兼容性处理：处理后端可能返回的不同字段名
      const providerType = (dataSource as any).providerType || 
                          (dataSource as any).type_name || 
                          'json'; // 兜底值

      console.log('🔍 推断的 providerType:', providerType);

      // 获取数据预览
      const previewData = await DataSourceAPI.getPreview(dataSourceId, undefined, 1);
      console.log('🔍 预览数据:', previewData);
      
      // 获取数据源schema信息
      const schema = await DataSourceAPI.getSchema(dataSourceId);
      console.log('🔍 Schema信息:', schema);
      
      // 构建字段信息
      const fields: DataField[] = schema.columns.map(col => ({
        name: col.name,
        displayName: col.description || col.name,
        type: this.mapDataType(col.data_type),
        nullable: col.nullable,
        sample: col.default_value
      }));

      // 设置新的数据上下文
      const newContext: DataContext = {
        dataSource: {
          id: dataSourceId,
          type: this.inferDataSourceType(providerType),
          name: dataSource.name,
          status: this.mapDataSourceStatus(dataSource.status)
        },
        currentRecord: {
          index: 0,
          total: (previewData as any).totalCount ?? (previewData as any).total_rows ?? (previewData as any).total_count ?? 0,
          data: previewData.rows[0] || {}
        },
        fields
      };

      console.log('✅ 创建新的数据上下文:', newContext);

      this.context[1](newContext);
      // 持久化当前激活数据源ID，便于下次启动自动恢复
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('jasper.activeDataSourceId', dataSourceId);
        }
      } catch (e) {
        console.warn('无法持久化激活数据源ID:', e);
      }
      this.notifySubscribers(newContext);
      
    } catch (error) {
      console.error('设置数据源失败:', error);
      
      // 设置错误状态
      const errorContext: DataContext = {
        dataSource: {
          id: dataSourceId,
          type: 'json',
          name: '未知数据源',
          status: 'error'
        },
        currentRecord: {
          index: 0,
          total: 0,
          data: {}
        },
        fields: [],
        error: {
          type: 'system',
          message: error instanceof Error ? error.message : '数据源加载失败',
          details: error
        }
      };
      
      this.context[1](errorContext);
      this.notifySubscribers(errorContext);
    }
  }

  async navigateToRecord(index: number): Promise<boolean> {
    const context = this.getCurrentContext();
    if (!context || index < 0 || index >= context.currentRecord.total) {
      return false;
    }

    try {
      // 获取指定记录的数据
      const data = await DataSourceAPI.queryData(context.dataSource.id, {
        limit: 1,
        offset: index
      });

      if (data.rows.length === 0) {
        return false;
      }

      // 更新当前记录
      const updatedContext = {
        ...context,
        currentRecord: {
          ...context.currentRecord,
          index,
          data: data.rows[0]
        }
      };

      this.context[1](updatedContext);
      this.notifySubscribers(updatedContext);
      return true;
      
    } catch (error) {
      console.error('导航到记录失败:', error);
      return false;
    }
  }

  async navigateNext(): Promise<boolean> {
    const context = this.getCurrentContext();
    if (!context) return false;
    
    return this.navigateToRecord(context.currentRecord.index + 1);
  }

  async navigatePrevious(): Promise<boolean> {
    const context = this.getCurrentContext();
    if (!context) return false;
    
    return this.navigateToRecord(context.currentRecord.index - 1);
  }

  async evaluateExpression(expression: string): Promise<EvaluationResult> {
    const context = this.getCurrentContext();
    return await expressionEngine.evaluateExpression(expression, context);
  }

  validateExpression(expression: string): ExpressionValidationResult {
    const context = this.getCurrentContext();
    const result = expressionEngine.validateExpression(expression, context);
    
    return {
      valid: result.valid,
      ...(result.error && { error: result.error }),
      ...(result.suggestions && { suggestions: result.suggestions })
    };
  }

  getFieldSuggestions(partialExpression: string): string[] {
    const context = this.getCurrentContext();
    return expressionEngine.getFieldSuggestions(partialExpression, context);
  }

  subscribe(callback: (context: DataContext | null) => void): () => void {
    this.subscribers.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  destroy(): void {
    this.subscribers.length = 0;
    this.context[1](null);
  }

  private notifySubscribers(context: DataContext | null): void {
    this.subscribers.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('数据上下文订阅回调错误:', error);
      }
    });
  }

  private inferDataSourceType(providerType: string | undefined): DataSourceType {
    if (!providerType) {
      console.warn('providerType is undefined, defaulting to json');
      return 'json';
    }
    
    switch (providerType.toLowerCase()) {
      case 'json': return 'json';
      case 'excel': return 'excel';
      case 'sql': return 'sql';
      case 'xml': return 'xml';
      case 'csv': return 'csv';
      default: return 'json';
    }
  }

  private mapDataType(dataType: any): DataField['type'] {
    switch (dataType) {
      case 'String': return 'string';
      case 'Number': return 'number';
      case 'Boolean': return 'boolean';
      case 'Date':
      case 'DateTime': return 'date';
      case 'Array': return 'array';
      case 'Object': return 'object';
      default: return 'string';
    }
  }

  private mapDataSourceStatus(status: string | undefined): DataSourceStatus {
    if (!status) {
      console.warn('status is undefined, defaulting to empty');
      return 'empty';
    }

    // 兼容多种状态格式
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active': 
      case 'connected':
      case 'ready': 
        return 'ready';
      case 'error': 
      case 'failed':
        return 'error';
      case 'loading':
      case 'processing':
      case 'connecting':
        return 'loading';
      case 'disabled': 
      case 'disconnected':
      case 'inactive':
        return 'empty';
      default:
        console.warn(`Unknown status: ${status}, defaulting to empty`);
        return 'empty';
    }
  }
}

// 创建全局数据上下文管理器实例
export const dataContextManager = new DataContextManagerImpl();
