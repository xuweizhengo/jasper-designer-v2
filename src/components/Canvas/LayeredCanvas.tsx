/**
 * 新的分层画布组件
 * 使用分层渲染架构
 */

import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import { LayerManager } from '../../renderer/layers/LayerManager';
import { toRenderableElement } from '../../renderer/core/interfaces';
import type { RenderableElement } from '../../renderer/core/interfaces';

interface LayeredCanvasProps {
  mode?: 'design' | 'data' | 'preview' | 'export';
  rendererType?: 'canvas' | 'skia' | 'auto';
}

/**
 * 分层画布组件
 * 演示如何使用新的渲染架构
 */
const LayeredCanvas: Component<LayeredCanvasProps> = (props) => {
  const { state, selectElement, clearSelection, updateElement } = useAppContext();

  let containerRef: HTMLDivElement | undefined;
  let layerManager: LayerManager | null = null;

  onMount(async () => {
    if (!containerRef) return;

    console.log('初始化分层画布...');

    // 创建分层管理器
    layerManager = new LayerManager({
      container: containerRef,
      mode: props.mode || 'design',
      rendererType: props.rendererType || 'canvas',
      enableInteraction: true,
      enableFeedback: true,
    });

    // 绑定事件处理
    setupEventHandlers();

    // 初始渲染
    renderElements();
  });

  onCleanup(() => {
    console.log('清理分层画布...');
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
      layerManager.switchMode(mode);
    }
  });

  /**
   * 设置事件处理器
   */
  const setupEventHandlers = () => {
    if (!layerManager) return;

    // 选择事件
    layerManager.on('select', async (data: any) => {
      console.log('选择元素:', data.elementId);
      if (data.elementId) {
        await selectElement(data.elementId);
      } else {
        await clearSelection();
      }
    });

    // 拖拽事件
    layerManager.on('drag', (data: any) => {
      console.log('拖拽元素:', data);
      if (data.elementId && data.delta) {
        // 更新元素位置（预览）
        const element = state.elements.find(e => e.id === data.elementId);
        if (element) {
          // 这里可以更新临时位置，显示拖拽预览
        }
      }
    });

    // 拖拽结束
    layerManager.on('dragend', async (data: any) => {
      console.log('拖拽结束:', data);
      if (data.elementId && data.point) {
        const element = state.elements.find(e => e.id === data.elementId);
        if (element) {
          // 更新实际位置
          await updateElement(data.elementId, {
            position: {
              x: data.point.x,
              y: data.point.y,
            }
          });
        }
      }
    });

    // 悬停事件
    layerManager.on('hover', (data: any) => {
      if (data.elementId) {
        console.log('悬停元素:', data.elementId);
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

    // 渲染
    layerManager.render(renderableElements);

    // 更新选中状态
    layerManager.selectElements([...state.selected_ids]);
  };

  return (
    <div class="layered-canvas-container">
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

      {/* 性能监控（可选） */}
      {props.mode === 'design' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            'font-size': '12px',
            'font-family': 'monospace',
            'border-radius': '4px',
            'pointer-events': 'none',
          }}
        >
          <div>渲染器: {props.rendererType || 'canvas'}</div>
          <div>模式: {props.mode || 'design'}</div>
          <div>元素数: {state.elements.length}</div>
          <div>选中数: {state.selected_ids.length}</div>
        </div>
      )}
    </div>
  );
};

export default LayeredCanvas;