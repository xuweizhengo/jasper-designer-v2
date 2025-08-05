import { Component, createMemo, For } from 'solid-js';
import type { ReportElement } from '../../types';

interface SelectionBoxProps {
  elements: ReportElement[];
}

const SelectionBox: Component<SelectionBoxProps> = (props) => {
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

  // Handle positions for resize handles
  const handlePositions = createMemo(() => {
    const box = boundingBox();
    const handleSize = 8;
    const offset = handleSize / 2;

    return [
      { x: box.x - offset, y: box.y - offset, cursor: 'nw-resize' }, // Top-left
      { x: box.x + box.width / 2 - offset, y: box.y - offset, cursor: 'n-resize' }, // Top-center
      { x: box.x + box.width - offset, y: box.y - offset, cursor: 'ne-resize' }, // Top-right
      { x: box.x + box.width - offset, y: box.y + box.height / 2 - offset, cursor: 'e-resize' }, // Middle-right
      { x: box.x + box.width - offset, y: box.y + box.height - offset, cursor: 'se-resize' }, // Bottom-right
      { x: box.x + box.width / 2 - offset, y: box.y + box.height - offset, cursor: 's-resize' }, // Bottom-center
      { x: box.x - offset, y: box.y + box.height - offset, cursor: 'sw-resize' }, // Bottom-left
      { x: box.x - offset, y: box.y + box.height / 2 - offset, cursor: 'w-resize' }, // Middle-left
    ];
  });

  return (
    <g class="selection-box" data-testid="selection-box">
      {/* Selection outline */}
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
      />

      {/* Resize handles */}
      <For each={handlePositions()}>
        {(handle) => (
          <rect
            x={handle.x}
            y={handle.y}
            width="8"
            height="8"
            class="selection-handle"
            style={{ cursor: handle.cursor }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // TODO: Implement resize functionality
              console.log('Resize handle clicked:', handle.cursor);
            }}
          />
        )}
      </For>

      {/* Move handle (invisible area over the selection) */}
      <rect
        x={boundingBox().x}
        y={boundingBox().y}
        width={boundingBox().width}
        height={boundingBox().height}
        fill="transparent"
        style={{ cursor: 'move' }}
        onMouseDown={(e) => {
          e.stopPropagation();
          // TODO: Implement move functionality
          console.log('Move handle clicked');
        }}
      />
    </g>
  );
};

export default SelectionBox;