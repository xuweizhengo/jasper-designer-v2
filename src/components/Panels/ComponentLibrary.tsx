import { Component, createSignal, For } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';
import type { ComponentDefinition } from '../../types';

const ComponentLibrary: Component = () => {
  const { createElement } = useAppContext();
  const [searchTerm, setSearchTerm] = createSignal('');

  // Component definitions
  const basicComponents: ComponentDefinition[] = [
    {
      id: 'text',
      name: '文字',
      category: 'basic',
      icon: '📝',
      description: '静态文字标签',
      default_size: { width: 100, height: 24 },
      create_content: (data) => ({
        type: 'Text',
        content: data?.text || '文字内容',
        style: {
          font_family: 'SimSun',
          font_size: 14,
          font_weight: 'normal',
          color: '#000000',
          align: 'Left' as const,
        },
      }),
    },
    {
      id: 'data_field',
      name: '数据字段',
      category: 'data',
      icon: '🔗',
      description: '动态数据字段',
      default_size: { width: 120, height: 24 },
      create_content: (data) => ({
        type: 'DataField',
        expression: data?.expression || '${fieldName}',
        format: data?.format,
        style: {
          font_family: 'SimSun',
          font_size: 14,
          font_weight: 'normal',
          color: '#000000',
          align: 'Left' as const,
        },
      }),
    },
    {
      id: 'rectangle',
      name: '矩形',
      category: 'basic',
      icon: '▭',
      description: '矩形框架',
      default_size: { width: 100, height: 60 },
      create_content: (data) => ({
        type: 'Rectangle',
        fill_color: data?.fill_color || 'transparent',
        border: {
          color: data?.border_color || '#000000',
          width: data?.border_width || 1,
          style: 'Solid' as const,
        },
      }),
    },
    {
      id: 'line',
      name: '线条',
      category: 'basic',
      icon: '━',
      description: '分隔线',
      default_size: { width: 200, height: 2 },
      create_content: (data) => ({
        type: 'Line',
        color: data?.color || '#000000',
        width: data?.width || 1,
      }),
    },
    {
      id: 'image',
      name: '图片',
      category: 'basic',
      icon: '🖼️',
      description: '图片占位符',
      default_size: { width: 100, height: 80 },
      create_content: (data) => ({
        type: 'Image',
        src: data?.src || '',
        alt: data?.alt || '图片',
      }),
    },
  ];

  const bankComponents: ComponentDefinition[] = [
    {
      id: 'bank_header',
      name: '银行抬头',
      category: 'bank',
      icon: '🏦',
      description: '银行标题和Logo区域',
      default_size: { width: 300, height: 60 },
      create_content: () => ({
        type: 'Text',
        content: '中国工商银行电子回单',
        style: {
          font_family: 'SimHei',
          font_size: 18,
          font_weight: 'bold',
          color: '#000000',
          align: 'Center' as const,
        },
      }),
    },
    {
      id: 'amount_field',
      name: '金额字段',
      category: 'bank',
      icon: '💰',
      description: '格式化金额显示',
      default_size: { width: 120, height: 24 },
      create_content: () => ({
        type: 'DataField',
        expression: '${amount}',
        format: 'currency',
        style: {
          font_family: 'SimSun',
          font_size: 14,
          font_weight: 'bold',
          color: '#000000',
          align: 'Right' as const,
        },
      }),
    },
    {
      id: 'customer_info',
      name: '客户信息',
      category: 'bank',
      icon: '👤',
      description: '客户姓名和账号',
      default_size: { width: 150, height: 24 },
      create_content: () => ({
        type: 'DataField',
        expression: '${customerName}',
        style: {
          font_family: 'SimSun',
          font_size: 12,
          font_weight: 'normal',
          color: '#000000',
          align: 'Left' as const,
        },
      }),
    },
  ];

  const allComponents = [...basicComponents, ...bankComponents];

  const filteredComponents = () => {
    const term = searchTerm().toLowerCase();
    if (!term) return allComponents;
    return allComponents.filter(comp => 
      comp.name.toLowerCase().includes(term) || 
      comp.description.toLowerCase().includes(term)
    );
  };

  const handleComponentDrag = (component: ComponentDefinition, event: DragEvent) => {
    console.log('Starting drag for component:', component.id);
    
    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'component',
        component: component
      }));
      
      // Create a visual drag image
      const dragImage = document.createElement('div');
      dragImage.innerHTML = `
        <div style="
          background: #f3f4f6; 
          border: 2px solid #3b82f6; 
          border-radius: 8px; 
          padding: 8px 12px; 
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ">
          ${component.icon} ${component.name}
        </div>
      `;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      
      event.dataTransfer.setDragImage(dragImage, 50, 20);
      
      // Clean up drag image after drag starts
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  const handleComponentClick = async (component: ComponentDefinition) => {
    try {
      // Create element at center of canvas
      const elementId = await createElement(
        component.id,
        { x: 100, y: 100 }, // TODO: Calculate based on canvas center
        component.default_size,
        component.create_content()
      );
      console.log('Created element:', elementId);
    } catch (error) {
      console.error('Failed to create element:', error);
    }
  };

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div class="p-4 border-b border-default">
        <h2 class="text-lg font-semibold text-primary mb-3">组件库</h2>
        <input
          type="text"
          placeholder="搜索组件..."
          class="component-search"
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Component List */}
      <div class="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div class="space-y-4">
          {/* Basic Components */}
          <div>
            <h3 class="text-sm font-medium text-secondary mb-2">基础组件</h3>
            <div class="grid grid-cols-2 gap-2">
              <For each={filteredComponents().filter(c => c.category === 'basic')}>
                {(component) => (
                  <ComponentItem
                    component={component}
                    onDrag={(e) => handleComponentDrag(component, e)}
                    onClick={() => handleComponentClick(component)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* Data Components */}
          <div>
            <h3 class="text-sm font-medium text-secondary mb-2">数据组件</h3>
            <div class="grid grid-cols-2 gap-2">
              <For each={filteredComponents().filter(c => c.category === 'data')}>
                {(component) => (
                  <ComponentItem
                    component={component}
                    onDrag={(e) => handleComponentDrag(component, e)}
                    onClick={() => handleComponentClick(component)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* Bank Components */}
          <div>
            <h3 class="text-sm font-medium text-secondary mb-2">银行组件</h3>
            <div class="grid grid-cols-2 gap-2">
              <For each={filteredComponents().filter(c => c.category === 'bank')}>
                {(component) => (
                  <ComponentItem
                    component={component}
                    onDrag={(e) => handleComponentDrag(component, e)}
                    onClick={() => handleComponentClick(component)}
                  />
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component Item
interface ComponentItemProps {
  component: ComponentDefinition;
  onDrag: (event: DragEvent) => void;
  onClick: () => void;
}

const ComponentItem: Component<ComponentItemProps> = (props) => {
  return (
    <div
      class="component-item"
      draggable={true}
      onDragStart={(e) => props.onDrag(e)}
      onClick={props.onClick}
      title={props.component.description}
    >
      <div class="text-center">
        <div class="text-lg mb-1">{props.component.icon}</div>
        <div class="text-xs font-medium text-primary">{props.component.name}</div>
      </div>
    </div>
  );
};

export default ComponentLibrary;