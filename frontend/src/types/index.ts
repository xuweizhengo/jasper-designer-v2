// Element types
export interface Element {
  id: string
  type: 'text' | 'field' | 'image' | 'line' | 'rectangle' | 'group'
  props: ElementProps
  band?: 'title' | 'pageHeader' | 'columnHeader' | 'detail' | 'pageFooter'
  children?: Element[]
}

export interface ElementProps {
  x: number
  y: number
  width: number
  height: number
  
  // Text properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  
  // Data binding
  expression?: string
  format?: string
  
  // Visual properties
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  
  // Image properties
  src?: string
  
  // Line properties
  strokeWidth?: number
  strokeColor?: string
  
  [key: string]: any
}

// Canvas types
export interface CanvasConfig {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
  gridSize: number
  showGrid: boolean
  showRuler: boolean
  snapToGrid: boolean
}

export interface AlignmentLine {
  id: string
  type: 'horizontal' | 'vertical'
  position: number
  length: number
}

// Component library types
export interface ComponentDefinition {
  id: string
  name: string
  icon: string
  category: 'basic' | 'data' | 'bank'
  defaultProps: Partial<ElementProps>
  template?: {
    type: 'group'
    children: Array<{
      type: string
      props: Partial<ElementProps>
    }>
  }
}

// Mock data types
export interface MockDataField {
  name: string
  displayName: string
  type: 'string' | 'number' | 'date' | 'boolean'
  sampleValue: any
}

export interface MockDataSource {
  fields: MockDataField[]
  sampleData: Record<string, any>
}

// Template types
export interface Template {
  id: string
  name: string
  description?: string
  category: string
  thumbnail?: string
  elements: Element[]
  canvasConfig?: Partial<CanvasConfig>
  createdAt?: string
  updatedAt?: string
}

// Store types
export interface AppState {
  canvas: {
    config: CanvasConfig
    elements: Element[]
    selectedIds: string[]
  }
  
  history: {
    past: AppState[]
    present: AppState
    future: AppState[]
  }
  
  mockData: MockDataSource
  
  ui: {
    showGrid: boolean
    showRuler: boolean
    leftPanelWidth: number
    rightPanelWidth: number
    activePanel: 'components' | 'data' | 'templates'
    isDragging: boolean
    dragType?: 'component' | 'element' | 'resize'
    dragData?: any
  }
}

// Event types
export interface DragEvent {
  active: {
    id: string
    data: {
      current: any
    }
  }
  over?: {
    id: string
    data: {
      current: any
    }
  }
  delta: {
    x: number
    y: number
  }
}

// API types
export interface GenerateRequest {
  jrxmlContent: string
  format: 'PDF' | 'HTML'
  data?: Record<string, any>
}

export interface GenerateResponse {
  success: boolean
  fileUrl?: string
  error?: string
}

export interface SaveTemplateRequest {
  name: string
  description?: string
  category: string
  elements: Element[]
  canvasConfig: CanvasConfig
}

export interface TemplateListResponse {
  templates: Array<{
    id: string
    name: string
    category: string
    thumbnail?: string
    createdAt: string
  }>
}

// Utility types
export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type Rect = Point & Size

export type BoundingBox = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

// Property control types
export interface PropertyControl {
  type: 'text' | 'number' | 'select' | 'color' | 'checkbox' | 'expression'
  label: string
  value: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  disabled?: boolean
}

export interface PropertyGroup {
  title: string
  icon: string
  properties: string[]
  condition?: (element: Element) => boolean
}

// Expression types
export interface ExpressionSuggestion {
  label: string
  value: string
  type: 'field' | 'function' | 'operator'
  description?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}