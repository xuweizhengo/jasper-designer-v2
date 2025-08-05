import { Component, createMemo, Match, Show, Switch } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import type { ReportElement } from '../../types';

const PropertiesPanel: Component = () => {
  const { state, updateElement } = useAppContext();

  // Get selected elements
  const selectedElements = createMemo(() => {
    const selectedIds = new Set(state.selected_ids);
    return state.elements.filter(element => selectedIds.has(element.id.value));
  });

  // Get the primary selected element (first one)
  const primaryElement = createMemo(() => selectedElements()[0]);

  const updateElementProperty = async (elementId: string, property: string, value: any) => {
    try {
      await updateElement(elementId, { [property]: value });
    } catch (error) {
      console.error('Failed to update element property:', error);
    }
  };

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div class="p-4 border-b border-default">
        <h2 class="text-lg font-semibold text-primary">属性面板</h2>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <Show 
          when={primaryElement()} 
          fallback={
            <div class="p-4 text-center text-muted">
              <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-sm">选择元素以查看属性</p>
            </div>
          }
        >
          <ElementProperties element={primaryElement()!} onUpdate={updateElementProperty} />
        </Show>
      </div>
    </div>
  );
};

// Element Properties Component
interface ElementPropertiesProps {
  element: ReportElement;
  onUpdate: (elementId: string, property: string, value: any) => void;
}

const ElementProperties: Component<ElementPropertiesProps> = (props) => {
  const handlePositionChange = (field: 'x' | 'y', value: number) => {
    const newPosition = { ...props.element.position, [field]: value };
    props.onUpdate(props.element.id.value, 'position', newPosition);
  };

  const handleSizeChange = (field: 'width' | 'height', value: number) => {
    const newSize = { ...props.element.size, [field]: Math.max(1, value) };
    props.onUpdate(props.element.id.value, 'size', newSize);
  };

  return (
    <div class="p-4 space-y-4">
      {/* Element Info */}
      <PropertyGroup title="元素信息" icon="ℹ️">
        <div class="space-y-2">
          <PropertyField label="类型">
            <span class="property-value">{props.element.content.type}</span>
          </PropertyField>
          <PropertyField label="ID">
            <span class="property-value text-xs text-muted">{props.element.id.value}</span>
          </PropertyField>
        </div>
      </PropertyGroup>

      {/* Position & Size */}
      <PropertyGroup title="位置和大小" icon="📐">
        <div class="grid grid-cols-2 gap-2">
          <PropertyField label="X">
            <input
              type="number"
              class="property-input"
              value={props.element.position.x}
              onInput={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
            />
          </PropertyField>
          <PropertyField label="Y">
            <input
              type="number"
              class="property-input"
              value={props.element.position.y}
              onInput={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
            />
          </PropertyField>
          <PropertyField label="宽度">
            <input
              type="number"
              class="property-input"
              value={props.element.size.width}
              onInput={(e) => handleSizeChange('width', parseFloat(e.target.value) || 1)}
            />
          </PropertyField>
          <PropertyField label="高度">
            <input
              type="number"
              class="property-input"
              value={props.element.size.height}
              onInput={(e) => handleSizeChange('height', parseFloat(e.target.value) || 1)}
            />
          </PropertyField>
        </div>
      </PropertyGroup>

      {/* Element State */}
      <PropertyGroup title="状态" icon="👁️">
        <div class="space-y-2">
          <PropertyField label="可见">
            <input
              type="checkbox"
              class="property-checkbox"
              checked={props.element.visible}
              onChange={(e) => props.onUpdate(props.element.id.value, 'visible', e.target.checked)}
            />
          </PropertyField>
          <PropertyField label="锁定">
            <input
              type="checkbox"
              class="property-checkbox"
              checked={props.element.locked}
              onChange={(e) => props.onUpdate(props.element.id.value, 'locked', e.target.checked)}
            />
          </PropertyField>
          <PropertyField label="层级">
            <input
              type="number"
              class="property-input"
              value={props.element.z_index}
              onInput={(e) => props.onUpdate(props.element.id.value, 'z_index', parseInt(e.target.value) || 0)}
            />
          </PropertyField>
        </div>
      </PropertyGroup>

      {/* Content-specific properties */}
      <Switch>
        <Match when={props.element.content.type === 'Text' && props.element.content}>
          {(textContent) => (
            <TextProperties 
              content={textContent()} 
              onUpdate={(updates) => props.onUpdate(props.element.id.value, 'content', { ...textContent(), ...updates })}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'Rectangle' && props.element.content}>
          {(rectContent) => (
            <RectangleProperties 
              content={rectContent()} 
              onUpdate={(updates) => props.onUpdate(props.element.id.value, 'content', { ...rectContent(), ...updates })}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'Line' && props.element.content}>
          {(lineContent) => (
            <LineProperties 
              content={lineContent()} 
              onUpdate={(updates) => props.onUpdate(props.element.id.value, 'content', { ...lineContent(), ...updates })}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'DataField' && props.element.content}>
          {(fieldContent) => (
            <DataFieldProperties 
              content={fieldContent()} 
              onUpdate={(updates) => props.onUpdate(props.element.id.value, 'content', { ...fieldContent(), ...updates })}
            />
          )}
        </Match>
      </Switch>
    </div>
  );
};

// Property Group Component
interface PropertyGroupProps {
  title: string;
  icon: string;
  children: any;
}

const PropertyGroup: Component<PropertyGroupProps> = (props) => {
  return (
    <div class="property-group">
      <div class="property-group-title">
        <span>{props.icon}</span>
        <span>{props.title}</span>
      </div>
      <div class="property-group-content">
        {props.children}
      </div>
    </div>
  );
};

// Property Field Component
interface PropertyFieldProps {
  label: string;
  children: any;
}

const PropertyField: Component<PropertyFieldProps> = (props) => {
  return (
    <div class="property-field">
      <label class="property-label">{props.label}</label>
      {props.children}
    </div>
  );
};

// Content-specific property components
const TextProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="文字样式" icon="🔤">
      <div class="space-y-2">
        <PropertyField label="内容">
          <input
            type="text"
            class="property-input"
            value={props.content.content}
            onInput={(e) => props.onUpdate({ content: e.target.value })}
          />
        </PropertyField>
        <PropertyField label="字体">
          <select
            class="property-select"
            value={props.content.style.font_family}
            onChange={(e) => props.onUpdate({ 
              style: { ...props.content.style, font_family: e.target.value }
            })}
          >
            <option value="SimSun">宋体</option>
            <option value="SimHei">黑体</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="Arial">Arial</option>
          </select>
        </PropertyField>
        <PropertyField label="大小">
          <input
            type="number"
            class="property-input"
            value={props.content.style.font_size}
            onInput={(e) => props.onUpdate({ 
              style: { ...props.content.style, font_size: parseFloat(e.target.value) || 12 }
            })}
          />
        </PropertyField>
        <PropertyField label="颜色">
          <input
            type="color"
            class="property-color"
            value={props.content.style.color}
            onInput={(e) => props.onUpdate({ 
              style: { ...props.content.style, color: e.target.value }
            })}
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const RectangleProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="矩形样式" icon="▭">
      <div class="space-y-2">
        <PropertyField label="填充颜色">
          <input
            type="color"
            class="property-color"
            value={props.content.fill_color || '#ffffff'}
            onInput={(e) => props.onUpdate({ fill_color: e.target.value })}
          />
        </PropertyField>
        <PropertyField label="边框颜色">
          <input
            type="color"
            class="property-color"
            value={props.content.border?.color || '#000000'}
            onInput={(e) => props.onUpdate({ 
              border: { ...props.content.border, color: e.target.value }
            })}
          />
        </PropertyField>
        <PropertyField label="边框宽度">
          <input
            type="number"
            class="property-input"
            value={props.content.border?.width || 1}
            onInput={(e) => props.onUpdate({ 
              border: { ...props.content.border, width: parseFloat(e.target.value) || 1 }
            })}
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const LineProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="线条样式" icon="━">
      <div class="space-y-2">
        <PropertyField label="颜色">
          <input
            type="color"
            class="property-color"
            value={props.content.color}
            onInput={(e) => props.onUpdate({ color: e.target.value })}
          />
        </PropertyField>
        <PropertyField label="宽度">
          <input
            type="number"
            class="property-input"
            value={props.content.width}
            onInput={(e) => props.onUpdate({ width: parseFloat(e.target.value) || 1 })}
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const DataFieldProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="数据字段" icon="🔗">
      <div class="space-y-2">
        <PropertyField label="表达式">
          <input
            type="text"
            class="property-input"
            value={props.content.expression}
            onInput={(e) => props.onUpdate({ expression: e.target.value })}
            placeholder="${fieldName}"
          />
        </PropertyField>
        <PropertyField label="格式">
          <select
            class="property-select"
            value={props.content.format || 'default'}
            onChange={(e) => props.onUpdate({ format: e.target.value === 'default' ? undefined : e.target.value })}
          >
            <option value="default">默认</option>
            <option value="currency">货币</option>
            <option value="date">日期</option>
            <option value="datetime">日期时间</option>
            <option value="number">数字</option>
          </select>
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

export default PropertiesPanel;