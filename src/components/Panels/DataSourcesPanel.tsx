// === Data Sources Panel ===
import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { DataSourceAPI, DataSourceInfo, DataSourceTypeInfo, DataSet } from '../../api/data-sources';
import { dataContextManager } from '../../stores/DataContextManager';
import DataSourceWizard from './DataSourceWizard';
import './DataSourcesPanel.css';

// 统一的类型显示函数（供整个文件复用）
const displayTypeFromSource = (source: DataSourceInfo) => {
  const raw = ((source as any).type_name || (source as any).provider_type || (source as any).providerType || '').toLowerCase();
  if (raw.includes('database_mysql')) return 'MySQL';
  if (raw.includes('database_postgresql')) return 'PostgreSQL';
  if (raw === 'json') return 'JSON';
  if (raw === 'csv') return 'CSV';
  if (raw === 'excel') return 'Excel';
  if (raw.startsWith('api')) return 'API';
  if (raw.startsWith('database')) return 'Database';
  return (source as any).type_name || (source as any).provider_type || (source as any).providerType || 'Unknown';
};

interface DataSourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourcesPanel(props: DataSourcesPanelProps) {
  const [dataSources, setDataSources] = createSignal<DataSourceInfo[]>([]);
  const [availableTypes, setAvailableTypes] = createSignal<DataSourceTypeInfo[]>([]);
  const [activeView, setActiveView] = createSignal<'list' | 'add' | 'edit' | 'preview'>('list');
  const [selectedSource, setSelectedSource] = createSignal<DataSourceInfo | null>(null);
  const [previewData, setPreviewData] = createSignal<DataSet | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [activeId, setActiveId] = createSignal<string | null>(null);

  // Load data sources on mount
  onMount(async () => {
    try {
      await loadDataSources();
      await loadAvailableTypes();
      // 订阅数据上下文变化，跟踪当前激活源
      const unsubscribe = dataContextManager.subscribe((ctx) => {
        setActiveId(ctx?.dataSource.id || null);
      });
      // 初始化一次
      setActiveId(dataContextManager.getCurrentContext()?.dataSource.id || null);
      // 组件卸载时取消订阅
      onCleanup(unsubscribe);
    } catch (error) {
      console.error('🚨 DataSourcesPanel初始化失败:', error);
      setError(`数据源模块初始化失败: ${error}`);
    }
  });

  const loadDataSources = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载数据源列表...');
      const sources = await DataSourceAPI.listDataSources();
      console.log('✅ 数据源列表加载成功:', sources);
      setDataSources(sources);
      setError(null);
    } catch (err) {
      console.error('❌ 加载数据源失败:', err);
      setError(`加载数据源失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTypes = async () => {
    try {
      console.log('🔄 开始加载可用数据源类型...');
      const types = await DataSourceAPI.getAvailableTypes();
      console.log('✅ 数据源类型加载成功:', types);
      setAvailableTypes(types);
    } catch (err) {
      console.error('❌ 加载数据源类型失败:', err);
      // 不设置错误状态，因为这不是致命错误
    }
  };

  const handleAddDataSource = () => {
    setActiveView('add');
    setSelectedSource(null);
  };

  const handleEditDataSource = (source: DataSourceInfo) => {
    setSelectedSource(source);
    setActiveView('edit');
  };

  const handlePreviewDataSource = async (source: DataSourceInfo) => {
    try {
      setLoading(true);
      setError(null); // 清除之前的错误
      setSelectedSource(source);
      console.log('🔄 开始预览数据源:', source.name);
      
      // 检查数据源状态
      if (source.status !== 'active') {
        console.log('⚠️  数据源状态不是激活状态:', source.status);
        setError(`数据源状态为 ${source.status}，可能无法预览数据`);
        // 仍然尝试获取预览，有些情况下仍然可以获取数据
      }
      
      const preview = await DataSourceAPI.getPreview(source.id);
      setPreviewData(preview);
      setActiveView('preview');
      console.log('✅ 数据预览加载成功:', preview);
      
    } catch (err) {
      console.error('❌ 数据预览失败:', err);
      const errorMessage = `预览数据源 "${source.name}" 失败: ${err}`;
      setError(errorMessage);
      
      // 显示用户友好的错误提示
      const friendlyErrors: Record<string, string> = {
        'connection': '连接失败，请检查数据源配置',
        'permission': '权限不足，请检查认证信息',
        'not_found': '数据源或数据不存在',
        'timeout': '请求超时，请稍后重试'
      };
      
      const errorStr = String(err).toLowerCase();
      const friendlyMessage = Object.keys(friendlyErrors).find(key => 
        errorStr.includes(key)
      );
      
      if (friendlyMessage) {
        setError(`预览失败: ${friendlyErrors[friendlyMessage]}`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataSource = async (sourceId: string) => {
    if (confirm('确定要删除这个数据源吗？')) {
      try {
        await DataSourceAPI.deleteDataSource(sourceId);
        await loadDataSources();
      } catch (err) {
        setError(`删除数据源失败: ${err}`);
      }
    }
  };

  const handleActivateDataSource = async (source: DataSourceInfo) => {
    try {
      setLoading(true);
      setError(null);
      await dataContextManager.setActiveDataSource(source.id);
    } catch (err) {
      console.error('❌ 激活数据源失败:', err);
      setError(`激活数据源失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    try {
      setLoading(true);
      setError(null); // 清除之前的错误
      console.log('🔄 开始测试数据源连接:', sourceId);
      
      // 找到对应的数据源信息
      const source = dataSources().find(ds => ds.id === sourceId);
      if (!source) {
        const errorMsg = `数据源不存在: ${sourceId}`;
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('📋 数据源信息:', {
        id: source.id,
        name: source.name,
        providerType: (source as any).providerType || (source as any).provider_type,
        config: source.config
      });

      // 对于数据库类型，确保使用正确的provider_type
      let providerType = (source as any).providerType || (source as any).provider_type || (source as any).type_name;
      if (source.name.includes('MySQL') || source.name.includes('数据库') || 
          JSON.stringify(source.config).includes('mysql') ||
          JSON.stringify(source.config).includes('3306')) {
        providerType = 'database';
        console.log('🗄️ 检测到数据库类型，使用provider_type: database');
      }

      console.log('🔍 调用测试连接API:', {
        providerType,
        config: source.config
      });

      // 调用API测试连接
      const success = await DataSourceAPI.testConnection(providerType, source.config || {});
      
      console.log('📨 API返回结果:', success);
      
      if (success) {
        console.log('✅ 数据源连接测试成功:', sourceId);
        alert(`✅ 数据源 "${source.name}" 连接测试成功！\n\n🎉 数据库连接正常，可以正常使用`);
      } else {
        console.log('❌ 数据源连接测试失败:', sourceId);
        alert(`❌ 数据源 "${source.name}" 连接测试失败\n\n请检查配置信息是否正确`);
      }
    } catch (err) {
      console.error('❌ 测试连接时发生错误:', err);
      console.error('❌ 错误详情:', {
        error: err,
        errorType: typeof err,
        errorString: String(err),
        errorJSON: JSON.stringify(err, null, 2)
      });
      
      const source = dataSources().find(ds => ds.id === sourceId);
      const errorMessage = `测试连接失败: ${err}`;
      setError(errorMessage);
      
      // 更详细的错误提示
      if (!err || String(err) === '' || String(err) === 'null') {
        alert(`❌ 数据源 "${source?.name || sourceId}" 连接测试遇到未知错误\n\n请检查：\n• 开发者工具控制台的详细错误信息\n• 后端服务是否正常运行\n• 配置参数是否正确`);
      } else {
        alert(`❌ 数据源 "${source?.name || sourceId}" 连接测试失败:\n\n${err}\n\n💡 如果是空错误，请检查开发者工具控制台获取详细信息`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <div 
        class="data-sources-panel" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="data-panel-title"
        aria-describedby="data-panel-description"
      >
        <a href="#data-panel-content" class="skip-to-content">跳转到内容</a>
        <div class="panel-header">
          <h2 id="data-panel-title">数据源管理</h2>
          <span id="data-panel-description" class="sr-only">
            管理JSON数据源，包括创建、编辑、测试和预览功能
          </span>
          <button 
            class="close-btn" 
            onClick={props.onClose}
            aria-label="关闭数据源面板"
            title="关闭数据源面板"
          >
            ×
          </button>
        </div>

        <div class="panel-content" id="data-panel-content">
          <Show when={activeView() === 'list'}>
            <DataSourcesList
              dataSources={dataSources()}
              loading={loading()}
              error={error()}
              onAdd={handleAddDataSource}
              onEdit={handleEditDataSource}
              onPreview={handlePreviewDataSource}
              onDelete={handleDeleteDataSource}
              onActivate={handleActivateDataSource}
              onTestConnection={handleTestConnection}
              onRefresh={loadDataSources}
              activeId={activeId()}
            />
          </Show>

          <Show when={activeView() === 'add'}>
            <DataSourceWizard
              availableTypes={availableTypes()}
              onBack={() => setActiveView('list')}
              onSuccess={loadDataSources}
            />
          </Show>

          <Show when={activeView() === 'edit' && selectedSource()}>
            <EditDataSourceForm
              dataSource={selectedSource()!}
              onBack={() => setActiveView('list')}
              onSuccess={loadDataSources}
            />
          </Show>

          <Show when={activeView() === 'preview' && selectedSource() && previewData()}>
            <DataPreview
              dataSource={selectedSource()!}
              data={previewData()!}
              onBack={() => setActiveView('list')}
            />
          </Show>
        </div>
      </div>
    </Show>
  );
}

// === Data Sources List Component ===
interface DataSourcesListProps {
  dataSources: DataSourceInfo[];
  loading: boolean;
  error: string | null;
  onAdd: () => void;
  onEdit: (source: DataSourceInfo) => void;
  onPreview: (source: DataSourceInfo) => void;
  onDelete: (sourceId: string) => void;
  onActivate: (source: DataSourceInfo) => void;
  onTestConnection: (sourceId: string) => void;
  onRefresh: () => void;
  activeId: string | null;
}

function DataSourcesList(props: DataSourcesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'error': return '#ef4444';
      case 'disabled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="data-sources-list">
      <div class="list-header">
        <div class="list-title">
          <h3>已配置的数据源 ({props.dataSources.length})</h3>
          <button 
            class="refresh-btn" 
            onClick={props.onRefresh} 
            disabled={props.loading}
            aria-label={props.loading ? "正在刷新数据源列表" : "刷新数据源列表"}
            title={props.loading ? "正在刷新..." : "刷新数据源列表"}
          >
            🔄 刷新
          </button>
        </div>
        <button 
          class="add-btn" 
          onClick={props.onAdd}
          aria-label="添加新的数据源"
          title="创建新的JSON数据源"
        >
          + 添加数据源
        </button>
      </div>

      <Show when={props.error}>
        <div class="error-message">{props.error}</div>
      </Show>

      <Show when={props.loading}>
        <div class="loading-message">加载中...</div>
      </Show>

      <Show when={!props.loading && props.dataSources.length === 0}>
        <div class="empty-state">
          <p>尚未配置任何数据源</p>
          <button onClick={props.onAdd}>添加第一个数据源</button>
        </div>
      </Show>

      <Show when={!props.loading && props.dataSources.length > 0}>
        <div class="sources-grid">
          <For each={props.dataSources}>
            {(source) => (
              <div class="source-card" data-active={props.activeId === source.id ? 'true' : 'false'}>
                <div class="source-header">
                  <div class="source-info">
                    <h4>
                      {source.name}
                      <Show when={props.activeId === source.id}>
                        <span class="active-badge" title="当前激活">当前</span>
                      </Show>
                    </h4>
                    <span class="source-type">{displayTypeFromSource(source)}</span>
                  </div>
                  <div 
                    class="source-status" 
                    style={{ 'background-color': getStatusColor(source.status) }}
                    title={`状态: ${source.status}`}
                  />
                </div>

                <div class="source-meta">
                  <div class="meta-item">
                    <span>创建时间:</span>
                    <span>{formatDate((source as any).createdAt || (source as any).created_at)}</span>
                  </div>
                  <div class="meta-item">
                    <span>最后更新:</span>
                    <span>{formatDate((source as any).lastUpdated || (source as any).last_updated)}</span>
                  </div>
                </div>

                <div class="source-actions">
                  <button 
                    class="action-btn preview-btn"
                    onClick={() => props.onPreview(source)}
                    disabled={source.status !== 'active'}
                  >
                    👁️ 预览
                  </button>
                  <button 
                    class="action-btn test-btn"
                    onClick={() => props.onActivate(source)}
                    disabled={props.activeId === source.id}
                    title="设为当前数据源"
                  >
                    ⭐ 设为当前
                  </button>
                  <button 
                    class="action-btn test-btn"
                    onClick={() => props.onTestConnection(source.id)}
                  >
                    🔌 测试
                  </button>
                  <button 
                    class="action-btn edit-btn"
                    onClick={() => props.onEdit(source)}
                  >
                    ✏️ 编辑
                  </button>
                  <button 
                    class="action-btn delete-btn"
                    onClick={() => props.onDelete(source.id)}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// === Edit Data Source Form ===
interface EditDataSourceFormProps {
  dataSource: DataSourceInfo;
  onBack: () => void;
  onSuccess: () => void;
}

function EditDataSourceForm(props: EditDataSourceFormProps) {
  const [editState, setEditState] = createSignal({
    name: props.dataSource.name,
    config: props.dataSource.config || {},
    loading: false,
    error: null as string | null,
    testResult: null as any,
    hasChanges: false
  });

  const [originalConfig] = createSignal(JSON.stringify(props.dataSource.config || {}));

  // 检查是否有变化
  const checkForChanges = () => {
    const current = editState();
    const hasNameChange = current.name !== props.dataSource.name;
    const hasConfigChange = JSON.stringify(current.config) !== originalConfig();
    
    setEditState(prev => ({
      ...prev,
      hasChanges: hasNameChange || hasConfigChange
    }));
  };

  const handleNameChange = (name: string) => {
    setEditState(prev => ({ ...prev, name }));
    checkForChanges();
  };

  const handleConfigChange = (config: any) => {
    setEditState(prev => ({ ...prev, config }));
    checkForChanges();
  };

  const testConnection = async () => {
    const current = editState();
    setEditState(prev => ({ ...prev, loading: true, testResult: null }));

    try {
      console.log('🔄 测试连接配置...');
      const success = await DataSourceAPI.testConnection(((props.dataSource as any).providerType || (props.dataSource as any).provider_type), current.config);
      
      if (success) {
        console.log('✅ 连接测试成功');
        setEditState(prev => ({
          ...prev,
          testResult: {
            success: true,
            message: '连接测试成功！配置有效。'
          },
          loading: false
        }));
      }
    } catch (error) {
      console.error('❌ 连接测试失败:', error);
      setEditState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: '连接测试失败',
          error: error instanceof Error ? error.message : String(error)
        },
        loading: false
      }));
    }
  };

  const handleSave = async () => {
    const current = editState();
    
    if (!current.hasChanges) {
      props.onBack();
      return;
    }

    if (!current.name.trim()) {
      setEditState(prev => ({ ...prev, error: '数据源名称不能为空' }));
      return;
    }

    try {
      setEditState(prev => ({ ...prev, loading: true, error: null }));
      console.log('🔄 更新数据源配置...');
      
      // 更新数据源配置
      await DataSourceAPI.updateConfig(props.dataSource.id, current.config);
      
      // 注意：当前API只支持更新配置，名称更新需要额外实现
      if (current.name !== props.dataSource.name) {
        console.log('⚠️  名称更新功能待实现，当前只更新了配置');
        setEditState(prev => ({ 
          ...prev, 
          error: '配置已更新，但名称更新功能待实现' 
        }));
      } else {
        console.log('✅ 数据源配置更新成功');
      }
      
      props.onSuccess();
      props.onBack();
    } catch (error) {
      console.error('❌ 更新数据源失败:', error);
      setEditState(prev => ({
        ...prev,
        error: `更新失败: ${error}`,
        loading: false
      }));
    }
  };

  const resetChanges = () => {
    setEditState(prev => ({
      ...prev,
      name: props.dataSource.name,
      config: props.dataSource.config || {},
      hasChanges: false,
      error: null,
      testResult: null
    }));
  };

  return (
    <div class="edit-data-source-form">
      <div class="form-header">
        <button class="back-btn" onClick={props.onBack}>← 返回</button>
        <div class="header-info">
          <h3>编辑数据源</h3>
          <div class="source-meta">
            <span class="source-type">{(props.dataSource as any).providerType || (props.dataSource as any).type_name}</span>
            <span class="source-id">ID: {props.dataSource.id}</span>
          </div>
        </div>
      </div>

      <div class="edit-content">
        {/* 基本信息编辑 */}
        <div class="edit-section">
          <div class="section-header">
            <h4>🏷️ 基本信息</h4>
          </div>
          
          <div class="form-field">
            <label>数据源名称</label>
            <input
              type="text"
              value={editState().name}
              onInput={(e) => handleNameChange(e.currentTarget.value)}
              placeholder="请输入数据源名称"
              class={editState().error && !editState().name.trim() ? 'error' : ''}
            />
          </div>
        </div>

        {/* 配置编辑 */}
        <div class="edit-section">
          <div class="section-header">
            <h4>⚙️ 配置信息</h4>
            <Show when={editState().hasChanges}>
              <span class="changes-indicator">● 有未保存的更改</span>
            </Show>
          </div>
          
          <div class="form-field">
            <label>数据源配置</label>
            <textarea
              value={JSON.stringify(editState().config, null, 2)}
              onInput={(e) => {
                try {
                  const config = JSON.parse(e.currentTarget.value);
                  handleConfigChange(config);
                  setEditState(prev => ({ ...prev, error: null }));
                } catch (err) {
                  setEditState(prev => ({ 
                    ...prev, 
                    error: '配置格式错误，请检查JSON语法' 
                  }));
                }
              }}
              rows={12}
              class={editState().error && editState().error?.includes('配置格式') ? 'error' : ''}
              placeholder="数据源配置 (JSON格式)"
            />
            <div class="config-hint">
              💡 修改配置后建议先测试连接，确保配置有效
            </div>
          </div>
        </div>

        {/* 连接测试 */}
        <div class="edit-section">
          <div class="section-header">
            <h4>🔌 连接测试</h4>
            <button
              class="test-connection-btn"
              onClick={testConnection}
              disabled={editState().loading}
            >
              {editState().loading ? '测试中...' : '测试连接'}
            </button>
          </div>

          <Show when={editState().testResult}>
            <div class={`test-result ${editState().testResult?.success ? 'success' : 'error'}`}>
              <div class="result-message">
                {editState().testResult?.success ? '✅' : '❌'} {editState().testResult?.message}
              </div>
              <Show when={editState().testResult?.error}>
                <div class="error-details">{editState().testResult?.error}</div>
              </Show>
            </div>
          </Show>
        </div>

        {/* 数据源状态信息 */}
        <div class="edit-section">
          <div class="section-header">
            <h4>📊 数据源状态</h4>
          </div>
          
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">当前状态:</span>
              <span class={`status-value status-${props.dataSource.status}`}>
                {props.dataSource.status === 'active' ? '✅ 活跃' : 
                 props.dataSource.status === 'error' ? '❌ 错误' : 
                 '⚠️ 未知'}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">创建时间:</span>
              <span class="status-value">
                {new Date(((props.dataSource as any).createdAt || (props.dataSource as any).created_at)).toLocaleString('zh-CN')}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">最后更新:</span>
              <span class="status-value">
                {new Date(((props.dataSource as any).lastUpdated || (props.dataSource as any).last_updated)).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        <Show when={editState().error}>
          <div class="error-message">
            ❌ {editState().error}
          </div>
        </Show>

        {/* 操作按钮 */}
        <div class="form-actions">
          <button 
            type="button" 
            class="cancel-btn"
            onClick={props.onBack}
          >
            取消
          </button>
          
          <Show when={editState().hasChanges}>
            <button 
              type="button" 
              class="reset-btn"
              onClick={resetChanges}
              disabled={editState().loading}
            >
              重置更改
            </button>
          </Show>
          
          <button 
            type="button"
            class={`save-btn ${editState().hasChanges ? 'has-changes' : ''}`}
            onClick={handleSave}
            disabled={editState().loading}
          >
            {editState().loading ? '保存中...' : 
             editState().hasChanges ? '保存更改' : '无更改'}
          </button>
        </div>

        {/* 使用提示 */}
        <div class="edit-tips">
          <div class="tips-title">💡 编辑提示:</div>
          <ul>
            <li>修改配置后建议先测试连接确保有效性</li>
            <li>保存更改后可能需要重新激活数据源</li>
            <li>JSON配置格式错误会阻止保存</li>
            <li>重置更改可恢复到保存前的状态</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// === Data Preview Component ===
interface DataPreviewProps {
  dataSource: DataSourceInfo;
  data: DataSet;
  onBack: () => void;
}

function DataPreview(props: DataPreviewProps) {
  return (
    <div class="data-preview">
      <div class="preview-header">
        <button class="back-btn" onClick={props.onBack}>← 返回</button>
        <h3>数据预览: {props.dataSource.name}</h3>
          <div class="preview-info">
          共 {(props.data as any).totalCount ?? (props.data as any).total_rows} 行数据，显示前 {props.data.rows.length} 行
        </div>
      </div>

      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <For each={props.data.columns}>
                {(column) => <th>{column}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.data.rows.slice(0, 50)}>
              {(row) => (
                <tr>
                  <For each={props.data.columns}>
                    {(column) => (
                      <td>
                        {typeof row[column] === 'object' 
                          ? JSON.stringify(row[column]) 
                          : String(row[column] || '')
                        }
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
