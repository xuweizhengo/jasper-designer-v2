import { Component, Show } from 'solid-js';
import type { CanvasConfig } from '../../types';

interface CanvasGridProps {
  config: CanvasConfig;
}

const CanvasGrid: Component<CanvasGridProps> = (props) => {
  return (
    <Show when={props.config.show_grid}>
      <defs>
        <pattern
          id="canvas-grid"
          width={props.config.grid_size}
          height={props.config.grid_size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${props.config.grid_size} 0 L 0 0 0 ${props.config.grid_size}`}
            fill="none"
            stroke="#d1d5db"
            stroke-width="1"
            opacity="0.8"
          />
        </pattern>
      </defs>
      <rect
        width={props.config.width}
        height={props.config.height}
        fill="url(#canvas-grid)"
      />
    </Show>
  );
};

export default CanvasGrid;