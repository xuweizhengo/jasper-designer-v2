import { Component, createSignal, For, Show } from 'solid-js';
import type { RenderOptions, OutputFormat, RenderQuality, RenderStats } from '../../types/preview';

interface PreviewControlsProps {
  isRendering: boolean;
  renderOptions: RenderOptions;
  onOptionsChange: (options: RenderOptions) => void;
  onFormatChange: (format: OutputFormat) => void;
  onRefresh: () => void;
  onDownload: () => void;
  autoPreview: boolean;
  onAutoPreviewChange: (enabled: boolean) => void;
  supportedFormats?: OutputFormat[] | undefined;
  stats?: RenderStats | undefined;
}

/**
 * 预览控制面板组件
 * 提供格式选择、质量设置、渲染控制等功能
 */
export const PreviewControls: Component<PreviewControlsProps> = (props) => {
  const [showAdvanced, setShowAdvanced] = createSignal(false);

  // 格式选项配置
  const formatOptions = () => [
    { value: 'pdf' as OutputFormat, label: 'PDF', icon: '📄' },
    { value: 'png' as OutputFormat, label: 'PNG', icon: '🖼️' },
    { value: 'jpg' as OutputFormat, label: 'JPEG', icon: '📷' },
    { value: 'webp' as OutputFormat, label: 'WebP', icon: '🖼️' },
    { value: 'svg' as OutputFormat, label: 'SVG', icon: '🎨' },
    { value: 'excel' as OutputFormat, label: 'Excel', icon: '📊' },
    { value: 'powerpoint' as OutputFormat, label: 'PPT', icon: '📋' },
  ].filter(format => 
    !props.supportedFormats || props.supportedFormats.includes(format.value)
  );

  // 质量选项
  const qualityOptions: Array<{value: RenderQuality, label: string}> = [
    { value: 'draft', label: '草稿' },
    { value: 'standard', label: '标准' },
    { value: 'high', label: '高质量' },
    { value: 'print', label: '印刷质量' }
  ];

  // 更新选项
  const updateOptions = (updates: Partial<RenderOptions>) => {
    props.onOptionsChange({ ...props.renderOptions, ...updates });
  };

  // 获取格式显示信息 (currently unused but kept for future use)
  // const getFormatInfo = (format: OutputFormat) => {
  //   return formatOptions().find(f => f.value === format);
  // };

  return (
    <div class="preview-controls bg-primary border-b border-default p-4">
      <div class="controls-container flex flex-wrap items-center gap-4">
        
        {/* 格式选择器 */}
        <div class="format-selector flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">格式:</label>
          <select 
            class="px-3 py-1 border border-default rounded bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={props.renderOptions.format}
            onChange={(e) => props.onFormatChange(e.target.value as OutputFormat)}
            disabled={props.isRendering}
          >
            <For each={formatOptions()}>
              {(format) => (
                <option value={format.value}>
                  {format.icon} {format.label}
                </option>
              )}
            </For>
          </select>
        </div>

        {/* 质量选择器 */}
        <div class="quality-selector flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">质量:</label>
          <select 
            class="px-3 py-1 border border-default rounded bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={props.renderOptions.quality}
            onChange={(e) => updateOptions({ quality: e.target.value as RenderQuality })}
            disabled={props.isRendering}
          >
            <For each={qualityOptions}>
              {(quality) => (
                <option value={quality.value}>
                  {quality.label}
                </option>
              )}
            </For>
          </select>
        </div>

        {/* 自动预览开关 */}
        <div class="auto-preview-toggle flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">自动预览:</label>
          <button
            class={`toggle-switch px-3 py-1 rounded text-sm font-medium transition-colors ${
              props.autoPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-secondary text-primary border border-default'
            }`}
            onClick={() => props.onAutoPreviewChange(!props.autoPreview)}
          >
            {props.autoPreview ? '开启' : '关闭'}
          </button>
        </div>

        {/* 操作按钮组 */}
        <div class="action-buttons flex items-center gap-2">
          {/* 刷新按钮 */}
          <button
            class="refresh-btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={props.onRefresh}
            disabled={props.isRendering}
          >
            {props.isRendering ? '渲染中...' : '🔄 刷新'}
          </button>

          {/* 下载按钮 */}
          <button
            class="download-btn px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={props.onDownload}
            disabled={props.isRendering}
          >
            📥 下载
          </button>

          {/* 高级选项切换 */}
          <button
            class="advanced-toggle px-3 py-2 bg-secondary text-primary border border-default rounded hover:bg-tertiary transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced())}
          >
            {showAdvanced() ? '收起' : '高级'}
          </button>
        </div>

        {/* 统计信息 */}
        <Show when={props.stats}>
          {(stats) => (
            <div class="stats-display flex items-center gap-4 text-sm text-muted">
              <span>渲染次数: {stats().totalRenders}</span>
              <span>缓存命中: {Math.round(stats().cacheHits / Math.max(stats().totalRenders, 1) * 100)}%</span>
              <span>平均耗时: {Math.round(stats().averageRenderTimeMs)}ms</span>
            </div>
          )}
        </Show>
      </div>

      {/* 高级选项面板 */}
      <Show when={showAdvanced()}>
        <div class="advanced-options mt-4 pt-4 border-t border-default">
          <div class="options-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* PDF 特定选项 */}
            <Show when={props.renderOptions.format === 'pdf'}>
              <div class="pdf-options space-y-2">
                <h4 class="text-sm font-medium text-secondary">PDF 选项</h4>
                
                <div class="option-item">
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={props.renderOptions.pdfOptions?.embedFonts ?? true}
                      onChange={(e) => updateOptions({
                        pdfOptions: {
                          pageSize: 'a4' as const,
                          orientation: 'portrait' as const,
                          margins: { top: 20, right: 20, bottom: 20, left: 20 },
                          embedFonts: e.target.checked,
                          compressImages: true,
                          pdfVersion: '1.7',
                          ...props.renderOptions.pdfOptions,
                        }
                      })}
                      class="rounded"
                    />
                    嵌入字体
                  </label>
                </div>

                <div class="option-item">
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={props.renderOptions.pdfOptions?.compressImages ?? true}
                      onChange={(e) => updateOptions({
                        pdfOptions: {
                          pageSize: 'a4' as const,
                          orientation: 'portrait' as const,
                          margins: { top: 20, right: 20, bottom: 20, left: 20 },
                          embedFonts: true,
                          pdfVersion: '1.7',
                          ...props.renderOptions.pdfOptions,
                          compressImages: e.target.checked
                        }
                      })}
                      class="rounded"
                    />
                    压缩图片
                  </label>
                </div>
              </div>
            </Show>

            {/* 图片格式选项 */}
            <Show when={['png', 'jpg', 'webp'].includes(props.renderOptions.format)}>
              <div class="image-options space-y-2">
                <h4 class="text-sm font-medium text-secondary">图片选项</h4>
                
                <div class="option-item">
                  <label class="block text-sm">
                    DPI:
                    <input
                      type="number"
                      min="72"
                      max="300"
                      value={props.renderOptions.imageQuality?.dpi ?? 150}
                      onChange={(e) => updateOptions({
                        imageQuality: {
                          dpi: parseInt(e.target.value),
                          compression: 0.9,
                          colorSpace: 'srgb' as const,
                          antiAliasing: true,
                          ...props.renderOptions.imageQuality,
                        }
                      })}
                      class="mt-1 w-full px-2 py-1 border border-default rounded bg-secondary text-primary"
                    />
                  </label>
                </div>

                <div class="option-item">
                  <label class="block text-sm">
                    压缩质量:
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={props.renderOptions.imageQuality?.compression ?? 0.9}
                      onChange={(e) => updateOptions({
                        imageQuality: {
                          dpi: 150,
                          colorSpace: 'srgb' as const,
                          antiAliasing: true,
                          ...props.renderOptions.imageQuality,
                          compression: parseFloat(e.target.value)
                        }
                      })}
                      class="mt-1 w-full"
                    />
                    <span class="text-xs text-muted">
                      {Math.round((props.renderOptions.imageQuality?.compression ?? 0.9) * 100)}%
                    </span>
                  </label>
                </div>
              </div>
            </Show>

            {/* Excel 选项 */}
            <Show when={props.renderOptions.format === 'excel'}>
              <div class="excel-options space-y-2">
                <h4 class="text-sm font-medium text-secondary">Excel 选项</h4>
                
                <div class="option-item">
                  <label class="block text-sm">
                    工作表名:
                    <input
                      type="text"
                      value={props.renderOptions.excelOptions?.sheetName ?? 'Report'}
                      onChange={(e) => updateOptions({
                        excelOptions: {
                          sheetName: e.target.value,
                          includeFormatting: true,
                          autoFitColumns: true,
                          freezeHeader: true,
                          cellMappingStrategy: 'position_based' as const,
                          ...props.renderOptions.excelOptions,
                        }
                      })}
                      class="mt-1 w-full px-2 py-1 border border-default rounded bg-secondary text-primary"
                    />
                  </label>
                </div>

                <div class="option-item">
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={props.renderOptions.excelOptions?.includeFormatting ?? true}
                      onChange={(e) => updateOptions({
                        excelOptions: {
                          sheetName: 'Report',
                          autoFitColumns: true,
                          freezeHeader: true,
                          cellMappingStrategy: 'position_based' as const,
                          ...props.renderOptions.excelOptions,
                          includeFormatting: e.target.checked
                        }
                      })}
                      class="rounded"
                    />
                    包含格式
                  </label>
                </div>

                <div class="option-item">
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={props.renderOptions.excelOptions?.autoFitColumns ?? true}
                      onChange={(e) => updateOptions({
                        excelOptions: {
                          sheetName: 'Report',
                          includeFormatting: true,
                          freezeHeader: true,
                          cellMappingStrategy: 'position_based' as const,
                          ...props.renderOptions.excelOptions,
                          autoFitColumns: e.target.checked
                        }
                      })}
                      class="rounded"
                    />
                    自动调整列宽
                  </label>
                </div>
              </div>
            </Show>
            
          </div>
        </div>
      </Show>
    </div>
  );
};

export default PreviewControls;