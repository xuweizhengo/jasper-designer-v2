import { Component, createMemo, createSignal } from 'solid-js';
import type { ReportElement } from '../../types';
import { useAppContext } from '../../stores/AppContext';
import ResizeHandles from './ResizeHandles';

interface SelectionBoxProps {
  elements: ReportElement[];
}

const SelectionBox: Component<SelectionBoxProps> = (props) => {
  const { updateElement, dragOperation } = useAppContext();
  const [isDragging, setIsDragging] = createSignal(false);
  
  // Calculate bounding box of all selected elements
  const boundingBox = createMemo(() => {
    if (props.elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of props.elements) {
      const { position, size } = element;
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  });

  // Handle drag start
  const handleDragStart = (e: MouseEvent) => {
    // 🚨 CRITICAL: Check drag operation first, but don't set it yet
    if (dragOperation()) {
      console.log('🚫 SelectionBox drag blocked - already in drag operation');
      return;
    }
    
    e.stopPropagation();
    console.log('🎯 SelectionBox drag start');
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Store original positions
    const originalPositions = props.elements.map(element => ({
      id: element.id,
      x: element.position.x,
      y: element.position.y
    }));
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Update positions of all selected elements
      originalPositions.forEach(async (original) => {
        try {
          await updateElement(original.id, {
            position: {
              x: original.x + deltaX,
              y: original.y + deltaY
            }
          });
        } catch (error) {
          console.error('Failed to update element position:', error);
        }
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <g class="selection-box" data-testid="selection-box">
      {(() => {
        console.log('🔧 SelectionBox rendering with elements:', props.elements.length, 'elements:', props.elements.map(e => e.id));
        return null;
      })()}
      
      {/* 选择边框 - 设置pointer-events="none"避免阻挡事件 */}
      <rect
        x={boundingBox().x}
        y={boundingBox().y}
        width={boundingBox().width}
        height={boundingBox().height}
        fill="none"
        stroke="var(--color-selection)"
        stroke-width="2"
        stroke-dasharray="5,5"
        opacity="0.8"
        pointer-events="none"
      />

      {/* 移动手柄区域 - 缩小到避开ResizeHandles区域 */}
      <rect
        x={boundingBox().x + 8}
        y={boundingBox().y + 8}
        width={Math.max(0, boundingBox().width - 16)}
        height={Math.max(0, boundingBox().height - 16)}
        fill="transparent"
        style={{ cursor: isDragging() ? 'grabbing' : 'grab' }}
        onMouseDown={handleDragStart}
      />

      {/* BULLETPROOF Resize Handles - 顶层，确保能接收事件 */}
      {(() => {
        console.log('🔧 SelectionBox ResizeHandles check:', {
          elementsCount: props.elements.length,
          singleElement: props.elements.length === 1,
          multipleElements: props.elements.length > 1,
          firstElement: props.elements[0]
        });
        
        if (props.elements.length === 1) {
          console.log('🔧 Rendering ResizeHandles for single element:', props.elements[0]?.id);
          return props.elements[0] ? <ResizeHandles element={props.elements[0]} /> : null;
        } else if (props.elements.length > 1) {
          console.log('🔧 Rendering ResizeHandles for multiple elements');
          return (
            <ResizeHandles 
              element={{
                id: 'multi-selection',
                position: { x: boundingBox().x, y: boundingBox().y },
                size: { width: boundingBox().width, height: boundingBox().height },
                content: { 
                  type: 'Rectangle', 
                  fill_color: '#ffffff', 
                  border: { color: '#000000', width: 1, style: 'Solid' as const },
                  opacity: 0.1 
                },
                z_index: 0,
                visible: true,
                locked: false,
              }}
            />
          );
        } else {
          console.log('🔧 No elements to render ResizeHandles for');
          return null;
        }
      })()}
    </g>
  );
};

export default SelectionBox;