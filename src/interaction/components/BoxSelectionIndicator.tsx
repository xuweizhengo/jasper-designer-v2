/**
 * 框选指示器组件
 * 显示蓝色虚线选择矩形
 */

import type { Component } from 'solid-js';
import type { Rectangle } from '../types/geometry-types';

interface BoxSelectionIndicatorProps {
  rect: Rectangle;
  visible: boolean;
  color?: string;
  strokeWidth?: number;
  dashArray?: string;
  opacity?: number;
}

export const BoxSelectionIndicator: Component<BoxSelectionIndicatorProps> = (props) => {
  return (
    <div
      class="box-selection-indicator"
      style={{
        position: 'absolute',
        left: `${props.rect.x}px`,
        top: `${props.rect.y}px`,
        width: `${props.rect.width}px`,
        height: `${props.rect.height}px`,
        border: `${props.strokeWidth || 1}px dashed ${props.color || '#007acc'}`,
        background: `rgba(0, 122, 204, ${props.opacity || 0.1})`,
        'pointer-events': 'none',
        'z-index': 1000,
        opacity: props.visible ? 1 : 0,
        transition: 'opacity 0.15s ease'
      }}
    />
  );
};