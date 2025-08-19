import { Component, createMemo } from 'solid-js';
import type { ReportElement } from '../../types';

interface ElementRendererProps {
  element: ReportElement;
  selected: boolean;
  interactive?: boolean; // 可选的交互模式控制
}

/**
 * 纯渲染的ElementRenderer组件
 * 只负责渲染，不处理任何交互逻辑
 * 交互由SimpleInteractionLayer统一管理
 */
const ElementRenderer: Component<ElementRendererProps> = (props) => {
  // 纯渲染模式 - 移除所有交互逻辑
  const elementStyle = createMemo(() => {
    const { position } = props.element;
    return {
      transform: `translate(${position.x}px, ${position.y}px)`,
      opacity: props.element.visible ? 1 : 0.5,
      // 移除cursor设置 - 由InteractionLayer统一管理
    };
  });

  // Phase 1 完整功能的渲染逻辑
  const renderContent = () => {
    const { content, size } = props.element;

    // Text类型渲染 - Phase 1 完整功能
    if (content.type === 'Text' && content.content && content.style) {
      const align = content.style.align;
      const textAnchor = 
        align === 'Center' ? 'middle' :
        align === 'Right' ? 'end' : 'start';
      
      // 辅助函数：计算实际文字边界
      const calculateTextBounds = (textContent: string, style: any) => {
        // 估算文字尺寸（基于字体大小和字符数）
        const lines = textContent.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        
        // 字符宽度估算：中文字符约等于字体大小，英文字符约为字体大小的0.6倍
        const avgCharWidth = style.font_size * 0.8; // 混合估算
        const estimatedWidth = Math.min(maxLineLength * avgCharWidth, size.width);
        const estimatedHeight = lines.length * style.font_size * 1.2;
        
        return {
          width: estimatedWidth,
          height: estimatedHeight,
          lines: lines.length
        };
      };

      // 计算实际文字边界
      const textBounds = calculateTextBounds(content.content, content.style);
      
      // 计算文字位置（基于对齐方式）
      const x = 
        align === 'Center' ? size.width / 2 :
        align === 'Right' ? size.width : 0;

      // 背景和边框的padding
      const padding = content.style.background?.padding || 0;
      
      // 背景尺寸：基于实际文字尺寸而非元素尺寸
      const bgWidth = textBounds.width + padding * 2;
      const bgHeight = textBounds.height + padding * 2;
      
      // 背景位置：根据文字对齐方式调整
      const bgX = 
        align === 'Center' ? (size.width - bgWidth) / 2 :
        align === 'Right' ? size.width - bgWidth : 0;
      const bgY = 0; // 文字基线对齐

      return (
        <g class="text-element-container">
          {/* 背景层 */}
          {content.style.background && (
            <rect
              x={bgX}
              y={bgY}
              width={bgWidth}
              height={bgHeight}
              fill={content.style.background.color}
              fill-opacity={content.style.background.opacity || 1}
              rx={content.style.border?.radius || 0}
              ry={content.style.border?.radius || 0}
              class="text-background"
            />
          )}
          
          {/* 边框层 */}
          {content.style.border && (
            <rect
              x={bgX}
              y={bgY}
              width={bgWidth}
              height={bgHeight}
              fill="none"
              stroke={content.style.border.color}
              stroke-width={content.style.border.width}
              stroke-dasharray={
                content.style.border.style === 'Dashed' ? '5,5' :
                content.style.border.style === 'Dotted' ? '2,2' : 'none'
              }
              rx={content.style.border.radius || 0}
              ry={content.style.border.radius || 0}
              class="text-border"
            />
          )}
          
          {/* 文字层 */}
          <text
            x={x}
            y={content.style.font_size * 0.75}
            font-family={content.style.font_family}
            font-size={`${content.style.font_size}`}
            font-weight={content.style.font_weight}
            fill={content.style.color}
            text-anchor={textAnchor}
            dominant-baseline="hanging"
          >
            {content.content.split('\n').map((line, index) => (
              <tspan x={x} dy={index === 0 ? 0 : content.style.font_size * 1.2}>
                {line}
              </tspan>
            ))}
          </text>

          {/* 选中效果层 - 只在选中时显示 */}
          {props.selected && (
            <rect
              x={bgX - 2}
              y={bgY - 2}
              width={bgWidth + 4}
              height={bgHeight + 4}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3b82f6"
              stroke-width="1"
              stroke-dasharray="3,3"
              rx="2"
              ry="2"
              class="text-selection-background"
            />
          )}
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

    // DataField类型渲染
    if (content.type === 'DataField' && content.style) {
      return (
        <>
          <rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="rgba(59, 130, 246, 0.3)"
            stroke-width="1"
            stroke-dasharray="2,2"
          />
          <text
            x={
              content.style.align === 'Center' ? size.width / 2 :
              content.style.align === 'Right' ? size.width - 4 : 4
            }
            y={content.style.font_size * 0.8}
            font-family={content.style.font_family}
            font-size={`${content.style.font_size}`}
            font-weight={content.style.font_weight}
            fill={content.style.color}
            text-anchor={
              content.style.align === 'Center' ? 'middle' :
              content.style.align === 'Right' ? 'end' : 'start'
            }
            dominant-baseline="hanging"
          >
            {content.expression || '[数据字段]'}
          </text>
        </>
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
      class={`element ${props.selected ? 'element-selected' : ''}`}
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