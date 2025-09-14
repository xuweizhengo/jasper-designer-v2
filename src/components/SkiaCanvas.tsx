import { Component, onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import type { CanvasKit } from 'canvaskit-wasm';
import { SkiaRenderer } from '../renderer/skia/core/SkiaRenderer';
import type { RenderElement, RenderOptions } from '../renderer/types';

interface SkiaCanvasProps {
  elements: RenderElement[];
  options?: RenderOptions;
  onReady?: (renderer: SkiaRenderer) => void;
  onElementClick?: (elementId: string) => void;
  onElementDrag?: (elementId: string, delta: { x: number; y: number }) => void;
  width?: number;
  height?: number;
  mode?: 'design' | 'preview';
}

export const SkiaCanvas: Component<SkiaCanvasProps> = (props) => {
  console.log('[SkiaCanvas] Component created with props:', props);

  let canvasRef: HTMLCanvasElement | undefined;
  let renderer: SkiaRenderer | null = null;
  let canvasKit: CanvasKit | null = null;
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string>('');

  console.log('[SkiaCanvas] Initial state - isLoading:', isLoading(), 'error:', error());

  // 鼠标交互状态
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let selectedElement: string | null = null;

  onMount(async () => {
    console.log('[SkiaCanvas] Starting initialization...');

    // 立即显示一个测试消息，确认 onMount 被调用
    setError('Testing: onMount called successfully');

    try {
      // 动态导入 CanvasKit
      console.log('[SkiaCanvas] Loading CanvasKit module...');
      const CanvasKitInit = (await import('canvaskit-wasm')).default;

      console.log('[SkiaCanvas] Initializing CanvasKit with WASM...');
      canvasKit = await CanvasKitInit({
        locateFile: (file) => {
          const path = `./canvaskit/${file}`;
          console.log(`[SkiaCanvas] Loading file: ${file} from ${path}`);
          return path;
        },
      });
      console.log('[SkiaCanvas] CanvasKit loaded successfully');

      // 创建渲染器
      if (canvasRef) {
        console.log('[SkiaCanvas] Creating SkiaRenderer...');
        renderer = new SkiaRenderer(canvasKit, canvasRef);
        console.log('[SkiaCanvas] SkiaRenderer created successfully');
      } else {
        throw new Error('Canvas ref not found');
      }

      // 通知父组件
      props.onReady?.(renderer);

      // 初始渲染（即使没有元素也要渲染背景和网格）
      console.log('[SkiaCanvas] Initial render with', props.elements?.length || 0, 'elements');
      renderer.render(props.elements || [], props.options);

      setIsLoading(false);
      console.log('[SkiaCanvas] Initialization complete');

      // 设置交互（仅设计模式）
      if (props.mode === 'design') {
        setupInteractions();
      }
    } catch (err) {
      console.error('[SkiaCanvas] Failed to initialize:', err);
      if (err instanceof Error) {
        console.error('[SkiaCanvas] Error stack:', err.stack);
        setError(err.message);
      } else {
        setError(String(err) || 'Failed to initialize canvas');
      }
      setIsLoading(false);
    }
  });

  // 响应式更新
  createEffect(() => {
    if (renderer && !isLoading()) {
      try {
        renderer.render(props.elements || [], props.options);
      } catch (err) {
        console.error('Render error:', err);
      }
    }
  });

  // 设置设计模式交互
  const setupInteractions = () => {
    if (!canvasRef) return;

    // 鼠标按下
    canvasRef.addEventListener('mousedown', (e) => {
      const rect = canvasRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 检测点击的元素
      const element = hitTest(x, y);
      if (element) {
        selectedElement = element.id;
        isDragging = true;
        dragStartPos = { x: e.clientX, y: e.clientY };
        props.onElementClick?.(element.id);
      }
    });

    // 鼠标移动
    canvasRef.addEventListener('mousemove', (e) => {
      if (isDragging && selectedElement) {
        const delta = {
          x: e.clientX - dragStartPos.x,
          y: e.clientY - dragStartPos.y,
        };
        dragStartPos = { x: e.clientX, y: e.clientY };
        props.onElementDrag?.(selectedElement, delta);
      }
    });

    // 鼠标释放
    canvasRef.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // 鼠标离开画布
    canvasRef.addEventListener('mouseleave', () => {
      isDragging = false;
    });
  };

  // 简单的碰撞检测
  const hitTest = (x: number, y: number): RenderElement | null => {
    if (!props.elements) return null;

    // 反向遍历（从上到下）
    for (let i = props.elements.length - 1; i >= 0; i--) {
      const elem = props.elements[i];
      if (!elem || !elem.visible || elem.locked) continue;

      const bounds = getElementBounds(elem);
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return elem;
      }
    }
    return null;
  };

  // 获取元素边界
  const getElementBounds = (elem: RenderElement) => {
    const x = elem.transform?.translate?.x || 0;
    const y = elem.transform?.translate?.y || 0;
    const width = elem.style?.width || 100;
    const height = elem.style?.height || 100;
    return { x, y, width, height };
  };

  onCleanup(() => {
    renderer?.dispose();
  });

  console.log('[SkiaCanvas] Rendering component - isLoading:', isLoading(), 'error:', error());

  return (
    <div class="skia-canvas-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading() && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
        }}>
          Loading Canvas...
        </div>
      )}
      {error() && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          'border-radius': '8px',
          'max-width': '80%',
          'z-index': 1000,
          'font-size': '14px',
          'box-shadow': '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          <div style={{ 'font-weight': 'bold', 'margin-bottom': '10px' }}>
            ⚠️ SkiaCanvas 初始化错误
          </div>
          <div style={{ 'font-family': 'monospace', 'white-space': 'pre-wrap' }}>
            {error()}
          </div>
        </div>
      )}
      <canvas
        ref={(el) => {
          console.log('[SkiaCanvas] Canvas ref callback, element:', el);
          canvasRef = el;
        }}
        width={props.width || 1200}
        height={props.height || 800}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',  // Always show canvas
          opacity: isLoading() ? 0.3 : 1,  // Just dim when loading
          cursor: props.mode === 'design' ? 'default' : 'auto',
        }}
      />
    </div>
  );
};