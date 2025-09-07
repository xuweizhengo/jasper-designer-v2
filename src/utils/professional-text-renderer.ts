/**
 * Professional Text Style Integration - ElementRenderer Adapter
 * 
 * 将新的专业排版系统与现有的ElementRenderer集成
 * 提供向后兼容性和渐进式升级路径
 */

import { textStyleManager } from '../utils/text-style-manager';
import { unifiedTextBoundaryCalculator } from '../utils/text-boundary-calculator';
import type { 
  ProfessionalTextStyle, 
  RenderedTextElement,
  EnhancedTextBounds 
} from '../types/professional-text-types';
import type { ReportElement, TextStyle } from '../types';

export class ProfessionalTextRenderer {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await textStyleManager.initialize();
      this.initialized = true;
      console.log('🎨 ProfessionalTextRenderer 已初始化');
    } catch (error) {
      console.error('❌ ProfessionalTextRenderer 初始化失败:', error);
    }
  }

  /**
   * 检测元素是否使用了专业文字样式
   */
  isElementUsingProfessionalStyle(elementId: string): boolean {
    return textStyleManager.getElementStyleId(elementId) !== null;
  }

  /**
   * 将传统TextStyle适配为ProfessionalTextStyle
   */
  adaptLegacyTextStyle(textStyle: TextStyle): ProfessionalTextStyle {
    return {
      // 保持原有属性
      ...textStyle,
      font_weight: textStyle.font_weight as any, // 类型转换
      
      // 添加默认排版属性
      typography: {
        letterSpacing: 0,
        lineHeight: 1.2,
        paragraphSpacing: 0,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        },
        textTransform: 'none',
        whiteSpace: 'normal'
      },
      
      // 转换为多重填充格式
      fills: [{
        type: 'solid',
        enabled: true,
        opacity: 1,
        solid: { color: textStyle.color }
      }],
      
      // 默认无效果
      effects: []
    };
  }

  /**
   * 渲染专业文字元素
   */
  renderProfessionalText(
    element: ReportElement, 
    _selected: boolean = false // 保留参数兼容性，选中状态由ElementRenderer处理
  ): RenderedTextElement | null {
    
    if (element.content.type !== 'Text' && element.content.type !== 'DataField') {
      return null;
    }

    const elementStyleId = textStyleManager.getElementStyleId(element.id);
    let professionalStyle: ProfessionalTextStyle;

    if (elementStyleId) {
      // 使用专业样式系统
      const styleDefinition = textStyleManager.getStyle(elementStyleId);
      if (!styleDefinition) {
        console.warn(`⚠️ 找不到样式定义: ${elementStyleId}`);
        return null;
      }
      professionalStyle = styleDefinition.style;
      
      console.log(`🎨 使用专业样式渲染: ${styleDefinition.name} (${elementStyleId})`);
    } else {
      // 适配传统样式
      const legacyStyle = element.content.type === 'Text' 
        ? element.content.style
        : element.content.type === 'DataField'
        ? element.content.style
        : null;

      if (!legacyStyle) return null;

      professionalStyle = this.adaptLegacyTextStyle(legacyStyle);
      console.log('🔄 适配传统样式到专业排版系统');
    }

    // 计算增强的文字边界 (包含排版属性)
    const enhancedBounds = this.calculateEnhancedBounds(
      element.content.type === 'Text' ? element.content.content : element.content.expression || '[数据字段]',
      professionalStyle,
      element.size
    );

    // 渲染多层渲染结构
    const container = this.createProfessionalTextElement(
      enhancedBounds,
      element.content.type === 'Text' ? element.content.content : element.content.expression || '[数据字段]',
      professionalStyle,
      false // 选中状态统一由ElementRenderer处理，专业渲染器不再处理选中效果
    );

    return {
      element: container,
      bounds: enhancedBounds,
      style: professionalStyle
    };
  }

  /**
   * 计算包含排版属性的增强边界
   */
  private calculateEnhancedBounds(
    content: string, 
    style: ProfessionalTextStyle, 
    elementSize: { width: number; height: number }
  ): EnhancedTextBounds {
    
    // 基础边界计算 (复用统一边界计算器)
    const baseBounds = unifiedTextBoundaryCalculator.calculateUnifiedBounds(
      content, 
      style as any, // 临时类型转换，后续会完善
      elementSize
    );
    
    // 排版属性增强计算
    const typography = style.typography;
    
    // 字间距影响总宽度
    const letterSpacingEffect = this.calculateLetterSpacingEffect(content, typography.letterSpacing);
    
    // 行高影响总高度
    const lineHeightEffect = this.calculateLineHeightEffect(content, style.font_size, typography.lineHeight);
    
    // 段落间距影响
    const paragraphEffect = this.calculateParagraphSpacingEffect(content, typography.paragraphSpacing);
    
    return {
      containerBounds: baseBounds.containerBounds,
      positioning: baseBounds.positioning,
      fontMetrics: baseBounds.fontMetrics,
      typography: {
        adjustedWidth: baseBounds.containerBounds.width + letterSpacingEffect.widthIncrease,
        adjustedHeight: baseBounds.containerBounds.height + lineHeightEffect.heightIncrease + paragraphEffect.heightIncrease,
        letterSpacingData: letterSpacingEffect,
        lineHeightData: lineHeightEffect,
        paragraphData: paragraphEffect
      }
    };
  }

  /**
   * 字间距效果计算
   */
  private calculateLetterSpacingEffect(content: string, letterSpacing: number) {
    const lines = content.split('\n');
    const totalCharacters = lines.reduce((sum, line) => sum + line.length, 0);
    const totalSpaces = Math.max(0, totalCharacters - lines.length); // 减去每行最后一个字符
    
    return {
      spacingValue: letterSpacing,
      totalSpaces,
      widthIncrease: totalSpaces * letterSpacing,
      charPositions: [] // 简化版本，实际计算中会填充
    };
  }

  /**
   * 行高效果计算
   */
  private calculateLineHeightEffect(content: string, fontSize: number, lineHeight: number) {
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // 计算实际行高像素值
    const actualLineHeight = fontSize * lineHeight;
    const defaultLineHeight = fontSize * 1.2; // 默认行高
    const heightDifference = actualLineHeight - defaultLineHeight;
    
    return {
      lineHeightRatio: lineHeight,
      actualLineHeight,
      lineCount,
      heightIncrease: heightDifference * Math.max(0, lineCount - 1), // 第一行不增加
      baselinePositions: [] // 简化版本
    };
  }

  /**
   * 段落间距效果计算
   */
  private calculateParagraphSpacingEffect(content: string, paragraphSpacing: number) {
    const paragraphs = content.split('\n\n'); // 双换行符分段
    const paragraphCount = paragraphs.length;
    
    return {
      spacing: paragraphSpacing,
      paragraphCount,
      heightIncrease: paragraphSpacing * Math.max(0, paragraphCount - 1),
      paragraphPositions: [] // 简化版本
    };
  }

  /**
   * 创建专业文字渲染元素
   */
  private createProfessionalTextElement(
    bounds: EnhancedTextBounds,
    content: string,
    style: ProfessionalTextStyle,
    _selected: boolean // 保留参数兼容性，但不再使用
  ): SVGGElement {
    
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    container.setAttribute('class', 'professional-text-container');
    
    // 渲染多重填充背景
    this.renderMultipleFills(container, bounds, style.fills);
    
    // 渲染效果 (阴影等)
    this.renderEffects(container, bounds, style.effects);
    
    // 渲染主文字内容 (含排版)
    this.renderTypographyText(container, bounds, content, style);
    
    // 渲染装饰 (下划线等)
    this.renderTextDecorations(container, bounds, content, style.typography.decoration);
    
    // 🎯 选中状态现在统一由ElementRenderer.tsx处理，不在专业渲染器中处理
    // 这样避免了多重选中效果系统的冲突
    
    return container;
  }

  /**
   * 渲染多重填充
   */
  private renderMultipleFills(_container: SVGGElement, _bounds: EnhancedTextBounds, fills: any[]) {
    // 简化版本 - 只处理第一个填充
    if (fills && fills.length > 0 && fills[0].enabled) {
      const fill = fills[0];
      if (fill.type === 'solid' && fill.solid) {
        // 背景色通过text元素的fill属性实现，这里主要处理特殊填充
        console.log('🎨 应用纯色填充:', fill.solid.color);
      }
    }
  }

  /**
   * 渲染效果
   */
  private renderEffects(container: SVGGElement, _bounds: EnhancedTextBounds, effects: any[]) {
    if (!effects || effects.length === 0) return;

    // 创建滤镜定义
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    const filterId = `text-effects-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    filter.id = filterId;

    for (const effect of effects) {
      if (!effect.enabled) continue;

      if (effect.type === 'drop-shadow' && effect.dropShadow) {
        const dropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
        dropShadow.setAttribute('dx', effect.dropShadow.offsetX.toString());
        dropShadow.setAttribute('dy', effect.dropShadow.offsetY.toString());
        dropShadow.setAttribute('stdDeviation', effect.dropShadow.blur.toString());
        dropShadow.setAttribute('flood-color', effect.dropShadow.color);
        dropShadow.setAttribute('flood-opacity', effect.dropShadow.opacity.toString());
        
        filter.appendChild(dropShadow);
        console.log('✨ 应用投影效果');
      }
    }

    if (filter.children.length > 0) {
      defs.appendChild(filter);
      container.appendChild(defs);
      
      // 将滤镜应用到容器
      container.setAttribute('filter', `url(#${filterId})`);
    }
  }

  /**
   * 渲染带排版的文字内容
   */
  private renderTypographyText(
    container: SVGGElement,
    bounds: EnhancedTextBounds,
    content: string,
    style: ProfessionalTextStyle
  ): void {
    
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // 基础文字属性
    textElement.setAttribute('font-family', style.font_family);
    textElement.setAttribute('font-size', style.font_size.toString());
    textElement.setAttribute('font-weight', style.font_weight);
    textElement.setAttribute('fill', style.fills[0]?.solid?.color || style.color);
    textElement.setAttribute('text-anchor', this.getTextAnchor(style.align));
    
    // 处理多行文字 + 排版效果
    const lines = content.split('\n');
    const typography = style.typography;
    
    lines.forEach((line, lineIndex) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      
      // 应用字间距
      if (typography.letterSpacing !== 0) {
        tspan.setAttribute('letter-spacing', `${typography.letterSpacing}px`);
      }
      
      // 行位置计算 (包含行高效果)
      const baselineY = bounds.positioning.textAnchorY + 
        (lineIndex * bounds.typography.lineHeightData.actualLineHeight);
      
      tspan.setAttribute('x', bounds.positioning.textAnchorX.toString());
      tspan.setAttribute('y', baselineY.toString());
      
      // 首行缩进
      if (lineIndex === 0 && typography.textIndent !== 0) {
        const indentX = bounds.positioning.textAnchorX + typography.textIndent;
        tspan.setAttribute('x', indentX.toString());
      }
      
      // 文字变换
      if (typography.textTransform && typography.textTransform !== 'none') {
        tspan.textContent = this.applyTextTransform(line, typography.textTransform);
      } else {
        tspan.textContent = line;
      }
      
      textElement.appendChild(tspan);
    });
    
    container.appendChild(textElement);
  }

  /**
   * 渲染文字装饰
   */
  private renderTextDecorations(
    container: SVGGElement,
    bounds: EnhancedTextBounds,
    content: string,
    decoration: any
  ): void {
    
    if (!decoration.underline && !decoration.strikethrough && !decoration.overline) {
      return;
    }

    const lines = content.split('\n');
    const decorationColor = decoration.decorationColor || '#000000';
    const strokeWidth = decoration.decorationThickness || 1;
    const strokeDasharray = decoration.decorationStyle === 'dashed' ? '4,2' :
                           decoration.decorationStyle === 'dotted' ? '1,1' : 'none';

    lines.forEach((line, lineIndex) => {
      if (!line.trim()) return; // 跳过空行

      const lineY = bounds.positioning.textAnchorY + 
        (lineIndex * bounds.typography.lineHeightData.actualLineHeight);

      // 估算行宽 (简化版本)
      const lineWidth = line.length * bounds.fontMetrics.fontSize * 0.6; // 近似计算
      const startX = bounds.positioning.textAnchorX;
      const endX = startX + lineWidth;

      // 下划线
      if (decoration.underline) {
        const underlineY = lineY + bounds.fontMetrics.fontSize * 0.1;
        this.createDecorationLine(container, startX, underlineY, endX, underlineY, 
          decorationColor, strokeWidth, strokeDasharray, 'underline');
      }

      // 删除线
      if (decoration.strikethrough) {
        const strikethroughY = lineY - bounds.fontMetrics.fontSize * 0.3;
        this.createDecorationLine(container, startX, strikethroughY, endX, strikethroughY,
          decorationColor, strokeWidth, strokeDasharray, 'strikethrough');
      }

      // 上划线
      if (decoration.overline) {
        const overlineY = lineY - bounds.fontMetrics.fontSize * 0.8;
        this.createDecorationLine(container, startX, overlineY, endX, overlineY,
          decorationColor, strokeWidth, strokeDasharray, 'overline');
      }
    });
  }

  /**
   * 创建装饰线
   */
  private createDecorationLine(
    container: SVGGElement, 
    x1: number, y1: number, x2: number, y2: number,
    color: string, width: number, dashArray: string, type: string
  ): void {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width.toString());
    line.setAttribute('stroke-dasharray', dashArray);
    line.setAttribute('class', `text-decoration-${type}`);
    
    container.appendChild(line);
  }

  /**
   * 辅助方法
   */
  private getTextAnchor(align: string): string {
    switch (align) {
      case 'Center': return 'middle';
      case 'Right': return 'end';
      case 'Left':
      default: return 'start';
    }
  }

  private applyTextTransform(text: string, transform: string): string {
    switch (transform) {
      case 'uppercase': return text.toUpperCase();
      case 'lowercase': return text.toLowerCase();
      case 'capitalize': return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      default: return text;
    }
  }
}

// 创建全局单例
export const professionalTextRenderer = new ProfessionalTextRenderer();