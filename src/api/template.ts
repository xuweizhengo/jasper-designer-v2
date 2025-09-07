// === Jasper Template API Client ===
import { invoke } from '@tauri-apps/api/tauri'
import type {
  JasperTemplate,
  TemplateInfo,
  TemplatePreview,
  TemplateFormat,
} from '../types/template'

/**
 * Template API Client for Jasper Template Operations
 * Provides type-safe access to Rust backend template commands
 */
export class TemplateAPI {
  
  // === Basic Template Operations ===
  
  /**
   * Load a template from file
   */
  static async loadTemplate(filePath: string): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('load_jasper_template', { filePath })
  }
  
  /**
   * Save a template to file (JSON format)
   */
  static async saveTemplate(template: JasperTemplate, filePath: string): Promise<void> {
    await invoke<void>('save_jasper_template', { template, filePath })
  }
  
  /**
   * Save a template in specific format
   */
  static async saveTemplateAs(
    template: JasperTemplate,
    filePath: string,
    format: TemplateFormat
  ): Promise<void> {
    await invoke<void>('save_template_as', { template, filePath, format })
  }
  
  /**
   * Validate a template
   */
  static async validateTemplate(template: JasperTemplate): Promise<boolean> {
    return await invoke<boolean>('validate_template', { template })
  }
  
  /**
   * Create a new empty template
   */
  static async createEmptyTemplate(): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('create_empty_template')
  }
  
  // === Template Information ===
  
  /**
   * Get template metadata and statistics
   */
  static async getTemplateInfo(filePath: string): Promise<TemplateInfo> {
    return await invoke<TemplateInfo>('get_template_info', { filePath })
  }
  
  /**
   * Detect template file format
   */
  static async detectTemplateFormat(filePath: string): Promise<TemplateFormat> {
    const formatString = await invoke<string>('detect_template_format', { filePath })
    return formatString as TemplateFormat
  }
  
  /**
   * Generate template preview with summary information
   */
  static async generateTemplatePreview(template: JasperTemplate): Promise<TemplatePreview> {
    return await invoke<TemplatePreview>('generate_template_preview', { template })
  }
  
  // === Import/Export Operations ===
  
  /**
   * Export template to JSON string
   */
  static async exportTemplateJson(template: JasperTemplate): Promise<string> {
    return await invoke<string>('export_template_json', { template })
  }
  
  /**
   * Import template from JSON string
   */
  static async importTemplateJson(jsonData: string): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('import_template_json', { jsonData })
  }
  
  // === Template Utilities ===
  
  /**
   * Clone a template with new IDs
   */
  static async cloneTemplate(template: JasperTemplate): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('clone_template', { template })
  }
  
  /**
   * Merge two templates
   */
  static async mergeTemplates(
    baseTemplate: JasperTemplate,
    overlayTemplate: JasperTemplate
  ): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('merge_templates', { baseTemplate, overlayTemplate })
  }
  
  /**
   * Extract specific elements from a template
   */
  static async extractTemplateElements(
    template: JasperTemplate,
    elementIds: string[]
  ): Promise<JasperTemplate> {
    return await invoke<JasperTemplate>('extract_template_elements', { template, elementIds })
  }
}

// === Template Manager Class ===

/**
 * High-level template management with caching and state management
 */
export class TemplateManager {
  private currentTemplate: JasperTemplate | null = null
  private templateHistory: JasperTemplate[] = []
  private maxHistorySize = 10
  
  /**
   * Load and set as current template
   */
  async loadTemplate(filePath: string): Promise<JasperTemplate> {
    const template = await TemplateAPI.loadTemplate(filePath)
    this.setCurrentTemplate(template)
    return template
  }
  
  /**
   * Save current template
   */
  async saveCurrentTemplate(filePath: string): Promise<void> {
    if (!this.currentTemplate) {
      throw new Error('No template loaded')
    }
    
    await TemplateAPI.saveTemplate(this.currentTemplate, filePath)
  }
  
  /**
   * Create new empty template
   */
  async createNewTemplate(): Promise<JasperTemplate> {
    const template = await TemplateAPI.createEmptyTemplate()
    this.setCurrentTemplate(template)
    return template
  }
  
  /**
   * Get current template
   */
  getCurrentTemplate(): JasperTemplate | null {
    return this.currentTemplate
  }
  
  /**
   * Set current template and add to history
   */
  setCurrentTemplate(template: JasperTemplate): void {
    if (this.currentTemplate) {
      this.addToHistory(this.currentTemplate)
    }
    this.currentTemplate = template
  }
  
  /**
   * Update current template
   */
  updateCurrentTemplate(updates: Partial<JasperTemplate>): JasperTemplate | null {
    if (!this.currentTemplate) {
      return null
    }
    
    this.addToHistory(this.currentTemplate)
    this.currentTemplate = {
      ...this.currentTemplate,
      ...updates,
      metadata: {
        ...this.currentTemplate.metadata,
        last_modified: new Date().toISOString(),
      },
    }
    
    return this.currentTemplate
  }
  
  /**
   * Add element to current template
   */
  addElement(element: any): boolean {
    if (!this.currentTemplate) {
      return false
    }
    
    this.addToHistory(this.currentTemplate)
    this.currentTemplate = {
      ...this.currentTemplate,
      elements: [...this.currentTemplate.elements, element],
      metadata: {
        ...this.currentTemplate.metadata,
        last_modified: new Date().toISOString(),
      },
    }
    
    return true
  }
  
  /**
   * Remove element from current template
   */
  removeElement(elementId: string): boolean {
    if (!this.currentTemplate) {
      return false
    }
    
    const elements = this.currentTemplate.elements.filter(e => e.id !== elementId)
    if (elements.length === this.currentTemplate.elements.length) {
      return false // Element not found
    }
    
    this.addToHistory(this.currentTemplate)
    this.currentTemplate = {
      ...this.currentTemplate,
      elements,
      metadata: {
        ...this.currentTemplate.metadata,
        last_modified: new Date().toISOString(),
      },
    }
    
    return true
  }
  
  /**
   * Update element in current template
   */
  updateElement(elementId: string, updates: any): boolean {
    if (!this.currentTemplate) {
      return false
    }
    
    const elementIndex = this.currentTemplate.elements.findIndex(e => e.id === elementId)
    if (elementIndex === -1) {
      return false
    }
    
    this.addToHistory(this.currentTemplate)
    const elements = [...this.currentTemplate.elements]
    elements[elementIndex] = { ...elements[elementIndex], ...updates }
    
    this.currentTemplate = {
      ...this.currentTemplate,
      elements,
      metadata: {
        ...this.currentTemplate.metadata,
        last_modified: new Date().toISOString(),
      },
    }
    
    return true
  }
  
  /**
   * Validate current template
   */
  async validateCurrentTemplate(): Promise<boolean> {
    if (!this.currentTemplate) {
      return false
    }
    
    return await TemplateAPI.validateTemplate(this.currentTemplate)
  }
  
  /**
   * Clone current template
   */
  async cloneCurrentTemplate(): Promise<JasperTemplate | null> {
    if (!this.currentTemplate) {
      return null
    }
    
    return await TemplateAPI.cloneTemplate(this.currentTemplate)
  }
  
  /**
   * Undo last change
   */
  undo(): JasperTemplate | null {
    if (this.templateHistory.length === 0) {
      return null
    }
    
    this.currentTemplate = this.templateHistory.pop() || null
    return this.currentTemplate
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.templateHistory.length > 0
  }
  
  /**
   * Get template history
   */
  getHistory(): readonly JasperTemplate[] {
    return this.templateHistory
  }
  
  /**
   * Clear template history
   */
  clearHistory(): void {
    this.templateHistory = []
  }
  
  private addToHistory(template: JasperTemplate): void {
    this.templateHistory.push(template)
    
    // Limit history size
    if (this.templateHistory.length > this.maxHistorySize) {
      this.templateHistory.shift()
    }
  }
}

// === Template File Utilities ===

export class TemplateFileUtils {
  
  /**
   * Get supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return ['.jasper', '.jrxml', '.json']
  }
  
  /**
   * Check if file extension is supported
   */
  static isSupportedExtension(filename: string): boolean {
    const ext = this.getFileExtension(filename)
    return this.getSupportedExtensions().includes(ext)
  }
  
  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot === -1 ? '' : filename.substring(lastDot)
  }
  
  /**
   * Generate default filename for template
   */
  static generateDefaultFilename(template?: JasperTemplate): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const description = template?.metadata.description?.replace(/[^a-zA-Z0-9]/g, '_') || 'template'
    return `${description}_${timestamp}.jasper`
  }
  
  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

// === Template Preview Generator ===

export class TemplatePreviewGenerator {
  
  /**
   * Generate SVG preview of template
   */
  static generateSvgPreview(template: JasperTemplate, options?: {
    scale?: number
    showGrid?: boolean
    maxWidth?: number
    maxHeight?: number
  }): string {
    const { scale = 1, showGrid = false, maxWidth = 800, maxHeight = 600 } = options || {}
    
    const canvas = template.canvas
    let width = canvas.width * scale
    let height = canvas.height * scale
    
    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const widthScale = maxWidth / width
      const heightScale = maxHeight / height
      const finalScale = Math.min(widthScale, heightScale)
      width *= finalScale
      height *= finalScale
    }
    
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">`
    
    // Background
    svg += `<rect width="100%" height="100%" fill="${canvas.background.color}"/>`
    
    // Grid
    if (showGrid && canvas.grid.enabled) {
      const gridSize = canvas.grid.size
      svg += `<defs><pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">`
      svg += `<path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`
      svg += `</pattern></defs>`
      svg += `<rect width="100%" height="100%" fill="url(#grid)"/>`
    }
    
    // Elements (sorted by z-index)
    const sortedElements = [...template.elements].sort((a, b) => a.z_index - b.z_index)
    
    for (const element of sortedElements) {
      if (!element.visible) continue
      
      const { position, size, content } = element
      
      switch (element.element_type) {
        case 'Text':
          svg += `<text x="${position.x}" y="${position.y + (content.font?.size || 12) * 0.8}" `
          svg += `font-family="${content.font?.family || 'Arial'}" `
          svg += `font-size="${content.font?.size || 12}" `
          svg += `fill="${content.color || '#000000'}">`
          svg += escapeXml(content.text || '')
          svg += `</text>`
          break
          
        case 'Rectangle':
          svg += `<rect x="${position.x}" y="${position.y}" `
          svg += `width="${size.width}" height="${size.height}" `
          svg += `fill="${content.color || 'transparent'}" `
          if (element.style?.border) {
            svg += `stroke="${element.style.border.color}" `
            svg += `stroke-width="${element.style.border.width}" `
          }
          svg += `/>`
          break
          
        case 'Line':
          // Simple horizontal line for preview
          svg += `<line x1="${position.x}" y1="${position.y + size.height / 2}" `
          svg += `x2="${position.x + size.width}" y2="${position.y + size.height / 2}" `
          svg += `stroke="${content.color || '#000000'}" stroke-width="1"/>`
          break
          
        case 'DataField':
          svg += `<rect x="${position.x}" y="${position.y}" `
          svg += `width="${size.width}" height="${size.height}" `
          svg += `fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>`
          svg += `<text x="${position.x + 5}" y="${position.y + (content.font?.size || 12) * 0.8}" `
          svg += `font-family="${content.font?.family || 'Arial'}" `
          svg += `font-size="${content.font?.size || 12}" `
          svg += `fill="${content.color || '#666666'}">`
          svg += escapeXml(content.expression || '{data}')
          svg += `</text>`
          break
      }
    }
    
    svg += `</svg>`
    return svg
  }
  
  /**
   * Generate thumbnail data URL
   */
  static generateThumbnail(template: JasperTemplate, size: number = 200): string {
    const svg = this.generateSvgPreview(template, {
      maxWidth: size,
      maxHeight: size,
    })
    
    // Convert SVG to data URL
    const encodedSvg = btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${encodedSvg}`
  }
}

// === Utility Functions ===

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// === Default Export ===
export default TemplateAPI