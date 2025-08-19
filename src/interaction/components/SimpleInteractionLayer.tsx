/**
 * 简化光标系统 - 修复版本
 * 解决光标锁定问题的最小化实现
 */

import { createSignal, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { Point, Rectangle } from '../types/geometry-types';
import { InteractionMode, type DragState, type SelectionState, DEFAULT_INTERACTION_CONFIG } from '../types/interaction-types';
import type { ReportElement } from '../../types';
import { useAppContext } from '../../stores/AppContext';

interface SimpleInteractionLayerProps {
  canvasRef?: HTMLElement | SVGElement | undefined;
  getAllElements: () => ReportElement[];
  onElementsSelect?: (elementIds: string[]) => void;
  onElementMove?: (elementId: string, newPosition: Point) => void;
  onBatchUpdatePositions?: (updates: Array<{element_id: string, new_position: {x: number, y: number}}>) => Promise<void>;
  onElementResize?: (elementId: string, newSize: { width: number; height: number }, newPosition: { x: number; y: number }) => void;
  onCanvasClick?: (point: Point) => void;
  enableDebugMode?: boolean;
}

export const SimpleInteractionLayer: Component<SimpleInteractionLayerProps> = (props) => {
  const { resizeOperation, setResizeOperation } = useAppContext();
  const config = DEFAULT_INTERACTION_CONFIG;
  let overlayRef: HTMLDivElement | undefined;
  
  // === 统一状态管理 ===
  const [mode, setMode] = createSignal<InteractionMode>(InteractionMode.IDLE);
  const [selectedElements, setSelectedElements] = createSignal<string[]>([]);
  
  // 拖拽状态
  const [dragState, setDragState] = createSignal<DragState | null>(null);
  
  // 框选状态  
  const [selectionState, setSelectionState] = createSignal<SelectionState | null>(null);
  
  // 🔥 新增：重叠选择状态管理
  interface OverlapContext {
    clickPoint: Point;
    overlappingElements: ReportElement[];
    currentSelectedIndex: number;
    lastClickTime: number;
  }
  
  const [overlapContext, setOverlapContext] = createSignal<OverlapContext | null>(null);
  
  // 🔥 重叠选择工具函数
  const getDistance = (point1: Point, point2: Point): number => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };
  
  const arraysEqual = (arr1: string[], arr2: string[]): boolean => {
    return arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);
  };
  
  // 重置重叠选择上下文
  const resetOverlapContext = () => {
    setOverlapContext(null);
  };
  
  // Resize状态
  const [resizeState, setResizeState] = createSignal<{
    elementId: string;
    handlePosition: string;
    startPoint: Point;
    initialSize: { width: number; height: number };
    initialPosition: { x: number; y: number };
    cursor: string;
  } | null>(null);
  
  // === 🔥 修复后的光标系统 ===
  let currentCursor = 'default';
  
  const updateCursor = (newCursor: string, reason?: string) => {
    if (!overlayRef || currentCursor === newCursor) return;
    
    overlayRef.style.cursor = newCursor;
    currentCursor = newCursor;
    
    if (import.meta.env.DEV) {
      console.log(`🎯 光标更新: ${currentCursor} → ${newCursor} (${reason || ''})`);
    }
  };
  
  // 调试日志
  const debugLog = (message: string, ...args: any[]) => {
    if (config.enableDebugLog || import.meta.env.DEV) {
      console.log(`🎯 [InteractionLayer] ${message}`, ...args);
    }
  };
  
  // 获取鼠标在画布中的位置
  const getCanvasPoint = (event: MouseEvent): Point => {
    if (!overlayRef) return { x: 0, y: 0 };
    
    const rect = overlayRef.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };
  
  // 检查点是否在元素内
  const pointInElement = (point: Point, element: ReportElement): boolean => {
    return point.x >= element.position.x &&
           point.x <= element.position.x + element.size.width &&
           point.y >= element.position.y &&
           point.y <= element.position.y + element.size.height;
  };
  
  // 获取点击位置的元素
  const getElementAtPoint = (point: Point): ReportElement | null => {
    const elements = getElementsAtPoint(point);
    return elements.length > 0 ? (elements[0] ?? null) : null;
  };
  
  // 🔥 新增：获取点击位置的所有重叠元素（按z-index降序排列）
  const getElementsAtPoint = (point: Point): ReportElement[] => {
    const elements = props.getAllElements();
    const overlappingElements = elements.filter(element => 
      element && element.visible && pointInElement(point, element)
    );
    
    // 按z-index降序排列，如果没有z_index则按数组顺序（后面的元素在上层）
    return overlappingElements.sort((a, b) => {
      const aIndex = a.z_index ?? elements.indexOf(a);
      const bIndex = b.z_index ?? elements.indexOf(b);
      return bIndex - aIndex;
    });
  };
  
  // 检查点是否在resize handle上
  const getResizeHandleAtPoint = (point: Point): { elementId: string; direction: string; cursor: string } | null => {
    const selected = selectedElements();
    if (selected.length === 0) return null;
    
    const elements = props.getAllElements();
    
    for (const elementId of selected) {
      const element = elements.find(el => el.id === elementId);
      if (!element || !element.visible) continue;
      
      const handleSize = 8;
      const half = handleSize / 2;
      
      const left = element.position.x;
      const top = element.position.y;
      const right = element.position.x + element.size.width;
      const bottom = element.position.y + element.size.height;
      const centerX = element.position.x + element.size.width / 2;
      const centerY = element.position.y + element.size.height / 2;
      
      const handles = [
        { direction: 'nw', cursor: 'nw-resize', x: left - half, y: top - half },
        { direction: 'ne', cursor: 'ne-resize', x: right - half, y: top - half },
        { direction: 'sw', cursor: 'sw-resize', x: left - half, y: bottom - half },
        { direction: 'se', cursor: 'se-resize', x: right - half, y: bottom - half },
        { direction: 'n', cursor: 'n-resize', x: centerX - half, y: top - half },
        { direction: 's', cursor: 's-resize', x: centerX - half, y: bottom - half },
        { direction: 'w', cursor: 'w-resize', x: left - half, y: centerY - half },
        { direction: 'e', cursor: 'e-resize', x: right - half, y: centerY - half },
      ];
      
      for (const handle of handles) {
        if (point.x >= handle.x && point.x < handle.x + handleSize &&
            point.y >= handle.y && point.y < handle.y + handleSize) {
          return {
            elementId: element.id,
            direction: handle.direction,
            cursor: handle.cursor
          };
        }
      }
    }
    
    return null;
  };
  
  // 获取矩形内的元素
  const getElementsInRect = (rect: Rectangle): ReportElement[] => {
    const elements = props.getAllElements();
    return elements.filter(element => {
      if (!element.visible) return false;
      
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
    });
  };
  
  // === 🔥 重叠选择核心逻辑 ===
  
  // 处理重叠元素的选择逻辑
  const handleOverlapSelection = (clickPoint: Point, isCtrlClick: boolean): string | null => {
    const elementsAtPoint = getElementsAtPoint(clickPoint);
    
    debugLog('重叠选择检测', { 
      elementsCount: elementsAtPoint.length, 
      isCtrlClick,
      elementIds: elementsAtPoint.map(e => e.id)
    });
    
    if (elementsAtPoint.length === 0) return null;
    if (elementsAtPoint.length === 1) {
      resetOverlapContext();
      return elementsAtPoint[0]?.id || null;
    }
    
    if (!isCtrlClick) {
      // 普通点击：选中最上层，重置上下文
      resetOverlapContext();
      debugLog('普通点击选中最上层', { elementId: elementsAtPoint[0]?.id });
      return elementsAtPoint[0]?.id || null;
    }
    
    // Ctrl+点击：循环选择
    return handleCyclicSelection(clickPoint, elementsAtPoint);
  };
  
  // 处理循环选择逻辑
  const handleCyclicSelection = (point: Point, elements: ReportElement[]): string | null => {
    const currentContext = overlapContext();
    const now = Date.now();
    
    debugLog('循环选择开始', { 
      hasContext: !!currentContext,
      elementIds: elements.map(e => e.id)
    });
    
    // 检查是否需要重置上下文
    const shouldReset = !currentContext || 
      getDistance(point, currentContext.clickPoint) > 5 ||
      now - currentContext.lastClickTime > 3000 ||
      !arraysEqual(elements.map(e => e.id), currentContext.overlappingElements.map(e => e.id));
    
    if (shouldReset) {
      // 重置：从第二个元素开始(第一个是默认选择)
      const nextIndex = elements.length > 1 ? 1 : 0;
      setOverlapContext({
        clickPoint: point,
        overlappingElements: elements,
        currentSelectedIndex: nextIndex,
        lastClickTime: now
      });
      
      debugLog('循环选择重置', { 
        selectedIndex: nextIndex,
        selectedId: elements[nextIndex]?.id,
        reason: !currentContext ? 'no_context' : 
               getDistance(point, currentContext.clickPoint) > 5 ? 'position_changed' :
               now - currentContext.lastClickTime > 3000 ? 'timeout' : 'elements_changed'
      });
      
      showOverlapIndicator(nextIndex + 1, elements.length, point);
      return elements[nextIndex]?.id || null;
    } else {
      // 继续循环
      const nextIndex = (currentContext.currentSelectedIndex + 1) % elements.length;
      setOverlapContext({
        ...currentContext,
        currentSelectedIndex: nextIndex,
        lastClickTime: now
      });
      
      debugLog('循环选择继续', { 
        selectedIndex: nextIndex,
        selectedId: elements[nextIndex]?.id
      });
      
      showOverlapIndicator(nextIndex + 1, elements.length, point);
      return elements[nextIndex]?.id || null;
    }
  };
  
  // === 🔥 视觉反馈系统 ===
  
  // 显示重叠指示器
  const showOverlapIndicator = (current: number, total: number, point: Point) => {
    // 移除已存在的指示器
    const existingIndicator = document.querySelector('.overlap-indicator');
    if (existingIndicator?.parentNode) {
      existingIndicator.parentNode.removeChild(existingIndicator);
    }
    
    // 创建新的指示器
    const indicator = document.createElement('div');
    indicator.className = 'overlap-indicator';
    indicator.textContent = `${current}/${total}`;
    
    // 设置样式
    Object.assign(indicator.style, {
      position: 'fixed',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '2px 6px',
      fontSize: '11px',
      fontFamily: 'monospace',
      borderRadius: '3px',
      pointerEvents: 'none',
      zIndex: '9999',
      whiteSpace: 'nowrap',
      left: `${point.x + 10}px`,
      top: `${point.y - 20}px`
    });
    
    // 添加到页面
    document.body.appendChild(indicator);
    
    debugLog('显示重叠指示器', { current, total, point });
    
    // 1.5秒后自动移除
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
        debugLog('移除重叠指示器');
      }
    }, 1500);
  };
  
  // === 鼠标移动事件 - 🔥 修复版本 ===
  const handleMouseMove = (event: MouseEvent) => {
    const currentPoint = getCanvasPoint(event);
    
    // 高优先级：活跃操作状态 - 这些状态锁定光标
    if (resizeState()) {
      handleResizeMove(currentPoint);
      return;
    }
    
    if (mode() === InteractionMode.DRAGGING) {
      handleDragMove(currentPoint);
      return;
    }
    
    if (mode() === InteractionMode.SELECTING) {
      handleSelectionMove(currentPoint);
      return;
    }
    
    // IDLE状态检查拖拽准备
    if (mode() === InteractionMode.IDLE && dragState() && !dragState()?.isDragging) {
      checkDragThreshold(currentPoint);
      return;
    }
    
    // 🔥 关键修复：只在IDLE状态才进行光标检测
    if (mode() === InteractionMode.IDLE && !dragState() && !resizeState()) {
      handleCursorDetection(currentPoint);
    }
  };
  
  // 🔥 修复后的光标检测 - 不锁定状态，持续检测
  const handleCursorDetection = (currentPoint: Point) => {
    // 1. 检查resize handle
    const resizeHandle = getResizeHandleAtPoint(currentPoint);
    if (resizeHandle) {
      updateCursor(resizeHandle.cursor, 'resize_handle');
      return;
    }
    
    // 2. 检查元素
    const element = getElementAtPoint(currentPoint);
    if (element) {
      const isSelected = selectedElements().includes(element.id);
      const cursor = isSelected ? 'grab' : 'pointer';
      updateCursor(cursor, isSelected ? 'selected_element' : 'element');
      return;
    }
    
    // 3. 默认状态
    updateCursor('default', 'canvas');
  };
  
  // === 事件处理 ===
  
  const handleMouseDown = (event: MouseEvent) => {
    const point = getCanvasPoint(event);
    
    // 🔥 关键修复: 优先检查resize handle点击
    const resizeHandle = getResizeHandleAtPoint(point);
    if (resizeHandle) {
      debugLog('点击ResizeHandle', { elementId: resizeHandle.elementId, direction: resizeHandle.direction });
      handleResizeStart(resizeHandle, point, event);
      return;
    }
    
    if (resizeOperation()) {
      debugLog('调整大小操作进行中，跳过交互处理');
      return;
    }
    
    // 🔥 新增：使用重叠选择逻辑
    const selectedElementId = handleOverlapSelection(point, event.ctrlKey);
    debugLog('鼠标按下', { point, selectedElementId, currentMode: mode(), isCtrlClick: event.ctrlKey });
    
    if (selectedElementId) {
      const element = props.getAllElements().find(el => el.id === selectedElementId);
      if (element) {
        handleElementMouseDown(element, point, event);
      }
    } else {
      handleCanvasMouseDown(point, event);
    }
  };
  
  // === Resize操作处理 ===
  
  // 开始resize操作
  const handleResizeStart = (handle: { elementId: string; direction: string; cursor: string }, startPoint: Point, _event: MouseEvent) => {
    const element = props.getAllElements().find(el => el.id === handle.elementId);
    
    if (!element) return;
    
    debugLog('开始resize操作', { elementId: handle.elementId, direction: handle.direction });
    
    // 设置全局resize状态
    setResizeOperation(true);
    
    // 设置本地resize状态
    setResizeState({
      elementId: handle.elementId,
      handlePosition: handle.direction,
      startPoint,
      initialSize: { width: element.size.width, height: element.size.height },
      initialPosition: { x: element.position.x, y: element.position.y },
      cursor: handle.cursor
    });
    
    // 锁定resize光标
    updateCursor(handle.cursor, 'resize_start');
    
    debugLog('resize状态已设置', resizeState());
  };

  const handleElementMouseDown = (element: ReportElement, point: Point, event: MouseEvent) => {
    const isSelected = selectedElements().includes(element.id);
    const currentlySelected = selectedElements();
    const hasOverlapContext = !!overlapContext();
    
    debugLog('元素点击', { 
      elementId: element.id, 
      isSelected, 
      currentlySelected,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      hasOverlapContext
    });
    
    // 🔥 修复：Ctrl+点击重叠选择时，不执行切换选择逻辑
    if (event.ctrlKey && !hasOverlapContext) {
      // 普通Ctrl+点击(非重叠区域)：切换选择状态
      handleToggleSelection(element.id);
    } else if (event.shiftKey && selectedElements().length > 0) {
      handleAddToSelection(element.id);
    } else if (isSelected) {
      debugLog('点击已选中元素，准备拖拽', { selectedCount: currentlySelected.length });
      prepareDragOperation(currentlySelected, point, event);
    } else {
      selectAndPrepareDrag(element.id, point, event);
    }
  };
  
  const handleCanvasMouseDown = (point: Point, _event: MouseEvent) => {
    debugLog('开始框选', { point });
    
    setSelectedElements([]);
    props.onElementsSelect?.([]);
    
    // 🔥 新增：开始框选时重置重叠上下文
    resetOverlapContext();
    
    setMode(InteractionMode.SELECTING);
    updateCursor('crosshair', 'box_select_start');
    
    setSelectionState({
      startPoint: point,
      currentPoint: point,
      selectedIds: []
    });
  };
  
  // === 选择操作 ===
  
  const handleToggleSelection = (elementId: string) => {
    const current = selectedElements();
    const newSelection = current.includes(elementId) 
      ? current.filter(id => id !== elementId)
      : [...current, elementId];
    
    debugLog('切换选择', { elementId, newSelection });
    setSelectedElements(newSelection);
    props.onElementsSelect?.(newSelection);
  };
  
  const handleAddToSelection = (elementId: string) => {
    const current = selectedElements();
    if (!current.includes(elementId)) {
      const newSelection = [...current, elementId];
      debugLog('添加到选择', { elementId, newSelection });
      setSelectedElements(newSelection);
      props.onElementsSelect?.(newSelection);
    }
  };
  
  const selectAndPrepareDrag = (elementId: string, point: Point, event: MouseEvent) => {
    debugLog('选择并准备拖拽', { elementId, point });
    
    setSelectedElements([elementId]);
    props.onElementsSelect?.([elementId]);
    
    prepareDragOperation([elementId], point, event);
  };
  
  // === 拖拽操作 ===
  
  const prepareDragOperation = (elementIds: string[], startPoint: Point, _event: MouseEvent) => {
    debugLog('准备拖拽操作', { elementIds, startPoint });
    
    const elements = props.getAllElements();
    const startPositions = new Map<string, Point>();
    
    elementIds.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        startPositions.set(id, { x: element.position.x, y: element.position.y });
      }
    });
    
    setDragState({
      elementIds,
      startPoint,
      startPositions,
      currentOffset: { x: 0, y: 0 },
      isDragging: false
    });
  };
  
  const checkDragThreshold = (currentPoint: Point) => {
    const drag = dragState();
    if (!drag) return;
    
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - drag.startPoint.x, 2) + 
      Math.pow(currentPoint.y - drag.startPoint.y, 2)
    );
    
    if (distance > config.dragThreshold) {
      debugLog('开始拖拽', { distance, threshold: config.dragThreshold });
      
      setMode(InteractionMode.DRAGGING);
      updateCursor('grabbing', 'drag_start');
      setDragState({ ...drag, isDragging: true });
    }
  };
  
  // 高性能节流
  let pendingUpdate = false;
  let lastUpdateTime = 0;
  const throttledUpdate = (callback: () => void, immediate: boolean = false) => {
    if (immediate) {
      callback();
      return;
    }
    
    const now = Date.now();
    if (now - lastUpdateTime >= config.updateThrottle && !pendingUpdate) {
      pendingUpdate = true;
      requestAnimationFrame(() => {
        callback();
        pendingUpdate = false;
        lastUpdateTime = Date.now();
      });
    }
  };
  
  const handleDragMove = (currentPoint: Point) => {
    const drag = dragState();
    if (!drag) return;
    
    const offset = {
      x: currentPoint.x - drag.startPoint.x,
      y: currentPoint.y - drag.startPoint.y
    };
    
    setDragState({ ...drag, currentOffset: offset });
    
    throttledUpdate(() => {
      if (props.onBatchUpdatePositions && drag.elementIds.length > 1) {
        const positionUpdates = drag.elementIds.map(id => {
          const startPos = drag.startPositions.get(id);
          return startPos ? {
            element_id: id,
            new_position: {
              x: startPos.x + offset.x,
              y: startPos.y + offset.y
            }
          } : null;
        }).filter(Boolean) as Array<{element_id: string, new_position: {x: number, y: number}}>;
        
        if (positionUpdates.length > 0) {
          props.onBatchUpdatePositions(positionUpdates).catch(() => {});
        }
      } else if (props.onElementMove) {
        const updatePromises = drag.elementIds.map(id => {
          const startPos = drag.startPositions.get(id);
          if (startPos) {
            return props.onElementMove!(id, {
              x: startPos.x + offset.x,
              y: startPos.y + offset.y
            });
          }
        }).filter(Boolean);
        
        Promise.allSettled(updatePromises).catch(() => {});
      }
    });
  };
  
  const handleSelectionMove = (currentPoint: Point) => {
    const selection = selectionState();
    if (!selection) return;
    
    const newSelection = { ...selection, currentPoint };
    setSelectionState(newSelection);
    
    const rect: Rectangle = {
      x: Math.min(selection.startPoint.x, currentPoint.x),
      y: Math.min(selection.startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - selection.startPoint.x),
      height: Math.abs(currentPoint.y - selection.startPoint.y)
    };
    
    const elementsInRect = getElementsInRect(rect);
    const elementIds = elementsInRect.map(el => el.id);
    
    setSelectionState({ ...newSelection, selectedIds: elementIds });
    setSelectedElements(elementIds);
  };
  
  const handleResizeMove = (currentPoint: Point) => {
    const resize = resizeState();
    if (!resize) return;

    const deltaX = currentPoint.x - resize.startPoint.x;
    const deltaY = currentPoint.y - resize.startPoint.y;

    const result = calculateResize(
      resize.handlePosition,
      deltaX,
      deltaY,
      resize.initialSize,
      resize.initialPosition
    );

    throttledUpdate(() => {
      if (props.onElementResize) {
        props.onElementResize(resize.elementId, result.size, result.position);
      }
    });
  };

  const calculateResize = (
    handlePosition: string,
    deltaX: number,
    deltaY: number,
    initialSize: { width: number; height: number },
    initialPosition: { x: number; y: number }
  ) => {
    let newWidth = initialSize.width;
    let newHeight = initialSize.height;
    let newX = initialPosition.x;
    let newY = initialPosition.y;

    switch (handlePosition) {
      case 'nw':
        newWidth = initialSize.width - deltaX;
        newHeight = initialSize.height - deltaY;
        newX = initialPosition.x + deltaX;
        newY = initialPosition.y + deltaY;
        break;
      case 'ne':
        newWidth = initialSize.width + deltaX;
        newHeight = initialSize.height - deltaY;
        newY = initialPosition.y + deltaY;
        break;
      case 'sw':
        newWidth = initialSize.width - deltaX;
        newHeight = initialSize.height + deltaY;
        newX = initialPosition.x + deltaX;
        break;
      case 'se':
        newWidth = initialSize.width + deltaX;
        newHeight = initialSize.height + deltaY;
        break;
      case 'n':
        newHeight = initialSize.height - deltaY;
        newY = initialPosition.y + deltaY;
        break;
      case 's':
        newHeight = initialSize.height + deltaY;
        break;
      case 'w':
        newWidth = initialSize.width - deltaX;
        newX = initialPosition.x + deltaX;
        break;
      case 'e':
        newWidth = initialSize.width + deltaX;
        break;
    }

    const minSize = 10;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    return {
      size: { width: newWidth, height: newHeight },
      position: { x: newX, y: newY }
    };
  };
  
  // === 事件结束处理 ===
  
  const handleMouseUp = () => {
    const currentMode = mode();
    
    debugLog('鼠标释放', { currentMode, hasResizeState: !!resizeState() });
    
    if (resizeState()) {
      finalizeResizeOperation();
      return;
    }
    
    if (currentMode === InteractionMode.DRAGGING) {
      finalizeDragOperation();
    } else if (currentMode === InteractionMode.SELECTING) {
      finalizeSelectionOperation();
    }
    
    resetToIdleState();
  };
  
  const finalizeDragOperation = () => {
    const drag = dragState();
    if (!drag || (!drag.isDragging && drag.currentOffset.x === 0 && drag.currentOffset.y === 0)) {
      debugLog('拖拽完成，无实际移动');
      return;
    }
    
    if (props.onBatchUpdatePositions && drag.elementIds.length > 1) {
      const finalPositionUpdates = drag.elementIds.map(id => {
        const startPos = drag.startPositions.get(id);
        return startPos ? {
          element_id: id,
          new_position: {
            x: startPos.x + drag.currentOffset.x,
            y: startPos.y + drag.currentOffset.y
          }
        } : null;
      }).filter(Boolean) as Array<{element_id: string, new_position: {x: number, y: number}}>;
      
      if (finalPositionUpdates.length > 0) {
        debugLog('拖拽完成 - 批量更新', { elementCount: finalPositionUpdates.length });
        props.onBatchUpdatePositions(finalPositionUpdates).catch(error => {
          console.warn('批量更新最终位置失败:', error);
        });
      }
    }
  };
  
  const finalizeSelectionOperation = () => {
    const selection = selectionState();
    if (!selection) return;
    
    debugLog('框选完成', { selectedCount: selection.selectedIds.length });
    
    if (props.onElementsSelect) {
      props.onElementsSelect(selection.selectedIds);
    }
  };

  const finalizeResizeOperation = () => {
    const resize = resizeState();
    if (!resize) return;

    debugLog('完成resize操作', { elementId: resize.elementId });

    setResizeOperation(false);
    setResizeState(null);
  };
  
  const resetToIdleState = () => {
    setMode(InteractionMode.IDLE);
    updateCursor('default', 'reset_to_idle');
    
    setDragState(null);
    setSelectionState(null);
    setResizeState(null);
    setResizeOperation(false);
    
    // 🔥 新增：重置重叠选择上下文
    resetOverlapContext();
    
    debugLog('状态重置完成');
  };
  
  // 初始化和清理
  onMount(async () => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    debugLog('修复版交互层已初始化');
  });
  
  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    debugLog('修复版交互层已清理');
  });
  
  // 计算框选矩形
  const selectionRect = () => {
    const selection = selectionState();
    if (!selection || mode() !== InteractionMode.SELECTING) return null;
    
    const { startPoint, currentPoint } = selection;
    return {
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y)
    };
  };
  
  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        'z-index': 10,
        'pointer-events': 'all',
        background: 'transparent',
        'user-select': 'none'
      }}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      {selectionRect() && (
        <div
          style={{
            position: 'absolute',
            left: `${selectionRect()!.x}px`,
            top: `${selectionRect()!.y}px`,
            width: `${selectionRect()!.width}px`,
            height: `${selectionRect()!.height}px`,
            border: '1px dashed #007acc',
            background: 'rgba(0, 122, 204, 0.1)',
            'pointer-events': 'none'
          }}
        />
      )}
      
      {props.enableDebugMode && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            'font-family': 'monospace',
            'font-size': '12px',
            'border-radius': '4px',
            'z-index': 9999,
            'pointer-events': 'none'
          }}
        >
          <div>🎯 修复版交互层</div>
          <div>模式: {mode()}</div>
          <div>选中: {selectedElements().length}</div>
          <div>光标: {currentCursor}</div>
          {dragState()?.isDragging && (
            <div style={{ color: '#ffeb3b' }}>
              拖拽: {dragState()?.elementIds.length}个元素
            </div>
          )}
          {selectedElements().length > 0 && (
            <div style={{ 'font-size': '10px', color: '#ccc' }}>
              [{selectedElements().slice(0, 3).join(', ')}{selectedElements().length > 3 && '...'}]
            </div>
          )}
        </div>
      )}
    </div>
  );
};