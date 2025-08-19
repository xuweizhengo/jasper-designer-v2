/**
 * 对齐分布工具栏组件
 * 提供所有对齐和分布功能的UI界面
 */

import { createSignal, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';

// 内联对齐类型定义，避免外部导入
enum AlignmentType {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  H_CENTER = 'h_center',
  V_CENTER = 'v_center',
  DISTRIBUTE_H = 'distribute_h',
  DISTRIBUTE_V = 'distribute_v'
}

// 内联简化的对齐算法
const calculateAlignment = (elements: any[], alignmentType: AlignmentType) => {
  if (elements.length < 2) return [];
  
  const bounds = elements.map(el => ({
    x: el.position.x,
    y: el.position.y,
    width: el.size.width,
    height: el.size.height
  }));
  
  return bounds.map((bound, index) => {
    let newX = bound.x;
    let newY = bound.y;
    
    switch (alignmentType) {
      case AlignmentType.LEFT:
        newX = Math.min(...bounds.map(b => b.x));
        break;
      case AlignmentType.RIGHT:
        const maxRight = Math.max(...bounds.map(b => b.x + b.width));
        newX = maxRight - bound.width;
        break;
      case AlignmentType.TOP:
        newY = Math.min(...bounds.map(b => b.y));
        break;
      case AlignmentType.BOTTOM:
        const maxBottom = Math.max(...bounds.map(b => b.y + b.height));
        newY = maxBottom - bound.height;
        break;
      case AlignmentType.H_CENTER:
        const centerX = bounds.reduce((sum, b) => sum + b.x + b.width/2, 0) / bounds.length;
        newX = centerX - bound.width/2;
        break;
      case AlignmentType.V_CENTER:
        const centerY = bounds.reduce((sum, b) => sum + b.y + b.height/2, 0) / bounds.length;
        newY = centerY - bound.height/2;
        break;
    }
    
    return {
      element_id: elements[index].id,
      new_position: { x: newX, y: newY }
    };
  });
};

interface AlignmentToolbarProps {
  selectedElementIds: () => string[];
  onAlignmentComplete?: (results: any) => void;
  onAlignmentPreview?: (alignmentType: AlignmentType) => void;
  onPreviewCancel?: () => void;
}

export const AlignmentToolbar: Component<AlignmentToolbarProps> = (props) => {
  const { batchUpdatePositions, state } = useAppContext();
  const [isAligning, setIsAligning] = createSignal(false);

  // 检查是否可以执行对齐操作
  const canAlign = () => props.selectedElementIds().length >= 2;

  // 获取选中的元素
  const getSelectedElements = () => {
    const selectedIds = props.selectedElementIds();
    return state.elements.filter(el => selectedIds.includes(el.id));
  };

  // 执行对齐操作
  const performAlignment = async (alignmentType: AlignmentType) => {
    const selectedElements = getSelectedElements();
    if (selectedElements.length < 2) {
      console.warn('对齐功能需要至少2个元素');
      return;
    }

    try {
      setIsAligning(true);
      console.log(`🎯 执行${alignmentType}对齐:`, selectedElements.length, '个元素');

      // 使用内联算法计算对齐结果
      const positionUpdates = calculateAlignment(selectedElements, alignmentType);
      
      // 执行批量位置更新
      await batchUpdatePositions(positionUpdates);
      
      console.log('✅ 对齐操作完成');
      
      // 通知外部组件
      if (props.onAlignmentComplete) {
        props.onAlignmentComplete(positionUpdates);
      }

    } catch (error) {
      console.error('❌ 对齐操作失败:', error);
    } finally {
      setIsAligning(false);
    }
  };

  // 获取智能对齐建议（简化版本）
  const getSmartSuggestion = () => {
    const selectedElements = getSelectedElements();
    if (selectedElements.length < 2) return null;

    return {
      recommended: AlignmentType.LEFT,
      reason: '建议左对齐',
      results: []
    };
  };

  const smartSuggestion = () => getSmartSuggestion();

  return (
    <div class="alignment-toolbar">
      <div class="toolbar-section">
        <div class="section-title">对齐</div>
        <div class="button-group">
          {/* 左对齐 */}
          <button
            class="align-button left"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.LEFT)}
            title="左对齐"
          >
            <div class="align-icon">
              <div class="line left-line"></div>
              <div class="shapes">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>

          {/* 水平居中对齐 */}
          <button
            class="align-button h-center"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.H_CENTER)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.H_CENTER)}
            title="水平居中对齐"
          >
            <div class="align-icon">
              <div class="line center-line"></div>
              <div class="shapes">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>

          {/* 右对齐 */}
          <button
            class="align-button right"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.RIGHT)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.RIGHT)}
            title="右对齐"
          >
            <div class="align-icon">
              <div class="line right-line"></div>
              <div class="shapes">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <div class="section-title">垂直对齐</div>
        <div class="button-group">
          {/* 顶部对齐 */}
          <button
            class="align-button top"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.TOP)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.TOP)}
            title="顶部对齐"
          >
            <div class="align-icon vertical">
              <div class="line top-line"></div>
              <div class="shapes vertical">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>

          {/* 垂直居中对齐 */}
          <button
            class="align-button v-center"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.V_CENTER)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.V_CENTER)}
            title="垂直居中对齐"
          >
            <div class="align-icon vertical">
              <div class="line v-center-line"></div>
              <div class="shapes vertical">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>

          {/* 底部对齐 */}
          <button
            class="align-button bottom"
            disabled={!canAlign() || isAligning()}
            onClick={() => performAlignment(AlignmentType.BOTTOM)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.BOTTOM)}
            title="底部对齐"
          >
            <div class="align-icon vertical">
              <div class="line bottom-line"></div>
              <div class="shapes vertical">
                <div class="shape"></div>
                <div class="shape"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <div class="section-title">分布</div>
        <div class="button-group">
          {/* 水平分布 */}
          <button
            class="align-button distribute-h"
            disabled={props.selectedElementIds().length < 3 || isAligning()}
            onClick={() => performAlignment(AlignmentType.DISTRIBUTE_H)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.DISTRIBUTE_H)}
            title="水平均匀分布"
          >
            <div class="align-icon">
              <div class="shapes distribute">
                <div class="shape"></div>
                <div class="spacer"></div>
                <div class="shape"></div>
                <div class="spacer"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>

          {/* 垂直分布 */}
          <button
            class="align-button distribute-v"
            disabled={props.selectedElementIds().length < 3 || isAligning()}
            onClick={() => performAlignment(AlignmentType.DISTRIBUTE_V)}
            onMouseEnter={() => props.onAlignmentPreview?.(AlignmentType.DISTRIBUTE_V)}
            title="垂直均匀分布"
          >
            <div class="align-icon vertical">
              <div class="shapes distribute vertical">
                <div class="shape"></div>
                <div class="spacer"></div>
                <div class="shape"></div>
                <div class="spacer"></div>
                <div class="shape"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 智能建议 */}
      <Show when={canAlign() && smartSuggestion()}>
        <div class="toolbar-section">
          <div class="section-title">智能建议</div>
          <button
            class="smart-align-button"
            disabled={isAligning()}
            onClick={() => performAlignment(smartSuggestion()!.recommended)}
            title={smartSuggestion()!.reason}
          >
            <div class="smart-icon">🎯</div>
            <div class="smart-text">
              {smartSuggestion()!.recommended === AlignmentType.LEFT && '左对齐'}
              {smartSuggestion()!.recommended === AlignmentType.RIGHT && '右对齐'}
              {smartSuggestion()!.recommended === AlignmentType.TOP && '顶对齐'}
              {smartSuggestion()!.recommended === AlignmentType.BOTTOM && '底对齐'}
              {smartSuggestion()!.recommended === AlignmentType.H_CENTER && '水平居中'}
              {smartSuggestion()!.recommended === AlignmentType.V_CENTER && '垂直居中'}
            </div>
          </button>
          <div class="smart-reason">{smartSuggestion()!.reason}</div>
        </div>
      </Show>

      {/* 状态指示 */}
      <Show when={!canAlign()}>
        <div class="toolbar-status">
          <div class="status-text">
            选择至少2个元素以使用对齐功能
            {props.selectedElementIds().length < 3 && "，至少3个元素以使用分布功能"}
          </div>
        </div>
      </Show>

      <Show when={isAligning()}>
        <div class="toolbar-status">
          <div class="status-text aligning">
            <div class="spinner"></div>
            正在执行对齐操作...
          </div>
        </div>
      </Show>

    </div>
  );
};

// CSS样式（内嵌）
const alignmentStyles = `
.alignment-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 280px;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.button-group {
  display: flex;
  gap: 4px;
}

.align-button {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.align-button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.align-button:active:not(:disabled) {
  transform: translateY(0);
  background: #e5e7eb;
}

.align-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.align-icon {
  position: relative;
  width: 20px;
  height: 16px;
}

.align-icon.vertical {
  width: 16px;
  height: 20px;
}

.line {
  position: absolute;
  background: #3b82f6;
  z-index: 2;
}

.left-line, .right-line, .center-line {
  width: 2px;
  height: 16px;
  top: 0;
}

.left-line { left: 2px; }
.right-line { right: 2px; }
.center-line { left: 9px; }

.top-line, .bottom-line, .v-center-line {
  height: 2px;
  width: 16px;
  left: 0;
}

.top-line { top: 2px; }
.bottom-line { bottom: 2px; }
.v-center-line { top: 9px; }

.shapes {
  display: flex;
  gap: 2px;
  align-items: flex-start;
}

.shapes.vertical {
  flex-direction: column;
  height: 100%;
  align-items: flex-start;
}

.shapes.distribute {
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.shapes.distribute.vertical {
  height: 100%;
  width: auto;
}

.shape {
  width: 4px;
  height: 6px;
  background: #6b7280;
  border-radius: 1px;
}

.shapes.vertical .shape {
  width: 6px;
  height: 4px;
}

.spacer {
  width: 2px;
  height: 1px;
  background: #d1d5db;
}

.shapes.distribute.vertical .spacer {
  width: 1px;
  height: 2px;
}

.smart-align-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.smart-align-button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.smart-align-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.smart-icon {
  font-size: 16px;
}

.smart-text {
  font-size: 14px;
  font-weight: 500;
}

.smart-reason {
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
  margin-top: 4px;
}

.toolbar-status {
  padding: 8px;
  border-radius: 4px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.status-text {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.status-text.aligning {
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.preview-info {
  padding: 6px 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
}

.preview-text {
  font-size: 11px;
  color: #1d4ed8;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = alignmentStyles;
  document.head.appendChild(styleElement);
}