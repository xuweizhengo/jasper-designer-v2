import { Component } from 'solid-js';
import PreviewViewport from '../PreviewMode/PreviewViewport';
import { useAppContext } from '../../stores/AppContext';

/**
 * 预览渲染器组件
 * 使用 Konva.js 提供快速的客户端预览
 */
export const PreviewRenderer: Component = () => {
  const { state } = useAppContext();
  
  
  return (
    <div class="preview-renderer w-full h-full relative">
      <PreviewViewport 
        elements={[...state.elements]}
        pageSize={{ width: 794, height: 1123 }} // A4 size at 96 DPI
        pageCount={1}
      />
    </div>
  );
};

export default PreviewRenderer;