/**
 * 统一交互系统的状态类型定义
 * 简化版本，专注于SimpleInteractionLayer的核心需求
 */

import type { Point } from './geometry-types';

// 交互模式枚举 - 简化版本
export enum InteractionMode {
  IDLE = 'idle',           // 空闲状态 - 默认状态，等待用户操作
  SELECTING = 'selecting', // 框选中 - 用户正在拖拽选择矩形
  DRAGGING = 'dragging',   // 拖拽中 - 用户正在拖拽移动元素
}

// 拖拽状态接口
export interface DragState {
  elementIds: string[];                    // 正在拖拽的元素ID列表
  startPoint: Point;                       // 拖拽开始的鼠标位置
  startPositions: Map<string, Point>;      // 每个元素的初始位置
  currentOffset: Point;                    // 当前拖拽偏移量
  isDragging: boolean;                     // 是否已开始拖拽（超过阈值）
}

// 选择状态接口
export interface SelectionState {
  startPoint: Point;        // 框选开始位置
  currentPoint: Point;      // 当前鼠标位置
  selectedIds: string[];    // 框选中的元素ID列表
}

// 交互系统配置
export interface InteractionConfig {
  dragThreshold: number;     // 拖拽阈值（像素）
  updateThrottle: number;    // 更新节流时间（毫秒）
  enableDebugLog: boolean;   // 是否启用调试日志
}

// 默认配置
export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  dragThreshold: 3,
  updateThrottle: 16,  // 优化到60fps (1000/60≈16ms)
  enableDebugLog: false  // 生产环境关闭调试以提升性能
};