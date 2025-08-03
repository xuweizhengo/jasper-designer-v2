import React from 'react'
import { 
  File, Save, Eye, Undo, Redo, ZoomIn, Grid, Ruler,
  Layers, Database, FileText, Move, Palette, Settings
} from 'lucide-react'
import Button from '../UI/Button'
import Tabs from '../UI/Tabs'
import Panel, { PropertyGroup } from '../UI/Panel'
import Input from '../UI/Input'
import Select from '../UI/Select'
import ColorPicker from '../UI/ColorPicker'

const MainLayout: React.FC = () => {
  const leftPanelTabs = [
    {
      id: 'components',
      label: '组件库',
      icon: Layers,
      content: <ComponentLibraryPanel />
    },
    {
      id: 'data',
      label: '数据',
      icon: Database,
      content: <DataPanel />
    },
    {
      id: 'templates',
      label: '模板',
      icon: FileText,
      content: <TemplatesPanel />
    }
  ]
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <Toolbar />
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Tabs 
            items={leftPanelTabs}
            defaultActiveTab="components"
            variant="underline"
            className="h-full flex flex-col"
          />
        </div>
        
        {/* 画布区域 */}
        <div className="flex-1 flex flex-col">
          <CanvasArea />
        </div>
        
        {/* 右侧属性面板 */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  )
}

// 顶部工具栏组件
const Toolbar: React.FC = () => {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* 左侧：文件操作 */}
      <div className="flex items-center gap-2">
        <Button variant="primary" icon={File} size="sm">
          新建
        </Button>
        <Button variant="secondary" icon={Save} size="sm">
          保存
        </Button>
        <Button variant="secondary" icon={Eye} size="sm">
          预览
        </Button>
      </div>
      
      {/* 中间：编辑操作 */}
      <div className="flex items-center gap-2">
        <Button variant="icon" icon={Undo} size="sm" />
        <Button variant="icon" icon={Redo} size="sm" disabled />
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Select
          value="100%"
          options={[
            { value: '50%', label: '50%' },
            { value: '75%', label: '75%' },
            { value: '100%', label: '100%' },
            { value: '125%', label: '125%' },
            { value: '150%', label: '150%' },
            { value: 'fit', label: '适应屏幕' }
          ]}
          className="w-24"
        />
        
        <Button variant="icon" icon={Grid} size="sm" />
        <Button variant="icon" icon={Ruler} size="sm" />
      </div>
      
      {/* 右侧：用户区域 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      </div>
    </div>
  )
}

// 组件库面板
const ComponentLibraryPanel: React.FC = () => {
  const basicComponents = [
    { id: 'text', name: '文字', icon: '📄' },
    { id: 'label', name: '标签', icon: '📝' },
    { id: 'field', name: '字段', icon: '💾' },
    { id: 'image', name: '图片', icon: '📷' },
    { id: 'line', name: '线条', icon: '➖' },
    { id: 'rectangle', name: '矩形', icon: '▭' },
  ]
  
  const bankComponents = [
    { id: 'bank-header', name: '银行抬头', icon: '🏦' },
    { id: 'amount-field', name: '金额显示', icon: '💰' },
    { id: 'info-table', name: '信息表格', icon: '📋' },
    { id: 'signature', name: '签章区域', icon: '✍️' },
  ]
  
  return (
    <div className="p-4 space-y-4">
      <Input
        type="search"
        placeholder="搜索组件..."
        className="mb-4"
      />
      
      <Panel title="基础组件" collapsible defaultCollapsed={false}>
        <div className="grid grid-cols-2 gap-2">
          {basicComponents.map((component) => (
            <ComponentItem 
              key={component.id}
              icon={component.icon}
              name={component.name}
            />
          ))}
        </div>
      </Panel>
      
      <Panel title="银行组件" collapsible defaultCollapsed={false}>
        <div className="grid grid-cols-2 gap-2">
          {bankComponents.map((component) => (
            <ComponentItem 
              key={component.id}
              icon={component.icon}
              name={component.name}
            />
          ))}
        </div>
      </Panel>
    </div>
  )
}

// 组件项组件
const ComponentItem: React.FC<{ icon: string; name: string }> = ({ icon, name }) => {
  return (
    <div className="component-item p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-all">
      <div className="text-center">
        <div className="text-xl mb-1">{icon}</div>
        <div className="text-xs font-medium text-gray-700">{name}</div>
      </div>
    </div>
  )
}

// 数据面板
const DataPanel: React.FC = () => {
  const bankInfo = [
    { field: 'bankName', label: '银行名称', value: '中国工商银行' },
    { field: 'bankCode', label: '机构号', value: '102100024506' },
    { field: 'branchName', label: '开户行', value: '北京分行营业部' },
  ]
  
  const customerInfo = [
    { field: 'customerName', label: '客户姓名', value: '张三' },
    { field: 'accountNumber', label: '账户号码', value: '6222024200012345678' },
  ]
  
  const transactionInfo = [
    { field: 'amount', label: '交易金额', value: '¥1,280.50' },
    { field: 'transactionTime', label: '交易时间', value: '2024-01-15 14:30:25' },
    { field: 'transactionType', label: '交易类型', value: '网银转账' },
    { field: 'serialNumber', label: '流水号', value: '20240115001122334' },
  ]
  
  return (
    <div className="p-4 space-y-4">
      <Panel title="🏦 银行信息" collapsible defaultCollapsed={false}>
        <div className="space-y-2">
          {bankInfo.map((item) => (
            <DataField key={item.field} {...item} />
          ))}
        </div>
      </Panel>
      
      <Panel title="👤 客户信息" collapsible defaultCollapsed={false}>
        <div className="space-y-2">
          {customerInfo.map((item) => (
            <DataField key={item.field} {...item} />
          ))}
        </div>
      </Panel>
      
      <Panel title="💰 交易信息" collapsible defaultCollapsed={false}>
        <div className="space-y-2">
          {transactionInfo.map((item) => (
            <DataField key={item.field} {...item} />
          ))}
        </div>
      </Panel>
    </div>
  )
}

// 数据字段组件
const DataField: React.FC<{ field: string; label: string; value: string }> = ({ 
  field, label, value 
}) => {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-grab">
      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{label}</div>
        <div className="text-xs text-gray-500 truncate">{value}</div>
      </div>
    </div>
  )
}

// 模板面板
const TemplatesPanel: React.FC = () => {
  const templates = [
    { id: 'blank', name: '空白模板', preview: '📄' },
    { id: 'standard', name: '标准回单', preview: '🏦' },
    { id: 'detailed', name: '详细回单', preview: '📊' },
  ]
  
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 cursor-pointer">
            <div className="text-center mb-2">
              <div className="text-3xl mb-2">{template.preview}</div>
              <div className="text-sm font-medium text-gray-900">{template.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 画布区域
const CanvasArea: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-100 p-4">
      <div className="h-full flex items-center justify-center">
        {/* 标尺区域 */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* 水平标尺 */}
          <div className="h-5 bg-gray-50 border-b border-gray-200 flex">
            <div className="w-5 bg-gray-100 border-r border-gray-200" />
            <div className="flex-1 relative">
              {/* 标尺刻度 */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 60 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-300 last:border-r-0" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex">
            {/* 垂直标尺 */}
            <div className="w-5 bg-gray-50 border-r border-gray-200">
              <div className="h-96 relative">
                {/* 标尺刻度 */}
                <div className="absolute inset-0 flex flex-col">
                  {Array.from({ length: 40 }, (_, i) => (
                    <div key={i} className="flex-1 border-b border-gray-300 last:border-b-0" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* 画布区域 */}
            <div className="canvas-container bg-white w-96 h-96 relative">
              {/* 网格背景 */}
              <div className="absolute inset-0 canvas-grid opacity-50" />
              
              {/* A4纸张示意 */}
              <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded">
                <div className="p-4 text-center text-gray-500 text-sm">
                  拖拽组件到此处开始设计
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 属性面板
const PropertiesPanel: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-500 text-center py-8">
        选择元素以查看属性
      </div>
      
      {/* 当选中元素时显示的属性 */}
      <div className="hidden">
        <PropertyGroup title="位置大小" icon={Move}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="X" type="number" value="120" unit="px" />
            <Input label="Y" type="number" value="50" unit="px" />
            <Input label="宽" type="number" value="200" unit="px" />
            <Input label="高" type="number" value="30" unit="px" />
          </div>
        </PropertyGroup>
        
        <PropertyGroup title="外观样式" icon={Palette}>
          <div className="space-y-3">
            <Select
              label="字体"
              value="宋体"
              options={[
                { value: '宋体', label: '宋体' },
                { value: '黑体', label: '黑体' },
                { value: '微软雅黑', label: '微软雅黑' },
                { value: 'Arial', label: 'Arial' },
              ]}
            />
            <Input label="大小" type="number" value="14" unit="px" />
            <ColorPicker label="颜色" value="#000000" />
            <Select
              label="对齐"
              value="left"
              options={[
                { value: 'left', label: '左对齐' },
                { value: 'center', label: '居中' },
                { value: 'right', label: '右对齐' },
              ]}
            />
          </div>
        </PropertyGroup>
        
        <PropertyGroup title="数据绑定" icon={Database}>
          <div className="space-y-3">
            <Select
              label="字段"
              value=""
              placeholder="选择字段..."
              options={[
                { value: 'customerName', label: '客户姓名' },
                { value: 'amount', label: '交易金额' },
                { value: 'transactionTime', label: '交易时间' },
              ]}
            />
            <Select
              label="格式"
              value="default"
              options={[
                { value: 'default', label: '原样显示' },
                { value: 'currency', label: '货币格式' },
                { value: 'date', label: '日期格式' },
              ]}
            />
          </div>
        </PropertyGroup>
      </div>
    </div>
  )
}

export default MainLayout