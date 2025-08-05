import { Component, Match, Switch, createMemo } from 'solid-js';
import type { ReportElement } from '../../types';

interface ElementRendererProps {
  element: ReportElement;
  selected: boolean;
}

const ElementRenderer: Component<ElementRendererProps> = (props) => {
  // Create a unique key for the element to ensure proper reactivity
  const elementKey = createMemo(() => props.element.id.value);

  // Common element styles
  const elementStyle = createMemo(() => ({
    transform: `translate(${props.element.position.x}px, ${props.element.position.y}px)`,
    opacity: props.element.visible ? 1 : 0.5,
    cursor: props.element.locked ? 'not-allowed' : 'pointer',
  }));

  // Render different element types
  const renderContent = () => {
    const { content, size } = props.element;

    return (
      <Switch>
        <Match when={content.type === 'Text' && content}>
          {(textContent) => (
            <text
              x={0}
              y={textContent().style.font_size * 0.8} // Adjust for baseline
              width={size.width}
              height={size.height}
              font-family={textContent().style.font_family}
              font-size={textContent().style.font_size}
              font-weight={textContent().style.font_weight}
              fill={textContent().style.color}
              text-anchor={
                textContent().style.align === 'Center' ? 'middle' :
                textContent().style.align === 'Right' ? 'end' : 'start'
              }
              dominant-baseline="text-before-edge"
            >
              {textContent().content}
            </text>
          )}
        </Match>

        <Match when={content.type === 'Rectangle' && content}>
          {(rectContent) => (
            <rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fill={rectContent().fill_color || 'transparent'}
              stroke={rectContent().border?.color || '#000000'}
              stroke-width={rectContent().border?.width || 1}
              stroke-dasharray={
                rectContent().border?.style === 'Dashed' ? '5,5' :
                rectContent().border?.style === 'Dotted' ? '2,2' : 'none'
              }
            />
          )}
        </Match>

        <Match when={content.type === 'Line' && content}>
          {(lineContent) => (
            <line
              x1={0}
              y1={size.height / 2}
              x2={size.width}
              y2={size.height / 2}
              stroke={lineContent().color}
              stroke-width={lineContent().width}
            />
          )}
        </Match>

        <Match when={content.type === 'Image' && content}>
          {(imageContent) => (
            <>
              <image
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                href={imageContent().src}
                preserveAspectRatio="xMidYMid meet"
              />
              {/* Fallback rectangle if image fails to load */}
              <rect
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                fill="none"
                stroke="#cccccc"
                stroke-width="1"
                stroke-dasharray="3,3"
              />
              <text
                x={size.width / 2}
                y={size.height / 2}
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="12"
                fill="#666666"
              >
                Image
              </text>
            </>
          )}
        </Match>

        <Match when={content.type === 'DataField' && content}>
          {(fieldContent) => (
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
                x={4}
                y={fieldContent().style.font_size * 0.8}
                width={size.width - 8}
                height={size.height}
                font-family={fieldContent().style.font_family}
                font-size={fieldContent().style.font_size}
                font-weight={fieldContent().style.font_weight}
                fill={fieldContent().style.color}
                text-anchor={
                  fieldContent().style.align === 'Center' ? 'middle' :
                  fieldContent().style.align === 'Right' ? 'end' : 'start'
                }
              >
                {fieldContent().expression || '[数据字段]'}
              </text>
            </>
          )}
        </Match>
      </Switch>
    );
  };

  return (
    <g
      key={elementKey()}
      class={`element ${props.selected ? 'element-selected' : ''}`}
      style={elementStyle()}
      data-element-id={props.element.id.value}
      data-element-type={props.element.content.type}
    >
      {/* Element content */}
      {renderContent()}
      
      {/* Selection indicator */}
      {props.selected && (
        <rect
          x={-1}
          y={-1}
          width={props.element.size.width + 2}
          height={props.element.size.height + 2}
          fill="none"
          stroke="var(--color-selection)"
          stroke-width="2"
          stroke-dasharray="none"
        />
      )}
    </g>
  );
};

export default ElementRenderer;