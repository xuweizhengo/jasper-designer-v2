// === 数据库数据源创建向导 ===
import { createSignal, createMemo, Show, For } from 'solid-js';
import { 
  DataSourceAPI, 
  DatabaseConfig, 
  DatabaseSchema,
  ConnectionTestResult,
  QueryResult,
  ValidationResult,
  SaveDataSourceRequest,
  SaveDataSourceResponse,
  DataSourceValidation,
  DataPreview
} from '../../api/data-sources';
import SQLQueryBuilder from '../QueryBuilder/SQLQueryBuilder';
import './DatabaseSourceWizard.css';

export type DatabaseWizardStep = 'connection' | 'schema' | 'query' | 'preview';

interface DatabaseWizardProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface DatabaseWizardState {
  currentStep: DatabaseWizardStep;
  name: string;
  description: string;
  tags: string[];
  config: DatabaseConfig;
  schema: DatabaseSchema | null;
  selectedTables: string[];
  generatedSQL: string;
  customSQL: string;
  useCustomSQL: boolean;
  testResult: ConnectionTestResult | null;
  queryResult: QueryResult | null;
  validation: ValidationResult | null;
  dataSourceValidation: DataSourceValidation | null;
  dataPreview: DataPreview | null;
  loading: boolean;
  errors: string[];
  isSaving: boolean;
  saveResult: SaveDataSourceResponse | null;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  database_type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: '',
  username: '',
  password: '',
  ssl_enabled: false,
  max_connections: 10,
  min_connections: 1,
  connection_timeout: 30,
  idle_timeout: 600,
  sql: '',
  use_custom_sql: false,
  query_timeout: 60,
  default_limit: 1000,
  enable_caching: true,
  cache_ttl: 300,
};

export function DatabaseSourceWizard(props: DatabaseWizardProps) {
  const [state, setState] = createSignal<DatabaseWizardState>({
    currentStep: 'connection',
    name: '',
    description: '',
    tags: [],
    config: { ...DEFAULT_CONFIG },
    schema: null,
    selectedTables: [],
    generatedSQL: '',
    customSQL: '',
    useCustomSQL: false,
    testResult: null,
    queryResult: null,
    validation: null,
    dataSourceValidation: null,
    dataPreview: null,
    loading: false,
    errors: [],
    isSaving: false,
    saveResult: null,
  });

  // 计算步骤完成状态
  const stepStatus = createMemo(() => {
    const s = state();
    return {
      connection: s.testResult?.success || false,
      schema: s.schema !== null && s.selectedTables.length > 0,
      query: s.customSQL.trim().length > 0,
      preview: s.name.trim().length > 0 && s.customSQL.trim().length > 0,
    };
  });

  // 更新状态的辅助函数
  const updateState = (updates: Partial<DatabaseWizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (updates: Partial<DatabaseConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  };

  // === Step 1: 连接配置 ===
  const handleTestConnection = async () => {
    updateState({ loading: true, errors: [] });
    
    try {
      const result = await DataSourceAPI.testDatabaseConnection(state().config);
      updateState({ 
        testResult: result, 
        loading: false,
        errors: result.success ? [] : [result.message]
      });
      
      if (result.success) {
        // 自动进入下一步
        setTimeout(() => {
          updateState({ currentStep: 'schema' });
          loadDatabaseSchema();
        }, 1000);
      }
    } catch (error) {
      updateState({ 
        loading: false,
        errors: [`连接测试失败: ${error}`],
        testResult: { success: false, message: String(error) }
      });
    }
  };

  // === Step 2: 架构加载 ===
  const loadDatabaseSchema = async () => {
    updateState({ loading: true, errors: [] });
    
    try {
      const schema = await DataSourceAPI.loadDatabaseSchema(state().config);
      updateState({ 
        schema, 
        loading: false,
        errors: []
      });
    } catch (error) {
      updateState({ 
        loading: false,
        errors: [`架构加载失败: ${error}`],
        schema: null
      });
    }
  };

  // === Step 4: 预览和保存处理函数 ===
  const handleValidateDataSource = async () => {
    updateState({ loading: true, errors: [] });
    
    try {
      const request: SaveDataSourceRequest = {
        name: state().name,
        config: state().config,
        selected_tables: state().selectedTables,
        sql: state().customSQL,
        description: state().description,
        tags: state().tags,
        validate_before_save: true
      };
      
      const validation = await DataSourceAPI.validateDataSourceBeforeSave(request);
      updateState({ 
        dataSourceValidation: validation,
        loading: false,
        errors: validation.errors
      });
      
      return validation;
    } catch (error) {
      updateState({
        loading: false,
        errors: [`验证失败: ${error}`]
      });
      return null;
    }
  };

  const handlePreviewData = async () => {
    updateState({ loading: true, errors: [] });
    
    try {
      const preview = await DataSourceAPI.captureDataPreview(
        state().config, 
        state().customSQL
      );
      
      updateState({ 
        dataPreview: preview,
        loading: false 
      });
      
      return preview;
    } catch (error) {
      updateState({
        loading: false,
        errors: [`数据预览失败: ${error}`]
      });
      return null;
    }
  };

  const handleSaveDataSource = async () => {
    updateState({ isSaving: true, errors: [] });
    
    try {
      // 添加调试日志
      console.log('🔍 DatabaseWizard 保存前状态:', {
        selectedTables: state().selectedTables,
        selectedTables_type: typeof state().selectedTables,
        selectedTables_length: state().selectedTables?.length,
        customSQL_length: state().customSQL?.length,
        name: state().name,
      });
      
      const request: SaveDataSourceRequest = {
        name: state().name,
        config: state().config,
        selected_tables: state().selectedTables,
        sql: state().customSQL,
        description: state().description,
        tags: state().tags,
        validate_before_save: true,
        capture_schema_snapshot: true,
        capture_data_preview: true,
        preview_row_limit: 10
      };
      
      console.log('🔍 构建的 SaveDataSourceRequest:', {
        selected_tables: request.selected_tables,
        selected_tables_type: typeof request.selected_tables,
        selected_tables_length: request.selected_tables?.length,
      });
      
      const result = await DataSourceAPI.saveDataSource(request);
      
      updateState({ 
        saveResult: result,
        isSaving: false 
      });
      
      if (result.success) {
        // 延迟调用成功回调，让用户看到成功消息
        setTimeout(() => {
          props.onSuccess();
        }, 2000);
      }
      
      return result;
    } catch (error) {
      updateState({
        isSaving: false,
        errors: [`保存失败: ${error}`]
      });
      return null;
    }
  };

  // 步骤导航
  const goToStep = (step: DatabaseWizardStep) => {
    updateState({ currentStep: step });
  };

  const handleBack = () => {
    const s = state();
    switch (s.currentStep) {
      case 'schema':
        updateState({ currentStep: 'connection' });
        break;
      case 'query':
        updateState({ currentStep: 'schema' });
        break;
      case 'preview':
        updateState({ currentStep: 'query' });
        break;
      default:
        props.onBack();
    }
  };

  return (
    <div class="database-wizard">
      {/* 向导头部 */}
      <div class="wizard-header">
        <button class="back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <div class="wizard-title">
          <h3>🗄️ 创建数据库数据源</h3>
          <p>连接数据库并配置查询语句</p>
        </div>
      </div>

      {/* 进度指示器 */}
      <div class="wizard-progress">
        <div 
          class={`progress-step ${state().currentStep === 'connection' ? 'active' : ''} ${stepStatus().connection ? 'completed' : ''}`}
          onClick={() => goToStep('connection')}
        >
          <div class="step-indicator">1</div>
          <div class="step-info">
            <div class="step-title">数据库连接</div>
            <div class="step-description">配置连接信息</div>
          </div>
        </div>

        <div 
          class={`progress-step ${state().currentStep === 'schema' ? 'active' : ''} ${stepStatus().schema ? 'completed' : ''}`}
          onClick={() => stepStatus().connection && goToStep('schema')}
        >
          <div class="step-indicator">2</div>
          <div class="step-info">
            <div class="step-title">表结构</div>
            <div class="step-description">选择数据表</div>
          </div>
        </div>

        <div 
          class={`progress-step ${state().currentStep === 'query' ? 'active' : ''} ${stepStatus().query ? 'completed' : ''}`}
          onClick={() => stepStatus().schema && goToStep('query')}
        >
          <div class="step-indicator">3</div>
          <div class="step-info">
            <div class="step-title">查询构建</div>
            <div class="step-description">编写SQL查询</div>
          </div>
        </div>

        <div 
          class={`progress-step ${state().currentStep === 'preview' ? 'active' : ''} ${stepStatus().preview ? 'completed' : ''}`}
          onClick={() => stepStatus().query && goToStep('preview')}
        >
          <div class="step-indicator">4</div>
          <div class="step-info">
            <div class="step-title">预览保存</div>
            <div class="step-description">测试并保存</div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div class="wizard-content">
        <Show when={state().errors.length > 0}>
          <div class="error-messages">
            <For each={state().errors}>
              {(error) => <div class="error-message">❌ {error}</div>}
            </For>
          </div>
        </Show>

        <Show when={state().loading}>
          <div class="loading-overlay">
            <div class="loading-spinner">⏳</div>
            <div class="loading-text">处理中...</div>
          </div>
        </Show>

        {/* Step 1: 连接配置 */}
        <Show when={state().currentStep === 'connection'}>
          <div class="connection-step">
            <div class="step-header">
              <h4>🔌 数据库连接配置</h4>
              <p>请填写数据库连接信息</p>
            </div>
            
            <div class="form-section">
              <div class="form-group">
                <label>数据库类型</label>
                <select 
                  value={state().config.database_type} 
                  onChange={(e) => {
                    const dbType = e.currentTarget.value as DatabaseConfig['database_type'];
                    const defaultPort = {
                      'mysql': 3306,
                      'postgresql': 5432,
                      'sqlserver': 1433,
                      'oracle': 1521,
                      'sqlite': 0
                    }[dbType];
                    
                    updateConfig({ 
                      database_type: dbType,
                      port: defaultPort
                    });
                  }}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="sqlserver">SQL Server</option>
                  <option value="oracle">Oracle</option>
                </select>
              </div>

              <Show when={state().config.database_type !== 'sqlite'}>
                <div class="form-row">
                  <div class="form-group flex-2">
                    <label>主机地址</label>
                    <input 
                      type="text" 
                      value={state().config.host}
                      onChange={(e) => updateConfig({ host: e.currentTarget.value })}
                      placeholder="localhost"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>端口</label>
                    <input 
                      type="number" 
                      value={state().config.port}
                      onChange={(e) => updateConfig({ port: parseInt(e.currentTarget.value) || 3306 })}
                    />
                  </div>
                </div>
              </Show>

              <Show when={state().config.database_type === 'sqlite'}>
                <div class="form-group">
                  <label>数据库文件路径</label>
                  <input 
                    type="text" 
                    value={state().config.database}
                    onChange={(e) => updateConfig({ database: e.currentTarget.value })}
                    placeholder="/path/to/database.db"
                  />
                </div>
              </Show>

              <Show when={state().config.database_type !== 'sqlite'}>
                <div class="form-group">
                  <label>数据库名</label>
                  <input 
                    type="text" 
                    value={state().config.database}
                    onChange={(e) => updateConfig({ database: e.currentTarget.value })}
                    placeholder="myapp_production"
                  />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>用户名</label>
                    <input 
                      type="text" 
                      value={state().config.username}
                      onChange={(e) => updateConfig({ username: e.currentTarget.value })}
                    />
                  </div>
                  <div class="form-group">
                    <label>密码</label>
                    <input 
                      type="password" 
                      value={state().config.password}
                      onChange={(e) => updateConfig({ password: e.currentTarget.value })}
                    />
                  </div>
                </div>
              </Show>

              <div class="connection-test">
                <button 
                  class="test-connection-btn"
                  onClick={handleTestConnection}
                  disabled={state().loading}
                >
                  {state().loading ? '⏳ 测试中...' : '🔗 测试连接'}
                </button>

                <Show when={state().testResult}>
                  <div class={`test-result ${state().testResult?.success ? 'success' : 'error'}`}>
                    <div class="result-message">
                      <span class="result-icon">
                        {state().testResult?.success ? '✅' : '❌'}
                      </span>
                      <span class="result-text">{state().testResult?.message}</span>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Step 2: 架构浏览 */}
        <Show when={state().currentStep === 'schema'}>
          <div class="schema-step">
            <div class="step-header">
              <h4>🗂️ 数据库表结构</h4>
              <p>选择要查询的数据表和字段</p>
            </div>
            
            <Show when={!state().schema && !state().loading}>
              <div class="schema-loading">
                <button class="load-schema-btn" onClick={loadDatabaseSchema}>
                  🔄 加载表结构
                </button>
                <p class="loading-hint">点击按钮加载数据库的表结构信息</p>
              </div>
            </Show>

            <Show when={state().schema}>
              <div class="schema-content">
                <div class="schema-summary">
                  <div class="summary-item">
                    <span class="summary-label">数据库:</span>
                    <span class="summary-value">{state().schema?.database_name}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">表数量:</span>
                    <span class="summary-value">{state().schema?.schemas[0]?.tables?.length || 0}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">视图数量:</span>
                    <span class="summary-value">{state().schema?.schemas[0]?.views?.length || 0}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">加载时间:</span>
                    <span class="summary-value">{new Date(state().schema?.loaded_at || '').toLocaleString('zh-CN')}</span>
                  </div>
                </div>

                <div class="tables-section">
                  <h5>📋 数据表列表</h5>
                  <div class="tables-grid">
                    <For each={state().schema?.schemas[0]?.tables || []}>
                      {(table) => (
                        <TableCard 
                          table={table}
                          selected={state().selectedTables.includes(table.name)}
                          onToggle={(tableName, selected) => {
                            const currentSelected = state().selectedTables;
                            if (selected) {
                              updateState({ selectedTables: [...currentSelected, tableName] });
                            } else {
                              updateState({ selectedTables: currentSelected.filter(name => name !== tableName) });
                            }
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>

                <Show when={state().schema?.schemas[0]?.views && state().schema!.schemas[0]!.views!.length > 0}>
                  <div class="views-section">
                    <h5>👁️ 数据视图列表</h5>
                    <div class="views-list">
                      <For each={state().schema?.schemas[0]?.views || []}>
                        {(view) => (
                          <div class="view-item">
                            <div class="view-info">
                              <span class="view-name">{view.name}</span>
                              <span class="view-schema">{view.schema}</span>
                            </div>
                            <Show when={view.comment}>
                              <span class="view-comment">{view.comment}</span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>
          </div>
        </Show>

        {/* Step 3: 查询构建 */}
        <Show when={state().currentStep === 'query'}>
          <SQLQueryBuilder
            selectedTables={state().selectedTables}
            schema={state().schema}
            config={state().config}
            sql={state().customSQL}
            onSQLChange={(sql) => updateState({ customSQL: sql })}
            onQueryResult={(result) => updateState({ queryResult: result })}
            onValidationChange={(validation) => updateState({ validation })}
          />
        </Show>

        {/* Step 4: 预览保存 */}
        <Show when={state().currentStep === 'preview'}>
          <PreviewAndSaveStep 
            state={state()}
            onStateUpdate={updateState}
            onSave={handleSaveDataSource}
            onValidate={handleValidateDataSource}
            onPreviewData={handlePreviewData}
          />
        </Show>
      </div>

      {/* 向导控制按钮 */}
      <div class="wizard-controls">
        <div class="control-buttons">
          <button 
            class="control-btn back-btn" 
            onClick={handleBack}
          >
            ← 上一步
          </button>
          
          <button 
            class="control-btn next-btn" 
            onClick={() => {
              const s = state();
              if (s.currentStep === 'connection' && s.testResult?.success) {
                updateState({ currentStep: 'schema' });
                if (!s.schema) loadDatabaseSchema();
              } else if (s.currentStep === 'schema') {
                updateState({ currentStep: 'query' });
              } else if (s.currentStep === 'query') {
                updateState({ currentStep: 'preview' });
              }
            }}
            disabled={state().loading}
          >
            下一步 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default DatabaseSourceWizard;

// === 表格卡片组件 ===
interface TableCardProps {
  table: any; // TableInfo type from backend
  selected: boolean;
  onToggle: (tableName: string, selected: boolean) => void;
}

function TableCard(props: TableCardProps) {
  const formatRowCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getDataTypeIcon = (dataType: string) => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('number') || type.includes('decimal')) return '🔢';
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) return '📝';
    if (type.includes('date') || type.includes('time')) return '📅';
    if (type.includes('bool')) return '✅';
    return '📋';
  };

  return (
    <div class={`table-card ${props.selected ? 'selected' : ''}`}>
      <div class="table-card-header">
        <div class="table-card-title">
          <label class="table-checkbox">
            <input
              type="checkbox"
              checked={props.selected}
              onChange={(e) => props.onToggle(props.table.name, e.currentTarget.checked)}
            />
            <span class="table-name">📋 {props.table.name}</span>
          </label>
        </div>
        <div class="table-card-stats">
          <span class="row-count" title="预估行数">
            {formatRowCount(props.table.row_count_estimate)} 行
          </span>
          <span class="table-size" title="预估大小">
            {props.table.size_estimate}
          </span>
        </div>
      </div>

      <Show when={props.table.comment}>
        <div class="table-comment">{props.table.comment}</div>
      </Show>

      <div class="table-columns">
        <h6>字段 ({props.table.columns?.length || 0})</h6>
        <div class="columns-preview">
          <For each={(props.table.columns || []).slice(0, 6)}>
            {(column) => (
              <div class="column-item">
                <span class="column-icon">{getDataTypeIcon(column.data_type)}</span>
                <span class="column-name">{column.name}</span>
                <span class="column-type">{column.data_type}</span>
                <Show when={column.is_primary_key}>
                  <span class="pk-badge" title="主键">🔑</span>
                </Show>
                <Show when={column.is_foreign_key}>
                  <span class="fk-badge" title="外键">🔗</span>
                </Show>
              </div>
            )}
          </For>
          <Show when={(props.table.columns?.length || 0) > 6}>
            <div class="more-columns">
              +{(props.table.columns?.length || 0) - 6} 个字段...
            </div>
          </Show>
        </div>
      </div>

      <Show when={props.table.indexes && props.table.indexes.length > 0}>
        <div class="table-indexes">
          <h6>索引 ({props.table.indexes.length})</h6>
          <div class="indexes-list">
            <For each={props.table.indexes.slice(0, 3)}>
              {(index) => (
                <span class={`index-badge ${index.unique ? 'unique' : ''}`} title={index.columns.join(', ')}>
                  {index.unique ? '🔐' : '📇'} {index.name}
                </span>
              )}
            </For>
            <Show when={props.table.indexes.length > 3}>
              <span class="more-indexes">+{props.table.indexes.length - 3}</span>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.table.foreign_keys && props.table.foreign_keys.length > 0}>
        <div class="table-relations">
          <h6>关联 ({props.table.foreign_keys.length})</h6>
          <div class="relations-list">
            <For each={props.table.foreign_keys.slice(0, 2)}>
              {(fk) => (
                <span class="relation-badge" title={`${fk.column_name} → ${fk.referenced_table}.${fk.referenced_column}`}>
                  🔗 {fk.referenced_table}
                </span>
              )}
            </For>
            <Show when={props.table.foreign_keys.length > 2}>
              <span class="more-relations">+{props.table.foreign_keys.length - 2}</span>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

// === 预览和保存步骤组件 ===
interface PreviewAndSaveStepProps {
  state: DatabaseWizardState;
  onStateUpdate: (updates: Partial<DatabaseWizardState>) => void;
  onSave: () => Promise<SaveDataSourceResponse | null>;
  onValidate: () => Promise<DataSourceValidation | null>;
  onPreviewData: () => Promise<DataPreview | null>;
}

function PreviewAndSaveStep(props: PreviewAndSaveStepProps) {
  return (
    <div class="preview-step">
      <div class="step-header">
        <h4>👁️ 预览和保存</h4>
        <p>验证配置、预览数据并保存数据源</p>
      </div>

      {/* 基本信息配置 */}
      <div class="basic-info-section">
        <h5>📝 基本信息</h5>
        
        <div class="form-row">
          <div class="form-group flex-2">
            <label>数据源名称 *</label>
            <input 
              type="text" 
              value={props.state.name}
              onInput={(e) => props.onStateUpdate({ name: e.currentTarget.value })}
              placeholder="输入数据源名称..."
              required
            />
          </div>
          
          <div class="form-group flex-1">
            <label>标签</label>
            <input 
              type="text" 
              value={props.state.tags.join(', ')}
              onInput={(e) => {
                const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t);
                props.onStateUpdate({ tags });
              }}
              placeholder="标签1, 标签2"
            />
          </div>
        </div>

        <div class="form-group">
          <label>描述</label>
          <textarea 
            value={props.state.description}
            onInput={(e) => props.onStateUpdate({ description: e.currentTarget.value })}
            placeholder="描述这个数据源的用途..."
            rows="3"
          />
        </div>
      </div>

      {/* 配置摘要 */}
      <ConfigurationSummary state={props.state} />

      {/* 验证状态 */}
      <ValidationStatus 
        validation={props.state.dataSourceValidation}
        onValidate={props.onValidate}
        loading={props.state.loading}
      />

      {/* 数据预览 */}
      <DataPreviewSection 
        preview={props.state.dataPreview}
        onPreviewData={props.onPreviewData}
        loading={props.state.loading}
      />

      {/* 保存操作 */}
      <SaveOperationSection 
        state={props.state}
        saveResult={props.state.saveResult}
        onSave={props.onSave}
        isSaving={props.state.isSaving}
        canSave={canSave(props.state)}
      />
    </div>
  );
}

// === 配置摘要组件 ===
function ConfigurationSummary(props: { state: DatabaseWizardState }) {
  return (
    <div class="config-summary">
      <h5>⚙️ 配置摘要</h5>
      
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">数据库类型:</span>
          <span class="summary-value">{props.state.config.database_type.toUpperCase()}</span>
        </div>
        
        <div class="summary-item">
          <span class="summary-label">连接地址:</span>
          <span class="summary-value">{props.state.config.host}:{props.state.config.port}</span>
        </div>
        
        <div class="summary-item">
          <span class="summary-label">数据库:</span>
          <span class="summary-value">{props.state.config.database}</span>
        </div>
        
        <div class="summary-item">
          <span class="summary-label">用户名:</span>
          <span class="summary-value">{props.state.config.username}</span>
        </div>
        
        <div class="summary-item">
          <span class="summary-label">选中表:</span>
          <span class="summary-value">{props.state.selectedTables.length} 个表</span>
        </div>
        
        <div class="summary-item">
          <span class="summary-label">查询长度:</span>
          <span class="summary-value">{props.state.customSQL.length} 字符</span>
        </div>
      </div>
      
      <div class="sql-preview">
        <h6>SQL查询预览:</h6>
        <pre class="sql-code">{props.state.customSQL.slice(0, 200)}{props.state.customSQL.length > 200 ? '...' : ''}</pre>
      </div>
    </div>
  );
}

// === 验证状态组件 ===
function ValidationStatus(props: {
  validation: DataSourceValidation | null;
  onValidate: () => Promise<DataSourceValidation | null>;
  loading: boolean;
}) {
  return (
    <div class="validation-section">
      <div class="section-header">
        <h5>✅ 验证状态</h5>
        <button 
          class="validate-btn"
          onClick={props.onValidate}
          disabled={props.loading}
        >
          {props.loading ? '⏳ 验证中...' : '🔍 开始验证'}
        </button>
      </div>

      <Show when={props.validation}>
        <div class="validation-results">
          <div class="validation-checks">
            <ValidationCheck 
              label="数据库连接"
              status={props.validation?.connection_valid ? 'success' : 'error'}
              icon={props.validation?.connection_valid ? '✅' : '❌'}
            />
            
            <ValidationCheck 
              label="SQL语法"
              status={props.validation?.sql_valid ? 'success' : 'error'}
              icon={props.validation?.sql_valid ? '✅' : '❌'}
            />
            
            <ValidationCheck 
              label="安全检查"
              status={props.validation?.security_passed ? 'success' : 'warning'}
              icon={props.validation?.security_passed ? '✅' : '⚠️'}
            />
            
            <ValidationCheck 
              label="性能评估"
              status={props.validation?.performance_acceptable ? 'success' : 'info'}
              icon={props.validation?.performance_acceptable ? '✅' : 'ℹ️'}
            />
          </div>

          <Show when={props.validation && props.validation.warnings.length > 0}>
            <div class="validation-warnings">
              <h6>⚠️ 警告</h6>
              <For each={props.validation!.warnings || []}>
                {(warning) => <div class="warning-item">{warning}</div>}
              </For>
            </div>
          </Show>

          <Show when={props.validation && props.validation.errors.length > 0}>
            <div class="validation-errors">
              <h6>❌ 错误</h6>
              <For each={props.validation!.errors || []}>
                {(error) => <div class="error-item">{error}</div>}
              </For>
            </div>
          </Show>

          <Show when={props.validation && props.validation.suggestions && props.validation.suggestions.length > 0}>
            <div class="validation-suggestions">
              <h6>💡 建议</h6>
              <For each={props.validation!.suggestions || []}>
                {(suggestion) => <div class="suggestion-item">{suggestion}</div>}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

// === 验证检查项组件 ===
function ValidationCheck(props: {
  label: string;
  status: 'success' | 'error' | 'warning' | 'info';
  icon: string;
}) {
  return (
    <div class={`validation-check ${props.status}`}>
      <span class="check-icon">{props.icon}</span>
      <span class="check-label">{props.label}</span>
      <span class={`check-status ${props.status}`}>
        {props.status === 'success' ? '通过' : 
         props.status === 'error' ? '失败' :
         props.status === 'warning' ? '警告' : '信息'}
      </span>
    </div>
  );
}

// === 数据预览组件 ===
function DataPreviewSection(props: {
  preview: DataPreview | null;
  onPreviewData: () => Promise<DataPreview | null>;
  loading: boolean;
}) {
  return (
    <div class="data-preview-section">
      <div class="section-header">
        <h5>📊 数据预览</h5>
        <button 
          class="preview-btn"
          onClick={props.onPreviewData}
          disabled={props.loading}
        >
          {props.loading ? '⏳ 加载中...' : '👁️ 预览数据'}
        </button>
      </div>

      <Show when={props.preview}>
        <div class="preview-results">
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-label">样本行数:</span>
              <span class="stat-value">{props.preview?.sample_data.length || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">预估总行数:</span>
              <span class="stat-value">{props.preview?.total_estimated_rows.toLocaleString() || '未知'}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">执行时间:</span>
              <span class="stat-value">{props.preview?.execution_stats.execution_time || 0}ms</span>
            </div>
          </div>

          <div class="preview-data">
            <Show when={props.preview && props.preview.sample_data.length > 0}>
              <DataTable data={props.preview!.sample_data || []} />
            </Show>
            <Show when={!props.preview || props.preview.sample_data.length === 0}>
              <div class="no-data">没有查询到数据</div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

// === 数据表格组件 ===
function DataTable(props: { data: any[] }) {
  if (!props.data || props.data.length === 0) {
    return <div class="no-data">没有数据</div>;
  }

  const columns = Object.keys(props.data[0]);
  
  return (
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <For each={columns}>
              {(column) => <th>{column}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.data.slice(0, 10)}>
            {(row) => (
              <tr>
                <For each={columns}>
                  {(column) => (
                    <td>{formatCellValue(row[column])}</td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      
      <Show when={props.data.length > 10}>
        <div class="table-footer">
          显示前10行，共 {props.data.length} 行数据
        </div>
      </Show>
    </div>
  );
}

// === 保存操作组件 ===
function SaveOperationSection(props: {
  state: DatabaseWizardState;
  saveResult: SaveDataSourceResponse | null;
  onSave: () => Promise<SaveDataSourceResponse | null>;
  isSaving: boolean;
  canSave: boolean;
}) {
  return (
    <div class="save-section">
      <div class="section-header">
        <h5>💾 保存数据源</h5>
        <button 
          class={`save-btn ${props.canSave ? 'primary' : 'disabled'}`}
          onClick={props.onSave}
          disabled={props.isSaving || !props.canSave}
        >
          {props.isSaving ? '💾 保存中...' : '💾 保存数据源'}
        </button>
      </div>

      {/* 如果不能保存，显示提示信息 */}
      <Show when={!props.canSave && !props.isSaving}>
        <div class="save-requirements">
          <div class="requirements-header">❗ 保存要求检查：</div>
          <div class="requirements-list">
            <div class="requirement-item">数据源名称: {props.state.name ? '✅' : '❌'} "{props.state.name}"</div>
            <div class="requirement-item">自定义SQL: {props.state.customSQL ? '✅' : '❌'} {props.state.customSQL ? `(${props.state.customSQL.length} 字符)` : '(空)'}</div>
            <div class="requirement-item">测试连接: {props.state.testResult?.success ? '✅' : '❌'} {props.state.testResult?.success ? '成功' : (props.state.testResult ? `失败: ${props.state.testResult.message}` : '未测试')}</div>
            <div class="requirement-item">保存状态: {props.isSaving ? '❌ 正在保存中' : '✅ 空闲'}</div>
          </div>
          <div class="requirements-note">
            {!props.state.testResult?.success 
              ? "请返回第1步完成连接测试，然后才能保存数据源。"
              : "所有条件都已满足，但按钮仍然禁用。这可能是一个bug。"
            }
          </div>
        </div>
      </Show>

      <Show when={props.saveResult}>
        <div class={`save-result ${props.saveResult?.success ? 'success' : 'error'}`}>
          <div class="result-message">
            <span class="result-icon">
              {props.saveResult?.success ? '✅' : '❌'}
            </span>
            <span class="result-text">{props.saveResult?.message}</span>
          </div>
          
          <Show when={props.saveResult?.success && props.saveResult.data_source_id}>
            <div class="result-details">
              <div class="detail-item">
                <span class="detail-label">数据源ID:</span>
                <span class="detail-value">{props.saveResult!.data_source_id}</span>
              </div>
            </div>
          </Show>

          <Show when={props.saveResult && props.saveResult.warnings && props.saveResult.warnings.length > 0}>
            <div class="result-warnings">
              <For each={props.saveResult!.warnings || []}>
                {(warning) => <div class="warning-item">⚠️ {warning}</div>}
              </For>
            </div>
          </Show>

          <Show when={props.saveResult && props.saveResult.errors && props.saveResult.errors.length > 0}>
            <div class="result-errors">
              <For each={props.saveResult!.errors || []}>
                {(error) => <div class="error-item">❌ {error}</div>}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!props.canSave}>
        <div class="save-requirements">
          <h6>保存前需要完成:</h6>
          <ul>
            <li>填写数据源名称</li>
            <li>确保SQL查询有效</li>
            <li>通过基本验证检查</li>
          </ul>
        </div>
      </Show>
    </div>
  );
}

// === 辅助函数 ===
function canSave(state: DatabaseWizardState): boolean {
  const hasName = state.name.trim().length > 0;
  const hasSQL = state.customSQL.trim().length > 0;
  const hasSuccessfulTest = state.testResult?.success;
  const notSaving = !state.isSaving;
  
  // 调试信息
  console.log('🔍 保存条件检查:', {
    hasName,
    hasSQL, 
    hasSuccessfulTest,
    notSaving,
    testResult: state.testResult,
    name: state.name,
    sql: state.customSQL
  });
  
  return !!(hasName && hasSQL && hasSuccessfulTest && notSaving);
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '(null)';
  }
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 47) + '...';
  }
  return String(value);
}