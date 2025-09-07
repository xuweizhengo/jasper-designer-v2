import { Component, createSignal, Show } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import { PreviewModeToggle } from '../../stores/PreviewModeContext';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { TemplateAPI } from '../../api/template';
import { AppStateConverter } from '../../utils/template-conversion';
import '../../stores/PreviewModeContext.css';

interface ToolbarProps {
  onOpenDataSources: () => void;
}

const Toolbar: Component<ToolbarProps> = (props) => {
  const { state, undo, redo, updateCanvasConfig, setState } = useAppContext();
  const [zoomValue, setZoomValue] = createSignal(state.canvas_config.zoom * 100);

  // Template operations
  const handleNewTemplate = async () => {
    try {
      const newTemplate = await TemplateAPI.createEmptyTemplate();
      const newAppState = AppStateConverter.toAppState(newTemplate);
      setState(newAppState);
      console.log('✅ 新建模板成功');
    } catch (error) {
      console.error('❌ 新建模板失败:', error);
      alert('新建模板失败');
    }
  };

  const handleOpenTemplate = async () => {
    try {
      const filePath = await open({
        title: '打开模板文件',
        filters: [{
          name: 'Jasper模板',
          extensions: ['jasper', 'jbin', 'jrxml']
        }],
        multiple: false
      });

      if (filePath && typeof filePath === 'string') {
        const template = await TemplateAPI.loadTemplate(filePath);
        const appState = AppStateConverter.toAppState(template);
        setState({ ...appState, template_name: template.metadata.description || '未命名模板' });
        console.log('✅ 模板加载成功:', filePath);
      }
    } catch (error) {
      console.error('❌ 加载模板失败:', error);
      alert('加载模板失败');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const filePath = await save({
        title: '保存模板文件',
        filters: [{
          name: 'Jasper模板',
          extensions: ['jasper']
        }],
        defaultPath: state.template_name || '未命名模板'
      });

      if (filePath) {
        const template = AppStateConverter.toJasperTemplate(state, {
          description: state.template_name || '未命名模板'
        });
        await TemplateAPI.saveTemplate(template, filePath);
        console.log('✅ 模板保存成功:', filePath);
      }
    } catch (error) {
      console.error('❌ 保存模板失败:', error);
      alert('保存模板失败');
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    const zoom = newZoom / 100;
    setZoomValue(newZoom);
    
    try {
      await updateCanvasConfig({ zoom });
    } catch (error) {
      console.error('Failed to update zoom:', error);
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoomValue() + 25, 500);
    handleZoomChange(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomValue() - 25, 25);
    handleZoomChange(newZoom);
  };

  // const resetZoom = () => {
  //   handleZoomChange(100);
  // };

  const toggleGrid = async () => {
    try {
      await updateCanvasConfig({ show_grid: !state.canvas_config.show_grid });
    } catch (error) {
      console.error('Failed to toggle grid:', error);
    }
  };

  const toggleRulers = async () => {
    try {
      await updateCanvasConfig({ show_rulers: !state.canvas_config.show_rulers });
    } catch (error) {
      console.error('Failed to toggle rulers:', error);
    }
  };

  const toggleDevTools = async () => {
    try {
      await invoke('toggle_devtools');
      console.log('🔧 DevTools toggled');
    } catch (error) {
      console.error('Failed to toggle DevTools:', error);
    }
  };

  return (
    <div class="h-12 bg-primary border-b border-default flex items-center justify-between px-4">
      {/* Left Section - File Operations */}
      <div class="flex items-center gap-2">
        <button 
          class="toolbar-btn" 
          onClick={handleNewTemplate}
          title="新建模板 (Ctrl+N)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>新建</span>
        </button>
        
        <button 
          class="toolbar-btn" 
          onClick={handleOpenTemplate}
          title="打开模板 (Ctrl+O)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>打开</span>
        </button>
        
        <button 
          class="toolbar-btn" 
          onClick={handleSaveTemplate}
          title="保存模板 (Ctrl+S)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>保存</span>
        </button>

        <div class="w-px h-6 bg-border-default mx-2" />

        {/* 预览模式切换 */}
        <PreviewModeToggle />

        <button 
          class="toolbar-btn" 
          onClick={() => {
            console.log('🔄 数据源按钮被点击！');
            props.onOpenDataSources();
          }} 
          title="数据源管理"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <span>数据源</span>
        </button>


        {/* 输出预览按钮 - 预留功能 */}
        <button 
          class="toolbar-btn opacity-50 cursor-not-allowed"
          disabled={true}
          onClick={() => {
            alert('📄 输出预览即将推出！\n\n✨ 即将支持的功能：\n• PDF格式预览\n• 打印效果预览\n• 分页显示\n• 导出设置');
          }}
          title="输出预览 - 即将推出 (PDF/打印预览功能)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>输出预览</span>
        </button>
      </div>

      {/* Center Section - Edit Operations */}
      <div class="flex items-center gap-2">
        <button 
          class={`toolbar-btn-icon ${!state.can_undo ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!state.can_undo}
          onClick={undo}
          title={`撤销${state.undo_description ? ` (${state.undo_description})` : ''} (Ctrl+Z)`}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button 
          class={`toolbar-btn-icon ${!state.can_redo ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!state.can_redo}
          onClick={redo}
          title={`重做${state.redo_description ? ` (${state.redo_description})` : ''} (Ctrl+Y)`}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div class="w-px h-6 bg-border-default mx-2" />

        {/* Zoom Controls */}
        <button 
          class="toolbar-btn-icon" 
          onClick={zoomOut}
          title="缩小 (Ctrl+-)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        <select 
          class="zoom-select"
          value={`${Math.round(zoomValue())}%`}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'fit') {
              // TODO: Implement fit to window
              console.log('Fit to window');
            } else {
              const zoom = parseInt(value.replace('%', ''));
              handleZoomChange(zoom);
            }
          }}
        >
          <option value="25%">25%</option>
          <option value="50%">50%</option>
          <option value="75%">75%</option>
          <option value="100%">100%</option>
          <option value="125%">125%</option>
          <option value="150%">150%</option>
          <option value="200%">200%</option>
          <option value="fit">适应窗口</option>
        </select>

        <button 
          class="toolbar-btn-icon" 
          onClick={zoomIn}
          title="放大 (Ctrl++)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <div class="w-px h-6 bg-border-default mx-2" />

        {/* View Options */}
        <button 
          class={`toolbar-btn-icon ${state.canvas_config.show_grid ? 'active' : ''}`}
          onClick={toggleGrid}
          title="显示网格 (Ctrl+G)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </button>

        <button 
          class={`toolbar-btn-icon ${state.canvas_config.show_rulers ? 'active' : ''}`}
          onClick={toggleRulers}
          title="显示标尺 (Ctrl+R)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v14a2 2 0 01-2 2H7zM20 3v18l-4-4V7l4-4z" />
          </svg>
        </button>

        <div class="w-px h-6 bg-border-default mx-2" />

        {/* Debug Button */}
        <button 
          class="toolbar-btn-icon bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
          onClick={toggleDevTools}
          title="开启/关闭开发者工具 (F12)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Right Section - Status */}
      <div class="flex items-center gap-2 text-secondary text-sm">
        <Show when={state.dirty}>
          <span class="text-warning">●</span>
        </Show>
        <span>
          {state.template_name || '未命名模板'}
        </span>
        <Show when={state.elements.length > 0}>
          <span class="ml-2">
            {state.elements.length} 个元素
          </span>
        </Show>
        <Show when={state.selected_ids.length > 0}>
          <span class="ml-2 text-primary">
            已选择 {state.selected_ids.length} 个
          </span>
        </Show>
      </div>
    </div>
  );
};

export default Toolbar;