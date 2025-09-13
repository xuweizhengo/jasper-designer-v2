import { Component, createSignal, onMount, Show } from 'solid-js';
import type { RenderResult } from '../../types/preview';

interface PreviewCanvasProps {
  result: RenderResult;
  onDownload?: (filename?: string) => void;
}

/**
 * 预览画布组件
 * 负责显示渲染结果，支持缩放、平移等交互
 */
export const PreviewCanvas: Component<PreviewCanvasProps> = (props) => {
  let canvasContainer: HTMLDivElement | undefined;
  let canvasElement: HTMLCanvasElement | undefined;
  
  const [zoom, setZoom] = createSignal(1);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = createSignal({ x: 0, y: 0 });
  const [fitMode, setFitMode] = createSignal<'fit' | 'width' | 'actual'>('fit');

  // 渲染预览内容
  onMount(() => {
    renderPreview();
  });

  // 当结果变化时重新渲染
  const renderPreview = () => {
    if (!canvasElement || !props.result?.data) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    // 根据格式类型处理渲染
    switch (props.result.format) {
      case 'png':
      case 'jpg':
      case 'webp':
        renderImageResult(ctx);
        break;
      case 'pdf':
        renderPdfPreview(ctx);
        break;
      case 'svg':
        renderSvgResult(ctx);
        break;
      case 'excel':
      case 'powerpoint':
        renderOfficePreview(ctx);
        break;
      default:
        renderFallbackPreview(ctx);
    }

    // 应用适应模式
    applyFitMode();
  };

  // 渲染图片结果
  const renderImageResult = (ctx: CanvasRenderingContext2D) => {
    const img = new Image();
    img.onload = () => {
      if (!canvasElement) return;
      
      // 调整画布大小
      canvasElement.width = img.width;
      canvasElement.height = img.height;
      
      // 绘制图片
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
    };
    
    // 创建图片URL
    const blob = new Blob([props.result.data as any], { 
      type: getMimeType(props.result.format) 
    });
    img.src = URL.createObjectURL(blob);
  };

  // 渲染PDF预览
  const renderPdfPreview = (ctx: CanvasRenderingContext2D) => {
    // PDF预览需要特殊处理，这里显示缩略图
    if (!canvasElement) return;
    
    canvasElement.width = 600;
    canvasElement.height = 800;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);
    
    // 绘制PDF图标和信息
    ctx.fillStyle = '#dc2626';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📄', 300, 200);
    
    ctx.fillStyle = '#374151';
    ctx.font = '24px sans-serif';
    ctx.fillText('PDF 文档', 300, 280);
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`大小: ${Math.round(props.result.fileSize / 1024)}KB`, 300, 320);
    ctx.fillText(`页数: ${props.result.metadata.pageCount}`, 300, 350);
    ctx.fillText(`渲染时间: ${props.result.renderTimeMs}ms`, 300, 380);
    
    // 绘制边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 500, 700);
  };

  // 渲染SVG结果
  const renderSvgResult = (ctx: CanvasRenderingContext2D) => {
    if (!props.result.data || !canvasElement) return;
    
    try {
      const svgText = new TextDecoder().decode(props.result.data as any);
      const img = new Image();
      
      img.onload = () => {
        canvasElement.width = img.width || 800;
        canvasElement.height = img.height || 600;
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(img, 0, 0);
      };
      
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('SVG渲染失败:', error);
      renderFallbackPreview(ctx);
    }
  };

  // 渲染Office文档预览
  const renderOfficePreview = (ctx: CanvasRenderingContext2D) => {
    if (!canvasElement) return;
    
    canvasElement.width = 600;
    canvasElement.height = 400;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 400);
    
    const icon = props.result.format === 'excel' ? '📊' : '📋';
    const title = props.result.format === 'excel' ? 'Excel 工作表' : 'PowerPoint 演示文稿';
    
    ctx.fillStyle = props.result.format === 'excel' ? '#16a34a' : '#dc2626';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 300, 150);
    
    ctx.fillStyle = '#374151';
    ctx.font = '24px sans-serif';
    ctx.fillText(title, 300, 200);
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`大小: ${Math.round(props.result.fileSize / 1024)}KB`, 300, 240);
    
    // 绘制边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 500, 300);
  };

  // 渲染失败预览
  const renderFallbackPreview = (ctx: CanvasRenderingContext2D) => {
    if (!canvasElement) return;
    
    canvasElement.width = 400;
    canvasElement.height = 300;
    
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, 400, 300);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📄', 200, 120);
    
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('预览不可用', 200, 160);
    
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('点击下载查看完整内容', 200, 190);
  };

  // 应用适应模式
  const applyFitMode = () => {
    if (!canvasContainer || !canvasElement) return;

    const containerRect = canvasContainer.getBoundingClientRect();
    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;

    let newZoom = 1;
    
    switch (fitMode()) {
      case 'fit':
        const scaleX = (containerRect.width - 40) / canvasWidth;
        const scaleY = (containerRect.height - 40) / canvasHeight;
        newZoom = Math.min(scaleX, scaleY, 1);
        break;
      case 'width':
        newZoom = (containerRect.width - 40) / canvasWidth;
        break;
      case 'actual':
        newZoom = 1;
        break;
    }

    setZoom(Math.max(0.1, Math.min(5, newZoom)));
    setCanvasOffset({ x: 0, y: 0 }); // 重置偏移
  };

  // 缩放控制
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // 鼠标拖拽
  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    const deltaX = e.clientX - dragStart().x;
    const deltaY = e.clientY - dragStart().y;
    
    setCanvasOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 获取MIME类型
  const getMimeType = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'application/octet-stream';
  };

  // 样式计算
  const canvasStyle = () => ({
    transform: `scale(${zoom()}) translate(${canvasOffset().x}px, ${canvasOffset().y}px)`,
    cursor: isDragging() ? 'grabbing' : 'grab',
    'transform-origin': 'center center'
  });

  return (
    <div class="preview-canvas-container h-full flex flex-col bg-tertiary">
      {/* 工具栏 */}
      <div class="canvas-toolbar flex items-center justify-between px-4 py-2 bg-primary border-b border-default">
        <div class="toolbar-left flex items-center gap-2">
          {/* 适应模式按钮 */}
          <div class="fit-controls flex items-center gap-1">
            <button
              class={`fit-btn px-2 py-1 text-xs rounded ${
                fitMode() === 'fit' ? 'bg-blue-500 text-white' : 'bg-secondary text-primary'
              }`}
              onClick={() => setFitMode('fit')}
            >
              适应
            </button>
            <button
              class={`fit-btn px-2 py-1 text-xs rounded ${
                fitMode() === 'width' ? 'bg-blue-500 text-white' : 'bg-secondary text-primary'
              }`}
              onClick={() => setFitMode('width')}
            >
              适宽
            </button>
            <button
              class={`fit-btn px-2 py-1 text-xs rounded ${
                fitMode() === 'actual' ? 'bg-blue-500 text-white' : 'bg-secondary text-primary'
              }`}
              onClick={() => setFitMode('actual')}
            >
              实际
            </button>
          </div>

          {/* 缩放控制 */}
          <div class="zoom-controls flex items-center gap-1">
            <button
              class="zoom-btn px-2 py-1 text-xs bg-secondary text-primary rounded hover:bg-tertiary"
              onClick={() => handleZoom(-0.1)}
            >
              -
            </button>
            <span class="zoom-display px-2 py-1 text-xs bg-tertiary text-primary rounded">
              {Math.round(zoom() * 100)}%
            </span>
            <button
              class="zoom-btn px-2 py-1 text-xs bg-secondary text-primary rounded hover:bg-tertiary"
              onClick={() => handleZoom(0.1)}
            >
              +
            </button>
          </div>
        </div>

        <div class="toolbar-right">
          <Show when={props.onDownload}>
            <button
              class="download-btn px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => props.onDownload?.()}
            >
              📥 下载
            </button>
          </Show>
        </div>
      </div>

      {/* 画布区域 */}
      <div 
        ref={canvasContainer}
        class="canvas-area flex-1 overflow-hidden flex items-center justify-center p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasElement}
          class="preview-canvas shadow-lg"
          style={canvasStyle()}
        />
      </div>

      {/* 状态信息 */}
      <div class="canvas-status px-4 py-2 bg-primary border-t border-default text-xs text-muted">
        <div class="flex justify-between items-center">
          <div>
            格式: {props.result.format.toUpperCase()} • 
            大小: {Math.round(props.result.fileSize / 1024)}KB • 
            渲染: {props.result.renderTimeMs}ms
          </div>
          <div>
            <Show when={props.result.metadata.dimensions}>
              {(dims) => (
                <span>
                  {dims().width} × {dims().height} {dims().unit}
                </span>
              )}
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;