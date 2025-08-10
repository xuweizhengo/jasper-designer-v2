/**
 * 几何类型定义
 * 用于交互系统的基础几何计算
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  position: Point;
  size: Size;
  rotation?: number;
  scale?: Point;
}

// 调整控制点方向
export type HandleDirection = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// 鼠标按键状态
export interface MouseState {
  buttons: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// 边界信息
export interface BoundingBox {
  bounds: Rectangle;
  center: Point;
  corners: {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
  };
}