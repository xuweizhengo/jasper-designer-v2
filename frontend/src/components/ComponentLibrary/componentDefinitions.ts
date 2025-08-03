import { ComponentDefinition } from '../../types'

export const basicComponents: ComponentDefinition[] = [
  {
    id: 'text',
    name: '标题文字',
    icon: 'Type',
    category: 'basic',
    defaultProps: {
      x: 0,
      y: 0,
      width: 200,
      height: 30,
      text: '标题文字',
      fontSize: 16,
      fontFamily: '宋体',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
    }
  },
  {
    id: 'label',
    name: '普通文字',
    icon: 'AlignLeft',
    category: 'basic',
    defaultProps: {
      x: 0,
      y: 0,
      width: 150,
      height: 24,
      text: '普通文字',
      fontSize: 12,
      fontFamily: '宋体',
      color: '#000000',
      textAlign: 'left',
    }
  },
  {
    id: 'field',
    name: '数据字段',
    icon: 'Database',
    category: 'data',
    defaultProps: {
      x: 0,
      y: 0,
      width: 150,
      height: 24,
      text: '[字段名]',
      fontSize: 12,
      fontFamily: '宋体',
      color: '#000000',
      textAlign: 'left',
      expression: '',
    }
  },
  {
    id: 'image',
    name: '图片',
    icon: 'Image',
    category: 'basic',
    defaultProps: {
      x: 0,
      y: 0,
      width: 60,
      height: 30,
      src: '',
    }
  },
  {
    id: 'line',
    name: '分割线',
    icon: 'Minus',
    category: 'basic',
    defaultProps: {
      x: 0,
      y: 0,
      width: 200,
      height: 1,
      strokeWidth: 1,
      strokeColor: '#000000',
    }
  },
  {
    id: 'rectangle',
    name: '矩形框',
    icon: 'Square',
    category: 'basic',
    defaultProps: {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 1,
    }
  },
]

export const bankComponents: ComponentDefinition[] = [
  {
    id: 'bank-header',
    name: '银行抬头',
    icon: 'Building',
    category: 'bank',
    defaultProps: {
      x: 0,
      y: 0,
      width: 400,
      height: 80,
    },
    template: {
      type: 'group',
      children: [
        {
          type: 'image',
          props: {
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            src: '/assets/bank-logo.png',
          }
        },
        {
          type: 'text',
          props: {
            x: 80,
            y: 0,
            width: 200,
            height: 30,
            text: '中国工商银行',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'left',
          }
        },
        {
          type: 'text',
          props: {
            x: 80,
            y: 35,
            width: 150,
            height: 25,
            text: '电子回单',
            fontSize: 14,
            textAlign: 'left',
          }
        }
      ]
    }
  },
  {
    id: 'amount-field',
    name: '金额显示',
    icon: 'DollarSign',
    category: 'bank',
    defaultProps: {
      x: 0,
      y: 0,
      width: 150,
      height: 24,
      text: '¥0.00',
      fontSize: 14,
      fontFamily: '宋体',
      color: '#000000',
      textAlign: 'right',
      expression: '',
      format: 'currency',
    }
  },
  {
    id: 'info-table',
    name: '信息表格',
    icon: 'Table',
    category: 'bank',
    defaultProps: {
      x: 0,
      y: 0,
      width: 400,
      height: 120,
    },
    template: {
      type: 'group',
      children: [
        // 外框
        {
          type: 'rectangle',
          props: {
            x: 0,
            y: 0,
            width: 400,
            height: 120,
            backgroundColor: 'transparent',
            borderColor: '#000000',
            borderWidth: 1,
          }
        },
        // 中间分割线
        {
          type: 'line',
          props: {
            x: 200,
            y: 0,
            width: 1,
            height: 120,
            strokeColor: '#000000',
            strokeWidth: 1,
          }
        },
        // 横向分割线
        {
          type: 'line',
          props: {
            x: 0,
            y: 30,
            width: 400,
            height: 1,
            strokeColor: '#000000',
            strokeWidth: 1,
          }
        },
        {
          type: 'line',
          props: {
            x: 0,
            y: 60,
            width: 400,
            height: 1,
            strokeColor: '#000000',
            strokeWidth: 1,
          }
        },
        {
          type: 'line',
          props: {
            x: 0,
            y: 90,
            width: 400,
            height: 1,
            strokeColor: '#000000',
            strokeWidth: 1,
          }
        },
      ]
    }
  },
  {
    id: 'signature-area',
    name: '签章区域',
    icon: 'FileSignature',
    category: 'bank',
    defaultProps: {
      x: 0,
      y: 0,
      width: 200,
      height: 80,
    },
    template: {
      type: 'group',
      children: [
        {
          type: 'text',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 24,
            text: '电子签章',
            fontSize: 12,
            textAlign: 'center',
            color: '#666666',
          }
        },
        {
          type: 'rectangle',
          props: {
            x: 0,
            y: 30,
            width: 200,
            height: 50,
            backgroundColor: 'transparent',
            borderColor: '#cccccc',
            borderWidth: 1,
          }
        }
      ]
    }
  }
]

export const allComponents = [...basicComponents, ...bankComponents]

// Helper function to get component by id
export const getComponentById = (id: string): ComponentDefinition | undefined => {
  return allComponents.find(comp => comp.id === id)
}

// Helper function to get components by category
export const getComponentsByCategory = (category: string): ComponentDefinition[] => {
  return allComponents.filter(comp => comp.category === category)
}

// Component categories for UI grouping
export const componentCategories = [
  { id: 'basic', name: '基础组件', icon: 'Layers' },
  { id: 'data', name: '数据组件', icon: 'Database' },
  { id: 'bank', name: '银行组件', icon: 'Building' },
]