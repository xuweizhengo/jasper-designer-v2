import { Component, createMemo, onMount, createSignal } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import CanvasGrid from './CanvasGrid';
import ElementRenderer from './ElementRenderer';
import SelectionBox from './SelectionBox';
import { For } from 'solid-js';

const Canvas: Component = () => {
  const { state, getElementsAtPoint, selectElement, clearSelection } = useAppContext();
  let canvasRef: SVGSVGElement | undefined;
  
  const [canvasSize, setCanvasSize] = createSignal({ width: 800, height: 600 });
  // Used for potential future viewport calculations
  console.log('Canvas size:', canvasSize());

  // Calculate visible elements based on viewport (performance optimization)
  const visibleElements = createMemo(() => {
    // For now, return all elements. In a real implementation, we would filter based on viewport
    return state.elements.filter(element => element.visible);
  });

  // Get selected elements
  const selectedElements = createMemo(() => {
    const selectedIds = new Set(state.selected_ids);
    return state.elements.filter(element => selectedIds.has(element.id.value));
  });

  // Handle canvas click
  const handleCanvasClick = async (event: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = (event.clientX - rect.left - state.canvas_config.offset_x) / state.canvas_config.zoom;
    const y = (event.clientY - rect.top - state.canvas_config.offset_y) / state.canvas_config.zoom;

    try {
      const elementsAtPoint = await getElementsAtPoint(x, y);
      
      if (elementsAtPoint.length > 0) {
        // Select the topmost element
        await selectElement(elementsAtPoint[elementsAtPoint.length - 1] || "");
      } else {
        // Clear selection if clicking on empty area
        await clearSelection();
      }
    } catch (error) {
      console.error('Failed to handle canvas click:', error);
    }
  };

  // Handle canvas resize
  onMount(() => {
    const updateCanvasSize = () => {
      if (canvasRef?.parentElement) {
        const rect = canvasRef.parentElement.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  });

  // Canvas transform calculation (reserved for future use)
  // const canvasTransform = createMemo(() => {
  //   const { zoom, offset_x, offset_y } = state.canvas_config;
  //   return `translate(${offset_x}, ${offset_y}) scale(${zoom})`;
  // });

  // Calculate viewBox to show the entire canvas
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
        </div>
      </div>

      {/* Canvas Container */}
      <div class="flex-1 overflow-auto custom-scrollbar bg-tertiary p-4">
        <div class="flex items-center justify-center min-h-full">
          <div class="bg-canvas-bg shadow-lg rounded-lg overflow-hidden">
            <svg
              ref={canvasRef}
              width={state.canvas_config.width * state.canvas_config.zoom}
              height={state.canvas_config.height * state.canvas_config.zoom}
              viewBox={viewBox()}
              class="block cursor-default"
              onClick={handleCanvasClick}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Grid Background */}
              <CanvasGrid config={state.canvas_config} />
              
              {/* Canvas Background */}
              <rect
                width={state.canvas_config.width}
                height={state.canvas_config.height}
                fill={state.canvas_config.background_color}
              />
              
              {/* Canvas Border */}
              <rect
                width={state.canvas_config.width}
                height={state.canvas_config.height}
                fill="none"
                stroke="var(--color-border)"
                stroke-width="1"
              />
              
              {/* Elements Layer */}
              <g class="elements-layer">
                <For each={visibleElements()}>
                  {(element) => (
                    <ElementRenderer
                      element={element}
                      selected={state.selected_ids.includes(element.id.value)}
                    />
                  )}
                </For>
              </g>
              
              {/* Selection Layer */}
              {selectedElements().length > 0 && (
                <SelectionBox elements={selectedElements()} />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;