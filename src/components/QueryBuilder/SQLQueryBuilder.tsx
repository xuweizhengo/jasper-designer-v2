// === SQL查询构建器主组件 ===
import { createSignal, Show, For, createMemo } from 'solid-js';
import { DataSourceAPI, DatabaseSchema, DatabaseConfig, QueryResult, ValidationResult } from '../../api/data-sources';
import SQLEditor from './SQLEditor';
import VisualQueryBuilder from './VisualQueryBuilder';
import QueryPreview from './QueryPreview';
import './SQLQueryBuilder.css';

interface SQLQueryBuilderProps {
  selectedTables: string[];
  schema: DatabaseSchema | null;
  config: DatabaseConfig;
  sql: string;
  onSQLChange: (sql: string) => void;
  onQueryResult: (result: QueryResult | null) => void;
  onValidationChange: (validation: ValidationResult | null) => void;
}

export type QueryMode = 'visual' | 'custom';

export default function SQLQueryBuilder(props: SQLQueryBuilderProps) {
  const [queryMode, setQueryMode] = createSignal<QueryMode>('visual');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [validationResult, setValidationResult] = createSignal<ValidationResult | null>(null);
  const [queryResult, setQueryResult] = createSignal<QueryResult | null>(null);
  const [generatedSQL, setGeneratedSQL] = createSignal('');

  // 计算最终的SQL查询
  const finalSQL = createMemo(() => {
    return queryMode() === 'visual' ? generatedSQL() : props.sql;
  });

  // 获取验证结果的memo，避免重复调用
  const validationData = createMemo(() => validationResult());

  // 验证SQL语法
  const validateSQL = async () => {
    const sql = finalSQL().trim();
    if (!sql) {
      setValidationResult(null);
      props.onValidationChange(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 验证SQL语法:', sql);
      
      // 调试：检查config对象的实际内容
      console.log('🔍 SQLQueryBuilder config对象:', props.config);
      console.log('🔍 config对象的键:', Object.keys(props.config));
      console.log('🔍 database_type字段:', props.config.database_type);
      
      // 检查是否存在其他可能的数据库类型字段名
      const possibleFields = ['database_type', 'databaseType', 'dbType', 'type'];
      possibleFields.forEach(field => {
        if (props.config[field as keyof DatabaseConfig]) {
          console.log(`🔍 找到字段 ${field}:`, props.config[field as keyof DatabaseConfig]);
        }
      });
      
      if (!props.config.database_type) {
        throw new Error(`database_type字段缺失，config内容: ${JSON.stringify(props.config)}`);
      }
      
      // 调用后端验证API
      const result = await DataSourceAPI.validateSqlSyntax(sql, props.config.database_type);
      setValidationResult(result);
      props.onValidationChange(result);
      
      console.log('✅ SQL验证结果:', result);
    } catch (err) {
      console.error('❌ SQL验证失败:', err);
      const errorValidation: ValidationResult = {
        valid: false,
        errors: [`验证失败: ${err}`],
        warnings: [],
        suggestions: [],
        is_safe: false,
        security_issues: ['无法验证查询安全性']
      };
      setValidationResult(errorValidation);
      props.onValidationChange(errorValidation);
      setError(`SQL验证失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // 格式化SQL
  const formatSQL = async () => {
    const sql = finalSQL().trim();
    if (!sql) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🎨 格式化SQL:', sql);
      
      const formatted = await DataSourceAPI.formatSql(sql, props.config.database_type);
      
      if (queryMode() === 'visual') {
        setGeneratedSQL(formatted);
      } else {
        props.onSQLChange(formatted);
      }
      
      console.log('✅ SQL格式化完成');
    } catch (err) {
      console.error('❌ SQL格式化失败:', err);
      setError(`格式化失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // 执行查询预览
  const executePreview = async () => {
    const sql = finalSQL().trim();
    if (!sql) {
      setError('请输入SQL查询语句');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('▶️ 执行查询预览:', sql);
      
      // 先验证SQL
      await validateSQL();
      
      // 如果验证不通过，不执行查询
      const validation = validationResult();
      if (validation && !validation.valid) {
        setError('SQL语法验证失败，请修正后重试');
        return;
      }

      // 执行预览查询
      const result = await DataSourceAPI.executeDatabasePreview(
        props.config, 
        sql, 
        50 // 预览限制50行
      );
      
      setQueryResult(result);
      props.onQueryResult(result);
      console.log('✅ 查询预览成功:', result);
      
    } catch (err) {
      console.error('❌ 查询预览失败:', err);
      setError(`查询执行失败: ${err}`);
      setQueryResult(null);
      props.onQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  // 复制SQL到剪贴板
  const copySQL = async () => {
    const sql = finalSQL();
    if (!sql) return;
    
    try {
      await navigator.clipboard.writeText(sql);
      console.log('📋 SQL已复制到剪贴板');
    } catch (err) {
      console.error('❌ 复制失败:', err);
      setError(`复制失败: ${err}`);
    }
  };

  // 处理查询模式切换
  const handleModeChange = (mode: QueryMode) => {
    setQueryMode(mode);
    setError(null);
    
    // 切换到自定义模式时，将可视化生成的SQL同步过去
    if (mode === 'custom' && generatedSQL()) {
      props.onSQLChange(generatedSQL());
    }
  };

  return (
    <div class="sql-query-builder">
      {/* 模式选择器 */}
      <div class="query-mode-selector">
        <div class="mode-tabs">
          <button 
            class={`mode-tab ${queryMode() === 'visual' ? 'active' : ''}`}
            onClick={() => handleModeChange('visual')}
            disabled={loading()}
          >
            🎯 可视化构建
          </button>
          <button 
            class={`mode-tab ${queryMode() === 'custom' ? 'active' : ''}`}
            onClick={() => handleModeChange('custom')}
            disabled={loading()}
          >
            💻 自定义SQL
          </button>
        </div>
        
        <div class="mode-description">
          <Show when={queryMode() === 'visual'}>
            <span>通过可视化界面构建查询，适合初学者使用</span>
          </Show>
          <Show when={queryMode() === 'custom'}>
            <span>直接编写SQL语句，适合有经验的用户</span>
          </Show>
        </div>
      </div>

      {/* 错误提示 */}
      <Show when={error()}>
        <div class="error-message">
          ❌ {error()}
        </div>
      </Show>

      {/* 查询构建区域 */}
      <div class="query-content">
        <Show when={queryMode() === 'visual'}>
          <VisualQueryBuilder
            selectedTables={props.selectedTables}
            schema={props.schema}
            onQueryChange={setGeneratedSQL}
            disabled={loading()}
          />
        </Show>

        <Show when={queryMode() === 'custom'}>
          <SQLEditor
            sql={props.sql}
            onSQLChange={props.onSQLChange}
            databaseType={props.config.database_type}
            disabled={loading()}
          />
        </Show>
      </div>

      {/* 查询预览区域 */}
      <div class="query-preview-section">
        <div class="preview-header">
          <h4>📋 SQL查询预览</h4>
          <div class="preview-actions">
            <button 
              class="action-btn format-btn"
              onClick={formatSQL}
              disabled={loading() || !finalSQL()}
              title="格式化SQL代码"
            >
              🎨 格式化
            </button>
            <button 
              class="action-btn validate-btn"
              onClick={validateSQL}
              disabled={loading() || !finalSQL()}
              title="验证SQL语法"
            >
              ✓ 验证语法
            </button>
            <button 
              class="action-btn copy-btn"
              onClick={copySQL}
              disabled={loading() || !finalSQL()}
              title="复制SQL到剪贴板"
            >
              📋 复制
            </button>
            <button 
              class="action-btn execute-btn"
              onClick={executePreview}
              disabled={loading() || !finalSQL()}
              title="执行查询预览"
            >
              {loading() ? '⏳ 执行中...' : '▶️ 预览查询'}
            </button>
          </div>
        </div>

        {/* SQL显示区域 */}
        <div class="sql-display">
          <pre class="sql-code">
            <code>{finalSQL() || '-- 请构建或输入SQL查询语句'}</code>
          </pre>
        </div>

        {/* 验证结果显示 */}
        <Show when={validationData()}>
          <div class={`validation-result ${validationData()?.valid ? 'valid' : 'invalid'}`}>
            <div class="validation-header">
              <span class="validation-status">
                {validationData()!.valid ? '✅ 语法正确' : '❌ 语法错误'}
              </span>
              <span class="security-status">
                {validationData()!.is_safe ? '🔒 查询安全' : '⚠️ 安全警告'}
              </span>
            </div>
            
            <Show when={validationData()!.errors && validationData()!.errors.length > 0}>
              <div class="validation-errors">
                <strong>错误:</strong>
                <ul>
                  <For each={validationData()!.errors}>
                    {(error) => <li>{error}</li>}
                  </For>
                </ul>
              </div>
            </Show>
            
            <Show when={validationData()?.warnings && validationData()!.warnings!.length > 0}>
              <div class="validation-warnings">
                <strong>警告:</strong>
                <ul>
                  <For each={validationData()!.warnings!}>
                    {(warning) => <li>{warning}</li>}
                  </For>
                </ul>
              </div>
            </Show>
            
            <Show when={validationData()?.suggestions && validationData()!.suggestions!.length > 0}>
              <div class="validation-suggestions">
                <strong>建议:</strong>
                <ul>
                  <For each={validationData()!.suggestions!}>
                    {(suggestion) => <li>{suggestion}</li>}
                  </For>
                </ul>
              </div>
            </Show>
          </div>
        </Show>

        {/* 查询结果预览 */}
        <Show when={queryResult()}>
          <QueryPreview 
            result={queryResult()!}
            onClose={() => {
              setQueryResult(null);
              props.onQueryResult(null);
            }}
          />
        </Show>
      </div>

      {/* 帮助提示 */}
      <div class="query-help">
        <details>
          <summary>💡 查询构建帮助</summary>
          <div class="help-content">
            <div class="help-section">
              <h5>可视化构建:</h5>
              <ul>
                <li>选择表和字段来自动生成查询</li>
                <li>支持JOIN关联、WHERE条件、ORDER BY排序</li>
                <li>适合SQL初学者使用</li>
              </ul>
            </div>
            <div class="help-section">
              <h5>自定义SQL:</h5>
              <ul>
                <li>直接编写SQL语句，支持复杂查询</li>
                <li>提供语法验证和格式化功能</li>
                <li>适合有经验的用户</li>
              </ul>
            </div>
            <div class="help-section">
              <h5>安全提示:</h5>
              <ul>
                <li>系统会自动检测SQL注入风险</li>
                <li>预览查询限制返回行数，避免性能问题</li>
                <li>建议先验证语法，再执行预览</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}