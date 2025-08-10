/**
 * 统一交互层组件
 * 完整的交互系统：选择、拖拽、框选等所有交互功能
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
  const [hoveredElementId, setHoveredElementId] = createSignal<string | null>(null);
  
  // 拖拽状态
  const [dragState, setDragState] = createSignal<DragState | null>(null);
  
  // 框选状态  
  const [selectionState, setSelectionState] = createSignal<SelectionState | null>(null);
  
  // 调试日志
  const debugLog = (message: string, ...args: any[]) => {
    if (config.enableDebugLog) {
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
    const elements = props.getAllElements();
    // 从后往前检查（最上层的元素）
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element && element.visible && pointInElement(point, element)) {
        return element;
      }
    }
    return null;
  };

  // ResizeHandle信息接口
  interface ResizeHandle {
    elementId: string;
    position: 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';
    cursor: string;
    bounds: { x: number; y: number; width: number; height: number };
  }

  // 计算选中元素的所有ResizeHandle
  const getResizeHandles = (): ResizeHandle[] => {
    const handles: ResizeHandle[] = [];
    const selected = selectedElements();
    const elements = props.getAllElements();
    
    selected.forEach(elementId => {
      const element = elements.find(el => el.id === elementId);
      if (!element || !element.visible) return;
      
      const handleSize = 8;
      const halfHandle = handleSize / 2;
      
      // 使用绝对坐标计算手柄位置
      const left = element.position.x;
      const top = element.position.y;
      const right = element.position.x + element.size.width;
      const bottom = element.position.y + element.size.height;
      const centerX = element.position.x + element.size.width / 2;
      const centerY = element.position.y + element.size.height / 2;
      
      const elementHandles = [
        // 四角
        { position: 'nw' as const, cursor: 'nw-resize', x: left - halfHandle, y: top - halfHandle },
        { position: 'ne' as const, cursor: 'ne-resize', x: right - halfHandle, y: top - halfHandle },
        { position: 'sw' as const, cursor: 'sw-resize', x: left - halfHandle, y: bottom - halfHandle },
        { position: 'se' as const, cursor: 'se-resize', x: right - halfHandle, y: bottom - halfHandle },
        
        // 四边中点
        { position: 'n' as const, cursor: 'n-resize', x: centerX - halfHandle, y: top - halfHandle },
        { position: 's' as const, cursor: 's-resize', x: centerX - halfHandle, y: bottom - halfHandle },
        { position: 'w' as const, cursor: 'w-resize', x: left - halfHandle, y: centerY - halfHandle },
        { position: 'e' as const, cursor: 'e-resize', x: right - halfHandle, y: centerY - halfHandle },
      ];
      
      elementHandles.forEach(handle => {
        handles.push({
          elementId: element.id,
          position: handle.position,
          cursor: handle.cursor,
          bounds: {
            x: handle.x,
            y: handle.y,
            width: handleSize,
            height: handleSize
          }
        });
      });
    });
    
    return handles;
  };

  // 获取点击位置的ResizeHandle
  const getResizeHandleAtPoint = (point: Point): ResizeHandle | null => {
    const handles = getCachedResizeHandles();  // 使用缓存版本
    
    // 从后往前检查（优先处理最上层的元素）
    for (let i = handles.length - 1; i >= 0; i--) {
      const handle = handles[i];
      if (!handle) continue;
      
      const bounds = handle.bounds;
      
      if (point.x >= bounds.x && 
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y && 
          point.y <= bounds.y + bounds.height) {
        return handle;
      }
    }
    
    return null;
  };
  
  // 获取矩形内的元素
  const getElementsInRect = (rect: Rectangle): ReportElement[] => {
    const elements = props.getAllElements();
    return elements.filter(element => {
      if (!element.visible) return false;
      
      // 检查元素是否与选择矩形相交
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
  
  // === 事件处理统一入口 ===
  
  // 鼠标按下事件 - 统一入口点
  const handleMouseDown = (event: MouseEvent) => {
    const point = getCanvasPoint(event);
    
    // 1. 首先检查是否点击在ResizeHandle上
    const resizeHandle = getResizeHandleAtPoint(point);
    if (resizeHandle) {
      debugLog('点击ResizeHandle', { elementId: resizeHandle.elementId, position: resizeHandle.position });
      handleResizeStart(resizeHandle, point, event);
      return;
    }
    
    // 2. 然后检查现有的resize状态
    if (resizeOperation()) {
      debugLog('调整大小操作进行中，跳过交互处理');
      return;
    }
    
    // 3. 最后处理常规交互
    const element = getElementAtPoint(point);
    
    debugLog('鼠标按下', { point, elementId: element?.id, currentMode: mode() });
    
    if (element) {
      handleElementMouseDown(element, point, event);
    } else {
      handleCanvasMouseDown(point, event);
    }
  };

  // === Resize操作处理 ===
  
  // Resize状态
  const [resizeState, setResizeState] = createSignal<{
    elementId: string;
    handlePosition: string;
    startPoint: Point;
    initialSize: { width: number; height: number };
    initialPosition: { x: number; y: number };
    cursor: string;
  } | null>(null);

  // 开始resize操作
  const handleResizeStart = (handle: ResizeHandle, startPoint: Point, _event: MouseEvent) => {
    const element = props.getAllElements().find(el => el.id === handle.elementId);
    
    if (!element) return;
    
    debugLog('开始resize操作', { elementId: handle.elementId, position: handle.position });
    
    // 设置全局resize状态
    setResizeOperation(true);
    
    // 设置本地resize状态
    setResizeState({
      elementId: handle.elementId,
      handlePosition: handle.position,
      startPoint,
      initialSize: { width: element.size.width, height: element.size.height },
      initialPosition: { x: element.position.x, y: element.position.y },
      cursor: handle.cursor
    });
    
    // 设置光标
    updateCursor(handle.cursor);
    
    debugLog('resize状态已设置', resizeState());
  };

  // 计算resize结果
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

    // 根据控制点位置计算新尺寸
    switch (handlePosition) {
      case 'nw': // 左上角
        newWidth = initialSize.width - deltaX;
        newHeight = initialSize.height - deltaY;
        newX = initialPosition.x + deltaX;
        newY = initialPosition.y + deltaY;
        break;
      case 'ne': // 右上角
        newWidth = initialSize.width + deltaX;
        newHeight = initialSize.height - deltaY;
        newY = initialPosition.y + deltaY;
        break;
      case 'sw': // 左下角
        newWidth = initialSize.width - deltaX;
        newHeight = initialSize.height + deltaY;
        newX = initialPosition.x + deltaX;
        break;
      case 'se': // 右下角
        newWidth = initialSize.width + deltaX;
        newHeight = initialSize.height + deltaY;
        break;
      case 'n': // 上边
        newHeight = initialSize.height - deltaY;
        newY = initialPosition.y + deltaY;
        break;
      case 's': // 下边
        newHeight = initialSize.height + deltaY;
        break;
      case 'w': // 左边
        newWidth = initialSize.width - deltaX;
        newX = initialPosition.x + deltaX;
        break;
      case 'e': // 右边
        newWidth = initialSize.width + deltaX;
        break;
    }

    // 限制最小尺寸
    const minSize = 10;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    return {
      size: { width: newWidth, height: newHeight },
      position: { x: newX, y: newY }
    };
  };

  // 处理resize移动 - 性能优化版本
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

    // 实时更新元素 - 使用优化的节流机制
    throttledUpdate(() => {
      if (props.onElementResize) {
        // 简化处理，直接调用不等待结果
        props.onElementResize(resize.elementId, result.size, result.position);
      }
    });
  };

  // 完成resize操作
  const finalizeResizeOperation = () => {
    const resize = resizeState();
    if (!resize) return;

    debugLog('完成resize操作', { elementId: resize.elementId });

    // 清理状态
    setResizeOperation(false);
    setResizeState(null);
    updateCursor();
    
    // 主动清理ResizeHandle缓存 - 确保下次重新计算
    // 因为元素几何属性已经改变，需要重新计算handle位置
    lastElementsGeometry.clear();
    cachedResizeHandles = [];
    
    debugLog('ResizeHandle缓存已清理，下次将重新计算');
  };
  
  // 元素点击处理
  const handleElementMouseDown = (element: ReportElement, point: Point, event: MouseEvent) => {
    const isSelected = selectedElements().includes(element.id);
    
    if (event.ctrlKey) {
      // Ctrl+点击：切换选择状态
      handleToggleSelection(element.id);
    } else if (event.shiftKey && selectedElements().length > 0) {
      // Shift+点击：范围选择（暂时简化为添加选择）
      handleAddToSelection(element.id);
    } else if (isSelected) {
      // 点击已选中元素：准备拖拽所有选中的元素
      prepareDragOperation(selectedElements(), point, event);
    } else {
      // 点击未选中元素：选择并准备拖拽
      selectAndPrepareDrag(element.id, point, event);
    }
  };
  
  // 画布点击处理
  const handleCanvasMouseDown = (point: Point, _event: MouseEvent) => {
    debugLog('开始框选', { point });
    
    // 清除当前选择
    setSelectedElements([]);
    props.onElementsSelect?.([]);
    
    // 开始框选
    setMode(InteractionMode.SELECTING);
    setSelectionState({
      startPoint: point,
      currentPoint: point,
      selectedIds: []
    });
  };
  
  // === 选择操作处理 ===
  
  // 切换元素选择状态
  const handleToggleSelection = (elementId: string) => {
    const current = selectedElements();
    const newSelection = current.includes(elementId) 
      ? current.filter(id => id !== elementId)
      : [...current, elementId];
    
    debugLog('切换选择', { elementId, newSelection });
    setSelectedElements(newSelection);
    props.onElementsSelect?.(newSelection);
  };
  
  // 添加到选择
  const handleAddToSelection = (elementId: string) => {
    const current = selectedElements();
    if (!current.includes(elementId)) {
      const newSelection = [...current, elementId];
      debugLog('添加到选择', { elementId, newSelection });
      setSelectedElements(newSelection);
      props.onElementsSelect?.(newSelection);
    }
  };
  
  // 选择并准备拖拽
  const selectAndPrepareDrag = (elementId: string, point: Point, event: MouseEvent) => {
    debugLog('选择并准备拖拽', { elementId, point });
    
    // 先选择元素
    setSelectedElements([elementId]);
    props.onElementsSelect?.([elementId]);
    
    // 然后准备拖拽
    prepareDragOperation([elementId], point, event);
  };
  
  // === 拖拽操作处理 ===
  
  // 准备拖拽操作
  const prepareDragOperation = (elementIds: string[], startPoint: Point, _event: MouseEvent) => {
    debugLog('准备拖拽操作', { elementIds, startPoint });
    
    const elements = props.getAllElements();
    const startPositions = new Map<string, Point>();
    
    // 记录所有选中元素的初始位置
    elementIds.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        startPositions.set(id, { x: element.position.x, y: element.position.y });
      }
    });
    
    // 设置拖拽状态（准备阶段）
    setDragState({
      elementIds,
      startPoint,
      startPositions,
      currentOffset: { x: 0, y: 0 },
      isDragging: false  // 还未开始拖拽，需要超过阈值才开始
    });
  };
  
  // === 工具函数：优化的节流和缓存 ===
  
  // 高性能节流 - 使用requestAnimationFrame
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
  
  // ResizeHandle缓存 - 优化版本，考虑元素几何属性变化
  let cachedResizeHandles: ResizeHandle[] = [];
  let lastSelectedElements: string[] = [];
  let lastElementsGeometry: Map<string, { x: number; y: number; width: number; height: number }> = new Map();
  
  const getCachedResizeHandles = (): ResizeHandle[] => {
    const currentSelected = selectedElements();
    const elements = props.getAllElements();
    
    // 检查选择是否发生变化
    const selectionChanged = currentSelected.length !== lastSelectedElements.length ||
        !currentSelected.every((id, index) => id === lastSelectedElements[index]);
    
    // 检查选中元素的几何属性是否发生变化
    let geometryChanged = false;
    if (!selectionChanged) {
      for (const elementId of currentSelected) {
        const element = elements.find(el => el.id === elementId);
        if (!element) continue;
        
        const lastGeometry = lastElementsGeometry.get(elementId);
        const currentGeometry = {
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height
        };
        
        if (!lastGeometry || 
            lastGeometry.x !== currentGeometry.x ||
            lastGeometry.y !== currentGeometry.y ||
            lastGeometry.width !== currentGeometry.width ||
            lastGeometry.height !== currentGeometry.height) {
          geometryChanged = true;
          break;
        }
      }
    }
    
    // 只在选择或几何属性发生变化时重新计算
    if (selectionChanged || geometryChanged) {
      cachedResizeHandles = getResizeHandles();
      lastSelectedElements = [...currentSelected];
      
      // 更新几何属性缓存
      lastElementsGeometry.clear();
      for (const elementId of currentSelected) {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          lastElementsGeometry.set(elementId, {
            x: element.position.x,
            y: element.position.y,
            width: element.size.width,
            height: element.size.height
          });
        }
      }
      
      debugLog('ResizeHandle缓存更新', { 
        reason: selectionChanged ? 'selection' : 'geometry',
        selectedCount: currentSelected.length,
        handlesCount: cachedResizeHandles.length
      });
    }
    
    return cachedResizeHandles;
  };
  
  // 鼠标移动事件 - 统一处理
  const handleMouseMove = (event: MouseEvent) => {
    const currentPoint = getCanvasPoint(event);
    const currentMode = mode();
    
    // 优先处理resize移动
    if (resizeState()) {
      handleResizeMove(currentPoint);
      return;
    }
    
    if (currentMode === InteractionMode.IDLE && dragState()) {
      // 检查是否超过拖拽阈值
      checkDragThreshold(currentPoint);
    } else if (currentMode === InteractionMode.DRAGGING) {
      // 处理拖拽移动
      handleDragMove(currentPoint);
    } else if (currentMode === InteractionMode.SELECTING) {
      // 处理框选移动
      handleSelectionMove(currentPoint);
    } else {
      // 空闲状态：处理悬停
      handleHoverUpdate(currentPoint);
    }
  };

  // 处理悬停更新 - 性能优化版本
  const handleHoverUpdate = (currentPoint: Point) => {
    // 首先检查ResizeHandle - 使用缓存版本
    const resizeHandle = getResizeHandleAtPoint(currentPoint);
    if (resizeHandle) {
      updateCursor(resizeHandle.cursor);
      const currentHovered = hoveredElementId();
      if (currentHovered !== null) {
        setHoveredElementId(null); // 清除元素悬停状态
      }
      return;
    }
    
    // 然后检查元素悬停 - 减少重复计算
    const element = getElementAtPoint(currentPoint);
    const newHoveredId = element?.id || null;
    const currentHoveredId = hoveredElementId();
    
    // 只在悬停状态真正改变时更新
    if (newHoveredId !== currentHoveredId) {
      setHoveredElementId(newHoveredId);
      updateCursor(); // 只在状态改变时更新光标
    }
  };
  
  // 检查拖拽阈值
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
      setDragState({ ...drag, isDragging: true });
      updateCursor('grabbing');
    }
  };
  
  // 处理拖拽移动 - 性能优化版本
  const handleDragMove = (currentPoint: Point) => {
    const drag = dragState();
    if (!drag) return;
    
    const offset = {
      x: currentPoint.x - drag.startPoint.x,
      y: currentPoint.y - drag.startPoint.y
    };
    
    // 立即更新本地状态以保持视觉响应
    setDragState({ ...drag, currentOffset: offset });
    
    // 节流更新后端状态 - 拖拽期间降低频率
    throttledUpdate(() => {
      if (!props.onElementMove) return;
      
      // 批量处理多个元素移动
      const updatePromises = drag.elementIds.map(id => {
        const startPos = drag.startPositions.get(id);
        if (startPos) {
          return props.onElementMove!(id, {
            x: startPos.x + offset.x,
            y: startPos.y + offset.y
          });
        }
      }).filter(Boolean);
      
      // 不等待异步完成，保持流畅度
      Promise.allSettled(updatePromises).catch(() => {
        // 静默处理错误，避免控制台噪音
      });
    });
  };
  
  // 处理框选移动
  const handleSelectionMove = (currentPoint: Point) => {
    const selection = selectionState();
    if (!selection) return;
    
    const newSelection = { ...selection, currentPoint };
    setSelectionState(newSelection);
    
    // 计算选择矩形内的元素
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
  
  // === 光标管理系统 - 性能优化版本 ===
  
  let currentCursor = 'default';
  
  // 优化的光标更新 - 避免重复DOM操作
  const updateCursor = (cursor?: string) => {
    if (!overlayRef) return;
    
    let targetCursor = cursor;
    
    if (!targetCursor) {
      // 根据当前状态自动判断光标
      const currentMode = mode();
      const hoveredId = hoveredElementId();
      
      if (currentMode === InteractionMode.DRAGGING) {
        targetCursor = 'grabbing';
      } else if (currentMode === InteractionMode.SELECTING) {
        targetCursor = 'crosshair';
      } else if (hoveredId && selectedElements().includes(hoveredId)) {
        targetCursor = 'grab';
      } else if (hoveredId) {
        targetCursor = 'pointer';
      } else {
        targetCursor = 'default';
      }
    }
    
    // 只在光标确实需要改变时更新DOM
    if (currentCursor !== targetCursor) {
      overlayRef.style.cursor = targetCursor;
      currentCursor = targetCursor;
    }
  };
  
  // === 事件结束处理 ===
  
  // 鼠标释放事件 - 统一处理
  const handleMouseUp = () => {
    const currentMode = mode();
    
    debugLog('鼠标释放', { currentMode, hasResizeState: !!resizeState() });
    
    // 优先处理resize结束
    if (resizeState()) {
      finalizeResizeOperation();
      return;
    }
    
    if (currentMode === InteractionMode.DRAGGING) {
      finalizeDragOperation();
    } else if (currentMode === InteractionMode.SELECTING) {
      finalizeSelectionOperation();
    }
    
    // 重置状态
    resetToIdleState();
  };
  
  // 完成拖拽操作 - 确保最终位置同步
  const finalizeDragOperation = () => {
    const drag = dragState();
    if (!drag || (!drag.isDragging && drag.currentOffset.x === 0 && drag.currentOffset.y === 0)) {
      debugLog('拖拽完成，无实际移动');
      return;
    }
    
    // 最终提交位置更新 - 立即执行，不使用节流
    throttledUpdate(() => {
      if (!props.onElementMove) return;
      
      const finalUpdatePromises = drag.elementIds.map(async (id) => {
        const startPos = drag.startPositions.get(id);
        if (startPos) {
          const finalPos = {
            x: startPos.x + drag.currentOffset.x,
            y: startPos.y + drag.currentOffset.y
          };
          
          debugLog('拖拽完成', { elementId: id, finalPosition: finalPos });
          return props.onElementMove!(id, finalPos);
        }
      }).filter(Boolean);
      
      // 等待所有最终更新完成
      Promise.allSettled(finalUpdatePromises).catch(error => {
        console.warn('拖拽最终更新部分失败:', error);
      });
    }, true); // 传入true表示立即执行
    
    // 主动清理ResizeHandle缓存 - 因为元素位置已改变
    if (drag.currentOffset.x !== 0 || drag.currentOffset.y !== 0) {
      lastElementsGeometry.clear();
      cachedResizeHandles = [];
      debugLog('拖拽后清理ResizeHandle缓存，元素位置已改变');
    }
  };
  
  // 完成框选操作
  const finalizeSelectionOperation = () => {
    const selection = selectionState();
    if (!selection) return;
    
    debugLog('框选完成', { selectedCount: selection.selectedIds.length });
    
    // 提交最终选择
    if (props.onElementsSelect) {
      props.onElementsSelect(selection.selectedIds);
    }
  };
  
  // 重置到空闲状态
  const resetToIdleState = () => {
    setMode(InteractionMode.IDLE);
    setDragState(null);
    setSelectionState(null);
    updateCursor();
  };
  
  // 画布点击事件
  const handleCanvasClick = () => {
    // 暂时不实现
  };
  
  // 初始化事件监听
  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    debugLog('统一交互层已初始化');
  });
  
  // 清理事件监听
  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    debugLog('统一交互层已清理');
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
      onClick={handleCanvasClick}
      tabIndex={0}
    >
      {/* 框选指示器 */}
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
      
      {/* 调试信息 */}
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
          <div>🎯 统一交互层</div>
          <div>模式: {mode()}</div>
          <div>选中: {selectedElements().length}</div>
          <div>悬停: {hoveredElementId() || '无'}</div>
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