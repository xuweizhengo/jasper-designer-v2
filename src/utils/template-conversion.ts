// === AppState to JasperTemplate Conversion Utilities ===
import type { AppState, ReportElement, ElementContent, CanvasConfig } from '../types'
import type {
  JasperTemplate,
  TemplateElement,
  Canvas,
  ElementType,
  FontConfig,
  AlignmentConfig,
  ElementStyle,
  TemplateMetadata,
} from '../types/template'
import { createEmptyTemplate } from '../types/template'

/**
 * Conversion utilities between existing AppState and new JasperTemplate format
 */
export class AppStateConverter {
  
  // === AppState -> JasperTemplate Conversion ===
  
  /**
   * Convert AppState to JasperTemplate
   */
  static toJasperTemplate(
    appState: AppState,
    metadata?: Partial<TemplateMetadata>
  ): JasperTemplate {
    const template = { ...createEmptyTemplate() } as JasperTemplate
    
    // Update metadata
    const updatedMetadata = {
      ...template.metadata,
      ...metadata,
      last_modified: new Date().toISOString(),
    }
    
    // Convert canvas configuration
    const convertedCanvas = this.convertCanvasConfig(appState.canvas_config)
    
    // Convert elements
    const convertedElements = appState.elements.map(element => 
      this.convertReportElementToTemplateElement(element)
    )
    
    return {
      ...template,
      metadata: updatedMetadata,
      canvas: convertedCanvas,
      elements: convertedElements,
    }
  }
  
  /**
   * Convert CanvasConfig to Canvas
   */
  static convertCanvasConfig(canvasConfig: CanvasConfig): Canvas {
    return {
      width: canvasConfig.width,
      height: canvasConfig.height,
      unit: 'pt', // Default to points
      orientation: canvasConfig.width > canvasConfig.height ? 'landscape' : 'portrait',
      margins: {
        top: 20.0,
        bottom: 20.0,
        left: 20.0,
        right: 20.0,
      },
      grid: {
        enabled: canvasConfig.show_grid,
        size: canvasConfig.grid_size,
        snap: canvasConfig.snap_to_grid,
        visible: canvasConfig.show_grid,
      },
      background: {
        color: canvasConfig.background_color,
      },
    }
  }
  
  /**
   * Convert ReportElement to TemplateElement
   */
  static convertReportElementToTemplateElement(element: ReportElement): TemplateElement {
    const elementType = this.getElementType(element.content)
    const content = this.convertElementContent(element.content)
    const style = this.convertElementStyle(element.content)
    
    return {
      id: element.id,
      element_type: elementType,
      position: {
        x: element.position.x,
        y: element.position.y,
      },
      size: {
        width: element.size.width,
        height: element.size.height,
      },
      z_index: element.z_index,
      visible: element.visible,
      content,
      style,
      data_binding: this.extractDataBinding(element.content),
    }
  }
  
  /**
   * Determine ElementType from ElementContent
   */
  private static getElementType(content: ElementContent): ElementType {
    switch (content.type) {
      case 'Text': return 'Text'
      case 'DataField': return 'DataField'
      case 'Rectangle': return 'Rectangle'
      case 'Line': return 'Line'
      case 'Image': return 'Image'
      default: return 'Text'
    }
  }
  
  /**
   * Convert ElementContent to template format
   */
  private static convertElementContent(content: ElementContent): any {
    switch (content.type) {
      case 'Text':
        return {
          text: content.content,
          font: this.convertTextStyleToFont(content.style),
          alignment: this.convertTextStyleToAlignment(content.style),
          color: content.style.color,
        }
        
      case 'DataField':
        return {
          expression: content.expression,
          format: content.format,
          font: this.convertTextStyleToFont(content.style),
          alignment: this.convertTextStyleToAlignment(content.style),
          color: content.style.color,
        }
        
      case 'Rectangle':
        return {
          color: content.fill_color,
        }
        
      case 'Line':
        return {
          color: content.color,
        }
        
      case 'Image':
        return {
          expression: content.src, // Image source as expression
          text: content.alt,
        }
        
      default:
        return {}
    }
  }
  
  /**
   * Convert TextStyle to FontConfig
   */
  private static convertTextStyleToFont(textStyle: any): FontConfig {
    return {
      family: textStyle.font_family || 'Arial',
      size: textStyle.font_size || 12,
      weight: this.mapFontWeight(textStyle.font_weight),
      style: 'normal', // TODO: Map if needed
    }
  }
  
  /**
   * Convert TextStyle to AlignmentConfig
   */
  private static convertTextStyleToAlignment(textStyle: any): AlignmentConfig {
    return {
      horizontal: this.mapTextAlign(textStyle.align),
      vertical: 'middle',
    }
  }
  
  /**
   * Convert element content to ElementStyle
   */
  private static convertElementStyle(content: ElementContent): ElementStyle {
    const style: any = {}
    
    switch (content.type) {
      case 'Rectangle':
        if (content.fill_color) {
          style.background = { color: content.fill_color }
        }
        if (content.border) {
          style.border = {
            width: content.border.width,
            color: content.border.color,
            style: this.mapBorderStyle(content.border.style),
          }
        }
        break
        
      case 'Text':
      case 'DataField':
        if (content.style.background) {
          style.background = { color: content.style.background.color }
        }
        if (content.style.border) {
          style.border = {
            width: content.style.border.width,
            color: content.style.border.color,
            style: this.mapBorderStyle(content.style.border.style),
          }
        }
        break
    }
    
    return style as ElementStyle
  }
  
  /**
   * Extract data binding information
   */
  private static extractDataBinding(content: ElementContent): any {
    if (content.type === 'DataField' && content.data_source_id) {
      return {
        source_id: content.data_source_id,
        field_name: this.extractFieldNameFromExpression(content.expression),
      }
    }
    return undefined
  }
  
  /**
   * Extract field name from expression like {field_name}
   */
  private static extractFieldNameFromExpression(expression: string): string {
    const match = expression.match(/^\{([^}]+)\}$/)
    return match?.[1] ?? expression
  }
  
  // === JasperTemplate -> AppState Conversion ===
  
  /**
   * Convert JasperTemplate to AppState
   */
  static toAppState(template: JasperTemplate): Partial<AppState> {
    const templateName = template.metadata.description || undefined
    
    return {
      elements: template.elements.map(element => 
        this.convertTemplateElementToReportElement(element)
      ),
      canvas_config: this.convertCanvasToCanvasConfig(template.canvas),
      selected_ids: [],
      can_undo: false,
      can_redo: false,
      dirty: false,
      ...(templateName && { template_name: templateName }),
    }
  }
  
  /**
   * Convert Canvas to CanvasConfig
   */
  static convertCanvasToCanvasConfig(canvas: Canvas): CanvasConfig {
    return {
      width: canvas.width,
      height: canvas.height,
      zoom: 1.0,
      offset_x: 0,
      offset_y: 0,
      show_grid: canvas.grid.enabled,
      show_rulers: true,
      grid_size: canvas.grid.size,
      snap_to_grid: canvas.grid.snap,
      background_color: canvas.background.color,
    }
  }
  
  /**
   * Convert TemplateElement to ReportElement
   */
  static convertTemplateElementToReportElement(element: TemplateElement): ReportElement {
    const content = this.convertTemplateContentToElementContent(element)
    
    return {
      id: element.id,
      position: {
        x: element.position.x,
        y: element.position.y,
      },
      size: {
        width: element.size.width,
        height: element.size.height,
      },
      content,
      z_index: element.z_index,
      visible: element.visible,
      locked: false,
    }
  }
  
  /**
   * Convert template element content to ElementContent
   */
  private static convertTemplateContentToElementContent(element: TemplateElement): ElementContent {
    switch (element.element_type) {
      case 'Text':
        return {
          type: 'Text',
          content: element.content.text || '',
          style: this.convertTemplateStyleToTextStyle(element),
        }
        
      case 'DataField':
        return {
          type: 'DataField',
          expression: element.content.expression || '{data}',
          ...(element.content.format && { format: element.content.format }),
          style: this.convertTemplateStyleToTextStyle(element),
          ...(element.data_binding?.source_id && { data_source_id: element.data_binding.source_id }),
        }
        
      case 'Rectangle':
        return {
          type: 'Rectangle',
          ...(element.style?.background?.color && { fill_color: element.style.background.color }),
          ...(element.content.color && !element.style?.background?.color && { fill_color: element.content.color }),
          ...(element.style?.border && { 
            border: {
              color: element.style.border.color,
              width: element.style.border.width,
              style: this.mapTemplateBorderStyle(element.style.border.style),
            }
          }),
          corner_radius: 0,
          opacity: 1,
        }
        
      case 'Line':
        return {
          type: 'Line',
          color: element.content.color || '#000000',
          width: 1,
          line_style: 'Solid',
          opacity: 1,
        }
        
      case 'Image':
        return {
          type: 'Image',
          src: element.content.expression || '',
          ...(element.content.text && { alt: element.content.text }),
        }
        
      default:
        return {
          type: 'Text',
          content: 'Unknown Element',
          style: this.createDefaultTextStyle(),
        }
    }
  }
  
  /**
   * Convert template style to TextStyle
   */
  private static convertTemplateStyleToTextStyle(element: TemplateElement): any {
    const font = element.content.font
    const alignment = element.content.alignment
    const style = element.style
    
    return {
      font_family: font?.family || 'Arial',
      font_size: font?.size || 12,
      font_weight: this.mapTemplateFont(font?.weight),
      color: element.content.color || '#000000',
      align: this.mapTemplateAlignment(alignment?.horizontal),
      background: style?.background ? {
        color: style.background.color || '',
        opacity: 1,
        padding: 0,
      } : undefined,
      border: style?.border ? {
        color: style.border.color,
        width: style.border.width,
        style: this.mapTemplateBorderStyle(style.border.style),
        radius: 0,
      } : undefined,
    }
  }
  
  /**
   * Create default text style
   */
  private static createDefaultTextStyle(): any {
    return {
      font_family: 'Arial',
      font_size: 12,
      font_weight: 'normal',
      color: '#000000',
      align: 'Left',
    }
  }
  
  // === Mapping Utilities ===
  
  private static mapFontWeight(weight: string | undefined): 'normal' | 'bold' | 'light' {
    switch (weight) {
      case 'bold': return 'bold'
      case 'light': return 'light'
      default: return 'normal'
    }
  }
  
  private static mapTemplateFont(weight: string | undefined): string {
    switch (weight) {
      case 'bold': return 'bold'
      case 'light': return 'light'
      default: return 'normal'
    }
  }
  
  private static mapTextAlign(align: string | undefined): 'left' | 'center' | 'right' | 'justify' {
    switch (align) {
      case 'Center': return 'center'
      case 'Right': return 'right'
      default: return 'left'
    }
  }
  
  private static mapTemplateAlignment(align: string | undefined): 'Left' | 'Center' | 'Right' {
    switch (align) {
      case 'center': return 'Center'
      case 'right': return 'Right'
      default: return 'Left'
    }
  }
  
  private static mapBorderStyle(style: string): 'solid' | 'dashed' | 'dotted' {
    switch (style) {
      case 'Dashed': return 'dashed'
      case 'Dotted': return 'dotted'
      default: return 'solid'
    }
  }
  
  private static mapTemplateBorderStyle(style: string): 'Solid' | 'Dashed' | 'Dotted' {
    switch (style) {
      case 'dashed': return 'Dashed'
      case 'dotted': return 'Dotted'
      default: return 'Solid'
    }
  }
}

// === Template State Manager ===

/**
 * High-level manager that bridges AppState and JasperTemplate
 */
export class TemplateStateManager {
  private currentAppState: AppState | null = null
  private currentTemplate: JasperTemplate | null = null
  private isDirty = false
  
  /**
   * Load template and convert to AppState
   */
  async loadTemplateAsAppState(filePath: string): Promise<AppState> {
    const { TemplateAPI } = await import('../api/template')
    const template = await TemplateAPI.loadTemplate(filePath)
    
    this.currentTemplate = template
    const convertedState = AppStateConverter.toAppState(template) as AppState
    this.currentAppState = convertedState
    this.isDirty = false
    
    return convertedState
  }
  
  /**
   * Save current AppState as template
   */
  async saveAppStateAsTemplate(
    appState: AppState,
    filePath: string,
    metadata?: Partial<TemplateMetadata>
  ): Promise<void> {
    const { TemplateAPI } = await import('../api/template')
    const template = AppStateConverter.toJasperTemplate(appState, metadata)
    
    await TemplateAPI.saveTemplate(template, filePath)
    
    this.currentTemplate = template
    this.currentAppState = appState
    this.isDirty = false
  }
  
  /**
   * Update AppState and mark as dirty
   */
  updateAppState(appState: AppState): void {
    this.currentAppState = appState
    this.isDirty = true
  }
  
  /**
   * Check if state has unsaved changes
   */
  isDirtyState(): boolean {
    return this.isDirty
  }
  
  /**
   * Get current AppState
   */
  getCurrentAppState(): AppState | null {
    return this.currentAppState
  }
  
  /**
   * Get current template
   */
  getCurrentTemplate(): JasperTemplate | null {
    return this.currentTemplate
  }
  
  /**
   * Convert current AppState to template format
   */
  getTemplateFromCurrentState(metadata?: Partial<TemplateMetadata>): JasperTemplate | null {
    if (!this.currentAppState) return null
    
    return AppStateConverter.toJasperTemplate(this.currentAppState, metadata)
  }
  
  /**
   * Synchronize template with current AppState
   */
  syncTemplateWithAppState(metadata?: Partial<TemplateMetadata>): void {
    if (!this.currentAppState) return
    
    this.currentTemplate = AppStateConverter.toJasperTemplate(this.currentAppState, metadata)
    this.isDirty = true
  }
  
  /**
   * Reset to clean state
   */
  reset(): void {
    this.currentAppState = null
    this.currentTemplate = null
    this.isDirty = false
  }
}

// === Validation Utilities ===

export class ConversionValidator {
  
  /**
   * Validate AppState before conversion
   */
  static validateAppState(appState: AppState): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check canvas config
    if (appState.canvas_config.width <= 0 || appState.canvas_config.height <= 0) {
      errors.push('Canvas dimensions must be positive')
    }
    
    // Check elements
    for (const element of appState.elements) {
      if (element.position.x < 0 || element.position.y < 0) {
        errors.push(`Element ${element.id} has invalid position`)
      }
      
      if (element.size.width <= 0 || element.size.height <= 0) {
        errors.push(`Element ${element.id} has invalid size`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  /**
   * Validate template conversion
   */
  static validateConversion(
    original: AppState,
    converted: JasperTemplate
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check element count
    if (original.elements.length !== converted.elements.length) {
      errors.push('Element count mismatch after conversion')
    }
    
    // Check canvas dimensions
    if (
      original.canvas_config.width !== converted.canvas.width ||
      original.canvas_config.height !== converted.canvas.height
    ) {
      errors.push('Canvas dimensions mismatch after conversion')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}