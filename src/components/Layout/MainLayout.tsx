import { Component } from 'solid-js';
// import { useAppContext } from '../../stores/AppContext'; // Reserved for future use
import Toolbar from '../Toolbar/Toolbar';
import ComponentLibrary from '../Panels/ComponentLibrary';
import PropertiesPanel from '../Panels/PropertiesPanel';
import CanvasWithInteraction from '../Canvas/CanvasWithInteraction'; // 使用新的交互系统Canvas
import TestPanel from '../Debug/TestPanel';

const MainLayout: Component = () => {
  // const { state } = useAppContext(); // Reserved for future state usage

  return (
    <div class="h-full flex flex-col bg-secondary">
      {/* Top Toolbar */}
      <Toolbar />
      
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
        
        {/* Right Panel - Properties */}
        <div class="w-80 bg-primary border-l border-default flex flex-col">
          <PropertiesPanel />
        </div>
      </div>
      
      {/* Debug Test Panel */}
      <TestPanel />
    </div>
  );
};

export default MainLayout;