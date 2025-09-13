import { createSignal, createContext, useContext } from 'solid-js';
import type { ParentComponent } from 'solid-js';

// 预览模式类型定义 - 扩展为三模式系统
export type PreviewModeType = 'design' | 'data' | 'preview';

// 预览状态接口
export interface PreviewStateType {
  mode: PreviewModeType;
  loading: boolean;
  error: string | undefined; // 使用undefined而不是null
}

// 预览上下文接口
export interface PreviewContextValueType {
  state: () => PreviewStateType;
  actions: {
    setMode: (mode: PreviewModeType) => void;
    toggleMode: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | undefined) => void; // 修改为undefined
    isDesignMode: () => boolean;
    isDataMode: () => boolean;
    isPreviewMode: () => boolean;
  };
}

// 创建预览上下文
const PreviewContext = createContext<PreviewContextValueType>();

/**
 * 预览模式提供者组件
 * 
 * 功能特性:
 * 1. 管理设计/预览模式状态
 * 2. 提供模式切换操作
 * 3. 处理模式切换时的加载状态
 * 4. 统一的错误处理机制
 */
export const PreviewProvider: ParentComponent = (props) => {
  // 预览状态管理
  const [state, setState] = createSignal<PreviewStateType>({
    mode: 'design', // 默认设计模式
    loading: false,
    error: undefined // 使用undefined
  });

  // 设置模式
  const setMode = (mode: PreviewModeType) => {
    setState(prev => ({ 
      ...prev, 
      mode,
      error: undefined // 清除之前的错误，使用undefined
    }));
    
    // 触发模式切换事件
    console.log(`🎯 预览模式切换: ${mode === 'design' ? '设计模式' : '预览模式'}`);
    
    // 发送自定义事件，让其他组件监听
    window.dispatchEvent(new CustomEvent('preview-mode-changed', {
      detail: { mode, timestamp: Date.now() }
    }));
  };

  // 切换模式
  const toggleMode = () => {
    const currentMode = state().mode;
    // 三模式循环切换：design -> data -> preview -> design
    const nextMode: PreviewModeType = 
      currentMode === 'design' ? 'data' : 
      currentMode === 'data' ? 'preview' : 
      'design';
    setMode(nextMode);
  };

  // 设置加载状态
  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  // 设置错误状态
  const setError = (error: string | undefined) => {
    setState(prev => ({ 
      ...prev, 
      error,
      loading: false // 有错误时停止加载
    }));
  };

  // 模式检查工具函数
  const isDesignMode = () => state().mode === 'design';
  const isDataMode = () => state().mode === 'data';
  const isPreviewMode = () => state().mode === 'preview';

  // 上下文值
  const contextValue: PreviewContextValueType = {
    state,
    actions: {
      setMode,
      toggleMode,
      setLoading,
      setError,
      isDesignMode,
      isDataMode,
      isPreviewMode
    }
  };

  return (
    <PreviewContext.Provider value={contextValue}>
      {props.children}
    </PreviewContext.Provider>
  );
};

/**
 * 使用预览上下文的Hook
 */
export const usePreview = (): PreviewContextValueType => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview必须在PreviewProvider内使用');
  }
  return context;
};

/**
 * 预览模式切换按钮组件 - 支持三模式切换
 */
export const PreviewModeToggle = () => {
  const { state, actions } = usePreview();

  const getModeInfo = (mode: PreviewModeType) => {
    const modeMap = {
      'design': { icon: '🎨', text: '设计模式', color: 'blue' },
      'data': { icon: '🔗', text: '数据模式', color: 'green' },
      'preview': { icon: '🔍', text: '预览模式', color: 'purple' }
    };
    return modeMap[mode];
  };

  const currentModeInfo = () => getModeInfo(state().mode);

  return (
    <div class="preview-toggle-container">
      {/* 当前模式指示器 */}
      <div class="current-mode-indicator">
        <span class="mode-icon">{currentModeInfo().icon}</span>
        <span class="mode-text">{currentModeInfo().text}</span>
        {state().loading && (
          <span class="loading-indicator">⏳</span>
        )}
      </div>

      {/* 三模式切换按钮组 */}
      <div class="mode-toggle-group">
        {(['design', 'data', 'preview'] as PreviewModeType[]).map(mode => {
          const modeInfo = getModeInfo(mode);
          const isActive = state().mode === mode;
          
          return (
            <button
              class={`mode-btn ${isActive ? 'active' : ''}`}
              onClick={() => actions.setMode(mode)}
              disabled={state().loading}
              title={`切换到${modeInfo.text}`}
            >
              <span class="button-icon">{modeInfo.icon}</span>
              <span class="button-text">{modeInfo.text}</span>
            </button>
          );
        })}
      </div>

      {/* 错误提示 */}
      {state().error && (
        <div class="error-indicator" title={state().error}>
          ❌
        </div>
      )}
    </div>
  );
};

/**
 * 预览模式感知组件的包装器
 * 根据当前模式渲染不同内容
 */
interface ModeAwareProps {
  designContent: () => any;
  dataContent: () => any;
  previewContent: () => any;
  loadingContent?: () => any;
}

export const ModeAwareRenderer = (props: ModeAwareProps) => {
  const { state } = usePreview();

  return (
    <>
      {state().loading && props.loadingContent && props.loadingContent()}
      {!state().loading && state().mode === 'design' && props.designContent()}
      {!state().loading && state().mode === 'data' && props.dataContent()}
      {!state().loading && state().mode === 'preview' && props.previewContent()}
    </>
  );
};

/**
 * 预览模式工具函数集合
 */
export const PreviewUtils = {
  // 获取当前模式的显示文本
  getModeDisplayText: (mode: PreviewModeType): string => {
    const textMap = {
      'design': '设计模式',
      'data': '数据模式', 
      'preview': '预览模式'
    };
    return textMap[mode];
  },

  // 获取模式图标
  getModeIcon: (mode: PreviewModeType): string => {
    const iconMap = {
      'design': '🎨',
      'data': '🔗',
      'preview': '🔍'
    };
    return iconMap[mode];
  },

  // 检查是否应该显示表达式占位符
  shouldShowExpression: (mode: PreviewModeType): boolean => {
    return mode === 'design';
  },

  // 检查是否应该求值表达式
  shouldEvaluateExpression: (mode: PreviewModeType): boolean => {
    return mode === 'data' || mode === 'preview';
  },

  // 检查是否应该显示设计辅助元素 (选中框、网格等)
  shouldShowDesignAids: (mode: PreviewModeType): boolean => {
    return mode === 'design' || mode === 'data';
  },

  // 检查是否支持交互编辑
  shouldAllowInteraction: (mode: PreviewModeType): boolean => {
    return mode === 'design' || mode === 'data';
  },

  // 检查是否是只读模式
  isReadOnlyMode: (mode: PreviewModeType): boolean => {
    return mode === 'preview';
  },

  // 为模式切换添加过渡类名
  getModeTransitionClass: (mode: PreviewModeType): string => {
    return `mode-${mode}-active`;
  }
};

// 导出类型供其他模块使用 - 使用类型别名避免冲突
export type PreviewMode = PreviewModeType;
export type PreviewState = PreviewStateType; 
export type PreviewContextValue = PreviewContextValueType;