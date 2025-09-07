// === Jasper模板系统演示 ===
// 这个文件展示了当前实现的功能效果

import type { JasperTemplate } from '../types/template'
import { createEmptyTemplate, createTextElement, createDataFieldElement, createRectangleElement } from '../types/template'
// import { TemplateAPI } from '../api/template'
import { AppStateConverter } from '../utils/template-conversion'

// === 演示1: 创建一个完整的报表模板 ===
export function createSampleTemplate(): JasperTemplate {
  // 创建基础模板
  const template = { ...createEmptyTemplate() } as any
  
  // 更新元数据
  template.metadata = {
    ...template.metadata,
    description: '销售报表示例',
    tags: ['销售', '月度报表', '演示'],
  }
  
  // 添加标题文本
  const titleElement = createTextElement(
    '月度销售报表',
    { x: 50, y: 50 },
    { width: 495, height: 30 },
    { family: 'Arial', size: 18, weight: 'bold' }
  )
  
  // 添加背景矩形
  const backgroundRect = createRectangleElement(
    { x: 45, y: 115 },
    { width: 505, height: 25 },
    '#f5f5f5',
    { width: 1, color: '#cccccc', style: 'solid' }
  )
  
  // 添加数据字段
  const customerNameField = createDataFieldElement(
    '{customer_name}',
    { x: 50, y: 120 },
    { width: 150, height: 20 },
    { source_id: 'primary_db', field_name: 'customer_name' }
  )
  
  const amountField = createDataFieldElement(
    '{amount}',
    { x: 220, y: 120 },
    { width: 100, height: 20 },
    { source_id: 'primary_db', field_name: 'amount' }
  )
  
  // 添加到模板
  template.elements = [
    backgroundRect,
    titleElement, 
    customerNameField,
    amountField
  ]
  
  // 添加数据源配置
  template.data_sources = [{
    id: 'primary_db',
    name: '销售数据库',
    source_type: 'sql',
    provider_type: 'postgresql',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'sales_db',
      username: '${DB_USER}',
      password: '${DB_PASS}',
    },
    schema: {
      columns: [
        { name: 'customer_name', data_type: 'String', nullable: false, constraints: [], description: '客户名称' },
        { name: 'amount', data_type: 'Number', nullable: false, constraints: [], description: '订单金额' }
      ],
      indexes: [],
      relationships: {},
      metadata: {}
    }
  }]
  
  // 添加参数
  template.parameters = [{
    name: 'report_title',
    param_type: 'String',
    default: '销售报表',
    description: '报表标题',
    required: false
  }]
  
  return template as JasperTemplate
}

// === 演示2: 模板JSON序列化效果 ===
export function demonstrateJsonSerialization() {
  const template = createSampleTemplate()
  
  // 序列化为JSON (模拟后端行为)
  const jsonString = JSON.stringify(template, null, 2)
  
  console.log('🎯 生成的Jasper模板JSON:')
  console.log(jsonString)
  
  // 显示关键信息
  console.log('\n📊 模板统计:')
  console.log(`- 元素数量: ${template.elements.length}`)
  console.log(`- 数据源数量: ${template.data_sources.length}`)
  console.log(`- 参数数量: ${template.parameters.length}`)
  console.log(`- 画布尺寸: ${template.canvas.width} x ${template.canvas.height}`)
  
  return jsonString
}

// === 演示3: AppState集成效果 ===
export function demonstrateAppStateIntegration() {
  // 模拟现有的AppState
  const mockAppState = {
    elements: [
      {
        id: 'text-001',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 30 },
        content: {
          type: 'Text' as const,
          content: '现有文本元素',
          style: {
            font_family: 'Arial',
            font_size: 14,
            font_weight: 'normal',
            color: '#000000',
            align: 'Left' as const
          }
        },
        z_index: 1,
        visible: true,
        locked: false
      }
    ],
    canvas_config: {
      width: 800,
      height: 600,
      zoom: 1.0,
      offset_x: 0,
      offset_y: 0,
      show_grid: true,
      show_rulers: true,
      grid_size: 10,
      snap_to_grid: true,
      background_color: '#ffffff'
    },
    selected_ids: [],
    can_undo: false,
    can_redo: false,
    dirty: false
  }
  
  // 转换为模板格式
  const template = AppStateConverter.toJasperTemplate(mockAppState)
  
  console.log('🔄 AppState -> JasperTemplate 转换结果:')
  console.log('原始AppState元素数:', mockAppState.elements.length)
  console.log('转换后模板元素数:', template.elements.length)
  console.log('画布尺寸转换:', `${mockAppState.canvas_config.width}x${mockAppState.canvas_config.height} -> ${template.canvas.width}x${template.canvas.height}`)
  
  // 反向转换
  const backToAppState = AppStateConverter.toAppState(template)
  
  console.log('\n🔄 JasperTemplate -> AppState 反向转换:')
  console.log('转换后AppState元素数:', backToAppState.elements?.length || 0)
  console.log('画布配置保持:', backToAppState.canvas_config?.width === mockAppState.canvas_config.width)
  
  return { template, backToAppState }
}

// === 演示4: 表达式验证效果 ===
export function demonstrateExpressionValidation() {
  const template = createSampleTemplate()
  
  const testExpressions = [
    '{customer_name}',     // 有效
    '{amount}',           // 有效  
    '{invalid_field}',    // 无效
    '{customer.address}', // 嵌套访问
    'Plain text',         // 普通文本
  ]
  
  console.log('🔍 表达式验证演示:')
  
  testExpressions.forEach(expr => {
    const result = validateExpression(expr, template)
    console.log(`"${expr}": ${result.valid ? '✅ 有效' : '❌ 无效'}${result.error ? ' - ' + result.error : ''}`)
  })
}

// 简化的验证函数（从template.ts复制）
function validateExpression(expression: string, template: JasperTemplate): { valid: boolean; error?: string } {
  if (!expression.trim()) {
    return { valid: false, error: 'Expression cannot be empty' }
  }
  
  const fieldPattern = /\{([^}]+)\}/g
  const matches = [...expression.matchAll(fieldPattern)]
  
  for (const match of matches) {
    const fieldPath = match[1]
    if (!fieldPath) continue
    
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

// === 演示5: SVG预览生成效果 ===
export function demonstrateSvgPreview() {
  const template = createSampleTemplate()
  
  // 生成SVG预览 (模拟)
  const svgPreview = generateSimpleSvgPreview(template)
  
  console.log('🖼️ SVG预览生成:')
  console.log(svgPreview)
  
  return svgPreview
}

function generateSimpleSvgPreview(template: JasperTemplate): string {
  // Remove unused parameter warning
  console.log('Generating preview for template:', template.metadata.description)
  
  const { width, height } = template.canvas
  
  let svg = `<svg width="400" height="300" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`
  
  // 背景
  svg += `<rect width="100%" height="100%" fill="${template.canvas.background.color}"/>`
  
  // 网格（如果启用）
  if (template.canvas.grid.enabled) {
    svg += `<defs><pattern id="grid" width="${template.canvas.grid.size}" height="${template.canvas.grid.size}" patternUnits="userSpaceOnUse">`
    svg += `<path d="M ${template.canvas.grid.size} 0 L 0 0 0 ${template.canvas.grid.size}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`
    svg += `</pattern></defs>`
    svg += `<rect width="100%" height="100%" fill="url(#grid)"/>`
  }
  
  // 渲染元素
  for (const element of template.elements) {
    if (!element.visible) continue
    
    const { position, size } = element
    
    switch (element.element_type) {
      case 'Text':
        svg += `<text x="${position.x}" y="${position.y + (element.content.font?.size || 12) * 0.8}" `
        svg += `font-family="${element.content.font?.family || 'Arial'}" `
        svg += `font-size="${element.content.font?.size || 12}" `
        svg += `fill="${element.content.color || '#000000'}">`
        svg += escapeXml(element.content.text || '')
        svg += `</text>`
        break
        
      case 'Rectangle':
        svg += `<rect x="${position.x}" y="${position.y}" `
        svg += `width="${size.width}" height="${size.height}" `
        svg += `fill="${element.content.color || 'transparent'}" `
        if (element.style?.border) {
          svg += `stroke="${element.style.border.color}" stroke-width="${element.style.border.width}" `
        }
        svg += `/>`
        break
        
      case 'DataField':
        svg += `<rect x="${position.x}" y="${position.y}" width="${size.width}" height="${size.height}" `
        svg += `fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>`
        svg += `<text x="${position.x + 5}" y="${position.y + (element.content.font?.size || 12) * 0.8}" `
        svg += `font-family="${element.content.font?.family || 'Arial'}" font-size="${element.content.font?.size || 12}" fill="#666">`
        svg += escapeXml(element.content.expression || '{data}')
        svg += `</text>`
        break
    }
  }
  
  svg += `</svg>`
  return svg
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// === 运行所有演示 ===
export function runAllDemonstrations() {
  console.log('🚀 Jasper模板系统功能演示')
  console.log('=' .repeat(50))
  
  console.log('\n1. 创建示例模板:')
  const template = createSampleTemplate()
  console.log('✅ 模板创建成功')
  
  console.log('\n2. JSON序列化演示:')
  demonstrateJsonSerialization()
  
  console.log('\n3. AppState集成演示:')
  demonstrateAppStateIntegration()
  
  console.log('\n4. 表达式验证演示:')
  demonstrateExpressionValidation()
  
  console.log('\n5. SVG预览演示:')
  demonstrateSvgPreview()
  
  console.log('\n🎉 所有演示完成!')
  
  // 避免未使用变量警告
  return { template }
}

// 如果在Node.js环境中运行
if (typeof require !== 'undefined' && require.main === module) {
  runAllDemonstrations()
}