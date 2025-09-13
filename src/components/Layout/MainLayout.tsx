import { Component, createSignal, Switch, Match } from 'solid-js';
// import { useAppContext } from '../../stores/AppContext'; // Reserved for future use
import { PreviewProvider, usePreview } from '../../stores/PreviewModeContext';
import Toolbar from '../Toolbar/Toolbar';
import ComponentLibrary from '../Panels/ComponentLibrary';
import PropertiesPanel from '../Panels/PropertiesPanel';
import CanvasWithInteraction from '../Canvas/CanvasWithInteraction'; // 使用新的交互系统Canvas
import PreviewRenderer from '../Preview/PreviewRenderer'; // 导入预览渲染器
// import TestPanel from '../Debug/TestPanel'; // 移除测试面板
import { DataSourcesPanel } from '../Panels/DataSourcesPanel';
import DataContextPanel from '../DataContext/DataContextPanel';
import { DataSourceManagementCenter } from '../DataSourceManagement/DataSourceManagementCenter';

// 内部布局组件，可以访问 PreviewContext
const MainLayoutContent: Component = () => {
  const { state: previewState } = usePreview();
  
  // Data source panel state management (保留旧面板作为快速访问)
  const [isDataSourcesOpen, setIsDataSourcesOpen] = createSignal(false);
  
  // Data source management center state management
  const [isManagementCenterOpen, setIsManagementCenterOpen] = createSignal(false);
  
  // 调试：监听状态变化
  console.log('🖥️  MainLayout渲染，当前模式:', previewState().mode);
  
  const handleOpenDataSources = () => {
    console.log('🔄 数据源按钮被点击，准备打开管理中心');
    console.log('📊 当前管理中心状态:', isManagementCenterOpen());
    // 现在打开管理中心而不是旧面板
    setIsManagementCenterOpen(true);
    console.log('✅ 管理中心状态已设置为 true');
    console.log('📊 设置后的管理中心状态:', isManagementCenterOpen());
  };
  
  const handleCloseDataSources = () => setIsDataSourcesOpen(false);
  const handleCloseManagementCenter = () => setIsManagementCenterOpen(false);

  return (
    <div class="h-full flex flex-col bg-secondary">
      {/* Top Toolbar */}
      <Toolbar 
        onOpenDataSources={handleOpenDataSources}
      />
      
      {/* Main Content Area - 根据模式切换 */}
      <div class="flex-1 flex overflow-hidden">
        <Switch>
          {/* 预览模式 - 全屏预览渲染器 */}
          <Match when={previewState().mode === 'preview'}>
            <div class="flex-1">
              <PreviewRenderer />
            </div>
          </Match>
          
          {/* 设计模式 - 显示所有面板 */}
          <Match when={previewState().mode === 'design'}>
            {/* Left Panel - Component Library */}
            <div class="w-80 bg-primary border-r border-default flex flex-col">
              <ComponentLibrary />
            </div>
            
            {/* Center Panel - Canvas */}
            <div class="flex-1 flex flex-col bg-tertiary">
              <CanvasWithInteraction />
            </div>
            
            {/* Right Panel - Properties and Data Context */}
            <div class="w-80 bg-primary border-l border-default flex flex-col">
              <div class="flex-1 overflow-y-auto custom-scrollbar">
                {/* 属性面板 */}
                <div class="min-h-fit">
                  <PropertiesPanel />
                </div>
                
                {/* 数据上下文面板 */}
                <div class="border-t border-default min-h-fit">
                  <DataContextPanel />
                </div>
              </div>
            </div>
          </Match>
          
          {/* 数据模式 - 显示数据绑定界面 */}
          <Match when={previewState().mode === 'data'}>
            {/* 保持设计模式布局，但突出显示数据面板 */}
            <div class="w-80 bg-primary border-r border-default flex flex-col">
              <ComponentLibrary />
            </div>
            
            <div class="flex-1 flex flex-col bg-tertiary">
              <CanvasWithInteraction />
            </div>
            
            <div class="w-80 bg-primary border-l border-default flex flex-col">
              <div class="flex-1 overflow-y-auto custom-scrollbar">
                {/* 数据上下文面板优先显示 */}
                <div class="border-b border-default min-h-fit">
                  <DataContextPanel />
                </div>
                
                {/* 属性面板 */}
                <div class="min-h-fit">
                  <PropertiesPanel />
                </div>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
      
      {/* 移除 Debug Test Panel 避免遮挡属性面板 */}
      
      {/* Data Source Management Center - 新的管理中心 */}
      <DataSourceManagementCenter
        isOpen={isManagementCenterOpen()}
        onClose={handleCloseManagementCenter}
      />
      
      {/* Data Sources Panel - 保留旧版本作为快速访问 (当前未使用) */}
      <DataSourcesPanel 
        isOpen={isDataSourcesOpen()} 
        onClose={handleCloseDataSources} 
      />
    </div>
  );
};

// 主布局组件 - 提供 PreviewProvider
const MainLayout: Component = () => {
  return (
    <PreviewProvider>
      <MainLayoutContent />
    </PreviewProvider>
  );
};

export default MainLayout;