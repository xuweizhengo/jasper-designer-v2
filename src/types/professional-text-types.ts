// Professional Typography System Types - Phase 2.1
// Based on Figma/Sketch standards for professional design tools

import { TextStyle, TextAlign } from './index';

/**
 * Font weight enumeration
 */
export type FontWeight = 
  | 'normal' 
  | 'bold'
  | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

/**
 * 样式分类枚举
 */
export type StyleCategory = 
  | 'heading'      // 标题样式
  | 'body'         // 正文样式  
  | 'caption'      // 说明文字
  | 'bank-special' // 银行专用
  | 'custom';      // 自定义样式

/**
 * 文字填充类型定义 - 支持多重填充
 */
export type TextFillType = 'solid' | 'gradient';

export interface SolidFill {
  color: string;
}

export interface GradientFill {
  type: 'linear' | 'radial';
  colors: Array<{ color: string; stop: number }>;
  angle?: number;
}

export interface TextFill {
  type: TextFillType;
  enabled: boolean;
  opacity: number;
  solid?: SolidFill;
  gradient?: GradientFill;
}

/**
 * 文字效果定义
 */
export type TextEffectType = 'drop-shadow' | 'inner-shadow';

export interface DropShadowEffect {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export interface InnerShadowEffect {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export interface TextEffect {
  type: TextEffectType;
  enabled: boolean;
  dropShadow?: DropShadowEffect;
  innerShadow?: InnerShadowEffect;
}

/**
 * 文字装饰样式
 */
export type DecorationStyle = 'solid' | 'dashed' | 'dotted';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type WhiteSpace = 'normal' | 'nowrap' | 'pre' | 'pre-wrap';

export interface TextDecoration {
  underline: boolean;
  strikethrough: boolean;
  overline: boolean;
  decorationColor?: string;
  decorationStyle: DecorationStyle;
  decorationThickness?: number;
}

/**
 * 高级排版属性
 */
export interface TypographyProperties {
  letterSpacing: number;       // 字间距 (px) 
  lineHeight: number;          // 行高倍数 (1.2 = 120%)
  paragraphSpacing: number;    // 段落间距 (px)
  textIndent: number;          // 首行缩进 (px)
  
  decoration: TextDecoration;
  
  // 高级排版选项
  textTransform?: TextTransform;
  whiteSpace?: WhiteSpace;
}

/**
 * 银行专用扩展属性
 */
export type BankingFormatType = 'currency' | 'date' | 'number' | 'text';

export interface BankingProperties {
  formatType?: BankingFormatType;
  locale?: string;
  precision?: number;
  currencySymbol?: string;
}

/**
 * 专业文字样式结构 - 扩展自原有TextStyle
 */
export interface ProfessionalTextStyle extends TextStyle {
  // 基础属性继承自 TextStyle
  font_family: string;
  font_size: number;
  font_weight: FontWeight;
  color: string;
  align: TextAlign;
  
  // 高级排版控制 (新增核心功能)
  typography: TypographyProperties;
  
  // 多重填充系统 (学习Figma)
  fills: TextFill[];
  
  // 基础效果系统
  effects: TextEffect[];
  
  // 银行专用扩展
  banking?: BankingProperties;
}

/**
 * 样式定义系统 - 参考Figma标准
 */
export interface TextStyleDefinition {
  id: string;                    // 唯一标识符
  name: string;                  // 样式名称
  description: string;           // 样式描述
  category: StyleCategory;       // 样式分类
  style: ProfessionalTextStyle;  // 样式内容
  
  // 元数据
  metadata: {
    createdAt: Date;
    lastModified: Date;
    author: string;
    usageCount: number;          // 使用统计
    isSystemStyle: boolean;      // 是否为系统预设
    tags: string[];              // 标签分类
  };
  
  // 继承关系
  inheritance?: {
    parentStyleId?: string;      // 父样式ID
    overrides: Partial<ProfessionalTextStyle>; // 覆盖属性
  };
}

/**
 * 样式观察者接口
 */
export interface StyleObserver {
  onStyleChange(event: string, data: any): void;
}

/**
 * 样式管理器事件类型
 */
export type StyleManagerEvent = 
  | 'style-created'
  | 'style-updated'
  | 'style-deleted'
  | 'style-applied'
  | 'styles-synced';

/**
 * 样式应用结果
 */
export interface StyleApplicationResult {
  success: boolean;
  elementId: string;
  styleId: string;
  appliedAt: Date;
  error?: string;
}

/**
 * 样式使用统计
 */
export interface StyleUsageStats {
  styleId: string;
  usageCount: number;
  elements: string[];
  lastUsed: Date;
}

/**
 * 样式导入导出格式
 */
export interface StyleLibraryExport {
  version: string;
  exportedAt: Date;
  styles: TextStyleDefinition[];
  metadata: {
    totalStyles: number;
    categories: StyleCategory[];
    author: string;
  };
}

/**
 * 渲染相关类型
 */
export interface RenderedTextElement {
  element: SVGGElement;
  bounds: any; // Will be defined by boundary calculator
  style: ProfessionalTextStyle;
}

/**
 * 边界计算相关类型 (与统一边界系统集成)
 */
export interface EnhancedTextBounds {
  containerBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  typography: {
    adjustedWidth: number;
    adjustedHeight: number;
    letterSpacingData: LetterSpacingEffect;
    lineHeightData: LineHeightEffect;
    paragraphData: ParagraphEffect;
  };
  positioning: {
    textAnchorX: number;
    textAnchorY: number;
  };
  fontMetrics: {
    fontSize: number;
    ascender: number;
    descender: number;
    lineHeight: number;
  };
}

export interface LetterSpacingEffect {
  spacingValue: number;
  totalSpaces: number;
  widthIncrease: number;
  charPositions: number[];
}

export interface LineHeightEffect {
  lineHeightRatio: number;
  actualLineHeight: number;
  lineCount: number;
  heightIncrease: number;
  baselinePositions: number[];
}

export interface ParagraphEffect {
  spacing: number;
  paragraphCount: number;
  heightIncrease: number;
  paragraphPositions: number[];
}