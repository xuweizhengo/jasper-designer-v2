import { Component, createSignal, Show, For } from 'solid-js';
import { PreviewAPI } from '../../api/preview';
import { useAppContext } from '../../stores/AppContext';
import { save } from '@tauri-apps/api/dialog';
import type {
  OutputFormat,
  RenderOptions,
  RenderQuality,
  PreviewRequest,
  Orientation
} from '../../types/preview';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  const { state } = useAppContext();

  // Export state
  const [selectedFormat, setSelectedFormat] = createSignal<OutputFormat>('pdf');
  const [quality, setQuality] = createSignal<RenderQuality>('high');
  const [isExporting, setIsExporting] = createSignal(false);
  const [exportProgress, setExportProgress] = createSignal(0);
  const [errorMessage, setErrorMessage] = createSignal<string>('');

  // PDF options
  const [pageSize, setPageSize] = createSignal<string>('a4');
  const [orientation, setOrientation] = createSignal<Orientation>('portrait');

  // Image options
  const [dpi, setDpi] = createSignal(150);
  const [imageCompression, setImageCompression] = createSignal(0.9);

  const formats: { value: OutputFormat; label: string; icon: string }[] = [
    { value: 'pdf', label: 'PDF 文档', icon: '📄' },
    { value: 'png', label: 'PNG 图片', icon: '🖼️' },
    { value: 'jpg', label: 'JPG 图片', icon: '🖼️' },
    { value: 'svg', label: 'SVG 矢量图', icon: '🎨' },
    { value: 'excel', label: 'Excel 表格', icon: '📊' },
  ];

  const qualities: { value: RenderQuality; label: string }[] = [
    { value: 'draft', label: '草稿' },
    { value: 'standard', label: '标准' },
    { value: 'high', label: '高质量' },
    { value: 'print', label: '打印' },
  ];

  const pageSizes: { value: string; label: string }[] = [
    { value: 'a4', label: 'A4' },
    { value: 'a3', label: 'A3' },
    { value: 'a5', label: 'A5' },
    { value: 'letter', label: 'Letter' },
    { value: 'legal', label: 'Legal' },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setExportProgress(0);

    try {
      // Get file extension based on format
      const extensions: Record<OutputFormat, string> = {
        pdf: 'pdf',
        png: 'png',
        jpg: 'jpg',
        webp: 'webp',
        svg: 'svg',
        excel: 'xlsx',
        powerpoint: 'pptx',
      };

      // Show save dialog
      const filePath = await save({
        title: `导出为 ${selectedFormat().toUpperCase()}`,
        defaultPath: `report.${extensions[selectedFormat()]}`,
        filters: [{
          name: formats.find(f => f.value === selectedFormat())?.label || 'File',
          extensions: [extensions[selectedFormat()]]
        }]
      });

      if (!filePath) {
        setIsExporting(false);
        return;
      }

      // Build render options
      const renderOptions: RenderOptions = {
        format: selectedFormat(),
        quality: quality(),
        customProperties: {},
      } as RenderOptions;

      // Add format-specific options
      if (selectedFormat() === 'pdf') {
        renderOptions.pdfOptions = {
          pageSize: pageSize() as any,
          orientation: orientation(),
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          embedFonts: true,
          compressImages: true,
          pdfVersion: '1.7',
        };
      }

      if (['png', 'jpg', 'webp'].includes(selectedFormat())) {
        renderOptions.imageQuality = {
          dpi: dpi(),
          compression: imageCompression(),
          colorSpace: 'srgb',
          antiAliasing: true,
        };
      }

      if (selectedFormat() === 'excel') {
        renderOptions.excelOptions = {
          sheetName: 'Report',
          includeFormatting: true,
          autoFitColumns: true,
          freezeHeader: true,
          cellMappingStrategy: 'position_based',
        };
      }

      // Create preview request
      const request: PreviewRequest = {
        elements: state.elements as any, // Type conversion needed
        canvasConfig: state.canvas_config as any,
        options: renderOptions,
        useCache: true,
      };

      setExportProgress(30);

      // Export to file
      const result = await PreviewAPI.exportToFile(request, filePath);

      setExportProgress(100);

      console.log('✅ 导出成功:', result);

      // Close dialog after success
      setTimeout(() => {
        props.onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 500);

    } catch (error) {
      console.error('❌ 导出失败:', error);
      setErrorMessage(error?.toString() || '导出失败');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Show when={props.isOpen}>
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;">
        {/* Backdrop */}
        <div
          style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5);"
          onClick={props.onClose}
        />

        {/* Dialog */}
        <div style="position: relative; background-color: white; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); padding: 24px; width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto;">
            <h2 class="text-xl font-semibold mb-4">导出报表</h2>

            {/* Format selection */}
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                导出格式
              </label>
              <div class="grid grid-cols-2 gap-2">
                <For each={formats}>
                  {(format) => (
                    <button
                      class={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                        selectedFormat() === format.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedFormat(format.value)}
                    >
                      <span class="text-lg">{format.icon}</span>
                      <span class="text-sm">{format.label}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Quality selection */}
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                输出质量
              </label>
              <select
                class="w-full p-2 border border-gray-300 rounded-lg"
                value={quality()}
                onChange={(e) => setQuality(e.target.value as RenderQuality)}
              >
                <For each={qualities}>
                  {(q) => <option value={q.value}>{q.label}</option>}
                </For>
              </select>
            </div>

            {/* PDF Options */}
            <Show when={selectedFormat() === 'pdf'}>
              <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-700 mb-3">PDF 选项</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">页面大小</label>
                    <select
                      class="w-full p-2 border border-gray-300 rounded text-sm"
                      value={pageSize()}
                      onChange={(e) => setPageSize(e.target.value)}
                    >
                      <For each={pageSizes}>
                        {(size) => <option value={size.value}>{size.label}</option>}
                      </For>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">方向</label>
                    <select
                      class="w-full p-2 border border-gray-300 rounded text-sm"
                      value={orientation()}
                      onChange={(e) => setOrientation(e.target.value as Orientation)}
                    >
                      <option value="portrait">纵向</option>
                      <option value="landscape">横向</option>
                    </select>
                  </div>
                </div>
              </div>
            </Show>

            {/* Image Options */}
            <Show when={['png', 'jpg', 'webp'].includes(selectedFormat())}>
              <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-700 mb-3">图片选项</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">
                      DPI ({dpi()})
                    </label>
                    <input
                      type="range"
                      min="72"
                      max="300"
                      step="1"
                      value={dpi()}
                      onChange={(e) => setDpi(parseInt(e.target.value))}
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">
                      压缩质量 ({Math.round(imageCompression() * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={imageCompression()}
                      onChange={(e) => setImageCompression(parseFloat(e.target.value))}
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </Show>

            {/* Error message */}
            <Show when={errorMessage()}>
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errorMessage()}
              </div>
            </Show>

            {/* Progress bar */}
            <Show when={isExporting()}>
              <div class="mb-4">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress()}%` }}
                  />
                </div>
                <p class="text-sm text-gray-600 mt-1">导出中... {exportProgress()}%</p>
              </div>
            </Show>

            {/* Action buttons */}
            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={props.onClose}
                disabled={isExporting()}
              >
                取消
              </button>
              <button
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExport}
                disabled={isExporting()}
              >
                {isExporting() ? '导出中...' : '导出'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};