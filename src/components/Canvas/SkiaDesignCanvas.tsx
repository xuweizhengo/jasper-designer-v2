import { Component, onMount, onCleanup, createSignal, Show } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import { usePreview } from '../../stores/PreviewModeContext';
import { SkiaCanvas } from '../SkiaCanvas';
import { SimpleInteractionLayer } from '../../interaction/components/SimpleInteractionLayer';
import { AlignmentToolbar } from '../alignment/AlignmentToolbar';
import type { RenderElement } from '../../renderer/types';
import type { ReportElement } from '../../types';
import type { Point } from '../../interaction/types/geometry-types';

/**
 * Skia 设计画布组件
 * 替换原有的 SVG 渲染系统，使用 Skia 进行高性能渲染
 */
export const SkiaDesignCanvas: Component = () => {
  console.log('[SkiaDesignCanvas] Component created');

  const {
    state,
    selectElement,
    clearSelection,
    selectMultiple,
    updateElement,
    batchUpdatePositions
  } = useAppContext();

  const { state: previewState } = usePreview();

  const [selectedElementIds, setSelectedElementIds] = createSignal<string[]>([]);
  const [canvasSize, setCanvasSize] = createSignal({ width: 800, height: 600 });
  let containerRef: HTMLDivElement | undefined;

  // 监听容器大小变化
  onMount(() => {
    const updateSize = () => {
      if (containerRef) {
        const rect = containerRef.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    onCleanup(() => {
      window.removeEventListener('resize', updateSize);
    });
  });

  // 将 ReportElement 转换为 RenderElement
  const convertToRenderElements = (elements: readonly ReportElement[]): RenderElement[] => {
    return elements.filter(el => el.visible).map(element => {
      const renderElement: RenderElement = {
        id: element.id,
        type: mapElementType(element.content.type),
        transform: {
          translate: { x: element.position.x, y: element.position.y },
          rotate: 0,
          scale: { x: 1, y: 1 }
        },
        style: {},
        data: {},
        visible: element.visible,
        locked: element.locked || false
      };

      // 根据元素类型填充数据和样式
      switch (element.content.type) {
        case 'Text':
        case 'DataField': {
          const textContent = element.content.type === 'Text'
            ? element.content.content
            : element.content.type === 'DataField'
              ? element.content.expression
              : '';
          renderElement.data = {
            content: textContent,
            fontSize: element.content.style?.font_size || 14,
            fontFamily: element.content.style?.font_family || 'Arial',
            color: element.content.style?.color || '#000000',
            align: element.content.style?.align || 'left'
          };
          }
          break;

        case 'Rectangle':
          if (element.content.type === 'Rectangle') {
            renderElement.type = 'rect';
            renderElement.style = {
              width: element.size.width,
              height: element.size.height,
              fill: element.content.fill_color || '#ffffff',
              stroke: element.content.border?.color || '#000000',
              strokeWidth: element.content.border?.width || 1
            };
          }
          break;

        case 'Line':
          if (element.content.type === 'Line') {
            renderElement.type = 'path';
            renderElement.data = {
              commands: [
                { type: 'M', x: 0, y: 0 },
                { type: 'L', x: element.size.width, y: element.size.height }
              ]
            };
            renderElement.style = {
              stroke: element.content.color || '#000000',
              strokeWidth: element.content.width || 2,
              fill: 'none'
            };
          }
          break;

        case 'Image':
          if (element.content.type === 'Image') {
            renderElement.data = {
              src: element.content.src || '',
              width: element.size.width,
              height: element.size.height
            };
          }
          break;
      }

      return renderElement;
    });
  };

  // 映射元素类型
  const mapElementType = (type: string): 'text' | 'rect' | 'circle' | 'path' | 'image' | 'group' => {
    const typeMap: Record<string, any> = {
      'Text': 'text',
      'DataField': 'text',
      'Rectangle': 'rect',
      'Line': 'path',
      'Image': 'image'
    };
    return typeMap[type] || 'rect';
  };

  // 处理元素选择
  const handleElementsSelect = async (elementIds: string[]) => {
    console.log('🎯 选择元素', elementIds);
    setSelectedElementIds([...elementIds]);

    try {
      if (elementIds.length === 0) {
        await clearSelection();
      } else if (elementIds.length === 1) {
        await selectElement(elementIds[0]!);
      } else {
        await selectMultiple([...elementIds]);
      }
    } catch (error) {
      console.error('❌ 选择元素失败:', error);
    }
  };

  // 处理批量位置更新
  const handleBatchUpdatePositions = async (updates: Array<{element_id: string, new_position: {x: number, y: number}}>) => {
    if (import.meta.env.DEV) {
      console.log('📦 批量更新位置', { count: updates.length });
    }

    try {
      await batchUpdatePositions(updates);
    } catch (error) {
      console.error('❌ 批量更新位置失败:', error);
    }
  };

  // 处理元素移动
  const handleElementMove = async (elementId: string, newPosition: Point) => {
    try {
      await updateElement(elementId, {
        position: { x: newPosition.x, y: newPosition.y }
      });
    } catch (error) {
      console.error('❌ 移动元素失败:', error);
    }
  };

  // 处理元素大小调整
  const handleElementResize = async (
    elementId: string,
    newSize: { width: number; height: number },
    newPosition: { x: number; y: number }
  ) => {
    try {
      await updateElement(elementId, {
        size: newSize,
        position: newPosition
      });
    } catch (error) {
      console.error('❌ 调整大小失败:', error);
    }
  };

  // 处理 Skia 画布上的元素点击
  const handleSkiaElementClick = (elementId: string) => {
    handleElementsSelect([elementId]);
  };

  // 处理 Skia 画布上的元素拖拽
  const handleSkiaElementDrag = (elementId: string, delta: { x: number; y: number }) => {
    const element = state.elements.find(el => el.id === elementId);
    if (element) {
      handleElementMove(elementId, {
        x: element.position.x + delta.x,
        y: element.position.y + delta.y
      });
    }
  };

  console.log('[SkiaDesignCanvas] Rendering with', state.elements.length, 'elements');
  console.log('[SkiaDesignCanvas] Canvas config:', state.canvas_config);
  console.log('[SkiaDesignCanvas] Container size:', canvasSize());

  return (
    <div ref={containerRef} class="flex-1 relative overflow-hidden bg-tertiary">
      {/* 对齐工具栏 */}
      <Show when={selectedElementIds().length > 1}>
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <AlignmentToolbar selectedElementIds={selectedElementIds} />
        </div>
      </Show>

      {/* Skia 渲染画布 */}
      <div class="absolute inset-0">
        {console.log('[SkiaDesignCanvas] About to render SkiaCanvas')}
        <SkiaCanvas
          elements={convertToRenderElements(state.elements)}
          mode={previewState().mode === 'design' ? 'design' : 'preview'}
          width={canvasSize().width}
          height={canvasSize().height}
          onElementClick={handleSkiaElementClick}
          onElementDrag={handleSkiaElementDrag}
          options={{
            background: state.canvas_config.background_color || '#f5f5f5',
            showGrid: state.canvas_config.show_grid,
            gridSize: state.canvas_config.grid_size,
            viewport: {
              zoom: state.canvas_config.zoom,
              pan: { x: 0, y: 0 }
            }
          }}
        />
      </div>

      {/* 交互层 - 用于选择框、调整大小等 */}
      <div class="absolute inset-0 pointer-events-none">
        <SimpleInteractionLayer
          getAllElements={() => [...state.elements]}
          onElementsSelect={handleElementsSelect}
          onElementMove={handleElementMove}
          onElementResize={handleElementResize}
          onBatchUpdatePositions={handleBatchUpdatePositions}
        />
      </div>
    </div>
  );
};