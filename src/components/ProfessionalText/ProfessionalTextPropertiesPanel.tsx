/**
 * ProfessionalTextPropertiesPanel - 专业排版系统属性面板
 * 
 * 集成到现有的PropertiesPanel中，为Text和DataField元素
 * 提供专业的文字样式选择和排版控制功能
 */

import { Component, createSignal, createMemo, Show, onMount } from 'solid-js';
import { textStyleManager } from '../../utils/text-style-manager';
import { professionalTextRenderer } from '../../utils/professional-text-renderer';
import StylePickerComponent from '../StylePicker/StylePickerComponent';
import type { 
  TextStyleDefinition, 
  ProfessionalTextStyle 
} from '../../types/professional-text-types';
import type { ReportElement } from '../../types';

interface ProfessionalTextPropertiesProps {
  element: ReportElement;
  onUpdate: (elementId: string, property: string, value: any) => void;
}

const ProfessionalTextPropertiesPanel: Component<ProfessionalTextPropertiesProps> = (props) => {
  const [currentStyleId, setCurrentStyleId] = createSignal<string | null>(null);
  const [showStylePicker, setShowStylePicker] = createSignal(false);
  const [availableStyles, setAvailableStyles] = createSignal<TextStyleDefinition[]>([]);
  const [initialized, setInitialized] = createSignal(false);

  // 初始化
  onMount(async () => {
    try {
      await textStyleManager.initialize();
      
      // 获取元素当前使用的样式ID
      const styleId = textStyleManager.getElementStyleId(props.element.id);
      setCurrentStyleId(styleId);
      
      // 加载可用样式
      const styles = textStyleManager.getStylesByCategory();
      setAvailableStyles(styles);
      
      setInitialized(true);
      console.log('🎨 ProfessionalTextPropertiesPanel 初始化完成');
    } catch (error) {
      console.error('❌ 专业文字属性面板初始化失败:', error);
    }
  });

  // 当前使用的样式定义
  const currentStyleDefinition = createMemo(() => {
    const styleId = currentStyleId();
    return styleId ? textStyleManager.getStyle(styleId) : null;
  });

  // 是否为文字类型元素
  const isTextElement = createMemo(() => {
    return props.element.content.type === 'Text' || props.element.content.type === 'DataField';
  });

  // 处理样式选择
  const handleStyleSelect = async (styleId: string) => {
    try {
      const result = await textStyleManager.applyStyleToElement(props.element.id, styleId);
      
      if (result.success) {
        setCurrentStyleId(styleId);
        
        // 获取样式定义并更新元素
        const styleDefinition = textStyleManager.getStyle(styleId);
        if (styleDefinition) {
          // 将专业样式转换为兼容格式并更新元素
          const compatibleStyle = convertToCompatibleStyle(styleDefinition.style);
          props.onUpdate(props.element.id, 'content', {
            ...props.element.content,
            style: compatibleStyle
          });
        }
        
        console.log('✅ 样式应用成功:', result);
      } else {
        console.error('❌ 样式应用失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 样式选择处理失败:', error);
    }
  };

// 转换专业样式为兼容格式
const convertToCompatibleStyle = (professionalStyle: ProfessionalTextStyle) => {
    // 将新的专业样式格式转换为现有的TextStyle格式
    return {
      font_family: professionalStyle.font_family,
      font_size: professionalStyle.font_size,
      font_weight: professionalStyle.font_weight,
      color: professionalStyle.fills?.[0]?.solid?.color || professionalStyle.color,
      align: professionalStyle.align
    };
  };

  // 处理样式创建
  const handleStyleCreate = () => {
    console.log('🆕 创建新样式');
    // TODO: 打开样式编辑器
  };

  // 处理样式编辑
  const handleStyleEdit = (styleId: string) => {
    console.log('✏️ 编辑样式:', styleId);
    // TODO: 打开样式编辑器
  };

  // 切换样式选择器显示
  const toggleStylePicker = () => {
    setShowStylePicker(!showStylePicker());
  };

  // 移除样式
  const handleRemoveStyle = () => {
    if (currentStyleId()) {
      textStyleManager.removeElementStyle(props.element.id);
      setCurrentStyleId(null);
      console.log('🗑️ 移除元素样式');
    }
  };

  // 如果不是文字元素，不显示面板
  if (!isTextElement()) {
    return null;
  }

  return (
    <div class="professional-text-properties">
      {/* 样式系统控制区 */}
      <div class="property-group">
        <div class="property-group-title">
          <span>🎨</span>
          <span>专业文字样式</span>
          <div class="property-group-actions">
            <Show when={initialized()}>
              <button
                class="style-picker-toggle"
                onClick={toggleStylePicker}
                title={showStylePicker() ? '隐藏样式库' : '显示样式库'}
              >
                {showStylePicker() ? '📝' : '📚'}
              </button>
            </Show>
            <Show when={!initialized()}>
              <button
                class="style-reload-btn"
                onClick={() => window.location.reload()}
                title="重新加载样式系统"
              >
                🔄
              </button>
            </Show>
          </div>
        </div>
        
        <div class="property-group-content">
          {/* 🎯 初始化状态处理 - 降级显示 */}
          <Show when={!initialized()}>
            <div class="initialization-fallback">
              <div class="fallback-content">
                <span class="fallback-icon">⏳</span>
                <span class="fallback-text">专业样式系统加载中...</span>
                <div class="fallback-actions">
                  <button 
                    class="retry-btn"
                    onClick={async () => {
                      try {
                        await textStyleManager.initialize();
                        const styles = textStyleManager.getStylesByCategory();
                        setAvailableStyles(styles);
                        setInitialized(true);
                        console.log('🔄 样式系统重新初始化成功');
                      } catch (error) {
                        console.error('❌ 重新初始化失败:', error);
                      }
                    }}
                  >
                    重试加载
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* ✅ 正常功能显示 */}
          <Show when={initialized()}>
            {/* 当前样式显示 */}
            <Show when={currentStyleDefinition()}>
              {(styleDef) => (
                <div class="current-style-info">
                  <div class="current-style-preview">
                    <div class="style-preview-badge">
                      <span class="style-name">{styleDef().name}</span>
                      <span class="style-category">
                        {getCategoryLabel(styleDef().category)}
                      </span>
                    </div>
                    <div class="style-actions">
                      <button
                        class="style-action-btn edit-btn"
                        onClick={() => handleStyleEdit(styleDef().id)}
                        title="编辑样式"
                      >
                        ✏️
                      </button>
                      <button
                        class="style-action-btn remove-btn"
                        onClick={handleRemoveStyle}
                        title="移除样式"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Show>
            
            {/* 快速样式选择按钮 */}
            <Show when={!currentStyleDefinition()}>
              <div class="quick-style-actions">
                <button
                  class="apply-style-btn"
                  onClick={toggleStylePicker}
                >
                  <span class="btn-icon">🎨</span>
                  <span class="btn-text">选择样式</span>
                </button>
                
                <button
                  class="create-style-btn"
                  onClick={handleStyleCreate}
                  title="基于当前设置创建新样式"
                >
                  <span class="btn-icon">➕</span>
                  <span class="btn-text">新建</span>
                </button>
              </div>
            </Show>

            {/* 样式库面板 */}
            <Show when={showStylePicker()}>
              <div class="style-picker-panel">
                <StylePickerComponent
                  selectedStyleId={currentStyleId()}
                  onStyleSelect={handleStyleSelect}
                  onStyleCreate={handleStyleCreate}
                  onStyleEdit={handleStyleEdit}
                />
              </div>
            </Show>
          </Show>
        </div>
      </div>

      {/* Phase 2.2 预留: 高级排版控制面板 */}
      <Show when={currentStyleDefinition()}>
        <div class="property-group">
          <div class="property-group-title">
            <span>📐</span>
            <span>排版控制</span>
            <div class="coming-soon-badge">即将推出</div>
          </div>
          <div class="property-group-content">
            <div class="typography-controls-placeholder">
              <div class="placeholder-content">
                <span class="placeholder-icon">⚙️</span>
                <span class="placeholder-text">高级排版控制功能</span>
                <span class="placeholder-subtitle">字间距、行高、装饰等</span>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Phase 2.3 预留: 视觉效果面板 */}
      <Show when={currentStyleDefinition()}>
        <div class="property-group">
          <div class="property-group-title">
            <span>✨</span>
            <span>视觉效果</span>
            <div class="coming-soon-badge">即将推出</div>
          </div>
          <div class="property-group-content">
            <div class="effects-controls-placeholder">
              <div class="placeholder-content">
                <span class="placeholder-icon">🌈</span>
                <span class="placeholder-text">多重填充 & 阴影效果</span>
                <span class="placeholder-subtitle">渐变、投影、发光等</span>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* 调试信息 (开发环境) */}
      <Show when={process.env['NODE_ENV'] === 'development'}>
        <div class="property-group debug-panel">
          <div class="property-group-title">
            <span>🔧</span>
            <span>调试信息</span>
          </div>
          <div class="property-group-content">
            <div class="debug-info">
              <div class="debug-item">
                <span class="debug-label">元素ID:</span>
                <span class="debug-value">{props.element.id}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">当前样式ID:</span>
                <span class="debug-value">{currentStyleId() || '无'}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">可用样式:</span>
                <span class="debug-value">{availableStyles().length} 个</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">使用专业渲染:</span>
                <span class="debug-value">
                  {professionalTextRenderer.isElementUsingProfessionalStyle(props.element.id) ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

/**
 * 获取分类标签
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'bank-special': '银行',
    'heading': '标题',
    'body': '正文', 
    'caption': '说明',
    'custom': '自定义'
  };
  return labels[category] || category;
}

export default ProfessionalTextPropertiesPanel;