// === Safe Data Sources Panel (Minimal Version) ===
import { createSignal, Show } from 'solid-js';
import './DataSourcesPanel.css';

interface DataSourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourcesPanelSafe(props: DataSourcesPanelProps) {
  const [error, setError] = createSignal<string | null>(null);
  const [testMessage, setTestMessage] = createSignal('数据源模块正在初始化...');

  const handleTest = async () => {
    try {
      setTestMessage('正在测试Tauri连接...');
      console.log('🧪 测试Tauri连接...');
      
      // 简单测试invoke是否工作
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      setTestMessage('正在测试数据源API...');
      
      // 测试数据源命令是否可用
      const types = await invoke('get_available_data_source_types') as any[];
      console.log('✅ 数据源类型获取成功:', types);
      setTestMessage(`✅ 测试成功！找到 ${Array.isArray(types) ? types.length : 0} 种数据源类型`);
      
    } catch (err) {
      console.error('❌ 测试失败:', err);
      setError(`测试失败: ${err}`);
      setTestMessage('❌ 测试失败，请查看控制台');
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="data-sources-panel">
        <div class="panel-header">
          <h2>数据源管理 (安全测试版)</h2>
          <button class="close-btn" onClick={props.onClose}>×</button>
        </div>

        <div class="panel-content">
          <div style="padding: 20px;">
            <p>{testMessage()}</p>
            
            <Show when={error()}>
              <div class="error-message" style="margin: 10px 0;">
                {error()}
              </div>
            </Show>
            
            <div style="margin-top: 20px;">
              <button 
                class="add-btn" 
                onClick={handleTest}
              >
                🧪 测试数据源连接
              </button>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #666;">
              <p>这是数据源模块的安全测试版本。</p>
              <p>如果测试成功，说明后端连接正常。</p>
              <p>如果测试失败，请检查控制台错误信息。</p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}