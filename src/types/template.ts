// === Jasper Template TypeScript Types ===
// This file matches the Rust structures for type safety

// === Template Metadata ===
export interface TemplateMetadata {
  readonly version: string
  readonly format_version: string
  readonly created_at: string // ISO 8601 format
  readonly last_modified: string // ISO 8601 format
  readonly created_by: string
  readonly description?: string
  readonly tags: ReadonlyArray<string>
  readonly compatibility: CompatibilityInfo
}

export interface CompatibilityInfo {
  readonly min_jasper_version: string
  readonly jasperreports_version?: string
}

// === Canvas Configuration ===
export interface Canvas {
  readonly width: number
  readonly height: number
  readonly unit: PageUnit
  readonly orientation: PageOrientation
  readonly margins: PageMargins
  readonly grid: GridConfig
  readonly background: BackgroundConfig
}

export type PageUnit = 'pt' | 'mm' | 'in' | 'px'
export type PageOrientation = 'portrait' | 'landscape'

export interface PageMargins {
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

export interface GridConfig {
  readonly enabled: boolean
  readonly size: number
  readonly snap: boolean
  readonly visible: boolean
}

export interface BackgroundConfig {
  readonly color: string
  readonly image?: string
}

// === Data Source Configuration ===
export interface DataSource {
  readonly id: string
  readonly name: string
  readonly source_type: DataSourceType
  readonly provider_type: string
  readonly config: DataSourceConfig
  readonly schema: DataSchema
  readonly query?: DataQuery
}

export type DataSourceType = 'json' | 'excel' | 'sql' | 'xml' | 'csv'

export interface DataSourceConfig {
  // Database configuration
  readonly host?: string
  readonly port?: number
  readonly database?: string
  readonly username?: string
  readonly password?: string
  readonly ssl_mode?: string
  
  // File configuration
  readonly file_path?: string
  readonly sheet_name?: string
  readonly delimiter?: string
  
  // API configuration
  readonly url?: string
  readonly headers?: Record<string, string>
  readonly auth_method?: string
  
  // Connection settings
  readonly timeout?: number
  readonly retry_count?: number
}

export interface DataSchema {
  readonly columns: ReadonlyArray<ColumnInfo>
  readonly primary_key?: string
  readonly indexes: ReadonlyArray<string>
  readonly relationships: Record<string, any>
  readonly metadata: Record<string, any>
}

export interface ColumnInfo {
  readonly name: string
  readonly data_type: DataType
  readonly nullable: boolean
  readonly default_value?: any
  readonly constraints: ReadonlyArray<string>
  readonly description?: string
  readonly format_hint?: string
}

export type DataType = 'String' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'Array' | 'Object' | 'Null'

export interface DataQuery {
  readonly sql?: string
  readonly path?: string
  readonly filter?: string
  readonly limit?: number
  readonly offset?: number
  readonly sort?: string
  readonly parameters: ReadonlyArray<QueryParameter>
}

export interface QueryParameter {
  readonly name: string
  readonly param_type: DataType
  readonly default?: any
  readonly description?: string
}

// === Template Elements ===
export interface TemplateElement {
  readonly id: string
  readonly element_type: ElementType
  readonly position: Position
  readonly size: Size
  readonly z_index: number
  readonly visible: boolean
  readonly content: ElementContent
  readonly style: ElementStyle
  readonly data_binding?: DataBinding
}

export type ElementType = 'Text' | 'DataField' | 'Rectangle' | 'Line' | 'Image' | 'Barcode' | 'Chart'

export interface Position {
  readonly x: number
  readonly y: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

export interface ElementContent {
  readonly text?: string
  readonly expression?: string
  readonly font?: FontConfig
  readonly alignment?: AlignmentConfig
  readonly color?: string
  readonly format?: string
}

export interface FontConfig {
  readonly family: string
  readonly size: number
  readonly weight: FontWeight
  readonly style: FontStyle
}

export type FontWeight = 'normal' | 'bold' | 'light'
export type FontStyle = 'normal' | 'italic' | 'oblique'

export interface AlignmentConfig {
  readonly horizontal: HorizontalAlignment
  readonly vertical: VerticalAlignment
}

export type HorizontalAlignment = 'left' | 'center' | 'right' | 'justify'
export type VerticalAlignment = 'top' | 'middle' | 'bottom'

export interface ElementStyle {
  readonly background?: BackgroundStyle
  readonly border?: BorderStyle
  readonly padding?: PaddingConfig
}

export interface BackgroundStyle {
  readonly color?: string
  readonly image?: string
}

export interface BorderStyle {
  readonly width: number
  readonly color: string
  readonly style: BorderStyleType
}

export type BorderStyleType = 'solid' | 'dashed' | 'dotted'

export interface PaddingConfig {
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

export interface DataBinding {
  readonly source_id: string
  readonly field_name: string
  readonly validation?: ValidationRules
}

export interface ValidationRules {
  readonly required: boolean
  readonly max_length?: number
  readonly min_length?: number
  readonly pattern?: string
}

// === Parameters and Variables ===
export interface Parameter {
  readonly name: string
  readonly param_type: DataType
  readonly default?: any
  readonly description?: string
  readonly required: boolean
}

export interface Variable {
  readonly name: string
  readonly var_type: DataType
  readonly expression: string
  readonly initial_value?: any
  readonly description?: string
}

// === Groups ===
export interface Group {
  readonly name: string
  readonly expression: string
  readonly sort_order: SortOrder
  readonly header?: BandConfig
  readonly footer?: BandConfig
}

export type SortOrder = 'asc' | 'desc'

export interface BandConfig {
  readonly height: number
  readonly elements: ReadonlyArray<string> // Element IDs
}

// === Main Template Structure ===
export interface JasperTemplate {
  readonly metadata: TemplateMetadata
  readonly canvas: Canvas
  readonly data_sources: ReadonlyArray<DataSource>
  readonly elements: ReadonlyArray<TemplateElement>
  readonly parameters: ReadonlyArray<Parameter>
  readonly variables: ReadonlyArray<Variable>
  readonly groups: ReadonlyArray<Group>
}

// === Template Information and Utilities ===
export interface TemplateInfo {
  readonly version: string
  readonly format_version: string
  readonly created_at: string
  readonly last_modified: string
  readonly description?: string
  readonly tags: ReadonlyArray<string>
  readonly element_count: number
  readonly data_source_count: number
  readonly parameter_count: number
}

export interface TemplatePreview {
  readonly metadata: TemplateMetadata
  readonly canvas: CanvasInfo
  readonly elements: ReadonlyArray<ElementSummary>
  readonly data_sources: ReadonlyArray<DataSourceSummary>
  readonly parameters: ReadonlyArray<Parameter>
  readonly variables: ReadonlyArray<Variable>
}

export interface CanvasInfo {
  readonly width: number
  readonly height: number
  readonly unit: string
  readonly orientation: string
}

export interface ElementSummary {
  readonly id: string
  readonly element_type: string
  readonly position: Position
  readonly size: Size
  readonly visible: boolean
}

export interface DataSourceSummary {
  readonly id: string
  readonly name: string
  readonly source_type: string
  readonly column_count: number
}

// === Template Format Types ===
export type TemplateFormat = 'json' | 'binary' | 'jrxml' | 'unknown'

// === Validation Results ===
export interface TemplateValidationResult {
  readonly valid: boolean
  readonly errors: ReadonlyArray<string>
  readonly warnings: ReadonlyArray<string>
}

// === Factory Functions for Creating Templates ===
export const createEmptyTemplate = (): Partial<JasperTemplate> => ({
  metadata: {
    version: '2.0.0',
    format_version: '1.0.0',
    created_at: new Date().toISOString(),
    last_modified: new Date().toISOString(),
    created_by: 'jasper-designer-v2',
    tags: [],
    compatibility: {
      min_jasper_version: '2.0.0',
      jasperreports_version: '6.20.0',
    },
  },
  canvas: {
    width: 595.0,
    height: 842.0,
    unit: 'pt' as PageUnit,
    orientation: 'portrait' as PageOrientation,
    margins: {
      top: 20.0,
      bottom: 20.0,
      left: 20.0,
      right: 20.0,
    },
    grid: {
      enabled: true,
      size: 10.0,
      snap: true,
      visible: true,
    },
    background: {
      color: '#ffffff',
    },
  },
  data_sources: [],
  elements: [],
  parameters: [],
  variables: [],
  groups: [],
})

export const createDefaultFont = (): FontConfig => ({
  family: 'Arial',
  size: 12.0,
  weight: 'normal',
  style: 'normal',
})

export const createDefaultAlignment = (): AlignmentConfig => ({
  horizontal: 'left',
  vertical: 'middle',
})

export const createDefaultPadding = (): PaddingConfig => ({
  top: 0.0,
  bottom: 0.0,
  left: 0.0,
  right: 0.0,
})

// === Element Creation Helpers ===
export const createTextElement = (
  text: string,
  position: Position,
  size: Size,
  font?: Partial<FontConfig>
): Partial<TemplateElement> => ({
  id: crypto.randomUUID(),
  element_type: 'Text',
  position,
  size,
  z_index: 1,
  visible: true,
  content: {
    text,
    font: { ...createDefaultFont(), ...font },
    alignment: createDefaultAlignment(),
    color: '#000000',
  },
  style: {
    padding: createDefaultPadding(),
  },
})

export const createDataFieldElement = (
  expression: string,
  position: Position,
  size: Size,
  dataBinding?: DataBinding
): Partial<TemplateElement> => ({
  id: crypto.randomUUID(),
  element_type: 'DataField',
  position,
  size,
  z_index: 1,
  visible: true,
  content: {
    expression,
    font: createDefaultFont(),
    alignment: createDefaultAlignment(),
    color: '#000000',
  },
  style: {
    padding: createDefaultPadding(),
  },
  ...(dataBinding && { data_binding: dataBinding }),
})

export const createRectangleElement = (
  position: Position,
  size: Size,
  fillColor?: string,
  borderStyle?: BorderStyle
): Partial<TemplateElement> => ({
  id: crypto.randomUUID(),
  element_type: 'Rectangle',
  position,
  size,
  z_index: 0,
  visible: true,
  content: {
    ...(fillColor && { color: fillColor }),
  },
  style: {
    ...(fillColor && { background: { color: fillColor } }),
    ...(borderStyle && { border: borderStyle }),
    padding: createDefaultPadding(),
  },
})

// === Type Guards ===
export const isTextElement = (element: TemplateElement): boolean => 
  element.element_type === 'Text'

export const isDataFieldElement = (element: TemplateElement): boolean => 
  element.element_type === 'DataField'

export const isRectangleElement = (element: TemplateElement): boolean => 
  element.element_type === 'Rectangle'

export const isLineElement = (element: TemplateElement): boolean => 
  element.element_type === 'Line'

export const isImageElement = (element: TemplateElement): boolean => 
  element.element_type === 'Image'

export const hasDataBinding = (element: TemplateElement): boolean => 
  element.data_binding !== undefined

// === Template Utilities ===
export const getElementsInBounds = (
  template: JasperTemplate,
  bounds: { x: number; y: number; width: number; height: number }
): ReadonlyArray<TemplateElement> => {
  return template.elements.filter(element => {
    const elementRight = element.position.x + element.size.width
    const elementBottom = element.position.y + element.size.height
    const boundsRight = bounds.x + bounds.width
    const boundsBottom = bounds.y + bounds.height
    
    return !(
      element.position.x > boundsRight ||
      elementRight < bounds.x ||
      element.position.y > boundsBottom ||
      elementBottom < bounds.y
    )
  })
}

export const getElementById = (
  template: JasperTemplate,
  id: string
): TemplateElement | undefined => {
  return template.elements.find(element => element.id === id)
}

export const getDataSourceById = (
  template: JasperTemplate,
  id: string
): DataSource | undefined => {
  return template.data_sources.find(ds => ds.id === id)
}

export const validateExpression = (
  expression: string,
  template: JasperTemplate
): { valid: boolean; error?: string } => {
  // Basic expression validation
  if (!expression.trim()) {
    return { valid: false, error: 'Expression cannot be empty' }
  }
  
  // Check if expression uses valid syntax (basic check)
  const fieldPattern = /\{([^}]+)\}/g
  const matches = [...expression.matchAll(fieldPattern)]
  
  for (const match of matches) {
    const fieldPath = match[1]
    if (!fieldPath) continue
    
    // Validate field exists in data sources
    let fieldFound = false
    
    for (const dataSource of template.data_sources) {
      const topLevelField = fieldPath.split('.')[0]
      if (dataSource.schema.columns.some((col: any) => col.name === topLevelField)) {
        fieldFound = true
        break
      }
    }
    
    if (!fieldFound) {
      return { valid: false, error: `Field '${fieldPath}' not found in any data source` }
    }
  }
  
  return { valid: true }
}