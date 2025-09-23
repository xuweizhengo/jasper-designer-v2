/**
 * 统一画布组件
 * 使用双接口渲染架构
 * 根据模式自动切换渲染器
 */

import { Component, onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import { LayerManager } from '../../renderer/layers/LayerManager';
import { toRenderableElement } from '../../renderer/core/interfaces';
import type { RenderableElement } from '../../renderer/core/interfaces';
import { ExportFormat } from '../../renderer/core/export-interfaces';

interface UnifiedCanvasProps {
  mode?: 'design' | 'data' | 'preview' | 'export';
  onExport?: (format: ExportFormat, data: Blob) => void;
}

/**
 * 统一画布组件
 * 自动根据模式选择合适的渲染器
 */
const UnifiedCanvas: Component<UnifiedCanvasProps> = (props) => {
  const { state, selectElement, clearSelection, updateElement } = useAppContext();

  let containerRef: HTMLDivElement | undefined;
  let layerManager: LayerManager | null = null;

  // 性能统计
  const [fps, setFps] = createSignal(0);
  const [currentRenderer, setCurrentRenderer] = createSignal<string>('');

  onMount(async () => {
    if (!containerRef) return;

    console.log('初始化统一画布，模式:', props.mode);

    // 创建分层管理器
    layerManager = new LayerManager({
      container: containerRef,
      mode: props.mode || 'design',
      enableInteraction: props.mode !== 'export',
      enableFeedback: props.mode === 'design' || props.mode === 'data',
    });

    // 更新当前渲染器类型
    updateRendererInfo();

    // 绑定事件处理
    setupEventHandlers();

    // 初始渲染
    renderElements();

    // 启动性能监控
    if (props.mode === 'design' || props.mode === 'data') {
      startPerformanceMonitoring();
    }
  });

  onCleanup(() => {
    console.log('清理统一画布');
    if (layerManager) {
      layerManager.dispose();
      layerManager = null;
    }
  });

  // 监听元素变化
  createEffect(() => {
    renderElements();
  });

  // 监听模式变化
  createEffect(() => {
    const mode = props.mode;
    if (layerManager && mode) {
      console.log(`切换到 ${mode} 模式`);
      layerManager.switchMode(mode).then(() => {
        updateRendererInfo();
        renderElements();
      });
    }
  });

  /**
   * 更新渲染器信息
   */
  const updateRendererInfo = () => {
    if (!layerManager) return;

    const mode = props.mode || 'design';
    if (mode === 'design' || mode === 'data') {
      setCurrentRenderer('Canvas 2D (快速交互)');
    } else if (mode === 'preview' || mode === 'export') {
      setCurrentRenderer('Skia (高质量渲染)');
    }
  };

  /**
   * 设置事件处理器
   */
  const setupEventHandlers = () => {
    if (!layerManager) return;

    // 选择事件
    layerManager.on('select', async (data: any) => {
      if (data.elementId) {
        await selectElement(data.elementId);
      } else {
        await clearSelection();
      }
    });

    // 拖拽事件
    layerManager.on('drag', (data: any) => {
      if (data.elementId && data.delta) {
        // 预览拖拽（使用设计渲染器的快速预览）
        const designRenderer = layerManager!.getDesignRenderer();
        if (designRenderer) {
          const element = state.elements.find(e => e.id === data.elementId);
          if (element) {
            const renderable = toRenderableElement(element);
            designRenderer.renderDragPreview(renderable, data.delta);
          }
        }
      }
    });

    // 拖拽结束
    layerManager.on('dragend', async (data: any) => {
      if (data.elementId && data.point) {
        const element = state.elements.find(e => e.id === data.elementId);
        if (element) {
          await updateElement(data.elementId, {
            position: {
              x: data.point.x,
              y: data.point.y,
            }
          });

          // 清除拖拽预览
          const designRenderer = layerManager!.getDesignRenderer();
          if (designRenderer) {
            designRenderer.clearDragPreview();
          }
        }
      }
    });

    // 悬停事件
    layerManager.on('hover', (data: any) => {
      if (data.elementId) {
        // 可以显示工具提示或高亮
      }
    });

    // 框选事件
    layerManager.on('selection-box', (data: any) => {
      if (data.start && data.end) {
        const designRenderer = layerManager!.getDesignRenderer();
        if (designRenderer) {
          designRenderer.renderSelectionBox(data.start, data.end);
        }
      }
    });
  };

  /**
   * 渲染元素
   */
  const renderElements = () => {
    if (!layerManager) return;

    // 转换元素为可渲染格式
    const renderableElements: RenderableElement[] = state.elements
      .filter(element => element.visible)
      .map(element => toRenderableElement(element));

    // 使用分层管理器渲染
    layerManager.render(renderableElements);

    // 更新选中状态
    layerManager.selectElements([...state.selected_ids]);
  };

  /**
   * 性能监控
   */
  const startPerformanceMonitoring = () => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateStats = () => {
      if (!layerManager) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        frameCount = 0;
        lastTime = currentTime;

        // 获取渲染器统计
        const designRenderer = layerManager.getDesignRenderer();
        if (designRenderer) {
          // TODO: 从渲染器获取统计信息
        }
      }

      frameCount++;
      requestAnimationFrame(updateStats);
    };

    requestAnimationFrame(updateStats);
  };

  /**
   * 导出功能
   */
  const handleExport = async (format: ExportFormat) => {
    if (!layerManager) return;

    const exportRenderer = layerManager.getExportRenderer();
    if (!exportRenderer) {
      console.error('导出渲染器未初始化');
      return;
    }

    try {
      const renderableElements: RenderableElement[] = state.elements
        .filter(element => element.visible)
        .map(element => toRenderableElement(element));

      let blob: Blob;

      switch (format) {
        case ExportFormat.PNG:
        case ExportFormat.JPEG:
        case ExportFormat.WEBP:
          blob = await exportRenderer.exportImage(
            renderableElements,
            format as 'png' | 'jpeg' | 'webp',
            { quality: 0.9, scale: 2 }
          );
          break;

        case ExportFormat.PDF:
          blob = await exportRenderer.exportPDF(
            [renderableElements], // 单页
            {
              pageSize: 'A4',
              orientation: 'portrait',
              margins: { top: 20, right: 20, bottom: 20, left: 20 },
            }
          );
          break;

        case ExportFormat.SVG:
          const svg = await exportRenderer.exportSVG(renderableElements, {
            embedImages: true,
            embedFonts: true,
          });
          blob = new Blob([svg], { type: 'image/svg+xml' });
          break;

        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }

      // 回调
      if (props.onExport) {
        props.onExport(format, blob);
      }

      // 或者直接下载
      downloadBlob(blob, `export.${format.toLowerCase()}`);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  /**
   * 下载 Blob
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="unified-canvas-container">
      {/* 画布容器 */}
      <div
        ref={containerRef}
        class="canvas-viewport"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#f5f5f5',
        }}
      />

      {/* 性能监控面板 */}
      {(props.mode === 'design' || props.mode === 'data') && (
        <div class="performance-panel">
          <div>FPS: {fps()}</div>
          <div>渲染器: {currentRenderer()}</div>
          <div>模式: {props.mode}</div>
          <div>元素数: {state.elements.length}</div>
          <div>选中: {state.selected_ids.length}</div>
        </div>
      )}

      {/* 导出按钮（预览模式） */}
      {props.mode === 'preview' && (
        <div class="export-toolbar">
          <button onClick={() => handleExport(ExportFormat.PNG)}>
            导出 PNG
          </button>
          <button onClick={() => handleExport(ExportFormat.PDF)}>
            导出 PDF
          </button>
          <button onClick={() => handleExport(ExportFormat.SVG)}>
            导出 SVG
          </button>
        </div>
      )}

      <style>{`
        .unified-canvas-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .performance-panel {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 12px;
          font-family: monospace;
          border-radius: 4px;
          pointer-events: none;
          z-index: 1000;
        }

        .performance-panel div {
          margin: 2px 0;
        }

        .export-toolbar {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .export-toolbar button {
          padding: 8px 16px;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .export-toolbar button:hover {
          background: #0052cc;
        }
      `}</style>
    </div>
  );
};

export default UnifiedCanvas;