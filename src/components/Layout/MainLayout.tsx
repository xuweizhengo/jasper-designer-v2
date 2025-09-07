import { Component, createSignal } from 'solid-js';
// import { useAppContext } from '../../stores/AppContext'; // Reserved for future use
import { PreviewProvider } from '../../stores/PreviewModeContext';
import Toolbar from '../Toolbar/Toolbar';
import ComponentLibrary from '../Panels/ComponentLibrary';
import PropertiesPanel from '../Panels/PropertiesPanel';
import CanvasWithInteraction from '../Canvas/CanvasWithInteraction'; // 使用新的交互系统Canvas
// import TestPanel from '../Debug/TestPanel'; // 移除测试面板
import { DataSourcesPanel } from '../Panels/DataSourcesPanel';
import DataContextPanel from '../DataContext/DataContextPanel';
import { DataSourceManagementCenter } from '../DataSourceManagement/DataSourceManagementCenter';

const MainLayout: Component = () => {
  // const { state } = useAppContext(); // Reserved for future state usage
  
  // Data source panel state management (保留旧面板作为快速访问)
  const [isDataSourcesOpen, setIsDataSourcesOpen] = createSignal(false);
  
  // Data source management center state management
  const [isManagementCenterOpen, setIsManagementCenterOpen] = createSignal(false);
  
  // 调试：监听状态变化
  console.log('🖥️  MainLayout渲染，管理中心状态:', isManagementCenterOpen());
  
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
    <PreviewProvider>
      <div class="h-full flex flex-col bg-secondary">
        {/* Top Toolbar */}
        <Toolbar 
          onOpenDataSources={handleOpenDataSources}
        />
        
        {/* Main Content Area */}
        <div class="flex-1 flex overflow-hidden">
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
    </PreviewProvider>
  );
};

export default MainLayout;