import { Component, createSignal } from 'solid-js';
import { SkiaCanvas } from '../components/SkiaCanvas';
import type { RenderElement } from '../renderer/types';

export const SkiaTest: Component = () => {
  const [elements, setElements] = createSignal<RenderElement[]>([
    {
      id: '1',
      type: 'rect',
      transform: { translate: { x: 50, y: 50 } },
      style: {
        width: 200,
        height: 100,
        fill: '#4CAF50',
        stroke: '#2E7D32',
        strokeWidth: 2,
      },
      data: {},
      visible: true,
      locked: false,
    },
    {
      id: '2',
      type: 'circle',
      transform: { translate: { x: 300, y: 100 } },
      style: {
        width: 100,
        height: 100,
        fill: '#2196F3',
        opacity: 0.8,
      },
      data: {},
      visible: true,
      locked: false,
    },
    {
      id: '3',
      type: 'text',
      transform: { translate: { x: 100, y: 200 } },
      style: {},
      data: {
        content: 'Skia Renderer Test',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#333333',
      },
      visible: true,
      locked: false,
    },
    {
      id: '4',
      type: 'path',
      transform: { translate: { x: 50, y: 300 } },
      style: {
        stroke: '#FF5722',
        strokeWidth: 3,
        fill: 'none',
      },
      data: {
        commands: [
          { type: 'M', x: 0, y: 0 },
          { type: 'L', x: 100, y: 50 },
          { type: 'L', x: 200, y: 0 },
          { type: 'L', x: 300, y: 50 },
        ],
      },
      visible: true,
      locked: false,
    },
  ]);

  const handleElementClick = (elementId: string) => {
    console.log('Clicked element:', elementId);
  };

  const handleElementDrag = (elementId: string, delta: { x: number; y: number }) => {
    setElements((prev) => prev.map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          transform: {
            ...el.transform,
            translate: {
              x: (el.transform?.translate?.x || 0) + delta.x,
              y: (el.transform?.translate?.y || 0) + delta.y,
            },
          },
        };
      }
      return el;
    }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Skia 渲染器测试</h1>
      <div style={{ border: '1px solid #ccc', width: '800px', height: '600px' }}>
        <SkiaCanvas
          elements={elements()}
          mode="design"
          width={800}
          height={600}
          onElementClick={handleElementClick}
          onElementDrag={handleElementDrag}
        />
      </div>
      <div style={{ 'margin-top': '20px' }}>
        <button onClick={() => {
          console.log('Current elements:', elements());
        }}>
          打印元素状态
        </button>
      </div>
    </div>
  );
};