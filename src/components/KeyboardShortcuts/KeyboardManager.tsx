/**
 * 全局键盘快捷键管理器
 * 处理所有的键盘事件和快捷键操作
 */

import { onCleanup, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';

// 快捷键组合定义
interface KeyCombination {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

// 快捷键动作类型
type ShortcutAction = 
  | 'copy'
  | 'paste' 
  | 'cut'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'selectAll'
  | 'clearSelection'
  | 'duplicate'
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft' 
  | 'moveRight'
  | 'moveFastUp'
  | 'moveFastDown'
  | 'moveFastLeft'
  | 'moveFastRight';

// 快捷键配置
const SHORTCUT_CONFIG: Record<string, { action: ShortcutAction; combination: KeyCombination }> = {
  'copy': {
    action: 'copy',
    combination: { key: 'c', ctrl: true }
  },
  'paste': {
    action: 'paste', 
    combination: { key: 'v', ctrl: true }
  },
  'cut': {
    action: 'cut',
    combination: { key: 'x', ctrl: true }
  },
  'delete': {
    action: 'delete',
    combination: { key: 'Delete' }
  },
  'deleteAlt': {
    action: 'delete',
    combination: { key: 'Backspace' }
  },
  'undo': {
    action: 'undo',
    combination: { key: 'z', ctrl: true }
  },
  'redo': {
    action: 'redo',
    combination: { key: 'y', ctrl: true }
  },
  'redoAlt': {
    action: 'redo', 
    combination: { key: 'z', ctrl: true, shift: true }
  },
  'selectAll': {
    action: 'selectAll',
    combination: { key: 'a', ctrl: true }
  },
  'clearSelection': {
    action: 'clearSelection',
    combination: { key: 'Escape' }
  },
  'duplicate': {
    action: 'duplicate',
    combination: { key: 'd', ctrl: true }
  },
  // 精确移动 (1px)
  'moveUp': {
    action: 'moveUp',
    combination: { key: 'ArrowUp' }
  },
  'moveDown': {
    action: 'moveDown', 
    combination: { key: 'ArrowDown' }
  },
  'moveLeft': {
    action: 'moveLeft',
    combination: { key: 'ArrowLeft' }
  },
  'moveRight': {
    action: 'moveRight',
    combination: { key: 'ArrowRight' }
  },
  // 快速移动 (10px)
  'moveFastUp': {
    action: 'moveFastUp',
    combination: { key: 'ArrowUp', shift: true }
  },
  'moveFastDown': {
    action: 'moveFastDown',
    combination: { key: 'ArrowDown', shift: true }
  },
  'moveFastLeft': {
    action: 'moveFastLeft',
    combination: { key: 'ArrowLeft', shift: true }
  },
  'moveFastRight': {
    action: 'moveFastRight',
    combination: { key: 'ArrowRight', shift: true }
  }
};

export const KeyboardManager: Component = () => {
  const { 
    state, 
    copySelectedElements,
    pasteElements, 
    deleteElements,
    undo,
    redo,
    selectAllElements,
    clearSelection,
    moveElements
  } = useAppContext();

  // 检查键盘组合是否匹配
  const isKeyMatch = (event: KeyboardEvent, combination: KeyCombination): boolean => {
    const keyMatch = event.key.toLowerCase() === combination.key.toLowerCase() || 
                    event.key === combination.key;
    const ctrlMatch = !!combination.ctrl === (event.ctrlKey || event.metaKey);
    const altMatch = !!combination.alt === event.altKey;
    const shiftMatch = !!combination.shift === event.shiftKey;
    
    return keyMatch && ctrlMatch && altMatch && shiftMatch;
  };

  // 执行快捷键动作
  const executeAction = async (action: ShortcutAction): Promise<void> => {
    console.log('🎯 执行快捷键:', action);

    try {
      switch (action) {
        case 'copy':
          if (state.selected_ids.length > 0) {
            await copySelectedElements();
            showFeedback('复制成功', '✅');
          }
          break;

        case 'paste':
          // 在鼠标位置粘贴，如果没有鼠标位置则在画布中心
          const pasteOffset = { x: 20, y: 20 };
          const newIds = await pasteElements(pasteOffset.x, pasteOffset.y);
          if (newIds.length > 0) {
            showFeedback(`粘贴 ${newIds.length} 个元素`, '📋');
          }
          break;

        case 'cut':
          if (state.selected_ids.length > 0) {
            await copySelectedElements();
            await deleteElements([...state.selected_ids]);
            showFeedback('剪切成功', '✂️');
          }
          break;

        case 'delete':
          if (state.selected_ids.length > 0) {
            const count = state.selected_ids.length;
            await deleteElements([...state.selected_ids]);
            showFeedback(`删除 ${count} 个元素`, '🗑️');
          }
          break;

        case 'undo':
          await undo();
          showFeedback('撤销', '↶');
          break;

        case 'redo':
          await redo();
          showFeedback('重做', '↷');
          break;

        case 'selectAll':
          await selectAllElements();
          showFeedback(`全选 ${state.elements.length} 个元素`, '🎯');
          break;

        case 'clearSelection':
          if (state.selected_ids.length > 0) {
            clearSelection();
            showFeedback('清除选择', '⭕');
          }
          break;

        case 'duplicate':
          if (state.selected_ids.length > 0) {
            await copySelectedElements();
            const newIds = await pasteElements(20, 20);
            showFeedback(`复制 ${newIds.length} 个元素`, '📄');
          }
          break;

        // 元素移动
        case 'moveUp':
        case 'moveDown':
        case 'moveLeft':
        case 'moveRight':
        case 'moveFastUp':
        case 'moveFastDown':
        case 'moveFastLeft':
        case 'moveFastRight':
          await handleElementMove(action);
          break;

        default:
          console.warn('未知的快捷键动作:', action);
      }
    } catch (error) {
      console.error('快捷键执行失败:', error);
      showFeedback('操作失败', '❌');
    }
  };

  // 处理元素移动
  const handleElementMove = async (action: ShortcutAction): Promise<void> => {
    if (state.selected_ids.length === 0) return;

    const isFast = action.includes('Fast');
    const step = isFast ? 10 : 1;

    let deltaX = 0;
    let deltaY = 0;

    switch (action) {
      case 'moveUp':
      case 'moveFastUp':
        deltaY = -step;
        break;
      case 'moveDown': 
      case 'moveFastDown':
        deltaY = step;
        break;
      case 'moveLeft':
      case 'moveFastLeft':
        deltaX = -step;
        break;
      case 'moveRight':
      case 'moveFastRight':
        deltaX = step;
        break;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      await moveElements([...state.selected_ids], deltaX, deltaY);
      
      if (isFast) {
        showFeedback(`快速移动 ${step}px`, '🔄');
      }
    }
  };

  // 显示操作反馈
  const showFeedback = (message: string, icon: string): void => {
    // 创建临时反馈提示
    const feedback = document.createElement('div');
    feedback.className = 'keyboard-feedback';
    feedback.innerHTML = `
      <div class="feedback-content">
        <span class="feedback-icon">${icon}</span>
        <span class="feedback-text">${message}</span>
      </div>
    `;

    document.body.appendChild(feedback);

    // 2秒后自动移除
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  };

  // 全局键盘事件处理
  const handleKeyDown = (event: KeyboardEvent): void => {
    // 如果焦点在输入框内，不处理快捷键
    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' ||
                          target.contentEditable === 'true';
    
    if (isInputFocused) {
      return;
    }

    // 检查是否匹配任何快捷键
    for (const [name, config] of Object.entries(SHORTCUT_CONFIG)) {
      if (isKeyMatch(event, config.combination)) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🎹 快捷键触发:', name, config.action);
        executeAction(config.action);
        return;
      }
    }
  };

  // 组件挂载时添加全局事件监听
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    console.log('🎹 键盘快捷键管理器已启动');

    // 注入反馈样式
    if (!document.getElementById('keyboard-feedback-styles')) {
      const styles = document.createElement('style');
      styles.id = 'keyboard-feedback-styles';
      styles.textContent = `
        .keyboard-feedback {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 1.7s;
          pointer-events: none;
        }

        .feedback-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feedback-icon {
          font-size: 16px;
        }

        .feedback-text {
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  });

  // 组件卸载时移除事件监听
  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown, true);
    console.log('🎹 键盘快捷键管理器已停止');
  });

  // 这个组件没有UI，只处理键盘事件
  return null;
};

export default KeyboardManager;