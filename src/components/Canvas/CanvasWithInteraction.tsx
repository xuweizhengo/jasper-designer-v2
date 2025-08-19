/**
 * 新的Canvas组件 - 集成统一交互层
 * 这个版本完全消除了光标冲突和事件混乱问题
 */

import { Component, createMemo, onMount, createSignal, For, Show } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import CanvasGrid from './CanvasGrid';
import ElementRenderer from './ElementRenderer';
import ResizeHandles from './ResizeHandles';
import { SimpleInteractionLayer } from '../../interaction/components/SimpleInteractionLayer';
import { AlignmentToolbar } from '../alignment/AlignmentToolbar';
import type { Point } from '../../interaction/types/geometry-types';

const CanvasWithInteraction: Component = () => {
  const { 
    state, 
    selectElement, 
    clearSelection, 
    createElement, 
    selectMultiple,
    updateElement,
    batchUpdatePositions
  } = useAppContext();
  
  let canvasRef: SVGSVGElement | undefined;
  
  const [selectedElementIds, setSelectedElementIds] = createSignal<string[]>([]);
  
  // Calculate visible elements
  const visibleElements = createMemo(() => {
    return state.elements.filter(element => element.visible);
  });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    if (!canvasRef) return { x: 0, y: 0 };
    
    const rect = canvasRef.getBoundingClientRect();
    const canvasX = (screenX - rect.left) / state.canvas_config.zoom;
    const canvasY = (screenY - rect.top) / state.canvas_config.zoom;
    
    return { x: canvasX, y: canvasY };
  };

  // === 新交互系统的事件处理函数 ===

  const handleElementsSelect = async (elementIds: string[]) => {
    console.log('🎯 选择元素', elementIds);
    setSelectedElementIds([...elementIds]); // 创建可变副本
    
    try {
      if (elementIds.length === 0) {
        await clearSelection();
      } else if (elementIds.length === 1) {
        await selectElement(elementIds[0]!);
      } else {
        await selectMultiple([...elementIds]); // 创建可变副本
      }
    } catch (error) {
      console.error('❌ 选择元素失败:', error);
    }
  };

  const handleBatchUpdatePositions = async (updates: Array<{element_id: string, new_position: {x: number, y: number}}>) => {
    // 🔥 关键修复: 新增批量更新处理函数，提升多元素拖拽性能
    if (import.meta.env.DEV) {
      console.log('📦 批量更新位置', { count: updates.length, updates });
    }
    
    try {
      await batchUpdatePositions(updates);
    } catch (error) {
      console.error('❌ 批量更新位置失败:', error);
    }
  };

  const handleElementMove = async (elementId: string, newPosition: Point) => {
    // 移除频繁的日志输出以提升性能
    if (import.meta.env.DEV) {
      console.log('🚚 移动元素', elementId, newPosition);
    }
    
    try {
      await updateElement(elementId, {
        position: { x: newPosition.x, y: newPosition.y }
      });
    } catch (error) {
      console.error('❌ 移动元素失败:', error);
    }
  };

  const handleElementResize = async (elementId: string, newSize: { width: number; height: number }, newPosition: { x: number; y: number }) => {
    if (import.meta.env.DEV) {
      console.log('📏 调整元素大小', elementId, newSize, newPosition);
    }
    
    try {
      await updateElement(elementId, {
        size: newSize,
        position: newPosition
      });
    } catch (error) {
      console.error('❌ 调整大小失败:', error);
    }
  };

  const handleCanvasClick = async (point: Point) => {
    console.log('🖱️ 画布点击', point);
  };

  // Handle drop for creating elements (保留原有的拖放功能)
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    
    try {
      const dragData = event.dataTransfer?.getData('application/json');
      if (!dragData) return;
      
      const { type, component } = JSON.parse(dragData);
      
      if (type === 'component') {
        const { x, y } = screenToCanvas(event.clientX, event.clientY);
        
        const dropX = Math.max(0, x - component.default_size.width / 2);
        const dropY = Math.max(0, y - component.default_size.height / 2);
        
        console.log('🎯 通过拖放创建组件:', component.name, 'at', dropX, dropY);
        
        const elementId = await createElement(
          component.id,
          { x: dropX, y: dropY },
          component.default_size,
          component.create_content()
        );
        
        console.log('✅ 通过拖放创建元素成功:', elementId);
        
        // 自动选择新创建的元素
        setSelectedElementIds([elementId]);
        await selectElement(elementId);
      }
    } catch (error) {
      console.error('拖放处理失败:', error);
    }
  };

  // Canvas resize handling
  onMount(() => {
    // 同步现有的选择状态到新系统
    setSelectedElementIds([...state.selected_ids]);
  });

  // 监听state的选择变化，保持同步
  createMemo(() => {
    setSelectedElementIds([...state.selected_ids]); // 创建可变副本
  });

  const viewBox = createMemo(() => {
    const { width, height } = state.canvas_config;
    return `0 0 ${width} ${height}`;
  });

  return (
    <div class="flex-1 flex flex-col overflow-hidden">
      {/* Canvas Header */}
      <div class="h-12 bg-primary border-b border-default flex items-center px-4">
        <div class="text-sm text-secondary">
          Canvas: {state.canvas_config.width} × {state.canvas_config.height}px
          {state.canvas_config.zoom !== 1 && (
            <span class="ml-2">Zoom: {Math.round(state.canvas_config.zoom * 100)}%</span>
          )}
          <span class="ml-4 px-2 py-1 bg-blue-100 rounded text-xs">
            元素: {state.elements.length} | 选中: {selectedElementIds().length}
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div class="flex-1 overflow-auto custom-scrollbar bg-tertiary p-4">
        <div class="flex items-center justify-center min-h-full">
          <div class="bg-canvas-bg shadow-lg rounded-lg overflow-hidden" style={{ position: 'relative' }}>
            <svg
              ref={canvasRef}
              width={state.canvas_config.width * state.canvas_config.zoom}
              height={state.canvas_config.height * state.canvas_config.zoom}
              viewBox={viewBox()}
              class="block"
              onContextMenu={(e) => e.preventDefault()}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'copy';
              }}
              onDrop={handleDrop}
            >
              {/* Canvas Background */}
              <rect
                width={state.canvas_config.width}
                height={state.canvas_config.height}
                fill={state.canvas_config.background_color}
              />
              
              {/* Grid Background */}
              <CanvasGrid config={state.canvas_config} />
              
              {/* Canvas Border */}
              <rect
                width={state.canvas_config.width}
                height={state.canvas_config.height}
                fill="none"
                stroke="var(--color-border)"
                stroke-width="1"
              />
              
              {/* Elements Layer - 使用统一的ElementRenderer */}
              <g class="elements-layer">
                <For each={visibleElements()}>
                  {(element) => (
                    <ElementRenderer
                      element={element}
                      selected={selectedElementIds().includes(element.id)}
                    />
                  )}
                </For>
              </g>
              
              {/* Resize Handles Layer - 只对选中元素显示调整控制点 */}
              <g class="resize-handles-layer">
                <For each={visibleElements().filter(element => selectedElementIds().includes(element.id))}>
                  {(element) => (
                    <ResizeHandles element={element} />
                  )}
                </For>
              </g>
            </svg>
            
            {/* 简化的交互层 */}
            <SimpleInteractionLayer
              canvasRef={canvasRef}
              getAllElements={() => [...state.elements]} // 创建可变副本
              onElementsSelect={handleElementsSelect}
              onElementMove={handleElementMove}
              onBatchUpdatePositions={handleBatchUpdatePositions}
              onElementResize={handleElementResize}
              onCanvasClick={handleCanvasClick}
              enableDebugMode={import.meta.env.DEV}
            />

            {/* 对齐工具栏 - 当选中2个或更多元素时显示 */}
            <Show when={selectedElementIds().length >= 2}>
              <div 
                style={{
                  "position": "fixed",
                  "top": "80px",
                  "right": "20px", 
                  "z-index": "1000",
                  "background": "white",
                  "border-radius": "8px",
                  "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
                  "border": "1px solid #e5e7eb"
                }}
              >
                <AlignmentToolbar 
                  selectedElementIds={selectedElementIds}
                  onAlignmentComplete={(results) => {
                    console.log('✅ 对齐操作完成:', results);
                  }}
                  onAlignmentPreview={(alignmentType) => {
                    console.log('👁️ 对齐预览:', alignmentType);
                  }}
                  onPreviewCancel={() => {
                    console.log('❌ 取消对齐预览');
                  }}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasWithInteraction;