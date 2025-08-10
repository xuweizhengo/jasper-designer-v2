import { Component, createMemo, onMount, createSignal } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import CanvasGrid from './CanvasGrid';
import ElementRenderer from './ElementRenderer';
import SelectionBox from './SelectionBox';
import { For } from 'solid-js';

const Canvas: Component = () => {
  const { state, getElementsAtPoint, selectElement, clearSelection, createElement, dragOperation, selectMultiple, resizeOperation } = useAppContext();
  let canvasRef: SVGSVGElement | undefined;
  
  const [canvasSize, setCanvasSize] = createSignal({ width: 800, height: 600 });
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [selectionRect, setSelectionRect] = createSignal<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
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
    const selected = state.elements.filter(element => selectedIds.has(element.id));
    console.log('📊 Selected elements updated:', selected.length, 'selected_ids:', state.selected_ids);
    return selected;
  });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    if (!canvasRef) return { x: 0, y: 0 };
    
    const rect = canvasRef.getBoundingClientRect();
    const canvasX = (screenX - rect.left) / state.canvas_config.zoom;
    const canvasY = (screenY - rect.top) / state.canvas_config.zoom;
    
    return { x: canvasX, y: canvasY };
  };

  // Handle canvas click - 移除过度阻塞
  const handleCanvasClick = async (event: MouseEvent) => {
    if (!canvasRef) return;

    const target = event.target as SVGElement;
    
    // 只阻止resize handle点击
    if (target.classList.contains('resize-handle') || 
        target.closest('.resize-handles')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    console.log('🎯 Canvas coordinates:', { x, y });

    try {
      const elementsAtPoint = await getElementsAtPoint(x, y);
      console.log('🎯 Elements at point:', elementsAtPoint);
      
      if (elementsAtPoint.length > 0) {
        // Select the topmost element
        console.log('🎯 Selecting element:', elementsAtPoint[elementsAtPoint.length - 1]);
        await selectElement(elementsAtPoint[elementsAtPoint.length - 1] || "");
      } else {
        // Clear selection if clicking on empty area
        console.log('🎯 No elements at point, clearing selection');
        await clearSelection();
      }
    } catch (error) {
      console.error('Failed to handle canvas click:', error);
    }
  };

  // Check if an element is within the selection rectangle
  const isElementInSelection = (element: any, rect: { x: number, y: number, width: number, height: number }) => {
    const elementRect = {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };

    return !(elementRect.x > rect.x + rect.width ||
             elementRect.x + elementRect.width < rect.x ||
             elementRect.y > rect.y + rect.height ||
             elementRect.y + elementRect.height < rect.y);
  };

  // Get elements within selection rectangle
  const getElementsInSelection = () => {
    const rect = selectionRect();
    if (!rect) return [];

    const selectionBounds = {
      x: Math.min(rect.startX, rect.currentX),
      y: Math.min(rect.startY, rect.currentY),
      width: Math.abs(rect.currentX - rect.startX),
      height: Math.abs(rect.currentY - rect.startY)
    };

    return state.elements.filter(element => 
      element.visible && isElementInSelection(element, selectionBounds)
    );
  };

  // Handle canvas mouse down for selection rectangle
  const handleCanvasMouseDown = (event: MouseEvent) => {
    if (!canvasRef) return;
    
    const target = event.target as SVGElement;
    
    console.log('🖱️ Canvas mousedown detailed check:', {
      target: target.tagName,
      className: target.className,
      classList: Array.from(target.classList || []),
      id: target.id,
      dataset: target.dataset,
      isResizeHandle: target.classList?.contains('resize-handle'),
      isResizeHandles: target.closest('.resize-handles') !== null,
      parentElement: target.parentElement?.tagName
    });
    
    // 🚨 Enhanced fix: Multiple layers of resize handle detection
    if (target.classList?.contains('resize-handle') || 
        target.closest('.resize-handles') ||
        target.getAttribute('class')?.includes('resize-handle') ||
        target.tagName.toLowerCase() === 'rect' && target.getAttribute('class')?.includes('resize-handle') ||
        target.tagName.toLowerCase() === 'circle' && target.parentElement?.querySelector('.resize-handle') ||
        target.parentElement?.classList?.contains('resize-handles') ||
        target.parentElement?.parentElement?.classList?.contains('resize-handles')) {
      console.log('🔧 Canvas mousedown BLOCKED - resize handle detected');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    // 严格检查：只有点击真正的背景矩形才开始框选
    const isCanvasBackground = target.tagName === 'rect' && 
                              target.getAttribute('width') === state.canvas_config.width.toString() &&
                              target.getAttribute('height') === state.canvas_config.height.toString() &&
                              target.getAttribute('fill') === state.canvas_config.background_color;
    
    console.log('🖱️ Canvas mousedown background check:', {
      target: target.tagName,
      isCanvasBackground,
      width: target.getAttribute('width'),
      expectedWidth: state.canvas_config.width.toString(),
      height: target.getAttribute('height'),
      expectedHeight: state.canvas_config.height.toString(),
      fill: target.getAttribute('fill'),
      expectedFill: state.canvas_config.background_color,
      dragOperation: !!dragOperation(),
      resizeOperation: !!resizeOperation(),
      modifiers: { ctrl: event.ctrlKey, shift: event.shiftKey }
    });
    
    if (!isCanvasBackground || 
        dragOperation() ||
        event.ctrlKey || 
        event.shiftKey) {
      console.log('🚫 Skipping selection start - not canvas background or operations in progress');
      return;
    }

    event.preventDefault();
    
    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    
    setIsSelecting(true);
    setSelectionRect({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    });

    console.log('🔲 Starting selection rectangle at:', x, y);
  };

  // Handle drag over for drop zone
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  };

  // Handle drop for creating elements
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    
    try {
      const dragData = event.dataTransfer?.getData('application/json');
      if (!dragData) return;
      
      const { type, component } = JSON.parse(dragData);
      
      if (type === 'component') {
        const { x, y } = screenToCanvas(event.clientX, event.clientY);
        
        // Center the element on the drop position
        const dropX = Math.max(0, x - component.default_size.width / 2);
        const dropY = Math.max(0, y - component.default_size.height / 2);
        
        console.log('🎯 Dropping component:', component.name, 'at', dropX, dropY);
        
        const elementId = await createElement(
          component.id,
          { x: dropX, y: dropY },
          component.default_size,
          component.create_content()
        );
        
        console.log('✅ Element created via drag & drop:', elementId);
        
        // Auto-select the newly created element
        await selectElement(elementId);
      }
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  };

  // Handle mouse move during selection - Optimized with RAF
  const handleMouseMove = (event: MouseEvent) => {
    if (!isSelecting() || dragOperation()) return;

    // Use requestAnimationFrame for smooth selection box updates
    requestAnimationFrame(() => {
      if (!isSelecting()) return; // Double check in RAF callback
      
      const { x, y } = screenToCanvas(event.clientX, event.clientY);
      
      setSelectionRect(prev => prev ? {
        ...prev,
        currentX: x,
        currentY: y
      } : null);
    });
  };

  // Handle mouse up to finish selection
  const handleMouseUp = async () => {
    if (dragOperation()) {
      setIsSelecting(false);
      setSelectionRect(null);
      return;
    }
    
    if (!isSelecting()) return;

    setIsSelecting(false);
    
    const elementsInSelection = getElementsInSelection();
    console.log('🔲 Selection finished, found elements:', elementsInSelection.length);

    try {
      if (elementsInSelection.length > 0) {
        const elementIds = elementsInSelection.map(el => el.id);
        await selectMultiple(elementIds);
        console.log('✅ Multi-select completed:', elementIds);
      } else {
        await clearSelection();
        console.log('🔲 No elements in selection, cleared selection');
      }
    } catch (error) {
      console.error('❌ Failed to update selection:', error);
    }

    setSelectionRect(null);
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
    
    // Add global mouse event listeners for selection
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
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
          <span class="ml-4 px-2 py-1 bg-blue-100 rounded text-xs">
            元素: {state.elements.length} | 选中: {state.selected_ids.length}
          </span>
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
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMouseDown={handleCanvasMouseDown}
            >
              {/* Canvas Background (先放背景) */}
              <rect
                width={state.canvas_config.width}
                height={state.canvas_config.height}
                fill={state.canvas_config.background_color}
              />
              
              {/* Grid Background (后放网格，显示在背景上) */}
              <CanvasGrid config={state.canvas_config} />
              
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
                      selected={state.selected_ids.includes(element.id)}
                    />
                  )}
                </For>
              </g>
              
              {/* Selection Layer */}
              {selectedElements().length > 0 && (
                <SelectionBox elements={selectedElements()} />
              )}
              
              {/* Selection Rectangle */}
              {isSelecting() && selectionRect() && (() => {
                const rect = selectionRect()!;
                const x = Math.min(rect.startX, rect.currentX);
                const y = Math.min(rect.startY, rect.currentY);
                const width = Math.abs(rect.currentX - rect.startX);
                const height = Math.abs(rect.currentY - rect.startY);
                
                return (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      stroke-width="1"
                      stroke-dasharray="5,5"
                      class="selection-rectangle pointer-events-none"
                    />
                    {/* Preview selected elements during drag */}
                    {getElementsInSelection().map(element => (
                      <rect
                        x={element.position.x - 1}
                        y={element.position.y - 1}
                        width={element.size.width + 2}
                        height={element.size.height + 2}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.8)"
                        stroke-width="1"
                        stroke-dasharray="3,3"
                        class="selection-preview pointer-events-none"
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;