import { Component, createSignal, createEffect, createMemo, Show, For } from 'solid-js';
import { dataContextManager } from '../../stores/DataContextManager';
import type { DataContext } from '../../types/data-binding';
import './DataContextPanel.css';

/**
 * JSON数据源上下文面板组件
 * 
 * 功能特性:
 * 1. 显示当前数据源信息和状态
 * 2. 数据记录导航控制
 * 3. 当前记录数据预览
 * 4. 可用字段列表展示
 * 5. 错误状态处理和显示
 */
const DataContextPanel: Component = () => {
  // 响应式数据上下文
  const [context, setContext] = createSignal<DataContext | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  // 订阅数据上下文变化
  createEffect(() => {
    const unsubscribe = dataContextManager.subscribe((newContext) => {
      setContext(newContext);
    });

    // 初始化时获取当前上下文
    setContext(dataContextManager.getCurrentContext());

    // 清理订阅
    return unsubscribe;
  });

  // 计算状态指示器
  const statusInfo = createMemo(() => {
    const ctx = context();
    if (!ctx) {
      return { 
        text: '未选择数据源', 
        color: '#666', 
        icon: '📂' 
      };
    }

    switch (ctx.dataSource.status) {
      case 'ready':
        return { 
          text: `数据已就绪 - ${ctx.dataSource.name}`, 
          color: '#52c41a', 
          icon: '✅' 
        };
      case 'loading':
        return { 
          text: '正在加载数据...', 
          color: '#1890ff', 
          icon: '⏳' 
        };
      case 'error':
        return { 
          text: '数据加载失败', 
          color: '#ff4d4f', 
          icon: '❌' 
        };
      case 'empty':
        return { 
          text: '数据源为空', 
          color: '#faad14', 
          icon: '📭' 
        };
      default:
        return { 
          text: '未知状态', 
          color: '#666', 
          icon: '❓' 
        };
    }
  });

  // 记录导航处理
  const handleNavigateNext = async () => {
    setIsLoading(true);
    try {
      await dataContextManager.navigateNext();
    } catch (error) {
      console.error('导航到下一记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigatePrevious = async () => {
    setIsLoading(true);
    try {
      await dataContextManager.navigatePrevious();
    } catch (error) {
      console.error('导航到上一记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化数据值用于显示
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(空)';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // 获取数据类型显示文本
  const getTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'string': '文本',
      'number': '数字', 
      'boolean': '布尔',
      'date': '日期',
      'object': '对象',
      'array': '数组'
    };
    return typeMap[type] || type;
  };

  return (
    <div class="data-context-panel">
      {/* 面板标题 */}
      <div class="panel-header">
        <h3 class="panel-title">📋 数据上下文</h3>
        <div class="status-indicator">
          <span class="status-icon">{statusInfo().icon}</span>
          <span class="status-text" style={{ color: statusInfo().color }}>
            {statusInfo().text}
          </span>
        </div>
      </div>

      <Show when={context()}>
        {(ctx) => (
          <div class="context-content">
            {/* 数据源信息区域 */}
            <div class="section">
              <div class="section-header">
                <h4 class="section-title">🗄️ 数据源信息</h4>
              </div>
              <div class="data-source-info">
                <div class="info-item">
                  <span class="info-label">名称:</span>
                  <span class="info-value">{ctx().dataSource.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">类型:</span>
                  <span class="info-value">{ctx().dataSource.type.toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">ID:</span>
                  <span class="info-value info-id">{ctx().dataSource.id}</span>
                </div>
              </div>
            </div>

            {/* 记录导航区域 */}
            <div class="section">
              <div class="section-header">
                <h4 class="section-title">🔢 记录导航</h4>
              </div>
              <div class="navigation-controls">
                <button 
                  class="nav-button"
                  onClick={handleNavigatePrevious}
                  disabled={isLoading() || ctx().currentRecord.index <= 0}
                  title="上一条记录"
                >
                  ⬅️
                </button>
                <span class="record-info">
                  {ctx().currentRecord.index + 1} / {ctx().currentRecord.total}
                </span>
                <button 
                  class="nav-button"
                  onClick={handleNavigateNext}
                  disabled={isLoading() || ctx().currentRecord.index >= ctx().currentRecord.total - 1}
                  title="下一条记录"
                >
                  ➡️
                </button>
              </div>
            </div>

            {/* 当前记录数据预览 */}
            <div class="section">
              <div class="section-header">
                <h4 class="section-title">📋 当前记录</h4>
              </div>
              <Show when={Object.keys(ctx().currentRecord.data).length > 0}>
                <div class="current-record">
                  <For each={Object.entries(ctx().currentRecord.data)}>
                    {([key, value]) => (
                      <div class="record-field">
                        <div class="field-key">{key}:</div>
                        <div class="field-value">{formatValue(value)}</div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              <Show when={Object.keys(ctx().currentRecord.data).length === 0}>
                <div class="empty-record">暂无记录数据</div>
              </Show>
            </div>

            {/* 可用字段列表 */}
            <div class="section">
              <div class="section-header">
                <h4 class="section-title">🔍 可用字段</h4>
                <div class="field-count">({ctx().fields.length} 个字段)</div>
              </div>
              <Show when={ctx().fields.length > 0}>
                <div class="available-fields">
                  <For each={ctx().fields}>
                    {(field) => (
                      <div class="field-item">
                        <div class="field-header">
                          <span class="field-name">{field.name}</span>
                          <span class="field-type">({getTypeDisplay(field.type)})</span>
                        </div>
                        <Show when={field.displayName && field.displayName !== field.name}>
                          <div class="field-display-name">{field.displayName}</div>
                        </Show>
                        <Show when={field.sample !== undefined}>
                          <div class="field-sample">
                            示例: {formatValue(field.sample)}
                          </div>
                        </Show>
                        <div class="field-expression">
                          表达式: <code>{`{${field.name}}`}</code>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              <Show when={ctx().fields.length === 0}>
                <div class="no-fields">暂无可用字段</div>
              </Show>
            </div>

            {/* 错误信息显示 */}
            <Show when={ctx().error}>
              {(error) => (
                <div class="section error-section">
                  <div class="section-header">
                    <h4 class="section-title error-title">❌ 错误信息</h4>
                  </div>
                  <div class="error-content">
                    <div class="error-type">错误类型: {error().type}</div>
                    <div class="error-message">错误描述: {error().message}</div>
                    <Show when={error().details}>
                      <details class="error-details">
                        <summary>详细信息</summary>
                        <pre class="error-details-content">
                          {JSON.stringify(error().details, null, 2)}
                        </pre>
                      </details>
                    </Show>
                  </div>
                </div>
              )}
            </Show>
          </div>
        )}
      </Show>

      <Show when={!context()}>
        <div class="empty-context">
          <div class="empty-icon">📭</div>
          <div class="empty-title">暂无数据源</div>
          <div class="empty-description">
            请在数据源面板中创建并选择一个数据源
          </div>
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="loading-overlay">
          <div class="loading-spinner">⏳</div>
          <div class="loading-text">加载中...</div>
        </div>
      </Show>
    </div>
  );
};

export default DataContextPanel;