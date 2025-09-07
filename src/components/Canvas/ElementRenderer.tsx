import { Component, createMemo, createSignal, createEffect } from 'solid-js';
import { usePreview, PreviewUtils } from '../../stores/PreviewModeContext';
import { dataContextManager } from '../../stores/DataContextManager';
import type { ReportElement } from '../../types';
import { unifiedTextBoundaryCalculator } from '../../utils/text-boundary-calculator';

interface ElementRendererProps {
  element: ReportElement;
  selected: boolean;
  interactive?: boolean; // 可选的交互模式控制
}

/**
 * 纯渲染的ElementRenderer组件
 * 只负责渲染，不处理任何交互逻辑
 * 交互由SimpleInteractionLayer统一管理
 * 
 * V2.1 新增功能:
 * - 支持设计/预览模式切换
 * - DataField在预览模式下显示真实数据
 * - 表达式求值和错误处理
 */
const ElementRenderer: Component<ElementRendererProps> = (props) => {
  // 获取预览模式状态
  const { state: previewState } = usePreview();
  
  // 数据字段内容状态
  const [dataFieldDisplayText, setDataFieldDisplayText] = createSignal('[数据字段]');
  
  // 当预览模式或元素内容变化时重新计算数据字段内容
  createEffect(() => {
    if (props.element.content.type === 'DataField') {
      const expression = props.element.content.expression || '';
      const mode = previewState().mode;
      
      if (PreviewUtils.shouldShowExpression(mode)) {
        // 设计模式：显示表达式占位符
        setDataFieldDisplayText(expression || '[数据字段]');
      } else if (PreviewUtils.shouldEvaluateExpression(mode)) {
        // 数据模式和预览模式：异步求值表达式
        dataContextManager.evaluateExpression(expression)
          .then(result => {
            if (result.success) {
              setDataFieldDisplayText(String(result.value || ''));
            } else {
              setDataFieldDisplayText(`[错误: ${result.error}]`);
            }
          })
          .catch(error => {
            setDataFieldDisplayText(`[错误: ${error}]`);
          });
      }
    }
  });
  // 纯渲染模式 - 移除所有交互逻辑
  const elementStyle = createMemo(() => {
    const { position } = props.element;
    return {
      transform: `translate(${position.x}px, ${position.y}px)`,
      opacity: props.element.visible ? 1 : 0.5,
      // 移除cursor设置 - 由InteractionLayer统一管理
    };
  });

  /**
   * 统一边界渲染系统 - V2.0 核心更新
   * 
   * 关键改进：
   * 1. 使用UnifiedTextBoundaryCalculator统一计算所有边界
   * 2. 选中框与ResizeHandles完全对齐
   * 3. 文字descender部分完全包含在边界内
   * 4. 符合主流设计软件的边界模型
   */
  const renderContent = () => {
    const { content, size } = props.element;

    // Text类型渲染 - 使用统一边界系统
    if (content.type === 'Text' && content.content && content.style) {
      // 🎯 核心变更: 使用统一边界计算器
      const bounds = unifiedTextBoundaryCalculator.calculateUnifiedBounds(
        content.content, 
        content.style, 
        size
      );

      // 开发调试信息 (生产环境会被移除)
      if (process.env['NODE_ENV'] === 'development') {
        unifiedTextBoundaryCalculator.debugBounds(bounds, props.element.id);
      }

      // 获取SVG文字锚点值
      const textAnchor = unifiedTextBoundaryCalculator.getTextAnchor(content.style.align);
      
      return (
        <g class="text-element-unified-container" data-bounds-version="unified-v2">
          {/* 🎯 选中效果层 - 作为背景层，渲染在最下面 */}
          {props.selected && (
            <rect
              x={bounds.containerBounds.x}
              y={bounds.containerBounds.y}
              width={bounds.containerBounds.width}
              height={bounds.containerBounds.height}
              class="text-selection-unified"
            />
          )}

          {/* 🎨 背景层 - 基于统一容器边界 */}
          {content.style.background && (
            <rect
              x={bounds.positioning.backgroundX}
              y={bounds.positioning.backgroundY}
              width={bounds.containerBounds.width + (content.style.background.padding || 0) * 2}
              height={bounds.containerBounds.height + (content.style.background.padding || 0) * 2}
              fill={content.style.background.color}
              fill-opacity={content.style.background.opacity || 1}
              rx={content.style.border?.radius || 0}
              ry={content.style.border?.radius || 0}
              class="text-background-unified"
            />
          )}
          
          {/* 🔲 边框层 - 基于统一容器边界 */}
          {content.style.border && (
            <rect
              x={bounds.positioning.backgroundX}
              y={bounds.positioning.backgroundY}
              width={bounds.containerBounds.width + (content.style.background?.padding || 0) * 2}
              height={bounds.containerBounds.height + (content.style.background?.padding || 0) * 2}
              fill="none"
              stroke={content.style.border.color}
              stroke-width={content.style.border.width}
              stroke-dasharray={
                content.style.border.style === 'Dashed' ? '5,5' :
                content.style.border.style === 'Dotted' ? '2,2' : 'none'
              }
              rx={content.style.border.radius || 0}
              ry={content.style.border.radius || 0}
              class="text-border-unified"
            />
          )}
          
          {/* ✏️ 文字层 - 🎯 优化渲染质量 + 支持智能换行 */}
          <text
            x={bounds.positioning.textAnchorX}
            y={bounds.positioning.textAnchorY}
            font-family={content.style.font_family}
            font-size={content.style.font_size.toString()}
            font-weight={content.style.font_weight}
            fill={content.style.color}
            text-anchor={textAnchor}
            dominant-baseline="hanging"
            
            // 🎯 专业文字渲染优化
            text-rendering="optimizeLegibility"      // 优化字体渲染质量
            shape-rendering="geometricPrecision"     // 几何精度优化
            font-kerning="auto"                      // 自动字间距调整
            
            class="text-content-unified"
          >
            {/* 🎯 智能渲染：根据是否换行选择不同渲染策略 */}
            {bounds.textLayout?.isWrapped ? 
              // 换行文本渲染
              bounds.textLayout.wrappedLines.map((line, index) => (
                <tspan 
                  x={bounds.positioning.textAnchorX} 
                  dy={index === 0 ? 0 : bounds.fontMetrics.lineHeight}
                  class="text-line-wrapped"
                >
                  {line}
                </tspan>
              )) :
              // 原始文本渲染
              content.content.split('\n').map((line, index) => (
                <tspan 
                  x={bounds.positioning.textAnchorX} 
                  dy={index === 0 ? 0 : bounds.fontMetrics.lineHeight}
                  class="text-line-original"
                >
                  {line}
                </tspan>
              ))
            }
          </text>
        </g>
      );
    }

    // Rectangle类型渲染
    if (content.type === 'Rectangle') {
      const opacity = content.opacity !== undefined ? content.opacity : 1;
      const cornerRadius = content.corner_radius || 0;
      
      return (
        <rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={content.fill_color || 'transparent'}
          fill-opacity={opacity}
          stroke={content.border?.color || '#000000'}
          stroke-width={content.border?.width || 1}
          stroke-opacity={opacity}
          stroke-dasharray={
            content.border?.style === 'Dashed' ? '5,5' :
            content.border?.style === 'Dotted' ? '2,2' : 'none'
          }
        />
      );
    }

    // Line类型渲染
    if (content.type === 'Line') {
      const opacity = content.opacity !== undefined ? content.opacity : 1;
      const lineStyle = content.line_style || 'Solid';
      
      const strokeDasharray = 
        lineStyle === 'Dashed' ? '8,4' :
        lineStyle === 'Dotted' ? '2,2' :
        lineStyle === 'DashDot' ? '8,4,2,4' : 'none';
      
      return (
        <line
          x1={0}
          y1={size.height / 2}
          x2={size.width}
          y2={size.height / 2}
          stroke={content.color}
          stroke-width={content.width}
          stroke-opacity={opacity}
          stroke-dasharray={strokeDasharray}
        />
      );
    }

    // DataField类型渲染 - 使用统一边界系统 + 预览模式支持
    if (content.type === 'DataField' && content.style) {
      // 🎯 关键改进：使用响应式的显示文本
      const displayText = dataFieldDisplayText();
      
      // 使用统一边界计算器 (DataField也是文字类型)
      const bounds = unifiedTextBoundaryCalculator.calculateUnifiedBounds(
        displayText,
        content.style, 
        size
      );

      const textAnchor = unifiedTextBoundaryCalculator.getTextAnchor(content.style.align);

      return (
        <g class="datafield-element-unified-container" data-preview-mode={previewState().mode}>
          {/* 🎯 DataField选中效果 - 统一样式系统 */}
          {props.selected && (
            <rect
              x={bounds.containerBounds.x}
              y={bounds.containerBounds.y}
              width={bounds.containerBounds.width}
              height={bounds.containerBounds.height}
              class="text-selection-unified"
            />
          )}
          
          {/* 🎯 模式指示器 - 设计模式显示小图标 */}
          {PreviewUtils.shouldShowExpression(previewState().mode) && (
            <g class="design-mode-indicator">
              <circle
                cx={bounds.containerBounds.x + bounds.containerBounds.width - 8}
                cy={bounds.containerBounds.y + 8}
                r={6}
                fill="rgba(24, 144, 255, 0.1)"
                stroke="#1890ff"
                stroke-width={1}
              />
              <text
                x={bounds.containerBounds.x + bounds.containerBounds.width - 8}
                y={bounds.containerBounds.y + 8}
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="8"
                font-weight="bold"
                fill="#1890ff"
              >
                {}
              </text>
            </g>
          )}
          
          {/* DataField文字 - 🎯 优化渲染质量 + 支持智能换行 */}
          <text
            x={bounds.positioning.textAnchorX}
            y={bounds.positioning.textAnchorY}
            font-family={content.style.font_family}
            font-size={content.style.font_size.toString()}
            font-weight={content.style.font_weight}
            fill={
              displayText.startsWith('[错误:') 
                ? '#ff4d4f' // 错误时使用红色
                : content.style.color
            }
            text-anchor={textAnchor}
            dominant-baseline="hanging"
            
            // 🎯 专业文字渲染优化
            text-rendering="optimizeLegibility"      // 优化字体渲染质量
            shape-rendering="geometricPrecision"     // 几何精度优化
            font-kerning="auto"                      // 自动字间距调整
            
            class={`datafield-content-unified ${previewState().mode}-mode`}
          >
            {/* 🎯 智能渲染：DataField也支持换行 */}
            {bounds.textLayout?.isWrapped ? 
              bounds.textLayout.wrappedLines.map((line, index) => (
                <tspan 
                  x={bounds.positioning.textAnchorX} 
                  dy={index === 0 ? 0 : bounds.fontMetrics.lineHeight}
                  class="datafield-line-wrapped"
                >
                  {line}
                </tspan>
              )) :
              <tspan x={bounds.positioning.textAnchorX} dy={0}>
                {displayText}
              </tspan>
            }
          </text>
        </g>
      );
    }
    
    // 默认渲染 - 其他类型
    return (
      <rect
        x={0}
        y={0}
        width={size.width}
        height={size.height}
        fill="#f0f0f0"
        stroke="#ccc"
        stroke-width="1"
        stroke-dasharray="5,5"
      />
    );
  };

  return (
    <g
      class={`element ${props.selected && (props.element.content.type !== 'Text' && props.element.content.type !== 'DataField') ? 'element-selected' : ''}`}
      style={elementStyle()}
      data-element-id={props.element.id}
      data-element-type={props.element.content.type}
      // 完全移除所有事件处理 - 由InteractionLayer统一管理
    >
      {renderContent()}
    </g>
  );
};

export default ElementRenderer;