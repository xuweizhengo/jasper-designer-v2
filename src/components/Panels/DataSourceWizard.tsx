// === 数据源创建向导组件 ===
import { createSignal, createMemo, Show, For } from 'solid-js';
import { DataSourceAPI, DataSourceTypeInfo } from '../../api/data-sources';
import { dataContextManager } from '../../stores/DataContextManager';
import './DataSourceWizard.css';

// 向导步骤类型定义
export type WizardStep = 1 | 2 | 3 | 4;
export type SourceType = 'file' | 'content';

// 向导状态接口
interface WizardState {
  currentStep: WizardStep;
  sourceType: SourceType | null;
  name: string;
  config: {
    source_type: SourceType;
    file_path?: string;
    json_content?: string;
    auto_refresh: boolean;
    refresh_interval: number;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  testResult: TestResult | null;
  loading: boolean;
}

// 测试结果接口
interface TestResult {
  success: boolean;
  message: string;
  preview?: {
    record_count: number;
    fields: string[];
    sample_data: any[];
  };
  error?: string;
}

interface DataSourceWizardProps {
  availableTypes: DataSourceTypeInfo[];
  onBack: () => void;
  onSuccess: () => void;
}

export function DataSourceWizard(props: DataSourceWizardProps) {
  // 向导状态管理
  const [state, setState] = createSignal<WizardState>({
    currentStep: 1,
    sourceType: null,
    name: '',
    config: {
      source_type: 'content',
      auto_refresh: false,
      refresh_interval: 300
    },
    validation: {
      isValid: false,
      errors: [],
      warnings: []
    },
    testResult: null,
    loading: false
  });

  // 步骤信息配置
  const stepInfo = [
    { step: 1, title: '选择数据来源', description: '选择JSON数据的输入方式' },
    { step: 2, title: '输入数据', description: '提供具体的JSON数据' },
    { step: 3, title: '基础配置', description: '设置数据源名称和选项' },
    { step: 4, title: '测试预览', description: '验证数据源并预览效果' }
  ] as const;

  // 计算当前步骤是否可以进行下一步
  const canProceedToNext = createMemo(() => {
    const currentState = state();
    switch (currentState.currentStep) {
      case 1:
        return currentState.sourceType !== null;
      case 2:
        return validateStep2(currentState);
      case 3:
        return validateStep3(currentState);
      case 4:
        return validateStep4(currentState);
      default:
        return false;
    }
  });

  // 步骤2验证逻辑
  const validateStep2 = (currentState: WizardState): boolean => {
    if (currentState.sourceType === 'file') {
      return Boolean(currentState.config.file_path?.trim());
    } else if (currentState.sourceType === 'content') {
      const content = currentState.config.json_content?.trim();
      if (!content) return false;
      // 简单JSON格式验证
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  // 步骤3验证逻辑
  const validateStep3 = (currentState: WizardState): boolean => {
    const name = currentState.name.trim();
    // 名称基本验证
    if (name.length < 2) return false;
    if (name.length > 50) return false;
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/.test(name)) return false;
    return true;
  };

  // 步骤4验证逻辑
  const validateStep4 = (currentState: WizardState): boolean => {
    return Boolean(currentState.testResult?.success);
  };

  // 导航到指定步骤
  const navigateToStep = (targetStep: WizardStep) => {
    const currentState = state();
    
    // 清除之前的错误状态
    setState(prev => ({
      ...prev,
      validation: { ...prev.validation, errors: [] }
    }));
    
    // 如果从步骤1切换，确保config.source_type已同步
    if (currentState.currentStep === 1 && currentState.sourceType) {
      setState(prev => ({
        ...prev,
        currentStep: targetStep,
        config: { ...prev.config, source_type: currentState.sourceType! }
      }));
    } else {
      setState(prev => ({ ...prev, currentStep: targetStep }));
    }
  };

  // 下一步
  const nextStep = () => {
    const currentState = state();
    if (currentState.currentStep < 4 && canProceedToNext()) {
      navigateToStep((currentState.currentStep + 1) as WizardStep);
    }
  };

  // 上一步
  const previousStep = () => {
    const currentState = state();
    if (currentState.currentStep > 1) {
      // 清除测试结果（如果从步骤4返回）
      if (currentState.currentStep === 4) {
        setState(prev => ({ 
          ...prev, 
          currentStep: (prev.currentStep - 1) as WizardStep,
          testResult: null
        }));
      } else {
        navigateToStep((currentState.currentStep - 1) as WizardStep);
      }
    }
  };

  // 更新向导状态
  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // 测试连接
  const testConnection = async () => {
    const currentState = state();
    updateState({ loading: true, testResult: null });

    try {
      console.log('🔄 开始测试连接...');
      const testConfig = {
        ...currentState.config,
        source_type: currentState.sourceType
      };

      // 调用后端测试连接API
      const success = await DataSourceAPI.testConnection('json', testConfig);
      
      if (success) {
        // 如果连接成功，获取数据预览
        console.log('✅ 连接测试成功，获取预览数据...');
        const schema = await DataSourceAPI.discoverSchema('json', testConfig);
        
        // 创建临时数据源进行预览
        const tempSourceId = `temp_${Date.now()}`;
        const sourceId = await DataSourceAPI.createDataSource(
          tempSourceId,
          'json',
          testConfig
        );
        
        const previewData = await DataSourceAPI.getPreview(sourceId, undefined, 5);
        
        // 删除临时数据源
        await DataSourceAPI.deleteDataSource(sourceId);

        updateState({
          testResult: {
            success: true,
            message: '连接测试成功！数据格式正确。',
            preview: {
              record_count: previewData.total_rows ?? previewData.total_count ?? 0,
              fields: schema.columns.map(col => col.name),
              sample_data: previewData.rows
            }
          },
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ 连接测试失败:', error);
      updateState({
        testResult: {
          success: false,
          message: '连接测试失败',
          error: error instanceof Error ? error.message : String(error)
        },
        loading: false
      });
    }
  };

  // 完成创建
  const finishCreation = async () => {
    const currentState = state();
    updateState({ loading: true });

    try {
      console.log('🔄 开始创建数据源...');
      const finalConfig = {
        ...currentState.config,
        source_type: currentState.sourceType
      };

      const dataSourceId = await DataSourceAPI.createDataSource(
        currentState.name,
        'json',
        finalConfig
      );

      console.log('✅ 数据源创建成功，ID:', dataSourceId);

      // 自动激活新创建的数据源
      try {
        await dataContextManager.setActiveDataSource(dataSourceId);
        console.log('✅ 数据源自动激活成功');
      } catch (activationError) {
        console.warn('⚠️ 数据源激活失败，但创建成功:', activationError);
      }

      props.onSuccess();
      props.onBack();
    } catch (error) {
      console.error('❌ 创建数据源失败:', error);
      updateState({
        validation: {
          isValid: false,
          errors: [`创建失败: ${error}`],
          warnings: []
        },
        loading: false
      });
    }
  };

  return (
    <div class="data-source-wizard">
      {/* 向导头部 */}
      <div class="wizard-header">
        <button class="back-btn" onClick={props.onBack}>
          ← 返回
        </button>
        <div class="wizard-title">
          <h3>添加JSON数据源</h3>
          <p>{stepInfo[state().currentStep - 1]?.description}</p>
        </div>
      </div>

      {/* 进度指示器 */}
      <WizardProgress 
        currentStep={state().currentStep}
        stepInfo={stepInfo}
        onStepClick={navigateToStep}
      />

      {/* 步骤内容 */}
      <div class="wizard-content">
        <Show when={state().currentStep === 1}>
          <SourceTypeStep
            selectedType={state().sourceType}
            onSelect={(type) => updateState({ 
              sourceType: type,
              config: { ...state().config, source_type: type }
            })}
          />
        </Show>

        <Show when={state().currentStep === 2}>
          <DataInputStep
            sourceType={state().sourceType!}
            config={state().config}
            onConfigUpdate={(updates) => updateState({
              config: { ...state().config, ...updates }
            })}
          />
        </Show>

        <Show when={state().currentStep === 3}>
          <ConfigurationStep
            name={state().name}
            config={state().config}
            onNameChange={(name) => updateState({ name })}
            onConfigUpdate={(updates) => updateState({
              config: { ...state().config, ...updates }
            })}
          />
        </Show>

        <Show when={state().currentStep === 4}>
          <TestPreviewStep
            config={state().config}
            testResult={state().testResult}
            loading={state().loading}
            onTest={testConnection}
          />
        </Show>
      </div>

      {/* 向导控制按钮 */}
      <WizardControls
        currentStep={state().currentStep}
        canProceed={canProceedToNext()}
        loading={state().loading}
        testResult={state().testResult}
        onPrevious={previousStep}
        onNext={nextStep}
        onFinish={finishCreation}
      />

      {/* 错误提示 */}
      <Show when={state().validation.errors.length > 0}>
        <div class="wizard-errors">
          <For each={state().validation.errors}>
            {(error) => (
              <div class="error-message">{error}</div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// 子组件实现

// 进度指示器组件
interface WizardProgressProps {
  currentStep: WizardStep;
  stepInfo: readonly { step: number; title: string; description: string }[];
  onStepClick: (step: WizardStep) => void;
}

function WizardProgress(props: WizardProgressProps) {
  return (
    <div class="wizard-progress">
      <For each={props.stepInfo}>
        {(step) => {
          const isActive = props.currentStep === step.step;
          const isCompleted = props.currentStep > step.step;
          const isAccessible = props.currentStep >= step.step;
          
          return (
            <div 
              class={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => isAccessible && props.onStepClick(step.step as WizardStep)}
            >
              <div class="step-indicator">
                <span class="step-number">
                  {isCompleted ? '✓' : step.step}
                </span>
              </div>
              <div class="step-info">
                <div class="step-title">{step.title}</div>
                <div class="step-description">{step.description}</div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

// 步骤1: 数据来源类型选择
interface SourceTypeStepProps {
  selectedType: SourceType | null;
  onSelect: (type: SourceType) => void;
}

function SourceTypeStep(props: SourceTypeStepProps) {
  const sourceOptions = [
    {
      type: 'file' as SourceType,
      title: '📁 从文件加载',
      description: '从本地JSON文件导入数据',
      features: ['支持大文件', '自动刷新', '适合静态数据'],
      example: '适合：本地配置文件、导出数据等'
    },
    {
      type: 'content' as SourceType, 
      title: '✏️ 直接输入内容',
      description: '粘贴或输入JSON内容',
      features: ['快速测试', '动态编辑', '适合小数据'],
      example: '适合：API响应、临时数据、测试数据等'
    }
  ];

  return (
    <div class="source-type-step">
      <div class="step-header">
        <h4>选择JSON数据的输入方式</h4>
        <p>请选择最适合您使用场景的数据输入方式</p>
      </div>
      
      <div class="source-options">
        <For each={sourceOptions}>
          {(option) => (
            <div 
              class={`source-option ${props.selectedType === option.type ? 'selected' : ''}`}
              onClick={() => props.onSelect(option.type)}
            >
              <div class="option-header">
                <div class="option-title">{option.title}</div>
                <div class="option-description">{option.description}</div>
              </div>
              
              <div class="option-features">
                <For each={option.features}>
                  {(feature) => (
                    <span class="feature-tag">{feature}</span>
                  )}
                </For>
              </div>
              
              <div class="option-example">{option.example}</div>
              
              <div class="option-selector">
                <input 
                  type="radio" 
                  checked={props.selectedType === option.type}
                  onChange={() => props.onSelect(option.type)}
                />
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

// 步骤2: 数据输入
interface DataInputStepProps {
  sourceType: SourceType;
  config: WizardState['config'];
  onConfigUpdate: (updates: Partial<WizardState['config']>) => void;
}

function DataInputStep(props: DataInputStepProps) {
  return (
    <div class="data-input-step">
      <div class="step-header">
        <h4>
          {props.sourceType === 'file' ? '📁 选择JSON文件' : '✏️ 输入JSON内容'}
        </h4>
        <p>
          {props.sourceType === 'file' 
            ? '请选择要导入的JSON文件，支持拖拽上传'
            : '请粘贴或输入您的JSON数据内容'
          }
        </p>
      </div>

      <Show when={props.sourceType === 'file'}>
        <FileSelectionPanel
          filePath={props.config.file_path || ''}
          onFileSelect={(path) => props.onConfigUpdate({ file_path: path })}
        />
      </Show>

      <Show when={props.sourceType === 'content'}>
        <ContentEditingPanel
          content={props.config.json_content || ''}
          onContentChange={(content) => props.onConfigUpdate({ json_content: content })}
        />
      </Show>
    </div>
  );
}

// 文件选择面板
interface FileSelectionPanelProps {
  filePath: string;
  onFileSelect: (path: string) => void;
}

function FileSelectionPanel(props: FileSelectionPanelProps) {
  const [dragActive, setDragActive] = createSignal(false);
  const [fileError, setFileError] = createSignal<string | null>(null);

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file: File) => {
    setFileError(null);
    
    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      setFileError('请选择JSON文件（.json格式）');
      return;
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      setFileError('文件大小不能超过10MB');
      return;
    }

    // 读取文件内容进行验证
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content); // 验证JSON格式
        props.onFileSelect(file.name); // 这里实际项目中应该保存文件路径
        console.log('✅ 文件选择成功:', file.name);
      } catch (error) {
        setFileError('文件内容不是有效的JSON格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div class="file-selection-panel">
      {/* 拖拽上传区域 */}
      <div 
        class={`file-drop-zone ${dragActive() ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div class="drop-zone-content">
          <div class="drop-icon">📁</div>
          <div class="drop-text">
            <div>将JSON文件拖拽到此处</div>
            <div>或者点击下方按钮选择文件</div>
          </div>
        </div>
      </div>

      {/* 文件选择按钮 */}
      <div class="file-input-section">
        <label class="file-select-btn">
          <input 
            type="file" 
            accept=".json"
            onChange={handleFileSelect}
          />
          选择JSON文件
        </label>
        
        <Show when={props.filePath}>
          <div class="selected-file">
            <span class="file-icon">📄</span>
            <span class="file-name">{props.filePath}</span>
            <button 
              class="remove-file"
              onClick={() => props.onFileSelect('')}
            >
              ✕
            </button>
          </div>
        </Show>
      </div>

      {/* 错误提示 */}
      <Show when={fileError()}>
        <div class="file-error">{fileError()}</div>
      </Show>

      {/* 使用提示 */}
      <div class="file-help">
        <div class="help-title">📝 支持的文件格式:</div>
        <ul class="help-list">
          <li>JSON对象: <code>{`{"name": "value"}`}</code></li>
          <li>JSON数组: <code>{`[{"id": 1}, {"id": 2}]`}</code></li>
          <li>文件大小: 最大10MB</li>
          <li>编码格式: UTF-8</li>
        </ul>
      </div>
    </div>
  );
}

// 步骤3: 基础配置
interface ConfigurationStepProps {
  name: string;
  config: WizardState['config'];
  onNameChange: (name: string) => void;
  onConfigUpdate: (updates: Partial<WizardState['config']>) => void;
}

function ConfigurationStep(props: ConfigurationStepProps) {
  const [nameError, setNameError] = createSignal<string | null>(null);

  const handleNameChange = (value: string) => {
    props.onNameChange(value);
    
    // 名称验证
    if (value.trim().length === 0) {
      setNameError('数据源名称不能为空');
    } else if (value.trim().length < 2) {
      setNameError('数据源名称至少需要2个字符');
    } else if (value.trim().length > 50) {
      setNameError('数据源名称不能超过50个字符');
    } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/.test(value.trim())) {
      setNameError('数据源名称只能包含中文、英文、数字、空格、连字符和下划线');
    } else {
      setNameError(null);
    }
  };

  const handleRefreshIntervalChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 10 && numValue <= 3600) {
      props.onConfigUpdate({ refresh_interval: numValue });
    }
  };

  return (
    <div class="configuration-step">
      <div class="step-header">
        <h4>⚙️ 配置数据源</h4>
        <p>为您的数据源设置名称和基本选项</p>
      </div>

      <div class="config-form">
        {/* 数据源名称 */}
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">🏷️</span>
            <h5>基本信息</h5>
          </div>
          
          <div class="form-field">
            <label class="field-label">
              数据源名称 <span class="required">*</span>
            </label>
            <input
              type="text"
              class={`name-input ${nameError() ? 'error' : ''}`}
              value={props.name}
              onInput={(e) => handleNameChange(e.currentTarget.value)}
              placeholder="请输入数据源名称，如: 客户数据、销售报表等"
              maxLength={50}
            />
            <Show when={nameError()}>
              <div class="field-error">{nameError()}</div>
            </Show>
            <div class="field-hint">
              为您的数据源起一个容易识别的名称，方便后续使用和管理
            </div>
          </div>
        </div>

        {/* 刷新设置 */}
        <Show when={props.config.source_type === 'file'}>
          <div class="form-section">
            <div class="section-title">
              <span class="title-icon">🔄</span>
              <h5>自动刷新设置</h5>
            </div>
            
            <div class="form-field">
              <label class="field-label checkbox-label">
                <input
                  type="checkbox"
                  class="refresh-checkbox"
                  checked={props.config.auto_refresh}
                  onChange={(e) => props.onConfigUpdate({ 
                    auto_refresh: e.currentTarget.checked 
                  })}
                />
                <span class="checkbox-text">启用自动刷新</span>
              </label>
              <div class="field-hint">
                当JSON文件发生变化时，自动重新加载数据
              </div>
            </div>

            <Show when={props.config.auto_refresh}>
              <div class="form-field">
                <label class="field-label">
                  刷新间隔 (秒)
                </label>
                <div class="interval-input-group">
                  <input
                    type="range"
                    class="interval-slider"
                    min="10"
                    max="3600"
                    step="10"
                    value={props.config.refresh_interval}
                    onInput={(e) => handleRefreshIntervalChange(e.currentTarget.value)}
                  />
                  <input
                    type="number"
                    class="interval-number"
                    min="10"
                    max="3600"
                    value={props.config.refresh_interval}
                    onChange={(e) => handleRefreshIntervalChange(e.currentTarget.value)}
                  />
                  <span class="interval-unit">秒</span>
                </div>
                <div class="field-hint">
                  推荐设置: 5分钟 (300秒) 适合大多数场景
                </div>
              </div>
            </Show>
          </div>
        </Show>

        {/* 数据源类型总结 */}
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">📋</span>
            <h5>配置概览</h5>
          </div>
          
          <div class="config-summary">
            <div class="summary-item">
              <span class="summary-label">数据来源:</span>
              <span class="summary-value">
                {props.config.source_type === 'file' ? '📁 从文件加载' : '✏️ 直接输入内容'}
              </span>
            </div>
            
            <Show when={props.config.source_type === 'file'}>
              <div class="summary-item">
                <span class="summary-label">文件路径:</span>
                <span class="summary-value file-path">
                  {props.config.file_path || '(未选择文件)'}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">自动刷新:</span>
                <span class="summary-value">
                  {props.config.auto_refresh 
                    ? `✅ 每 ${props.config.refresh_interval} 秒检查一次`
                    : '❌ 已关闭'
                  }
                </span>
              </div>
            </Show>
            
            <Show when={props.config.source_type === 'content'}>
              <div class="summary-item">
                <span class="summary-label">内容长度:</span>
                <span class="summary-value">
                  {props.config.json_content?.length || 0} 字符
                </span>
              </div>
            </Show>
          </div>
        </div>

        {/* 使用提示 */}
        <div class="form-section">
          <div class="usage-tips">
            <div class="tips-title">💡 使用建议:</div>
            <ul class="tips-list">
              <li>使用具有描述性的名称，如"2024年销售数据"而不是"data1"</li>
              <li>对于经常变化的文件，建议启用自动刷新功能</li>
              <li>较大的JSON文件建议设置较长的刷新间隔以避免性能问题</li>
              <li>直接输入的JSON内容会保存在应用中，不会自动更新</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 内容编辑面板
interface ContentEditingPanelProps {
  content: string;
  onContentChange: (content: string) => void;
}

function ContentEditingPanel(props: ContentEditingPanelProps) {
  const [syntaxError, setSyntaxError] = createSignal<string | null>(null);
  const [showTemplate, setShowTemplate] = createSignal(false);

  // JSON模板示例
  const templates = [
    {
      name: '简单对象',
      description: '单个JSON对象',
      content: `{
  "name": "示例数据",
  "value": 123,
  "active": true,
  "created_at": "2024-12-21"
}`
    },
    {
      name: '对象数组',
      description: '多条记录数据',
      content: `[
  {
    "id": 1,
    "name": "张三",
    "age": 25,
    "department": "技术部"
  },
  {
    "id": 2,
    "name": "李四", 
    "age": 30,
    "department": "销售部"
  }
]`
    },
    {
      name: '复杂嵌套',
      description: '包含嵌套对象和数组',
      content: `{
  "company": "示例公司",
  "employees": [
    {
      "name": "张三",
      "position": "工程师",
      "skills": ["JavaScript", "Python"],
      "contact": {
        "email": "zhang@example.com",
        "phone": "138****1234"
      }
    }
  ],
  "metadata": {
    "total": 1,
    "updated": "2024-12-21T10:30:00Z"
  }
}`
    }
  ];

  const handleContentChange = (value: string) => {
    props.onContentChange(value);
    
    // 实时JSON格式验证
    if (value.trim()) {
      try {
        JSON.parse(value);
        setSyntaxError(null);
      } catch (error) {
        setSyntaxError(error instanceof Error ? error.message : '无效的JSON格式');
      }
    } else {
      setSyntaxError(null);
    }
  };

  const applyTemplate = (template: typeof templates[0]) => {
    props.onContentChange(template.content);
    setSyntaxError(null);
    setShowTemplate(false);
  };

  return (
    <div class="content-editing-panel">
      {/* 工具栏 */}
      <div class="editor-toolbar">
        <button 
          class="template-btn"
          onClick={() => setShowTemplate(!showTemplate())}
        >
          📋 使用模板
        </button>
        
        <button 
          class="clear-btn"
          onClick={() => props.onContentChange('')}
          disabled={!props.content}
        >
          🗑️ 清空
        </button>

        <div class="editor-status">
          <Show when={!syntaxError() && props.content.trim()}>
            <span class="status-success">✅ JSON格式正确</span>
          </Show>
          <Show when={syntaxError()}>
            <span class="status-error">❌ 格式错误</span>
          </Show>
        </div>
      </div>

      {/* 模板选择 */}
      <Show when={showTemplate()}>
        <div class="template-selector">
          <div class="template-header">选择JSON模板:</div>
          <div class="template-list">
            <For each={templates}>
              {(template) => (
                <div class="template-item" onClick={() => applyTemplate(template)}>
                  <div class="template-name">{template.name}</div>
                  <div class="template-description">{template.description}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* JSON编辑器 */}
      <div class="json-editor">
        <textarea
          class={`json-textarea ${syntaxError() ? 'error' : ''}`}
          value={props.content}
          onInput={(e) => handleContentChange(e.currentTarget.value)}
          placeholder="请输入或粘贴JSON内容...&#10;&#10;示例:&#10;{&#10;  &quot;name&quot;: &quot;示例数据&quot;,&#10;  &quot;value&quot;: 123&#10;}"
          rows={15}
        />
      </div>

      {/* 错误提示 */}
      <Show when={syntaxError()}>
        <div class="syntax-error">
          <div class="error-title">❌ JSON格式错误:</div>
          <div class="error-message">{syntaxError()}</div>
        </div>
      </Show>

      {/* 使用提示 */}
      <div class="editor-help">
        <div class="help-title">💡 使用提示:</div>
        <ul class="help-list">
          <li>支持JSON对象和数组格式</li>
          <li>字符串需要用双引号包围</li>
          <li>可以使用Ctrl+A全选，Ctrl+V粘贴</li>
          <li>系统会自动验证JSON格式</li>
        </ul>
      </div>
    </div>
  );
}

// 步骤4: 测试预览
interface TestPreviewStepProps {
  config: WizardState['config'];
  testResult: TestResult | null;
  loading: boolean;
  onTest: () => void;
}

function TestPreviewStep(props: TestPreviewStepProps) {
  const [showAdvancedInfo, setShowAdvancedInfo] = createSignal(false);

  const getTestStatusIcon = () => {
    if (props.loading) return '🔄';
    if (!props.testResult) return '⚡';
    return props.testResult.success ? '✅' : '❌';
  };

  const getTestStatusText = () => {
    if (props.loading) return '测试连接中...';
    if (!props.testResult) return '点击测试连接';
    return props.testResult.success ? '连接测试成功' : '连接测试失败';
  };

  const getTestStatusClass = () => {
    if (props.loading) return 'testing';
    if (!props.testResult) return 'ready';
    return props.testResult.success ? 'success' : 'error';
  };

  const formatPreviewData = (data: any) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  return (
    <div class="test-preview-step">
      <div class="step-header">
        <h4>🧪 测试与预览</h4>
        <p>验证数据源配置并预览数据内容</p>
      </div>

      <div class="test-section">
        {/* 连接测试 */}
        <div class="test-connection">
          <div class="test-header">
            <div class="test-title">
              <span class="test-icon">{getTestStatusIcon()}</span>
              <span class="test-text">{getTestStatusText()}</span>
            </div>
            <button
              class={`test-button ${getTestStatusClass()}`}
              onClick={props.onTest}
              disabled={props.loading}
            >
              {props.loading ? (
                <>
                  <span class="loading-spinner">⏳</span>
                  测试中...
                </>
              ) : (
                <>
                  <span class="test-button-icon">🔌</span>
                  测试连接
                </>
              )}
            </button>
          </div>

          {/* 测试结果显示 */}
          <Show when={props.testResult}>
            <div class={`test-result ${getTestStatusClass()}`}>
              <div class="result-message">
                <span class="result-icon">{getTestStatusIcon()}</span>
                <span class="result-text">{props.testResult!.message}</span>
              </div>

              <Show when={props.testResult!.error}>
                <div class="error-details">
                  <div class="error-title">错误详情:</div>
                  <div class="error-content">{props.testResult!.error}</div>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        {/* 数据预览 */}
        <Show when={props.testResult?.success && props.testResult.preview}>
          <div class="data-preview">
            <div class="preview-header">
              <div class="preview-title">
                <span class="preview-icon">📊</span>
                <h5>数据预览</h5>
              </div>
              <div class="preview-stats">
                <span class="stat-item">
                  <span class="stat-label">记录数:</span>
                  <span class="stat-value">{props.testResult!.preview!.record_count}</span>
                </span>
                <span class="stat-item">
                  <span class="stat-label">字段数:</span>
                  <span class="stat-value">{props.testResult!.preview!.fields.length}</span>
                </span>
              </div>
            </div>

            {/* 字段信息 */}
            <div class="fields-info">
              <div class="fields-title">📋 检测到的字段:</div>
              <div class="fields-grid">
                <For each={props.testResult!.preview!.fields}>
                  {(field) => (
                    <div class="field-tag">
                      <span class="field-name">{field}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* 示例数据表格 */}
            <div class="preview-table-container">
              <div class="table-title">🔍 示例数据 (前5条):</div>
              <div class="preview-table">
                <table>
                  <thead>
                    <tr>
                      <For each={props.testResult!.preview!.fields}>
                        {(field) => <th>{field}</th>}
                      </For>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={props.testResult!.preview!.sample_data}>
                      {(row) => (
                        <tr>
                          <For each={props.testResult!.preview!.fields}>
                            {(field) => (
                              <td>
                                <div class="cell-content">
                                  {row[field] !== undefined ? formatPreviewData(row[field]) : '-'}
                                </div>
                              </td>
                            )}
                          </For>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 高级信息 */}
            <div class="advanced-info">
              <button
                class="advanced-toggle"
                onClick={() => setShowAdvancedInfo(!showAdvancedInfo())}
              >
                <span class="toggle-icon">{showAdvancedInfo() ? '▼' : '▶'}</span>
                <span class="toggle-text">高级信息</span>
              </button>
              
              <Show when={showAdvancedInfo()}>
                <div class="advanced-content">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">数据源类型:</span>
                      <span class="info-value">
                        {props.config.source_type === 'file' ? 'JSON文件' : 'JSON内容'}
                      </span>
                    </div>
                    <Show when={props.config.source_type === 'file'}>
                      <div class="info-item">
                        <span class="info-label">文件路径:</span>
                        <span class="info-value file-path">{props.config.file_path}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">自动刷新:</span>
                        <span class="info-value">
                          {props.config.auto_refresh ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    </Show>
                    <div class="info-item">
                      <span class="info-label">预览限制:</span>
                      <span class="info-value">最多显示5条记录</span>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* 测试建议 */}
        <div class="test-suggestions">
          <div class="suggestions-title">💡 测试建议:</div>
          <ul class="suggestions-list">
            <Show when={!props.testResult}>
              <li>首次配置数据源时，建议先测试连接确保配置正确</li>
              <li>测试过程会验证JSON格式和文件访问权限</li>
              <li>预览功能可以帮助您确认数据结构是否符合预期</li>
            </Show>
            <Show when={props.testResult?.success}>
              <li>✅ 连接测试成功！您可以继续创建数据源</li>
              <li>预览显示的是实际数据，创建后可用于报表设计</li>
              <li>字段名称将用于数据绑定表达式</li>
            </Show>
            <Show when={props.testResult && !props.testResult.success}>
              <li>❌ 请检查JSON格式是否正确</li>
              <li>如果是文件类型，请确认文件路径存在且可访问</li>
              <li>可以返回上一步修改配置后重新测试</li>
            </Show>
          </ul>
        </div>

        {/* 安全提示 */}
        <Show when={props.config.source_type === 'file'}>
          <div class="security-notice">
            <div class="notice-icon">🔒</div>
            <div class="notice-content">
              <div class="notice-title">安全提示</div>
              <div class="notice-text">
                应用将读取指定的JSON文件。请确保文件内容安全，避免包含敏感信息。
                启用自动刷新时，应用会定期检查文件变化。
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

// 向导控制按钮组件
interface WizardControlsProps {
  currentStep: WizardStep;
  canProceed: boolean;
  loading: boolean;
  testResult: TestResult | null;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

function WizardControls(props: WizardControlsProps) {
  const getStepName = (step: WizardStep) => {
    switch (step) {
      case 1: return '选择来源';
      case 2: return '输入数据';
      case 3: return '基础配置';
      case 4: return '测试预览';
      default: return `步骤${step}`;
    }
  };

  const canGoBack = () => props.currentStep > 1;
  const canGoNext = () => props.currentStep < 4 && props.canProceed;
  const canFinish = () => props.currentStep === 4 && props.canProceed;

  return (
    <div class="wizard-controls">
      <div class="controls-info">
        <span class="current-step-info">
          步骤 {props.currentStep} / 4: {getStepName(props.currentStep)}
        </span>
        <Show when={!props.canProceed && props.currentStep < 4}>
          <span class="validation-hint">
            <span class="hint-icon">⚠️</span>
            请完成当前步骤的必填项
          </span>
        </Show>
      </div>

      <div class="control-buttons">
        <button
          class="control-btn back-btn"
          onClick={props.onPrevious}
          disabled={!canGoBack() || props.loading}
        >
          <span class="btn-icon">←</span>
          <span class="btn-text">上一步</span>
        </button>

        <Show when={props.currentStep < 4}>
          <button
            class="control-btn next-btn"
            onClick={props.onNext}
            disabled={!canGoNext() || props.loading}
          >
            <span class="btn-text">下一步</span>
            <span class="btn-icon">→</span>
          </button>
        </Show>

        <Show when={props.currentStep === 4}>
          <button
            class="control-btn finish-btn"
            onClick={props.onFinish}
            disabled={!canFinish() || props.loading}
          >
            {props.loading ? (
              <>
                <span class="btn-loading">⏳</span>
                <span class="btn-text">创建中...</span>
              </>
            ) : (
              <>
                <span class="btn-icon">✓</span>
                <span class="btn-text">创建数据源</span>
              </>
            )}
          </button>
        </Show>
      </div>

      {/* 进度提示 */}
      <div class="progress-hints">
        <Show when={props.currentStep === 1}>
          <span class="hint-text">选择您的JSON数据来源方式</span>
        </Show>
        <Show when={props.currentStep === 2}>
          <span class="hint-text">
            {props.testResult?.success ? '数据格式验证成功' : '请提供JSON数据内容'}
          </span>
        </Show>
        <Show when={props.currentStep === 3}>
          <span class="hint-text">设置数据源名称和选项</span>
        </Show>
        <Show when={props.currentStep === 4}>
          <span class="hint-text">
            {props.testResult?.success 
              ? '一切就绪，可以创建数据源' 
              : '建议先测试连接以确保配置正确'
            }
          </span>
        </Show>
      </div>
    </div>
  );
}

export default DataSourceWizard;