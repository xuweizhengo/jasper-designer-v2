import { Component, Match, Switch, Show, createMemo, createSignal } from 'solid-js';
import type { ReportElement } from '../../types';
import { useAppContext } from '../../stores/AppContext';

interface ElementRendererProps {
  element: ReportElement;
  selected: boolean;
}

const ElementRenderer: Component<ElementRendererProps> = (props) => {
  // @ts-ignore - state is used but TypeScript doesn't detect it
  const { state, selectElement, updateElement, batchUpdatePositions, dragOperation, setDragOperation, toggleSelection, addToSelection } = useAppContext();
  // Element key is handled automatically by Solid.js reactivity

  // Common element styles - Optimized for drag performance
  const elementStyle = createMemo(() => {
    const dragOp = dragOperation();
    const isDragging = dragOp?.type === 'move' && 
                      dragOp?.element_ids && 
                      dragOp.element_ids.includes(props.element.id);
    
    // Base position from element data
    const baseX = props.element.position.x;
    const baseY = props.element.position.y;
    
    // Use CSS transform for drag offset to avoid layout recalculation
    let transform = `translate(${baseX}px, ${baseY}px)`;
    
    if (isDragging && dragOp?.delta) {
      // Apply drag offset using transform for better performance
      transform = `translate(${baseX + dragOp.delta.x}px, ${baseY + dragOp.delta.y}px)`;
    }
    
    return {
      transform,
      opacity: props.element.visible ? (isDragging ? 0.7 : 1) : 0.5,
      cursor: props.element.locked ? 'not-allowed' : (props.selected ? 'move' : 'pointer'),
      // Use GPU acceleration for smooth dragging
      'will-change': isDragging ? 'transform' : 'auto',
    };
  });

  // Handle mouse down for dragging - Optimized for performance
  const handleMouseDown = (event: MouseEvent) => {
    if (props.element.locked || !props.selected) return;
    
    // Prevent event bubbling to avoid triggering selection box
    event.preventDefault();
    event.stopPropagation();
    
    const { state } = useAppContext();
    const selectedIds = state.selected_ids;
    
    const startX = event.clientX;
    const startY = event.clientY;
    
    console.log('🎯 Starting optimized drag for', selectedIds.length > 1 ? 'multiple elements' : 'single element:', props.element.id);
    
    // Record initial positions for all selected elements
    const initialPositions = new Map();
    selectedIds.forEach(id => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        initialPositions.set(id, { x: element.position.x, y: element.position.y });
      }
    });
    
    // Set drag operation with minimal data for performance
    setDragOperation({
      type: 'move',
      element_ids: selectedIds.length > 0 ? selectedIds : [props.element.id],
      start_mouse_position: { x: startX, y: startY },
      initial_positions: initialPositions,
      delta: { x: 0, y: 0 }
    });
    
    // Optimized mouse move handler - no backend calls during drag
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Only update delta for visual feedback, no position updates
      setDragOperation((prev: any) => prev ? {
        ...prev,
        delta: { x: deltaX, y: deltaY }
      } : null);
    };
    
    // Optimized mouse up handler - single backend call at end
    const handleMouseUp = async (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;
      
      // Only update if there was significant movement
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const dragOp = dragOperation();
        const elementIds = dragOp?.element_ids || [props.element.id];
        const initialPositions = dragOp?.initial_positions;
        
        console.log('🎯 Finishing optimized drag for', elementIds.length, 'element(s)');
        
        try {
          // Prepare batch position updates with bounds checking
          const positionUpdates = [];
          
          for (const elementId of elementIds) {
            const initialPos = initialPositions?.get(elementId);
            if (initialPos) {
              const newX = Math.max(0, initialPos.x + deltaX);
              const newY = Math.max(0, initialPos.y + deltaY);
              
              positionUpdates.push({
                element_id: elementId,
                new_position: { x: newX, y: newY }
              });
            }
          }
          
          // Single optimized backend call for all updates
          if (positionUpdates.length > 0) {
            console.log(`🚀 Optimized batch updating ${positionUpdates.length} elements`);
            await batchUpdatePositions(positionUpdates);
            console.log('✅ Optimized batch update completed');
          }
          
        } catch (error) {
          console.error('❌ Failed to update element positions:', error);
        }
      }
      
      // Clear drag operation
      setDragOperation(null);
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render different element types
  const renderContent = () => {
    const { content, size } = props.element;

    return (
      <Switch>
        <Match when={content.type === 'Text' && content}>
          {(textContent) => {
            const align = textContent().style.align;
            const textAnchor = 
              align === 'Center' ? 'middle' :
              align === 'Right' ? 'end' : 'start';
            
            const x = 
              align === 'Center' ? size.width / 2 :
              align === 'Right' ? size.width : 0;

            return (
              <text
                x={x}
                y={textContent().style.font_size * 0.75}
                font-family={textContent().style.font_family}
                font-size={`${textContent().style.font_size}`}
                font-weight={textContent().style.font_weight}
                fill={textContent().style.color}
                text-anchor={textAnchor}
                dominant-baseline="hanging"
              >
                {textContent().content.split('\n').map((line, index) => (
                  <tspan x={x} dy={index === 0 ? 0 : textContent().style.font_size * 1.2}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          }}
        </Match>

        <Match when={content.type === 'Rectangle' && content}>
          {(rectContent) => {
            const rect = rectContent();
            const opacity = rect.opacity !== undefined ? rect.opacity : 1;
            const cornerRadius = rect.corner_radius || 0;
            
            return (
              <rect
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                rx={cornerRadius}
                ry={cornerRadius}
                fill={rect.fill_color || 'transparent'}
                fill-opacity={opacity}
                stroke={rect.border?.color || '#000000'}
                stroke-width={rect.border?.width || 1}
                stroke-opacity={opacity}
                stroke-dasharray={
                  rect.border?.style === 'Dashed' ? '5,5' :
                  rect.border?.style === 'Dotted' ? '2,2' : 'none'
                }
              />
            );
          }}
        </Match>

        <Match when={content.type === 'Line' && content}>
          {(lineContent) => {
            const line = lineContent();
            const opacity = line.opacity !== undefined ? line.opacity : 1;
            const lineStyle = line.line_style || 'Solid';
            
            const strokeDasharray = 
              lineStyle === 'Dashed' ? '8,4' :
              lineStyle === 'Dotted' ? '2,2' :
              lineStyle === 'DashDot' ? '8,4,2,4' : 'none';
            
            return (
              <g>
                <defs>
                  <Show when={line.start_cap === 'Arrow' || line.end_cap === 'Arrow'}>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={line.color}
                        fill-opacity={opacity}
                      />
                    </marker>
                  </Show>
                </defs>
                <line
                  x1={0}
                  y1={size.height / 2}
                  x2={size.width}
                  y2={size.height / 2}
                  stroke={line.color}
                  stroke-width={line.width}
                  stroke-opacity={opacity}
                  stroke-dasharray={strokeDasharray}
                  marker-start={line.start_cap === 'Arrow' ? 'url(#arrowhead)' : undefined}
                  marker-end={line.end_cap === 'Arrow' ? 'url(#arrowhead)' : undefined}
                />
                <Show when={line.start_cap === 'Circle'}>
                  <circle
                    cx={0}
                    cy={size.height / 2}
                    r={line.width}
                    fill={line.color}
                    fill-opacity={opacity}
                  />
                </Show>
                <Show when={line.end_cap === 'Circle'}>
                  <circle
                    cx={size.width}
                    cy={size.height / 2}
                    r={line.width}
                    fill={line.color}
                    fill-opacity={opacity}
                  />
                </Show>
                <Show when={line.start_cap === 'Square'}>
                  <rect
                    x={-line.width}
                    y={size.height / 2 - line.width}
                    width={line.width * 2}
                    height={line.width * 2}
                    fill={line.color}
                    fill-opacity={opacity}
                  />
                </Show>
                <Show when={line.end_cap === 'Square'}>
                  <rect
                    x={size.width - line.width}
                    y={size.height / 2 - line.width}
                    width={line.width * 2}
                    height={line.width * 2}
                    fill={line.color}
                    fill-opacity={opacity}
                  />
                </Show>
              </g>
            );
          }}
        </Match>

        <Match when={content.type === 'Image' && content}>
          {(imageContent) => {
            const [imageLoaded, setImageLoaded] = createSignal(false);
            const [imageError, setImageError] = createSignal(false);
            
            return (
              <foreignObject
                x={0}
                y={0}
                width={size.width}
                height={size.height}
              >
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  overflow: "hidden"
                }}>
                  {imageContent().src && !imageError() ? (
                    <img
                      src={imageContent().src}
                      alt={imageContent().alt || "图片"}
                      style={{
                        "max-width": "100%",
                        "max-height": "100%",
                        "object-fit": "contain",
                        display: imageLoaded() ? "block" : "none"
                      }}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        setImageError(true);
                        setImageLoaded(false);
                      }}
                    />
                  ) : null}
                  
                  {!imageContent().src || imageError() || (!imageLoaded() && imageContent().src) ? (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "flex-direction": "column",
                      background: "rgba(0,0,0,0.05)",
                      border: "1px dashed #ccc",
                      "box-sizing": "border-box",
                      color: "#666",
                      "font-size": "12px",
                      "font-family": "Arial, sans-serif"
                    }}>
                      <div style={{"margin-bottom": "4px"}}>
                        {!imageContent().src ? "📷" : 
                         imageError() ? "❌" : "⏳"}
                      </div>
                      <div>
                        {!imageContent().src ? "无图片" : 
                         imageError() ? "加载失败" : "加载中..."}
                      </div>
                    </div>
                  ) : null}
                </div>
              </foreignObject>
            );
          }}
        </Match>

        <Match when={content.type === 'DataField' && content}>
          {(fieldContent) => (
            <>
              <rect
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="rgba(59, 130, 246, 0.3)"
                stroke-width="1"
                stroke-dasharray="2,2"
              />
              <text
                x={
                  fieldContent().style.align === 'Center' ? size.width / 2 :
                  fieldContent().style.align === 'Right' ? size.width - 4 : 4
                }
                y={fieldContent().style.font_size * 0.8}
                font-family={fieldContent().style.font_family}
                font-size={`${fieldContent().style.font_size}`}
                font-weight={fieldContent().style.font_weight}
                fill={fieldContent().style.color}
                text-anchor={
                  fieldContent().style.align === 'Center' ? 'middle' :
                  fieldContent().style.align === 'Right' ? 'end' : 'start'
                }
                dominant-baseline="hanging"
              >
                {fieldContent().expression || '[数据字段]'}
              </text>
            </>
          )}
        </Match>
      </Switch>
    );
  };

  return (
    <g
      class={`element ${props.selected ? 'element-selected' : ''} ${dragOperation()?.element_ids?.includes(props.element.id) ? 'element-dragging' : ''}`}
      style={elementStyle()}
      data-element-id={props.element.id}
      data-element-type={props.element.content.type}
      onClick={async (e) => {
        e.stopPropagation();
        
        console.log('🖱️ Element clicked!', props.element.id, {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          selected: props.selected
        });
        
        try {
          if (e.ctrlKey) {
            // Ctrl+Click: Toggle selection
            console.log('🔄 Toggling selection:', props.element.id);
            await toggleSelection(props.element.id);
          } else if (e.shiftKey) {
            // Shift+Click: Add to selection (range selection)
            console.log('➕ Adding to selection:', props.element.id);
            await addToSelection(props.element.id);
          } else {
            // Normal click: Single selection
            if (!props.selected) {
              await selectElement(props.element.id);
              console.log('✅ Element selected successfully:', props.element.id);
            }
          }
        } catch (error) {
          console.error('❌ Failed to select element:', error);
        }
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Element content */}
      {renderContent()}
      
      {/* 选择相关的视觉反馈已移至SelectionBox组件统一处理 */}
    </g>
  );
};

export default ElementRenderer;