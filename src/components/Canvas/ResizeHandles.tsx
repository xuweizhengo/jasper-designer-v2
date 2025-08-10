import { Component, createSignal, createMemo, onCleanup } from 'solid-js';
import type { ReportElement } from '../../types';
import { useAppContext } from '../../stores/AppContext';

interface ResizeHandlesProps {
  element: ReportElement;
  onResize?: (newSize: { width: number; height: number }, newPosition?: { x: number; y: number }) => void;
}

// 调整控制点的位置类型
type HandlePosition = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

interface ResizeHandle {
  position: HandlePosition;
  cursor: string;
  x: number;
  y: number;
}

const ResizeHandles: Component<ResizeHandlesProps> = (props) => {
  const { updateElement, setResizeOperation } = useAppContext();
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragHandle, setDragHandle] = createSignal<HandlePosition | null>(null);
  const [initialMousePos, setInitialMousePos] = createSignal({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = createSignal({ width: 0, height: 0 });
  const [initialPosition, setInitialPosition] = createSignal({ x: 0, y: 0 });
  
  // 本地拖拽状态 - 避免频繁后端调用
  const [dragPreviewSize, setDragPreviewSize] = createSignal({ width: 0, height: 0 });
  const [dragPreviewPosition, setDragPreviewPosition] = createSignal({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = createSignal(false);

  // 计算8个控制点的位置和样式
  const handles = createMemo((): ResizeHandle[] => {
    const { position, size } = props.element;
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    
    // 使用绝对坐标计算手柄位置
    const left = position.x;
    const top = position.y;
    const right = position.x + size.width;
    const bottom = position.y + size.height;
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    
    return [
      // 四角
      { position: 'nw', cursor: 'nw-resize', x: left - halfHandle, y: top - halfHandle },
      { position: 'ne', cursor: 'ne-resize', x: right - halfHandle, y: top - halfHandle },
      { position: 'sw', cursor: 'sw-resize', x: left - halfHandle, y: bottom - halfHandle },
      { position: 'se', cursor: 'se-resize', x: right - halfHandle, y: bottom - halfHandle },
      
      // 四边中点
      { position: 'n', cursor: 'n-resize', x: centerX - halfHandle, y: top - halfHandle },
      { position: 's', cursor: 's-resize', x: centerX - halfHandle, y: bottom - halfHandle },
      { position: 'w', cursor: 'w-resize', x: left - halfHandle, y: centerY - halfHandle },
      { position: 'e', cursor: 'e-resize', x: right - halfHandle, y: centerY - halfHandle },
    ];
  });

  // 计算新的尺寸和位置
  const calculateResize = (
    handle: HandlePosition,
    deltaX: number,
    deltaY: number,
    shiftKey: boolean = false,
    altKey: boolean = false
  ) => {
    const initial = initialSize();
    const initialPos = initialPosition();
    let newWidth = initial.width;
    let newHeight = initial.height;
    let newX = initialPos.x;
    let newY = initialPos.y;

    // 根据控制点位置计算新尺寸
    switch (handle) {
      case 'nw': // 左上角
        newWidth = initial.width - deltaX;
        newHeight = initial.height - deltaY;
        newX = initialPos.x + deltaX;
        newY = initialPos.y + deltaY;
        break;
      case 'ne': // 右上角
        newWidth = initial.width + deltaX;
        newHeight = initial.height - deltaY;
        newY = initialPos.y + deltaY;
        break;
      case 'sw': // 左下角
        newWidth = initial.width - deltaX;
        newHeight = initial.height + deltaY;
        newX = initialPos.x + deltaX;
        break;
      case 'se': // 右下角
        newWidth = initial.width + deltaX;
        newHeight = initial.height + deltaY;
        break;
      case 'n': // 上边
        newHeight = initial.height - deltaY;
        newY = initialPos.y + deltaY;
        break;
      case 's': // 下边
        newHeight = initial.height + deltaY;
        break;
      case 'w': // 左边
        newWidth = initial.width - deltaX;
        newX = initialPos.x + deltaX;
        break;
      case 'e': // 右边
        newWidth = initial.width + deltaX;
        break;
    }

    // Shift键：保持宽高比
    if (shiftKey && (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
      const aspectRatio = initial.width / initial.height;
      const newAspectRatio = newWidth / newHeight;
      
      if (newAspectRatio > aspectRatio) {
        // 宽度太大，调整宽度
        newWidth = newHeight * aspectRatio;
        if (handle === 'nw' || handle === 'sw') {
          newX = initialPos.x + (initial.width - newWidth);
        }
      } else {
        // 高度太大，调整高度
        newHeight = newWidth / aspectRatio;
        if (handle === 'nw' || handle === 'ne') {
          newY = initialPos.y + (initial.height - newHeight);
        }
      }
    }

    // Alt键：从中心点缩放
    if (altKey) {
      const centerX = initialPos.x + initial.width / 2;
      const centerY = initialPos.y + initial.height / 2;
      
      newX = centerX - newWidth / 2;
      newY = centerY - newHeight / 2;
    }

    // 应用最小尺寸限制
    const minSize = 20;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    return {
      size: { width: newWidth, height: newHeight },
      position: { x: newX, y: newY }
    };
  };

  // Global document click interceptor during resize operations
  const interceptDocumentClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  };

  // 开始拖拽
  const handleMouseDown = (handle: HandlePosition, event: MouseEvent) => {
    // 设置resize操作状态
    setResizeOperation(true);
    
    // 添加文档级点击拦截器
    document.addEventListener('click', interceptDocumentClick, { capture: true });
    
    // 设置拖拽状态
    setIsDragging(true);
    setDragHandle(handle);
    setInitialMousePos({ x: event.clientX, y: event.clientY });
    setInitialSize({ width: props.element.size.width, height: props.element.size.height });
    setInitialPosition({ x: props.element.position.x, y: props.element.position.y });
    
    // 初始化预览状态
    setDragPreviewSize(props.element.size);
    setDragPreviewPosition(props.element.position);
    setHasChanges(false);
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = handles().find(h => h.position === handle)?.cursor || 'default';
  };

  // 拖拽过程 - 恢复实时更新但减少频率
  let lastUpdateTime = 0;
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging()) return;
    
    const currentHandle = dragHandle();
    if (!currentHandle) return;
    
    const initialMouse = initialMousePos();
    const deltaX = event.clientX - initialMouse.x;
    const deltaY = event.clientY - initialMouse.y;
    
    const result = calculateResize(currentHandle, deltaX, deltaY, event.shiftKey, event.altKey);
    
    // 更新本地预览状态
    setDragPreviewSize(result.size);
    setDragPreviewPosition(result.position);
    setHasChanges(Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2);
    
    // 节流实时更新 - 每50ms更新一次
    const now = Date.now();
    if (now - lastUpdateTime > 50) {
      try {
        updateElement(props.element.id, {
          size: result.size,
          position: result.position
        });
        lastUpdateTime = now;
      } catch (error) {
        // 静默处理错误
      }
    }
  };

  // 结束拖拽 - 最终更新
  const handleMouseUp = () => {
    if (!isDragging()) return;
    
    const currentHandle = dragHandle();
    if (!currentHandle) return;
    
    // 清理状态和事件监听
    const cleanup = () => {
      document.removeEventListener('click', interceptDocumentClick, { capture: true });
      setResizeOperation(false);
      setIsDragging(false);
      setDragHandle(null);
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // 最终更新 - 使用最新的预览状态
    if (hasChanges()) {
      const finalSize = dragPreviewSize();
      const finalPosition = dragPreviewPosition();
      
      updateElement(props.element.id, {
        size: finalSize,
        position: finalPosition
      }).catch(_error => {
        // 错误回滚 - 恢复原始状态
        updateElement(props.element.id, {
          size: initialSize(),
          position: initialPosition()
        }).catch(_rollbackError => {
          // 静默处理回滚错误
        });
      });
    }
    
    // 立即清理状态
    cleanup();
  };

  // 清理事件监听器
  onCleanup(() => {
    setResizeOperation(false);
    document.removeEventListener('click', interceptDocumentClick, { capture: true });
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  });

  return (
    <g class="resize-handles">
      {handles().map((handle) => (
        <g>
          {/* 白色背景圆圈增强可见性 */}
          <circle
            cx={handle.x + 4}
            cy={handle.y + 4}
            r="6"
            fill="white"
            stroke="#cccccc"
            stroke-width="1"
            pointer-events="none"
          />
          {/* 蓝色控制点 */}
          <rect
            class="resize-handle"
            x={handle.x}
            y={handle.y}
            width="8"
            height="8"
            rx="1"
            fill="#007bff"
            stroke="white"
            stroke-width="1"
            style={{
              cursor: handle.cursor,
              'pointer-events': 'all'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMouseDown(handle.position, e);
            }}
            onMouseEnter={(_e) => {
              if (!isDragging()) {
                document.body.style.cursor = handle.cursor;
              }
            }}
            onMouseLeave={(_e) => {
              if (!isDragging()) {
                document.body.style.cursor = 'default';
              }
            }}
          />
        </g>
      ))}
    </g>
  );
};

export default ResizeHandles;