// === Data Source Management Center ===
import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { DataSourceAPI, DataSourceInfo, DataSourceTypeInfo, DataSet } from '../../api/data-sources';
import DataSourceWizard from '../Panels/DataSourceWizard';
import DatabaseSourceWizard from '../Panels/DatabaseSourceWizard';
import { dataContextManager } from '../../stores/DataContextManager';
import './DataSourceManagementCenter.css';

interface DataSourceManagementCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourceManagementCenter(props: DataSourceManagementCenterProps) {
  console.log('🏗️  DataSourceManagementCenter 组件渲染，isOpen:', props.isOpen);
  
  const [dataSources, setDataSources] = createSignal<DataSourceInfo[]>([]);
  const [availableTypes, setAvailableTypes] = createSignal<DataSourceTypeInfo[]>([]);
  const [activeView, setActiveView] = createSignal<'main' | 'add' | 'add-database' | 'edit' | 'preview'>('main');
  const [selectedSource, setSelectedSource] = createSignal<DataSourceInfo | null>(null);
  const [previewData, setPreviewData] = createSignal<DataSet | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [activeId, setActiveId] = createSignal<string | null>(null);
  
  // 筛选和搜索状态
  const [searchQuery, setSearchQuery] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal<string>('all');
  const [typeFilter, setTypeFilter] = createSignal<string>('all');

  // Load data sources on mount
  onMount(async () => {
    try {
      await loadDataSources();
      await loadAvailableTypes();
      // 跟踪当前激活的数据源ID
      const unsubscribe = dataContextManager.subscribe((ctx) => {
        setActiveId(ctx?.dataSource.id || null);
      });
      setActiveId(dataContextManager.getCurrentContext()?.dataSource.id || null);
      onCleanup(unsubscribe);
    } catch (error) {
      console.error('🚨 数据源管理中心初始化失败:', error);
      setError(`初始化失败: ${error}`);
    }
  });

  const loadDataSources = async () => {
    try {
      setLoading(true);
      console.log('🔄 加载数据源列表...');
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
      console.log('🔄 加载可用数据源类型...');
      const types = await DataSourceAPI.getAvailableTypes();
      console.log('✅ 数据源类型加载成功:', types);
      setAvailableTypes(types);
    } catch (err) {
      console.error('❌ 加载数据源类型失败:', err);
    }
  };

  // 筛选数据源
  const getReadableType = (source: DataSourceInfo) => {
    const raw = (source.providerType || '').toLowerCase();
    if (raw.includes('database_mysql')) return 'mysql';
    if (raw.includes('database_postgresql')) return 'postgresql';
    if (raw.includes('database')) return 'database';
    if (raw.includes('json')) return 'json';
    if (raw.includes('csv')) return 'csv';
    if (raw.includes('excel')) return 'excel';
    if (raw.includes('api')) return 'api';
    return raw || 'unknown';
  };

  const filteredDataSources = () => {
    let filtered = dataSources();
    
    // 按搜索查询筛选
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(source => 
        (source.name || '').toLowerCase().includes(query) ||
        getReadableType(source).includes(query)
      );
    }
    
    // 按状态筛选
    if (statusFilter() !== 'all') {
      filtered = filtered.filter(source => source.status === statusFilter());
    }
    
    // 按类型筛选
    if (typeFilter() !== 'all') {
      filtered = filtered.filter(source => getReadableType(source) === typeFilter());
    }
    
    return filtered;
  };

  // 统计信息
  const getStatusCount = (status: string) => {
    return dataSources().filter(source => source.status === status).length;
  };

  const getTypeCount = (type: string) => {
    return dataSources().filter(source => getReadableType(source) === type).length;
  };

  // 事件处理
  const handleAddDataSource = () => {
    setActiveView('add');
    setSelectedSource(null);
  };

  const handleAddDatabaseDataSource = () => {
    setActiveView('add-database');
    setSelectedSource(null);
  };

  const handleEditDataSource = (source: DataSourceInfo) => {
    setSelectedSource(source);
    setActiveView('edit');
  };

  const handlePreviewDataSource = async (source: DataSourceInfo) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedSource(source);
      console.log('🔄 开始预览数据源:', source.name);
      
      const preview = await DataSourceAPI.getPreview(source.id);
      setPreviewData(preview);
      setActiveView('preview');
      console.log('✅ 数据预览加载成功:', preview);
      
    } catch (err) {
      console.error('❌ 数据预览失败:', err);
      setError(`预览数据源 "${source.name}" 失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateDataSource = async (source: DataSourceInfo) => {
    try {
      setLoading(true);
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
      const source = dataSources().find(ds => ds.id === sourceId);
      if (!source) {
        setError(`数据源不存在: ${sourceId}`);
        return;
      }

      const success = await DataSourceAPI.testConnection((source as any).providerType || (source as any).provider_type, source.config || {});
      
      if (success) {
        alert(`✅ 数据源 "${source.name}" 连接测试成功！`);
      } else {
        alert(`❌ 数据源 "${source.name}" 连接测试失败`);
      }
    } catch (err) {
      console.error('❌ 测试连接失败:', err);
      const source = dataSources().find(ds => ds.id === sourceId);
      alert(`❌ 数据源 "${source?.name || sourceId}" 连接测试失败:\n${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataSource = async (sourceId: string) => {
    const source = dataSources().find(ds => ds.id === sourceId);
    if (confirm(`确定要删除数据源 "${source?.name}" 吗？`)) {
      try {
        await DataSourceAPI.deleteDataSource(sourceId);
        await loadDataSources();
      } catch (err) {
        setError(`删除数据源失败: ${err}`);
      }
    }
  };

  // 返回主视图
  const handleBackToMain = () => {
    setActiveView('main');
    setSelectedSource(null);
    setPreviewData(null);
    setError(null);
  };

  return (
    <Show when={props.isOpen}>
      <div class="data-source-management-center">
        {/* 顶部导航栏 */}
        <div class="management-header">
          <button class="back-to-designer-btn" onClick={props.onClose}>
            ← 返回设计器
          </button>
          <h1>数据源管理中心</h1>
          <div class="header-actions">
            <Show when={activeView() === 'main'}>
              <input
                type="text"
                class="search-input"
                placeholder="搜索数据源..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
              />
              <div class="add-buttons-group">
                <button class="add-data-source-btn" onClick={handleAddDataSource}>
                  📄 文件数据源
                </button>
                <button class="add-database-source-btn" onClick={handleAddDatabaseDataSource}>
                  🗄️ 数据库数据源
                </button>
              </div>
            </Show>
          </div>
        </div>

        {/* 主内容区域 */}
        <div class="management-content">
          
          {/* 主视图 - 数据源网格 */}
          <Show when={activeView() === 'main'}>
            <div class="main-view">
              {/* 左侧边栏 */}
              <div class="sidebar">
                <div class="sidebar-section">
                  <h3>分类导航</h3>
                  <ul class="nav-list">
                    <li class={statusFilter() === 'all' ? 'active' : ''}>
                      <button onClick={() => setStatusFilter('all')}>
                        📁 全部数据源 ({dataSources().length})
                      </button>
                    </li>
                  </ul>
                </div>

                <div class="sidebar-section">
                  <h3>按状态分类</h3>
                  <ul class="nav-list">
                    <li class={statusFilter() === 'active' ? 'active' : ''}>
                      <button onClick={() => setStatusFilter('active')}>
                        🟢 活跃使用 ({getStatusCount('active')})
                      </button>
                    </li>
                    <li class={statusFilter() === 'error' ? 'active' : ''}>
                      <button onClick={() => setStatusFilter('error')}>
                        🔴 连接异常 ({getStatusCount('error')})
                      </button>
                    </li>
                    <li class={statusFilter() === 'disabled' ? 'active' : ''}>
                      <button onClick={() => setStatusFilter('disabled')}>
                        🟡 空闲状态 ({getStatusCount('disabled')})
                      </button>
                    </li>
                  </ul>
                </div>

                <div class="sidebar-section">
                  <h3>按类型分类</h3>
                  <ul class="nav-list">
                    <li class={typeFilter() === 'all' ? 'active' : ''}>
                      <button onClick={() => setTypeFilter('all')}>
                        📋 所有类型
                      </button>
                    </li>
                    <For each={availableTypes()}>
                      {(type) => (
                        <li class={typeFilter() === type.typeName ? 'active' : ''}>
                          <button onClick={() => setTypeFilter(type.typeName)}>
                            {type.category === 'file' ? '📄' : 
                             type.category === 'api' ? '🌐' : 
                             type.category === 'database' ? '🗄️' : '📊'} {type.displayName} ({getTypeCount(type.typeName)})
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </div>

              {/* 右侧主内容区 */}
              <div class="main-content">
                <Show when={error()}>
                  <div class="error-message">{error()}</div>
                </Show>

                <Show when={loading()}>
                  <div class="loading-message">加载中...</div>
                </Show>

                <Show when={!loading() && filteredDataSources().length === 0}>
                  <div class="empty-state">
                    <p>
                      {searchQuery() || statusFilter() !== 'all' || typeFilter() !== 'all' 
                        ? '没有找到匹配的数据源' 
                        : '尚未配置任何数据源'
                      }
                    </p>
                    <button onClick={handleAddDataSource}>添加第一个数据源</button>
                  </div>
                </Show>

                <Show when={!loading() && filteredDataSources().length > 0}>
                  <div class="data-source-grid">
                    <For each={filteredDataSources()}>
                      {(source) => (
                        <DataSourceCard
                          source={source}
                          onPreview={() => handlePreviewDataSource(source)}
                          onTest={() => handleTestConnection(source.id)}
                          onEdit={() => handleEditDataSource(source)}
                          onDelete={() => handleDeleteDataSource(source.id)}
                          onActivate={() => handleActivateDataSource(source)}
                          active={activeId() === source.id}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* 添加文件数据源视图 */}
          <Show when={activeView() === 'add'}>
            <DataSourceWizard
              availableTypes={availableTypes()}
              onBack={handleBackToMain}
              onSuccess={() => {
                loadDataSources();
                handleBackToMain();
              }}
            />
          </Show>

          {/* 添加数据库数据源视图 */}
          <Show when={activeView() === 'add-database'}>
            <DatabaseSourceWizard
              onBack={handleBackToMain}
              onSuccess={() => {
                loadDataSources();
                handleBackToMain();
              }}
            />
          </Show>

          {/* 编辑数据源视图 */}
          <Show when={activeView() === 'edit' && selectedSource()}>
            <div class="edit-view">
              <div class="edit-header">
                <button onClick={handleBackToMain}>← 返回</button>
                <h2>编辑数据源: {selectedSource()?.name}</h2>
              </div>
              <p>编辑功能将在后续版本中完善...</p>
            </div>
          </Show>

          {/* 预览数据源视图 */}
          <Show when={activeView() === 'preview' && selectedSource() && previewData()}>
            <div class="preview-view">
              <div class="preview-header">
                <button onClick={handleBackToMain}>← 返回</button>
                <h2>数据预览: {selectedSource()?.name}</h2>
                <div class="preview-info">
                  共 {(previewData() as any)?.totalCount ?? (previewData() as any)?.total_rows} 行数据，显示前 {previewData()?.rows.length} 行
                </div>
              </div>

              <div class="preview-table-container">
                <table class="preview-table">
                  <thead>
                    <tr>
                      <For each={previewData()?.columns}>
                        {(column) => <th>{column}</th>}
                      </For>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={previewData()?.rows.slice(0, 50)}>
                      {(row) => (
                        <tr>
                          <For each={previewData()?.columns || []}>
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
          </Show>
        </div>
      </div>
    </Show>
  );
}

// === 数据源卡片组件 ===
interface DataSourceCardProps {
  source: DataSourceInfo;
  onPreview: () => void;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  active: boolean;
}

function DataSourceCard(props: DataSourceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'error': return '#ef4444';
      case 'disabled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '已连接';
      case 'error': return '连接异常';
      case 'disabled': return '未启用';
      default: return '未知';
    }
  };

  const formatDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return '刚刚更新';
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getTypeIcon = (typeName: string) => {
    const typeNameSafe = (typeName || '').toLowerCase();
    if (typeNameSafe.includes('json')) return '📄';
    if (typeNameSafe.includes('api')) return '🌐';
    if (typeNameSafe.includes('csv')) return '📊';
    if (typeNameSafe.includes('database')) return '🗄️';
    return '📋';
  };

  const getDisplayType = (source: DataSourceInfo) => {
    const raw = ((source as any).providerType || (source as any).provider_type || '').toLowerCase();
    if (raw.includes('database_mysql')) return 'MySQL';
    if (raw.includes('database_postgresql')) return 'PostgreSQL';
    if (raw === 'json') return 'JSON';
    if (raw === 'csv') return 'CSV';
    if (raw === 'excel') return 'Excel';
    if (raw.startsWith('api')) return 'API';
    if (raw.startsWith('database')) return 'Database';
    return (source as any).providerType || (source as any).provider_type || 'Unknown';
  };

  return (
    <div class="data-source-card" data-active={props.active ? 'true' : 'false'}>
      <div class="card-header">
        <div class="card-title">
          <span class="type-icon">{getTypeIcon(props.source.providerType)}</span>
          <h4>
            {props.source.name}
            <Show when={props.active}>
              <span class="active-badge" title="当前激活">当前</span>
            </Show>
          </h4>
        </div>
        <div 
          class="status-indicator" 
          style={{ 'background-color': getStatusColor(props.source.status) }}
          title={`状态: ${getStatusText(props.source.status)}`}
        />
      </div>

      <div class="card-meta">
        <div class="meta-row">
          <span class="meta-label">类型:</span>
          <span class="meta-value">{getDisplayType(props.source)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">状态:</span>
          <span class="meta-value">{getStatusText(props.source.status)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">最后更新:</span>
          <span class="meta-value">{formatDate(props.source.lastUpdated)}</span>
        </div>
      </div>

      <div class="card-actions">
        <button 
          class="action-btn preview-btn"
          onClick={props.onPreview}
          disabled={props.source.status !== 'active'}
          title="预览数据"
        >
          👁️ 预览
        </button>
        <button 
          class="action-btn test-btn"
          onClick={props.onTest}
          title="测试连接"
        >
          🔌 测试
        </button>
        <button 
          class="action-btn edit-btn"
          onClick={props.onEdit}
          title="编辑配置"
        >
          ✏️ 编辑
        </button>
        <button 
          class="action-btn test-btn"
          onClick={props.onActivate}
          title="设为当前数据源"
          disabled={props.active}
        >
          ⭐ 设为当前
        </button>
        <button 
          class="action-btn delete-btn"
          onClick={props.onDelete}
          title="删除数据源"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  );
}

export default DataSourceManagementCenter;
