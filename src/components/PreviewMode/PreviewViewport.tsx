import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { KonvaRenderer } from './renderers/KonvaRenderer';
import FloatingToolbar, { PreviewMode } from './controls/FloatingToolbar';
import { useAppContext } from '../../stores/AppContext';
import { usePreview } from '../../stores/PreviewModeContext';
import type { ReportElement } from '../../types';

interface PreviewViewportProps {
  elements?: ReportElement[];
  pageSize?: { width: number; height: number };
  pageCount?: number;
}

export const PreviewViewport: Component<PreviewViewportProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let renderer: KonvaRenderer | null = null;
  
  const { state: appState } = useAppContext();
  const { actions: previewActions } = usePreview();
  
  const [currentPage, setCurrentPage] = createSignal(1);
  const [zoom, setZoom] = createSignal(100);
  const [previewMode, setPreviewMode] = createSignal<PreviewMode>('presentation');
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [stagePosition, setStagePosition] = createSignal({ x: 0, y: 0 });
  
  // 获取要渲染的元素
  const getElements = () => {
    return props.elements || appState.elements;
  };
  
  // 获取总页数
  const getTotalPages = () => {
    return props.pageCount || 1;
  };
  
  // 初始化渲染器
  onMount(() => {
    if (!containerRef) return;
    
    console.log('🎨 初始化Konva渲染器');
    
    renderer = new KonvaRenderer(containerRef, {
      width: props.pageSize?.width || 794, // A4 width in pixels at 96 DPI
      height: props.pageSize?.height || 1123, // A4 height in pixels at 96 DPI
      background: '#ffffff',
    });
    
    // 渲染初始元素
    renderCurrentPage();
    
    // 设置键盘快捷键
    setupKeyboardShortcuts();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
  });
  
  // 清理
  onCleanup(() => {
    if (renderer) {
      renderer.destroy();
      renderer = null;
    }
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  // 监听元素变化
  createEffect(() => {
    const elements = getElements();
    if (renderer && elements) {
      renderCurrentPage();
    }
  });
  
  // 渲染当前页
  const renderCurrentPage = () => {
    if (!renderer) return;
    
    const elements = getElements();
    const page = currentPage();
    
    // TODO: 根据页码过滤元素
    // 现在暂时渲染所有元素
    renderer.render([...elements]);
    
    console.log(`📄 渲染第 ${page} 页，共 ${elements.length} 个元素`);
  };
  
  // 处理页面切换
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    renderCurrentPage();
  };
  
  // 处理缩放变化
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (renderer) {
      renderer.setScale(newZoom / 100);
    }
  };
  
  // 适应屏幕
  const handleFitScreen = () => {
    if (!renderer || !containerRef) return;
    
    const containerRect = containerRef.getBoundingClientRect();
    const pageWidth = props.pageSize?.width || 794;
    const pageHeight = props.pageSize?.height || 1123;
    
    const scaleX = (containerRect.width - 100) / pageWidth;
    const scaleY = (containerRect.height - 100) / pageHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    handleZoomChange(Math.round(scale * 100));
    
    // 居中显示
    const x = (containerRect.width - pageWidth * scale) / 2;
    const y = (containerRect.height - pageHeight * scale) / 2;
    renderer.setPosition(x, y);
    setStagePosition({ x, y });
  };
  
  // 实际大小
  const handleActualSize = () => {
    handleZoomChange(100);
    if (renderer) {
      renderer.setPosition(0, 0);
      setStagePosition({ x: 0, y: 0 });
    }
  };
  
  // 导出
  const handleExport = async () => {
    console.log('📤 导出预览');
    
    if (renderer) {
      try {
        const dataUrl = await renderer.toDataURL({ pixelRatio: 2 });
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `preview-page-${currentPage()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('导出失败:', error);
      }
    }
  };
  
  // 打印
  const handlePrint = () => {
    console.log('🖨️ 打印预览');
    window.print();
  };
  
  // 退出预览
  const handleExit = () => {
    console.log('🚪 退出预览模式');
    previewActions.setMode('design');
  };
  
  // 模式切换
  const handleModeChange = (mode: PreviewMode) => {
    setPreviewMode(mode);
    console.log(`🔄 切换到${mode}模式`);
    
    // TODO: 根据模式显示不同的辅助信息
    switch (mode) {
      case 'presentation':
        // 隐藏所有辅助信息
        break;
      case 'development':
        // 显示尺寸标注、间距等
        break;
      case 'print':
        // 显示页边距、分页线等
        break;
    }
  };
  
  // 处理窗口大小变化
  const handleResize = () => {
    if (renderer) {
      renderer.fitToContainer();
    }
  };
  
  // 鼠标拖拽平移
  const handleMouseDown = (e: MouseEvent) => {
    // 按住空格键才能拖拽
    if (e.button === 0 && e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || !renderer) return;
    
    const deltaX = e.clientX - dragStart().x;
    const deltaY = e.clientY - dragStart().y;
    
    const newPosition = {
      x: stagePosition().x + deltaX,
      y: stagePosition().y + deltaY,
    };
    
    renderer.setPosition(newPosition.x, newPosition.y);
    setStagePosition(newPosition);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 鼠标滚轮缩放
  const handleWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    const newZoom = Math.max(10, Math.min(500, zoom() + delta));
    handleZoomChange(newZoom);
  };
  
  // 键盘快捷键
  const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', handleKeyDown);
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        handleExit();
        break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          handleFitScreen();
        }
        break;
      case '1':
        if (!e.ctrlKey && !e.metaKey) {
          handleActualSize();
        }
        break;
      case '+':
      case '=':
        handleZoomChange(Math.min(500, zoom() + 25));
        break;
      case '-':
      case '_':
        handleZoomChange(Math.max(10, zoom() - 25));
        break;
      case 'ArrowLeft':
        if (currentPage() > 1) {
          handlePageChange(currentPage() - 1);
        }
        break;
      case 'ArrowRight':
        if (currentPage() < getTotalPages()) {
          handlePageChange(currentPage() + 1);
        }
        break;
      case 'Home':
        handlePageChange(1);
        break;
      case 'End':
        handlePageChange(getTotalPages());
        break;
      case 'p':
      case 'P':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handlePrint();
        }
        break;
      case 'e':
      case 'E':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleExport();
        }
        break;
      case 'd':
      case 'D':
        if (!e.ctrlKey && !e.metaKey) {
          handleModeChange('development');
        }
        break;
    }
  };
  
  return (
    <div class="preview-viewport w-full h-full bg-gray-100 relative overflow-hidden">
      {/* 浮动工具栏 */}
      <FloatingToolbar
        currentPage={currentPage()}
        totalPages={getTotalPages()}
        zoom={zoom()}
        mode={previewMode()}
        onPageChange={handlePageChange}
        onZoomChange={handleZoomChange}
        onExport={handleExport}
        onPrint={handlePrint}
        onModeChange={handleModeChange}
        onFitScreen={handleFitScreen}
        onActualSize={handleActualSize}
        onExit={handleExit}
      />
      
      {/* 渲染容器 */}
      <div
        ref={containerRef}
        class="preview-container w-full h-full"
        style={{ cursor: isDragging() ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* 快捷键提示 (3秒后自动消失) */}
      <div class="shortcuts-hint absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-fade-out">
        <span class="bg-white px-3 py-1 rounded shadow">
          ESC 退出 • Shift+拖动 平移 • Ctrl+滚轮 缩放 • F 适应屏幕
        </span>
      </div>
    </div>
  );
};

export default PreviewViewport;