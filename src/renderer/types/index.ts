// 统一的类型定义（前后端共享）

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  translate?: Point;
  scale?: Point;
  rotate?: number;
  origin?: Point;
}

export interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface ElementStyle {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  blur?: number;
  shadow?: Shadow;
  clipPath?: string;
  blendMode?: BlendMode;
}

export interface RenderElement {
  id: string;
  type: ElementType;
  transform: Transform;
  style: ElementStyle;
  data: any;
  visible: boolean;
  locked: boolean;
  children?: RenderElement[];
}

export type ElementType = 'text' | 'rect' | 'circle' | 'path' | 'image' | 'group';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface Overlay {
  type: 'selection' | 'grid' | 'ruler' | 'guide';
  data: any;
}

export interface RenderOptions {
  viewport?: Viewport;
  quality?: RenderQuality;
  background?: string;
  overlays?: Overlay[];
}

export type RenderQuality = 'draft' | 'normal' | 'high' | 'print';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'webp';
  quality?: number;
  dpi?: number;
  width?: number;
  height?: number;
}

// 与现有系统的类型映射
export function convertFromReportElement(element: any): RenderElement {
  return {
    id: element.id,
    type: mapElementType(element.type),
    transform: {
      translate: { x: element.position.x, y: element.position.y },
      scale: element.scale ? { x: element.scale.x, y: element.scale.y } : undefined,
      rotate: element.rotation,
    },
    style: {
      width: element.size.width,
      height: element.size.height,
      fill: element.style?.fill_color,
      stroke: element.style?.border?.color,
      strokeWidth: element.style?.border?.width,
      opacity: element.style?.opacity,
    },
    data: element.content,
    visible: element.visible,
    locked: element.locked,
  };
}

function mapElementType(type: string): ElementType {
  const typeMap: Record<string, ElementType> = {
    'Text': 'text',
    'Rectangle': 'rect',
    'Circle': 'circle',
    'Line': 'path',
    'Image': 'image',
    'DataField': 'text',
  };
  return typeMap[type] || 'rect';
}