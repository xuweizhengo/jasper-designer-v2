import { Component, createSignal, Show } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';

const Toolbar: Component = () => {
  const { state, undo, redo, updateCanvasConfig } = useAppContext();
  const [zoomValue, setZoomValue] = createSignal(state.canvas_config.zoom * 100);

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

  return (
    <div class="h-12 bg-primary border-b border-default flex items-center justify-between px-4">
      {/* Left Section - File Operations */}
      <div class="flex items-center gap-2">
        <button class="toolbar-btn" title="新建 (Ctrl+N)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>新建</span>
        </button>
        
        <button class="toolbar-btn" title="打开 (Ctrl+O)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>打开</span>
        </button>
        
        <button class="toolbar-btn" title="保存 (Ctrl+S)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>保存</span>
        </button>

        <div class="w-px h-6 bg-border-default mx-2" />

        <button class="toolbar-btn" title="预览">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>预览</span>
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