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
          {/* 垂直线 */}
          <line
            x1={props.config.grid_size}
            y1="0"
            x2={props.config.grid_size}
            y2={props.config.grid_size}
            stroke="#cbd5e1"
            stroke-width="0.5"
            opacity="0.8"
          />
          {/* 水平线 */}
          <line
            x1="0"
            y1={props.config.grid_size}
            x2={props.config.grid_size}
            y2={props.config.grid_size}
            stroke="#cbd5e1"
            stroke-width="0.5"
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