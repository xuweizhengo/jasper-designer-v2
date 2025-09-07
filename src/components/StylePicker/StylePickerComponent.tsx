/**
 * StylePickerComponent - 专业文字样式选择器
 * 
 * 核心功能：
 * - 按分类显示样式库
 * - 样式预览和快速应用
 * - 样式搜索和过滤
 * - 新建和编辑样式
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { textStyleManager } from '../../utils/text-style-manager';
import type { 
  TextStyleDefinition, 
  StyleCategory 
} from '../../types/professional-text-types';

interface StylePickerProps {
  selectedStyleId?: string | null;
  onStyleSelect: (styleId: string) => void;
  onStyleCreate: () => void;
  onStyleEdit: (styleId: string) => void;
}

const StylePickerComponent: Component<StylePickerProps> = (props) => {
  const [selectedCategory, setSelectedCategory] = createSignal<StyleCategory>('bank-special');
  const [searchTerm, setSearchTerm] = createSignal('');
  const [availableStyles, setAvailableStyles] = createSignal<TextStyleDefinition[]>([]);

  // 加载样式列表
  const loadStyles = async () => {
    await textStyleManager.initialize();
    const styles = textStyleManager.getStylesByCategory();
    setAvailableStyles(styles);
  };

  // 初始化加载
  loadStyles();

  // 过滤后的样式列表
  const filteredStyles = createMemo(() => {
    let styles = availableStyles();
    
    // 分类过滤
    if (selectedCategory()) {
      styles = styles.filter(style => style.category === selectedCategory());
    }
    
    // 搜索过滤
    const search = searchTerm().toLowerCase().trim();
    if (search) {
      styles = styles.filter(style => 
        style.name.toLowerCase().includes(search) ||
        style.description.toLowerCase().includes(search) ||
        style.metadata.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    return styles;
  });

  // 分类按钮数据
  const categories = [
    { key: 'bank-special', label: '银行专用', icon: '🏦' },
    { key: 'heading', label: '标题', icon: '📰' },
    { key: 'body', label: '正文', icon: '📝' },
    { key: 'caption', label: '说明', icon: '💬' },
    { key: 'custom', label: '自定义', icon: '⚙️' }
  ];

  const handleStyleSelect = (styleId: string) => {
    console.log('🎯 选择样式:', styleId);
    props.onStyleSelect(styleId);
  };

  const handleCategoryChange = (category: StyleCategory) => {
    setSelectedCategory(category);
    console.log('📂 切换分类:', category);
  };

  return (
    <div class="style-picker-container">
      {/* 分类导航 */}
      <div class="style-categories">
        <For each={categories}>
          {(category) => (
            <button
              class={`category-button ${selectedCategory() === category.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.key as StyleCategory)}
              title={category.label}
            >
              <span class="category-icon">{category.icon}</span>
              <span class="category-label">{category.label}</span>
            </button>
          )}
        </For>
      </div>

      {/* 搜索框 */}
      <div class="style-search">
        <div class="search-input-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索样式..."
            class="search-input"
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.target.value)}
          />
          <Show when={searchTerm()}>
            <button
              class="search-clear"
              onClick={() => setSearchTerm('')}
              title="清除搜索"
            >
              ✕
            </button>
          </Show>
        </div>
      </div>

      {/* 样式网格 */}
      <div class="style-grid">
        <For each={filteredStyles()}>
          {(style) => (
            <StyleCard
              style={style}
              selected={props.selectedStyleId === style.id}
              onClick={() => handleStyleSelect(style.id)}
              onEdit={() => props.onStyleEdit(style.id)}
            />
          )}
        </For>

        {/* 新建样式卡片 */}
        <div class="style-card create-style-card" onClick={props.onStyleCreate}>
          <div class="create-style-content">
            <div class="create-style-icon">➕</div>
            <div class="create-style-label">新建样式</div>
          </div>
        </div>
      </div>

      {/* 样式统计信息 */}
      <div class="style-stats">
        <span class="stats-text">
          {filteredStyles().length} 个样式
          {searchTerm() && ` (搜索: "${searchTerm()}")`}
        </span>
      </div>
    </div>
  );
};

/**
 * 样式卡片组件
 */
interface StyleCardProps {
  style: TextStyleDefinition;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const StyleCard: Component<StyleCardProps> = (props) => {
  const previewText = () => {
    switch (props.style.category) {
      case 'bank-special':
        if (props.style.id.includes('amount')) return '¥123,456.78';
        if (props.style.id.includes('account')) return '6222 0012 3456 7890';
        if (props.style.id.includes('institution')) return props.style.name;
        if (props.style.id.includes('date')) return '2025-08-19';
        return props.style.name;
      case 'heading': return props.style.name;
      case 'body': return '正文示例文字 Abc';
      case 'caption': return '说明文字';
      default: return props.style.name;
    }
  };

  const stylePreview = createMemo(() => {
    const style = props.style.style;
    return {
      fontFamily: style.font_family,
      fontSize: `${Math.min(style.font_size, 14)}px`, // 限制预览大小
      fontWeight: style.font_weight,
      color: style.fills?.[0]?.solid?.color || style.color,
      textAlign: style.align.toLowerCase() as any,
      letterSpacing: `${style.typography?.letterSpacing || 0}px`,
      textDecoration: 
        style.typography?.decoration?.underline ? 'underline' :
        style.typography?.decoration?.strikethrough ? 'line-through' : 'none'
    };
  });

  const handleCardClick = (e: MouseEvent) => {
    e.preventDefault();
    props.onClick();
  };

  const handleEditClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onEdit();
  };

  return (
    <div 
      class={`style-card ${props.selected ? 'selected' : ''} ${props.style.metadata.isSystemStyle ? 'system-style' : 'user-style'}`}
      onClick={handleCardClick}
    >
      {/* 样式预览区域 */}
      <div class="style-preview" style={stylePreview()}>
        {previewText()}
      </div>

      {/* 样式信息 */}
      <div class="style-info">
        <div class="style-name">{props.style.name}</div>
        <div class="style-meta">
          <span class="style-category">{getCategoryLabel(props.style.category)}</span>
          {props.style.metadata.usageCount > 0 && (
            <span class="usage-count" title={`使用次数: ${props.style.metadata.usageCount}`}>
              {props.style.metadata.usageCount}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div class="style-actions">
        {!props.style.metadata.isSystemStyle && (
          <button
            class="edit-button"
            onClick={handleEditClick}
            title="编辑样式"
          >
            ✏️
          </button>
        )}
        {props.style.metadata.isSystemStyle && (
          <span class="system-badge" title="系统预设样式">🔒</span>
        )}
      </div>

      {/* 选中指示器 */}
      {props.selected && (
        <div class="selection-indicator">✓</div>
      )}
    </div>
  );
};

/**
 * 获取分类标签
 */
function getCategoryLabel(category: StyleCategory): string {
  const labels: Record<StyleCategory, string> = {
    'bank-special': '银行',
    'heading': '标题',
    'body': '正文', 
    'caption': '说明',
    'custom': '自定义'
  };
  return labels[category] || category;
}

export default StylePickerComponent;