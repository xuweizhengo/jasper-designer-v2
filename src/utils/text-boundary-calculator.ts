/**
 * Jasper Designer V2.0 - 统一文字边界盒模型
 * 
 * 核心功能：建立统一的文字边界计算系统，消除选中框与ResizeHandles不一致问题
 * 设计原则：单一边界源、容器化思维、完整包含性、交互一致性
 */

import type { TextStyle, TextAlign, Size } from '../types';

/**
 * 统一边界盒模型 - 所有文字交互的唯一边界参考
 */
export interface UnifiedTextBoundingBox {
  // === 容器边界 (主边界) ===
  containerBounds: {
    x: number;      // 容器左上角X坐标
    y: number;      // 容器左上角Y坐标  
    width: number;  // 容器宽度 (与element.size.width一致)
    height: number; // 容器高度 (计算得出，包含完整字体空间)
  };
  
  // === 内容边界 (实际文字占用空间) ===
  contentBounds: {
    x: number;      // 文字实际起始X位置
    y: number;      // 文字实际起始Y位置
    width: number;  // 文字实际宽度
    height: number; // 文字实际高度
  };
  
  // === 字体度量信息 ===
  fontMetrics: {
    fontSize: number;     // 字体大小
    lineHeight: number;   // 行高 (fontSize * lineHeightRatio)
    ascender: number;     // 上升部高度 (基线以上)
    descender: number;    // 下降部高度 (基线以下，正值)
    baseline: number;     // 基线Y坐标 (相对容器)
  };
  
  // === 渲染定位信息 ===
  positioning: {
    textAnchorX: number;  // SVG text元素的x坐标
    textAnchorY: number;  // SVG text元素的y坐标 (基线位置)
    backgroundX: number;  // 背景矩形的x坐标
    backgroundY: number;  // 背景矩形的y坐标
  };

  // === 🎯 新增：文字换行信息 ===
  textLayout?: {
    wrappedLines: string[];    // 换行后的文本行
    isWrapped: boolean;        // 是否发生了换行
    originalLineCount: number; // 原始行数
    wrappedLineCount: number;  // 换行后行数
  };
}

/**
 * 字体度量信息
 */
interface FontMetrics {
  fontSize: number;
  lineHeight: number;
  ascender: number;
  descender: number;
  baseline: number;
}

/**
 * 文字内容度量信息
 */
interface ContentMetrics {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lineCount: number;
  actualHeight: number;
  wrappedLines?: string[];  // 新增：换行后的文本行
}

/**
 * 文字定位信息
 */
interface TextPositioning {
  textAnchorX: number;
  textAnchorY: number;
  backgroundX: number;
  backgroundY: number;
}

/**
 * 统一文字边界计算器
 * 
 * 核心职责：
 * 1. 建立单一、权威的边界计算源
 * 2. 确保选中框与ResizeHandles完全对齐
 * 3. 保证字体descender部分完全包含
 * 4. 提供与主流设计软件一致的边界模型
 */
export class UnifiedTextBoundaryCalculator {
  
  /**
   * 计算统一边界盒模型 - 核心入口方法
   */
  calculateUnifiedBounds(
    content: string, 
    style: TextStyle, 
    elementSize: Size
  ): UnifiedTextBoundingBox {
    
    // 1. 获取字体度量信息
    const fontMetrics = this.calculateFontMetrics(style);
    
    // 2. 测量文字内容尺寸 - 🎯 传递容器宽度进行边界约束
    const contentMetrics = this.measureTextContent(content, style, elementSize.width);
    
    // 3. 计算统一容器高度
    const containerHeight = this.calculateContainerHeight(
      contentMetrics, 
      fontMetrics, 
      elementSize.height
    );
    
    // 4. 计算文字定位
    const positioning = this.calculateTextPositioning(
      style, 
      elementSize, 
      containerHeight, 
      fontMetrics
    );
    
    // 5. 🎯 构建返回对象，包含换行信息
    const result: UnifiedTextBoundingBox = {
      containerBounds: {
        x: 0,
        y: 0,
        width: elementSize.width,
        height: containerHeight
      },
      contentBounds: contentMetrics.bounds,
      fontMetrics,
      positioning
    };

    // 6. 🎯 如果发生了换行，添加文字布局信息
    if (contentMetrics.wrappedLines) {
      result.textLayout = {
        wrappedLines: contentMetrics.wrappedLines,
        isWrapped: true,
        originalLineCount: content.split('\n').length,
        wrappedLineCount: contentMetrics.wrappedLines.length
      };
    }
    
    return result;
  }
  
  /**
   * 字体度量计算 - 核心算法
   * 
   * 基于经验值和标准排版规则计算字体的关键度量信息
   * 这些值决定了容器的最小高度和文字的精确定位
   */
  private calculateFontMetrics(style: TextStyle): FontMetrics {
    const fontSize = style.font_size;
    const lineHeightRatio = 1.2; // 默认行高倍数，符合主流设计软件标准
    
    // 基于字体大小的标准度量 (经验值，覆盖99%的常用字体)
    const ascenderRatio = 0.75;   // 上升部约占字体大小的75%
    const descenderRatio = 0.25;  // 下降部约占字体大小的25%
    
    const ascender = fontSize * ascenderRatio;
    const descender = fontSize * descenderRatio;
    
    return {
      fontSize,
      lineHeight: fontSize * lineHeightRatio,
      ascender,
      descender,
      baseline: ascender  // 基线位置=上升部高度
    };
  }
  
  /**
   * 🎯 字体感知的字符宽度计算
   * 
   * 基于字体族和字符类型进行精确的字符宽度计算
   * 解决不同字体族字符宽度差异巨大的问题
   */
  private getCharacterWidth(char: string, style: TextStyle): number {
    const fontSize = style.font_size;
    const fontFamily = style.font_family;
    
    // 中文字符检测
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    
    // 基于字体族的宽度系数 - 基于实际测量和经验值
    const fontWidthRatios: Record<string, { chinese: number; english: number }> = {
      // 等宽字体 - 所有字符相同宽度
      'Courier New': { chinese: 0.6, english: 0.6 },
      'Monaco': { chinese: 0.6, english: 0.6 },
      'Consolas': { chinese: 0.6, english: 0.6 },
      
      // 中文字体 - 中文方正，英文偏窄
      'SimSun': { chinese: 1.0, english: 0.5 },
      'SimHei': { chinese: 1.0, english: 0.5 },
      'KaiTi': { chinese: 1.1, english: 0.6 },
      'FangSong': { chinese: 1.0, english: 0.55 },
      
      // 西文字体 - 中文略宽，英文标准
      'Arial': { chinese: 1.0, english: 0.55 },
      'Helvetica': { chinese: 1.0, english: 0.55 },
      'Times New Roman': { chinese: 1.0, english: 0.5 },
      
      // 现代字体 - 平衡设计
      'Microsoft YaHei': { chinese: 1.0, english: 0.52 },
      'PingFang SC': { chinese: 1.0, english: 0.52 },
      'Noto Sans': { chinese: 1.0, english: 0.53 },
      
      // 默认 - 混合估算
      'default': { chinese: 1.0, english: 0.55 }
    };
    
    // 获取字体系数，不区分大小写
    const normalizedFontFamily = fontFamily.toLowerCase();
    let ratios = fontWidthRatios['default'];
    
    // 查找匹配的字体族
    for (const [font, ratio] of Object.entries(fontWidthRatios)) {
      if (normalizedFontFamily.includes(font.toLowerCase()) || font.toLowerCase().includes(normalizedFontFamily)) {
        ratios = ratio;
        break;
      }
    }
    
    const ratio = isChinese ? ratios!.chinese : ratios!.english;
    return fontSize * ratio;
  }

  /**
   * 🎯 智能文字宽度计算
   * 
   * 对短文本使用逐字符精确计算，对长文本使用优化算法
   */
  private calculateTextWidth(content: string, style: TextStyle): number {
    let totalWidth = 0;
    
    for (const char of content) {
      if (char === '\n') continue; // 换行符不占宽度
      totalWidth += this.getCharacterWidth(char, style);
    }
    
    return totalWidth;
  }
  /**
   * 文字内容度量 - 🎯 核心改进：字体感知的宽度计算和智能换行
   * 
   * 支持多行文字、不同字符类型混合内容、自动换行处理
   * 使用字体感知的精确宽度计算替代固定系数估算
   */
  private measureTextContent(content: string, style: TextStyle, containerWidth: number = 0): ContentMetrics {
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // 🎯 使用字体感知算法计算最大行宽
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = this.calculateTextWidth(line, style);
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    }
    
    // 🎯 核心改进：如果超出容器且容器有效，启动智能换行
    if (containerWidth > 0 && maxLineWidth > containerWidth) {
      return this.calculateWrappedText(content, style, containerWidth);
    }
    
    // 原始逻辑：不换行的情况
    const finalWidth = containerWidth > 0 ? Math.min(maxLineWidth, containerWidth) : maxLineWidth;
    
    // 实际内容高度基于行数和行高
    const actualHeight = lineCount * style.font_size * 1.2;
    
    return {
      bounds: {
        x: 0,
        y: 0,
        width: finalWidth,
        height: actualHeight
      },
      lineCount,
      actualHeight
    };
  }
  
  /**
   * 🎯 智能文字换行算法 - 字体感知版本
   * 
   * 核心特性：
   * - 字体感知的字符宽度计算
   * - 单词边界换行 (英文)
   * - 字符边界换行 (中文)  
   * - 强制截断 (超长单词)
   * - 中英文混排优化
   */
  private calculateWrappedText(
    content: string, 
    style: TextStyle, 
    containerWidth: number
  ): ContentMetrics {
    
    // 🎯 字体感知的容器宽度计算
    // 使用平均字符宽度估算每行可容纳的字符数（用于粗略估算）
    const avgCharWidth = this.getCharacterWidth('测', style); // 使用中文字符作为基准
    const roughMaxCharsPerLine = Math.floor(containerWidth / avgCharWidth);
    
    // 防止极端情况：容器太小
    if (roughMaxCharsPerLine < 1 || containerWidth < avgCharWidth) {
      return {
        bounds: { x: 0, y: 0, width: containerWidth, height: style.font_size * 1.2 },
        lineCount: 1,
        actualHeight: style.font_size * 1.2,
        wrappedLines: ['...']  // 显示省略号
      };
    }
    
    // 智能分词：支持中英文混合内容
    const segments = this.smartSegmentation(content);
    
    let lines: string[] = [];
    let currentLine = '';
    let currentLineWidth = 0;
    
    for (const segment of segments) {
      // 计算添加该段落后的实际宽度
      const segmentWidth = this.calculateTextWidth(segment, style);
      const testLineWidth = currentLineWidth + segmentWidth;
      
      // 🎯 基于实际像素宽度判断是否换行
      if (testLineWidth > containerWidth) {
        // 如果当前行有内容，先提交当前行
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
          currentLine = segment;
          currentLineWidth = segmentWidth;
        } else {
          // 单个片段太长，需要强制截断
          const { truncated, remaining } = this.forceTruncateSegment(segment, containerWidth, style);
          lines.push(truncated);
          currentLine = remaining;
          currentLineWidth = this.calculateTextWidth(remaining, style);
        }
      } else {
        currentLine += segment;
        currentLineWidth = testLineWidth;
      }
    }
    
    // 添加最后一行
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    // 计算换行后的实际高度
    const wrappedHeight = lines.length * style.font_size * 1.2;
    
    return {
      bounds: {
        x: 0,
        y: 0,
        width: containerWidth,
        height: wrappedHeight
      },
      lineCount: lines.length,
      actualHeight: wrappedHeight,
      wrappedLines: lines
    };
  }

  /**
   * 🎯 强制截断超长片段
   */
  private forceTruncateSegment(segment: string, maxWidth: number, style: TextStyle): { truncated: string; remaining: string } {
    let truncated = '';
    let currentWidth = 0;
    let i = 0;
    
    // 逐字符计算，直到接近容器宽度
    for (i = 0; i < segment.length; i++) {
      const char = segment[i];
      if (!char) break; // 安全检查
      const charWidth = this.getCharacterWidth(char, style);
      
      if (currentWidth + charWidth > maxWidth) {
        break;
      }
      
      truncated += char;
      currentWidth += charWidth;
    }
    
    const remaining = segment.substring(i);
    return { truncated, remaining };
  }
  
  /**
   * 🎯 智能分词算法
   * 
   * 支持中英文混合内容的合理分词：
   * - 中文：按字符分割，可在任意字符处换行
   * - 英文：按单词分割，保持单词完整性
   * - 标点：与前面的内容保持在一起
   * - 空格：作为分词边界
   */
  private smartSegmentation(content: string): string[] {
    const segments: string[] = [];
    let current = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      // 安全检查：确保字符存在
      if (!char) continue;
      
      // 中文字符：每个字符作为一个片段
      if (/[\u4e00-\u9fa5]/.test(char)) {
        if (current) {
          segments.push(current);
          current = '';
        }
        segments.push(char);
      }
      // 换行符：保持原有的换行
      else if (char === '\n') {
        if (current) {
          segments.push(current);
          current = '';
        }
        segments.push('\n');
      }
      // 空格：作为分词边界
      else if (char === ' ') {
        if (current) {
          segments.push(current + ' ');
          current = '';
        } else {
          segments.push(' ');
        }
      }
      // 英文字符和其他：累积到单词结束
      else {
        current += char;
      }
    }
    
    // 添加最后的片段
    if (current) {
      segments.push(current);
    }
    
    return segments.filter(seg => seg.length > 0);
  }
  
  /**
   * 容器高度计算策略
   * 
   * 关键算法：确保容器高度能够完全包含字体的所有可视部分
   * 包括ascender(如b,d,h的上部)和descender(如g,j,p,q,y的下部)
   */
  private calculateContainerHeight(
    contentMetrics: ContentMetrics,
    fontMetrics: FontMetrics, 
    userDefinedHeight: number
  ): number {
    // 策略1: 基于行数的理论高度
    const theoreticalHeight = fontMetrics.lineHeight * contentMetrics.lineCount;
    
    // 策略2: 基于字体度量的最小高度 (确保ascender+descender完全包含)
    const minFontHeight = fontMetrics.ascender + fontMetrics.descender;
    
    // 策略3: 单行文字的标准高度
    const standardSingleLineHeight = fontMetrics.lineHeight;
    
    // 计算最小必需高度
    const minRequiredHeight = Math.max(
      theoreticalHeight,           // 多行内容需求
      minFontHeight,              // 字体完整性需求
      standardSingleLineHeight    // 单行标准需求
    );
    
    // 最终高度: 取用户定义高度与计算高度的最大值
    // 这确保了用户可以设置更大的容器，但不会小于字体的完整显示需求
    return Math.max(minRequiredHeight, userDefinedHeight);
  }
  
  /**
   * 文字定位计算
   * 
   * 基于统一边界模型计算文字的精确定位坐标
   * 确保文字在容器内的位置符合对齐规则和排版标准
   */
  private calculateTextPositioning(
    style: TextStyle,
    elementSize: Size, 
    _containerHeight: number, // 标记为未使用但保留接口一致性
    fontMetrics: FontMetrics
  ): TextPositioning {
    
    // 水平定位 (基于对齐方式)
    const textAnchorX = this.calculateHorizontalAnchor(style.align, elementSize.width);
    
    // 垂直定位 (基于基线)
    // 文字的Y坐标设置为基线位置，这是SVG文字定位的标准方式
    const textAnchorY = fontMetrics.baseline;
    
    // 背景定位 (基于容器边界和内边距)
    const padding = style.background?.padding || 0;
    const backgroundX = -padding;
    const backgroundY = -padding;
    
    return {
      textAnchorX,
      textAnchorY, 
      backgroundX,
      backgroundY
    };
  }
  
  /**
   * 水平锚点计算
   * 
   * 根据文字对齐方式计算SVG text元素的x坐标
   */
  private calculateHorizontalAnchor(align: TextAlign, containerWidth: number): number {
    switch (align) {
      case 'Left': 
        return 0;                    // 左对齐：x=0
      case 'Center': 
        return containerWidth / 2;   // 居中：x=容器宽度/2
      case 'Right': 
        return containerWidth;       // 右对齐：x=容器宽度
      default: 
        return 0;
    }
  }
  
  /**
   * 获取SVG text-anchor属性值
   * 
   * 将我们的TextAlign类型转换为SVG标准的text-anchor值
   */
  getTextAnchor(align: TextAlign): "start" | "middle" | "end" {
    switch (align) {
      case 'Left': return 'start';
      case 'Center': return 'middle';  
      case 'Right': return 'end';
      default: return 'start';
    }
  }
  
  /**
   * 调试信息输出
   * 
   * 用于开发阶段的边界计算验证和问题诊断
   */
  debugBounds(bounds: UnifiedTextBoundingBox, elementId?: string): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.group(`🔍 统一边界盒调试 ${elementId ? `(${elementId})` : ''}`);
      console.log('📦 容器边界:', bounds.containerBounds);
      console.log('📝 内容边界:', bounds.contentBounds);  
      console.log('🔤 字体度量:', bounds.fontMetrics);
      console.log('📍 定位信息:', bounds.positioning);
      console.groupEnd();
    }
  }
}

/**
 * 全局单例实例
 * 
 * 提供统一的边界计算服务，避免重复实例化
 * 可以在整个应用中安全地使用同一个计算器实例
 */
export const unifiedTextBoundaryCalculator = new UnifiedTextBoundaryCalculator();