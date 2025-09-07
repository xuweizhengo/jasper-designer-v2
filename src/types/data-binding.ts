// === 数据绑定核心类型定义 ===

// 数据源类型
export type DataSourceType = 'json' | 'excel' | 'sql' | 'xml' | 'csv';

// 预览模式
export type PreviewMode = 'design' | 'preview';

// 数据源状态 - 重新设计为通用的数据状态而非连接状态
export type DataSourceStatus = 'ready' | 'loading' | 'error' | 'empty';

// 数据字段信息
export interface DataField {
  name: string;
  displayName?: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  sample?: any;
}

// 数据上下文接口
export interface DataContext {
  // 数据源信息
  dataSource: {
    id: string;
    type: DataSourceType;
    name: string;
    status: DataSourceStatus;
  };
  
  // 当前记录信息
  currentRecord: {
    index: number;
    total: number;
    data: Record<string, any>;
  };
  
  // 可用字段
  fields: DataField[];
  
  // 错误信息
  error?: {
    type: 'parsing' | 'validation' | 'format' | 'permission' | 'network' | 'system';
    message: string;
    details?: any;
  };
}

// 表达式求值结果
export interface EvaluationResult {
  success: boolean;
  value?: any;
  error?: string;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'object';
}

// 表达式验证结果
export interface ExpressionValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
}

// 数据上下文管理器接口
export interface DataContextManager {
  // 当前上下文
  getCurrentContext(): DataContext | null;
  
  // 设置活跃数据源
  setActiveDataSource(dataSourceId: string): Promise<void>;
  
  // 记录导航
  navigateToRecord(index: number): Promise<boolean>;
  navigateNext(): Promise<boolean>;
  navigatePrevious(): Promise<boolean>;
  
  // 表达式相关
  evaluateExpression(expression: string): Promise<EvaluationResult>;
  validateExpression(expression: string): ExpressionValidationResult;
  getFieldSuggestions(partialExpression: string): string[];
  
  // 状态管理
  subscribe(callback: (context: DataContext | null) => void): () => void;
  destroy(): void;
}

// 数据源上下文面板接口
export interface DataSourceContextPanel {
  readonly type: DataSourceType;
  
  // 渲染面板UI
  render(): Element;
  
  // 数据操作
  getCurrentRecord(): Record<string, any>;
  getAvailableFields(): DataField[];
  
  // 导航控制
  canNavigateNext(): boolean;
  canNavigatePrevious(): boolean;
  navigateNext(): Promise<boolean>;
  navigatePrevious(): Promise<boolean>;
  navigateToRecord(index: number): Promise<boolean>;
  
  // 错误处理
  getConnectionStatus(): DataSourceStatus;
  getError(): string | null;
}