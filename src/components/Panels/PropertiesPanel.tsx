import { Component, createMemo, Match, Show, Switch, createSignal, onMount, For, createEffect } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import type { ReportElement, TextAlign } from '../../types';
import { DataSourceAPI, DataSourceInfo } from '../../api/data-sources';
import ProfessionalTextPropertiesPanel from '../ProfessionalText/ProfessionalTextPropertiesPanel';
import '../ProfessionalText/ProfessionalTextPropertiesPanel.css';

const PropertiesPanel: Component = () => {
  const { state, updateElement } = useAppContext();

  // Get selected elements
  const selectedElements = createMemo(() => {
    const selectedIds = new Set(state.selected_ids);
    return state.elements.filter(element => selectedIds.has(element.id));
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
    <div class="flex flex-col h-auto">
      {/* Header */}
      <div class="p-4 border-b border-default">
        <h2 class="text-lg font-semibold text-primary">属性面板</h2>
      </div>

      {/* Content */}
      <div class="p-0">
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
    props.onUpdate(props.element.id, 'position', newPosition);
  };

  const handleSizeChange = (field: 'width' | 'height', value: number) => {
    const newSize = { ...props.element.size, [field]: Math.max(1, value) };
    props.onUpdate(props.element.id, 'size', newSize);
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
            <span class="property-value text-xs text-muted">{props.element.id}</span>
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
              onChange={(e) => props.onUpdate(props.element.id, 'visible', e.target.checked)}
            />
          </PropertyField>
          <PropertyField label="锁定">
            <input
              type="checkbox"
              class="property-checkbox"
              checked={props.element.locked}
              onChange={(e) => props.onUpdate(props.element.id, 'locked', e.target.checked)}
            />
          </PropertyField>
          <PropertyField label="层级">
            <input
              type="number"
              class="property-input"
              value={props.element.z_index}
              onInput={(e) => props.onUpdate(props.element.id, 'z_index', parseInt(e.target.value) || 0)}
            />
          </PropertyField>
        </div>
      </PropertyGroup>

      {/* Content-specific properties */}
      <Switch>
        <Match when={props.element.content.type === 'Text' && props.element.content}>
          {(textContent) => (
            <div>
              {/* 🎨 Phase 2.1: 专业排版系统集成 */}
              <ProfessionalTextPropertiesPanel 
                element={props.element}
                onUpdate={props.onUpdate}
              />
              
              {/* 传统文字属性 (保持向后兼容) */}
              <TextProperties 
                content={textContent()} 
                onUpdate={(updates) => {
                  console.log('Text content update:', updates);
                  props.onUpdate(props.element.id, 'content', updates);
                }}
              />
            </div>
          )}
        </Match>

        <Match when={props.element.content.type === 'Rectangle' && props.element.content}>
          {(rectContent) => (
            <RectangleProperties 
              content={rectContent()} 
              onUpdate={(updates) => {
                console.log('Rectangle content update:', updates);
                props.onUpdate(props.element.id, 'content', updates);
              }}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'Line' && props.element.content}>
          {(lineContent) => (
            <LineProperties 
              content={lineContent()} 
              onUpdate={(updates) => {
                console.log('Line content update:', updates);
                props.onUpdate(props.element.id, 'content', updates);
              }}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'Image' && props.element.content}>
          {(imageContent) => (
            <ImageProperties 
              content={imageContent()} 
              onUpdate={(updates) => {
                console.log('Image content update:', updates);
                props.onUpdate(props.element.id, 'content', updates);
              }}
            />
          )}
        </Match>

        <Match when={props.element.content.type === 'DataField' && props.element.content}>
          {(fieldContent) => (
            <div>
              {/* 🎨 Phase 2.1: 专业排版系统集成 - DataField也支持样式 */}
              <ProfessionalTextPropertiesPanel 
                element={props.element}
                onUpdate={props.onUpdate}
              />
              
              {/* 传统数据字段属性 */}
              <DataFieldProperties 
                content={fieldContent()} 
                onUpdate={(updates) => {
                  console.log('🔍 [PropertiesPanel] DataField content update 接收到:', {
                    更新内容: updates,
                    元素ID: props.element.id,
                    当前content: fieldContent(),
                    更新前data_source_id: fieldContent().data_source_id
                  });
                  props.onUpdate(props.element.id, 'content', updates);
                  console.log('🔍 [PropertiesPanel] 已调用 props.onUpdate');
                }}
              />
            </div>
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
      <div class="space-y-3">
        {/* 文本内容 */}
        <PropertyField label="内容">
          <textarea
            class="property-textarea"
            rows={2}
            value={props.content.content}
            onInput={(e) => props.onUpdate({ content: e.target.value })}
            placeholder="输入文本内容..."
          />
        </PropertyField>
        
        {/* 字体设置 */}
        <div class="grid grid-cols-2 gap-2">
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
              <option value="KaiTi">楷体</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </PropertyField>
          
          <PropertyField label="大小">
            <NumberInput
              value={props.content.style.font_size}
              min={6}
              max={72}
              step={1}
              unit="px"
              onUpdate={(value) => props.onUpdate({ 
                style: { ...props.content.style, font_size: value }
              })}
            />
          </PropertyField>
        </div>

        {/* 字体样式 */}
        <div class="grid grid-cols-2 gap-2">
          <PropertyField label="字重">
            <select
              class="property-select"
              value={props.content.style.font_weight}
              onChange={(e) => props.onUpdate({ 
                style: { ...props.content.style, font_weight: e.target.value }
              })}
            >
              <option value="normal">正常</option>
              <option value="bold">粗体</option>
              <option value="lighter">细体</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </PropertyField>
          
          <PropertyField label="对齐">
            <AlignmentSelector
              value={props.content.style.align}
              onUpdate={(align) => props.onUpdate({ 
                style: { ...props.content.style, align }
              })}
            />
          </PropertyField>
        </div>

        {/* 颜色设置 */}
        <PropertyField label="颜色">
          <ColorPicker
            value={props.content.style.color}
            onUpdate={(color) => props.onUpdate({ 
              style: { ...props.content.style, color }
            })}
          />
        </PropertyField>
        
        {/* Phase 1新增: 背景设置 */}
        <PropertyField label="背景">
          <div class="space-y-2">
            <ColorPicker
              value={props.content.style.background?.color || 'transparent'}
              onUpdate={(color) => props.onUpdate({ 
                style: { 
                  ...props.content.style, 
                  background: { 
                    ...props.content.style.background, 
                    color 
                  }
                }
              })}
            />
            <div class="grid grid-cols-2 gap-2">
              <PropertyField label="透明度">
                <NumberInput
                  value={props.content.style.background?.opacity || 1}
                  min={0}
                  max={1}
                  step={0.1}
                  onUpdate={(opacity) => props.onUpdate({ 
                    style: { 
                      ...props.content.style, 
                      background: { 
                        ...props.content.style.background, 
                        opacity 
                      }
                    }
                  })}
                />
              </PropertyField>
              <PropertyField label="内边距">
                <NumberInput
                  value={props.content.style.background?.padding || 0}
                  min={0}
                  max={20}
                  step={1}
                  unit="px"
                  onUpdate={(padding) => props.onUpdate({ 
                    style: { 
                      ...props.content.style, 
                      background: { 
                        ...props.content.style.background, 
                        padding 
                      }
                    }
                  })}
                />
              </PropertyField>
            </div>
          </div>
        </PropertyField>
        
        {/* Phase 1新增: 边框设置 */}
        <PropertyField label="边框">
          <div class="space-y-2">
            <ColorPicker
              value={props.content.style.border?.color || '#000000'}
              onUpdate={(color) => props.onUpdate({ 
                style: { 
                  ...props.content.style, 
                  border: { 
                    ...props.content.style.border, 
                    color 
                  }
                }
              })}
            />
            <div class="grid grid-cols-3 gap-2">
              <PropertyField label="宽度">
                <NumberInput
                  value={props.content.style.border?.width || 1}
                  min={0}
                  max={10}
                  step={0.5}
                  unit="px"
                  onUpdate={(width) => props.onUpdate({ 
                    style: { 
                      ...props.content.style, 
                      border: { 
                        ...props.content.style.border, 
                        width 
                      }
                    }
                  })}
                />
              </PropertyField>
              <PropertyField label="样式">
                <select
                  class="property-select"
                  value={props.content.style.border?.style || 'Solid'}
                  onChange={(e) => props.onUpdate({ 
                    style: { 
                      ...props.content.style, 
                      border: { 
                        ...props.content.style.border, 
                        style: e.target.value 
                      }
                    }
                  })}
                >
                  <option value="Solid">实线</option>
                  <option value="Dashed">虚线</option>
                  <option value="Dotted">点线</option>
                </select>
              </PropertyField>
              <PropertyField label="圆角">
                <NumberInput
                  value={props.content.style.border?.radius || 0}
                  min={0}
                  max={20}
                  step={1}
                  unit="px"
                  onUpdate={(radius) => props.onUpdate({ 
                    style: { 
                      ...props.content.style, 
                      border: { 
                        ...props.content.style.border, 
                        radius 
                      }
                    }
                  })}
                />
              </PropertyField>
            </div>
          </div>
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const RectangleProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="矩形样式" icon="▭">
      <div class="space-y-3">
        {/* 填充设置 */}
        <PropertyField label="填充颜色">
          <ColorPicker
            value={props.content.fill_color || '#ffffff'}
            onUpdate={(color) => props.onUpdate({ fill_color: color })}
          />
        </PropertyField>

        {/* 边框设置 */}
        <div class="space-y-2">
          <PropertyField label="边框">
            <div class="space-y-2">
              <ColorPicker
                value={props.content.border?.color || '#000000'}
                onUpdate={(color) => props.onUpdate({ 
                  border: { ...props.content.border, color }
                })}
              />
            </div>
          </PropertyField>
          
          <div class="grid grid-cols-2 gap-2">
            <PropertyField label="宽度">
              <NumberInput
                value={props.content.border?.width || 1}
                min={0}
                max={20}
                step={0.5}
                unit="px"
                onUpdate={(width) => props.onUpdate({ 
                  border: { ...props.content.border, width }
                })}
              />
            </PropertyField>
            
            <PropertyField label="样式">
              <select
                class="property-select"
                value={props.content.border?.style || 'Solid'}
                onChange={(e) => props.onUpdate({ 
                  border: { ...props.content.border, style: e.target.value }
                })}
              >
                <option value="Solid">实线</option>
                <option value="Dashed">虚线</option>
                <option value="Dotted">点线</option>
              </select>
            </PropertyField>
          </div>
        </div>

        {/* 圆角设置 */}
        <PropertyField label="圆角半径">
          <NumberInput
            value={props.content.corner_radius || 0}
            min={0}
            max={50}
            step={1}
            unit="px"
            onUpdate={(corner_radius) => props.onUpdate({ corner_radius })}
          />
        </PropertyField>

        {/* 透明度设置 */}
        <PropertyField label="透明度">
          <div class="flex gap-2 items-center">
            <input
              type="range"
              class="property-slider flex-1"
              min="0"
              max="100"
              step="1"
              value={((props.content.opacity || 1) * 100)}
              onInput={(e) => props.onUpdate({ 
                opacity: parseFloat(e.target.value) / 100 
              })}
            />
            <span class="property-value w-12 text-center">
              {Math.round((props.content.opacity || 1) * 100)}%
            </span>
          </div>
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const LineProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="线条样式" icon="━">
      <div class="space-y-3">
        {/* 颜色设置 */}
        <PropertyField label="颜色">
          <ColorPicker
            value={props.content.color}
            onUpdate={(color) => props.onUpdate({ color })}
          />
        </PropertyField>

        {/* 线条宽度 */}
        <PropertyField label="宽度">
          <NumberInput
            value={props.content.width}
            min={0.5}
            max={20}
            step={0.5}
            unit="px"
            onUpdate={(width) => props.onUpdate({ width })}
          />
        </PropertyField>

        {/* 线条样式 */}
        <PropertyField label="样式">
          <select
            class="property-select"
            value={props.content.line_style || 'Solid'}
            onChange={(e) => props.onUpdate({ line_style: e.target.value })}
          >
            <option value="Solid">实线</option>
            <option value="Dashed">虚线</option>
            <option value="Dotted">点线</option>
            <option value="DashDot">点划线</option>
          </select>
        </PropertyField>

        {/* 线条端点样式 */}
        <div class="grid grid-cols-2 gap-2">
          <PropertyField label="起点">
            <select
              class="property-select"
              value={props.content.start_cap || 'None'}
              onChange={(e) => props.onUpdate({ start_cap: e.target.value })}
            >
              <option value="None">无</option>
              <option value="Arrow">箭头</option>
              <option value="Circle">圆点</option>
              <option value="Square">方块</option>
            </select>
          </PropertyField>
          
          <PropertyField label="终点">
            <select
              class="property-select"
              value={props.content.end_cap || 'None'}
              onChange={(e) => props.onUpdate({ end_cap: e.target.value })}
            >
              <option value="None">无</option>
              <option value="Arrow">箭头</option>
              <option value="Circle">圆点</option>
              <option value="Square">方块</option>
            </select>
          </PropertyField>
        </div>

        {/* 透明度设置 */}
        <PropertyField label="透明度">
          <div class="flex gap-2 items-center">
            <input
              type="range"
              class="property-slider flex-1"
              min="0"
              max="100"
              step="1"
              value={((props.content.opacity || 1) * 100)}
              onInput={(e) => props.onUpdate({ 
                opacity: parseFloat(e.target.value) / 100 
              })}
            />
            <span class="property-value w-12 text-center">
              {Math.round((props.content.opacity || 1) * 100)}%
            </span>
          </div>
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const ImageProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  return (
    <PropertyGroup title="图片属性" icon="🖼️">
      <div class="space-y-3">
        {/* 图片地址 */}
        <PropertyField label="图片地址">
          <input
            type="text"
            class="property-input"
            value={props.content.src}
            onInput={(e) => props.onUpdate({ src: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </PropertyField>

        {/* 替代文本 */}
        <PropertyField label="替代文本">
          <input
            type="text"
            class="property-input"
            value={props.content.alt || ''}
            onInput={(e) => props.onUpdate({ alt: e.target.value })}
            placeholder="图片描述文字"
          />
        </PropertyField>

        {/* 图片预览 */}
        <PropertyField label="预览">
          <div class="property-image-preview">
            {props.content.src ? (
              <img
                src={props.content.src}
                alt={props.content.alt || '图片预览'}
                class="property-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const nextSibling = target.nextElementSibling as HTMLElement;
                  if (target) target.style.display = 'none';
                  if (nextSibling) nextSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement;
                  const nextSibling = target.nextElementSibling as HTMLElement;
                  if (target) target.style.display = 'block';
                  if (nextSibling) nextSibling.style.display = 'none';
                }}
              />
            ) : null}
            <div class="property-image-placeholder" style={{ display: props.content.src ? 'none' : 'flex' }}>
              <span>📷 无图片</span>
            </div>
          </div>
        </PropertyField>
      </div>
    </PropertyGroup>
  );
};

const DataFieldProperties: Component<{ content: any; onUpdate: (updates: any) => void }> = (props) => {
  const [dataSources, setDataSources] = createSignal<DataSourceInfo[]>([]);
  const [loadingDataSources, setLoadingDataSources] = createSignal(false);

  // 监测 props.content 的变化
  createEffect(() => {
    console.log('🔍 [DataFieldProperties] props.content 变化:', {
      data_source_id: props.content.data_source_id,
      expression: props.content.expression,
      完整content: props.content
    });
  });

  // Load available data sources on mount
  onMount(async () => {
    try {
      setLoadingDataSources(true);
      const sources = await DataSourceAPI.listDataSources();
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoadingDataSources(false);
    }
  });

  const handleDataSourceChange = (dataSourceId: string) => {
    console.log('🔍 [DataField] handleDataSourceChange 触发:', {
      新值: dataSourceId,
      当前值: props.content.data_source_id,
      是否为空: dataSourceId === '',
      将要更新的值: dataSourceId === '' ? undefined : dataSourceId
    });
    
    props.onUpdate({ 
      data_source_id: dataSourceId === '' ? undefined : dataSourceId 
    });
    
    console.log('🔍 [DataField] onUpdate 已调用，等待父组件更新');
    
    // 延迟检查是否更新成功
    setTimeout(() => {
      console.log('🔍 [DataField] 更新后检查:', {
        更新后的值: props.content.data_source_id,
        是否更新成功: props.content.data_source_id === (dataSourceId === '' ? undefined : dataSourceId)
      });
    }, 100);
  };

  const selectedDataSource = createMemo(() => {
    if (!props.content.data_source_id) return null;
    return dataSources().find(ds => ds.id === props.content.data_source_id);
  });

  return (
    <div class="space-y-4">
      <PropertyGroup title="数据源配置" icon="🔗">
        <div class="space-y-2">
          <PropertyField label="数据源">
            <Show when={loadingDataSources()} fallback={
              <select
                class="property-select"
                value={props.content.data_source_id || ''}
                onChange={(e) => {
                  console.log('🔍 [DataField] select onChange 事件触发:', {
                    target: e.target,
                    currentTarget: e.currentTarget,
                    value: e.currentTarget.value,
                    selectedIndex: e.currentTarget.selectedIndex,
                    selectedOption: e.currentTarget.options[e.currentTarget.selectedIndex]?.text
                  });
                  handleDataSourceChange(e.currentTarget.value);
                }}
                onInput={(e) => {
                  console.log('🔍 [DataField] select onInput 事件触发:', e.currentTarget.value);
                }}
              >
                <option value="">选择数据源</option>
                <For each={dataSources()}>
                  {(dataSource) => {
                    console.log('🔍 [DataField] 渲染数据源选项:', {
                      id: dataSource.id,
                      name: dataSource.name,
                      当前选中: props.content.data_source_id === dataSource.id
                    });
                    return (
                      <option value={dataSource.id}>
                        {dataSource.name} ({(dataSource as any).providerType || (dataSource as any).provider_type})
                      </option>
                    );
                  }}
                </For>
              </select>
            }>
              <div class="property-loading">加载数据源...</div>
            </Show>
          </PropertyField>

          <Show when={selectedDataSource()}>
            <div class="data-source-info">
              <div class="text-xs text-muted">
                <div><span class="font-medium">状态:</span> <span class={
                  selectedDataSource()!.status === 'active' ? 'text-green-600' : 
                  selectedDataSource()!.status === 'error' ? 'text-red-600' : 'text-gray-600'
                }>
                  {selectedDataSource()!.status === 'active' ? '活跃' : 
                   selectedDataSource()!.status === 'error' ? '错误' : '禁用'}
                </span></div>
                <div><span class="font-medium">类型:</span> {(selectedDataSource() as any)!.providerType || (selectedDataSource() as any)!.provider_type}</div>
                <div><span class="font-medium">更新:</span> {new Date(((selectedDataSource() as any)!.lastUpdated || (selectedDataSource() as any)!.last_updated)).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </Show>

          <PropertyField label="表达式">
            <input
              type="text"
              class="property-input"
              value={props.content.expression || ''}
              onInput={(e) => props.onUpdate({ expression: e.currentTarget.value })}
              placeholder="{name} 或 {user.email} 格式"
              disabled={false}
              title="使用 {fieldName} 语法引用数据字段，如 {name}, {price}, {user.email} 等"
            />
          </PropertyField>

          <Show when={!props.content.expression || !props.content.expression.trim()}>
            <div class="text-xs text-blue-600">
              💡 提示: 使用 {`{fieldName}`} 语法，如 {`{name}`}, {`{price}`}, {`{user.email}`} 等
            </div>
          </Show>
          
          <Show when={props.content.expression && !props.content.data_source_id}>
            <div class="text-xs text-orange-600">
              ⚠️ 注意: 选择数据源后表达式才能在预览模式下求值
            </div>
          </Show>

          <PropertyField label="格式">
            <select
              class="property-select"
              value={props.content.format || 'default'}
              onChange={(e) => props.onUpdate({ format: e.currentTarget.value === 'default' ? undefined : e.currentTarget.value })}
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

      {/* 数据字段样式设置 */}
      <PropertyGroup title="字段样式" icon="🎨">
        <div class="space-y-3">
          {/* 字体设置 */}
          <div class="grid grid-cols-2 gap-2">
            <PropertyField label="字体">
              <select
                class="property-select"
                value={props.content.style.font_family}
                onChange={(e) => props.onUpdate({ 
                  style: { ...props.content.style, font_family: e.currentTarget.value }
                })}
              >
                <option value="SimSun">宋体</option>
                <option value="SimHei">黑体</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="KaiTi">楷体</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
              </select>
            </PropertyField>
            
            <PropertyField label="大小">
              <NumberInput
                value={props.content.style.font_size}
                min={6}
                max={72}
                step={1}
                unit="px"
                onUpdate={(value) => props.onUpdate({ 
                  style: { ...props.content.style, font_size: value }
                })}
              />
            </PropertyField>
          </div>

          {/* 字体样式 */}
          <div class="grid grid-cols-2 gap-2">
            <PropertyField label="字重">
              <select
                class="property-select"
                value={props.content.style.font_weight}
                onChange={(e) => props.onUpdate({ 
                  style: { ...props.content.style, font_weight: e.currentTarget.value }
                })}
              >
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
                <option value="lighter">细体</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </PropertyField>
            
            <PropertyField label="对齐">
              <AlignmentSelector
                value={props.content.style.align}
                onUpdate={(align) => props.onUpdate({ 
                  style: { ...props.content.style, align }
                })}
              />
            </PropertyField>
          </div>

          {/* 颜色设置 */}
          <PropertyField label="颜色">
            <ColorPicker
              value={props.content.style.color}
              onUpdate={(color) => props.onUpdate({ 
                style: { ...props.content.style, color }
              })}
            />
          </PropertyField>
        </div>
      </PropertyGroup>
    </div>
  );
};

// Advanced UI Components for Properties Panel
interface NumberInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onUpdate: (value: number) => void;
}

const NumberInput: Component<NumberInputProps> = (props) => {
  return (
    <div class="flex">
      <input
        type="number"
        class="property-input flex-1"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step || 1}
        onInput={(e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            const clampedValue = Math.max(
              props.min || -Infinity,
              Math.min(props.max || Infinity, value)
            );
            props.onUpdate(clampedValue);
          }
        }}
        onBlur={(e) => {
          // Ensure value is within bounds on blur
          const value = parseFloat(e.target.value) || props.value;
          const clampedValue = Math.max(
            props.min || -Infinity,
            Math.min(props.max || Infinity, value)
          );
          if (clampedValue !== value) {
            e.target.value = clampedValue.toString();
            props.onUpdate(clampedValue);
          }
        }}
      />
      {props.unit && (
        <span class="property-unit">{props.unit}</span>
      )}
    </div>
  );
};

interface ColorPickerProps {
  value: string;
  onUpdate: (color: string) => void;
}

const ColorPicker: Component<ColorPickerProps> = (props) => {
  return (
    <div class="flex gap-2">
      {/* Color preview and picker */}
      <div class="property-color-wrapper">
        <input
          type="color"
          class="property-color"
          value={props.value}
          onInput={(e) => props.onUpdate(e.target.value)}
        />
        <div
          class="property-color-preview"
          style={{ 'background-color': props.value }}
        />
      </div>
      
      {/* Hex input */}
      <input
        type="text"
        class="property-input flex-1"
        value={props.value}
        onInput={(e) => {
          const color = e.target.value;
          // Basic hex color validation
          if (/^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color)) {
            props.onUpdate(color);
          }
        }}
        placeholder="#000000"
      />
    </div>
  );
};

interface AlignmentSelectorProps {
  value: TextAlign;
  onUpdate: (align: TextAlign) => void;
}

const AlignmentSelector: Component<AlignmentSelectorProps> = (props) => {
  const alignments = [
    { value: 'Left' as TextAlign, icon: '⬅️', label: '左对齐' },
    { value: 'Center' as TextAlign, icon: '↔️', label: '居中' },
    { value: 'Right' as TextAlign, icon: '➡️', label: '右对齐' }
  ];

  return (
    <div class="property-alignment-group">
      {alignments.map(alignment => (
        <button
          class={`property-alignment-btn ${props.value === alignment.value ? 'active' : ''}`}
          onClick={() => props.onUpdate(alignment.value)}
          title={alignment.label}
        >
          {alignment.icon}
        </button>
      ))}
    </div>
  );
};

export default PropertiesPanel;
