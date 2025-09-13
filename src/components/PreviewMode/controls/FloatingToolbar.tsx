import { Component, createSignal, onMount, onCleanup } from 'solid-js';

export type PreviewMode = 'presentation' | 'development' | 'print';

interface FloatingToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  mode: PreviewMode;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onExport: () => void;
  onPrint: () => void;
  onModeChange: (mode: PreviewMode) => void;
  onFitScreen: () => void;
  onActualSize: () => void;
  onExit: () => void;
}

export const FloatingToolbar: Component<FloatingToolbarProps> = (props) => {
  const [opacity, setOpacity] = createSignal(1);
  const [isHovered, setIsHovered] = createSignal(false);
  
  let hideTimer: number | null = null;
  
  const startHideTimer = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!isHovered()) {
        setOpacity(0.3);
      }
    }, 3000);
  };
  
  const stopHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    setOpacity(1);
  };
  
  onMount(() => {
    startHideTimer();
  });
  
  onCleanup(() => {
    if (hideTimer) clearTimeout(hideTimer);
  });
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    stopHideTimer();
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    startHideTimer();
  };
  
  const handlePagePrev = () => {
    if (props.currentPage > 1) {
      props.onPageChange(props.currentPage - 1);
    }
  };
  
  const handlePageNext = () => {
    if (props.currentPage < props.totalPages) {
      props.onPageChange(props.currentPage + 1);
    }
  };
  
  const handleZoomIn = () => {
    const newZoom = Math.min(500, props.zoom + 25);
    props.onZoomChange(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(10, props.zoom - 25);
    props.onZoomChange(newZoom);
  };
  
  const handlePageInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement;
    const page = parseInt(input.value);
    if (!isNaN(page) && page >= 1 && page <= props.totalPages) {
      props.onPageChange(page);
    }
  };
  
  const handleZoomInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement;
    const zoom = parseInt(input.value);
    if (!isNaN(zoom) && zoom >= 10 && zoom <= 500) {
      props.onZoomChange(zoom);
    }
  };
  
  return (
    <div 
      class="floating-toolbar fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      style={{
        opacity: opacity(),
        transition: 'opacity 0.3s ease',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div class="toolbar-container flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg shadow-2xl">
        {/* 页面导航 */}
        <div class="page-nav flex items-center gap-1">
          <button
            class="nav-btn p-1 text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePagePrev}
            disabled={props.currentPage <= 1}
            title="上一页"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div class="page-display flex items-center gap-1 text-white text-sm">
            <input
              type="number"
              class="page-input w-12 px-1 py-0.5 bg-gray-800 text-center rounded outline-none focus:bg-gray-700"
              value={props.currentPage}
              min="1"
              max={props.totalPages}
              onInput={handlePageInput}
            />
            <span>/</span>
            <span>{props.totalPages}</span>
          </div>
          
          <button
            class="nav-btn p-1 text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePageNext}
            disabled={props.currentPage >= props.totalPages}
            title="下一页"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div class="divider w-px h-6 bg-gray-600" />
        
        {/* 缩放控制 */}
        <div class="zoom-controls flex items-center gap-1">
          <button
            class="zoom-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={handleZoomOut}
            title="缩小"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          
          <div class="zoom-display flex items-center gap-1 text-white text-sm">
            <input
              type="number"
              class="zoom-input w-14 px-1 py-0.5 bg-gray-800 text-center rounded outline-none focus:bg-gray-700"
              value={props.zoom}
              min="10"
              max="500"
              step="10"
              onInput={handleZoomInput}
            />
            <span>%</span>
          </div>
          
          <button
            class="zoom-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={handleZoomIn}
            title="放大"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            class="fit-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={props.onFitScreen}
            title="适应屏幕"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
          
          <button
            class="actual-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={props.onActualSize}
            title="实际大小"
          >
            <span class="text-xs font-bold">1:1</span>
          </button>
        </div>
        
        <div class="divider w-px h-6 bg-gray-600" />
        
        {/* 模式切换 */}
        <div class="mode-controls flex items-center gap-1">
          <button
            class={`mode-btn px-2 py-1 text-xs rounded ${
              props.mode === 'presentation' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => props.onModeChange('presentation')}
            title="演示模式"
          >
            演示
          </button>
          
          <button
            class={`mode-btn px-2 py-1 text-xs rounded ${
              props.mode === 'development' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => props.onModeChange('development')}
            title="开发模式"
          >
            开发
          </button>
          
          <button
            class={`mode-btn px-2 py-1 text-xs rounded ${
              props.mode === 'print' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => props.onModeChange('print')}
            title="打印模式"
          >
            打印
          </button>
        </div>
        
        <div class="divider w-px h-6 bg-gray-600" />
        
        {/* 快速操作 */}
        <div class="quick-actions flex items-center gap-1">
          <button
            class="action-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={props.onExport}
            title="导出"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <button
            class="action-btn p-1 text-white hover:bg-gray-700 rounded"
            onClick={props.onPrint}
            title="打印"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          
          <button
            class="exit-btn px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
            onClick={props.onExit}
            title="退出预览 (ESC)"
          >
            退出
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingToolbar;