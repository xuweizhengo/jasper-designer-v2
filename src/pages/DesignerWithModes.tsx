/**
 * 带模式切换的设计器页面
 * 演示双接口渲染架构的使用
 */

import { Component, createSignal } from 'solid-js';
import UnifiedCanvas from '../components/Canvas/UnifiedCanvas';
import { ExportFormat } from '../renderer/core/export-interfaces';

type DesignerMode = 'design' | 'data' | 'preview';

const DesignerWithModes: Component = () => {
  const [currentMode, setCurrentMode] = createSignal<DesignerMode>('design');
  const [showExportDialog, setShowExportDialog] = createSignal(false);

  /**
   * 切换模式
   */
  const switchMode = (mode: DesignerMode) => {
    console.log(`切换到 ${mode} 模式`);
    setCurrentMode(mode);
  };

  /**
   * 处理导出
   */
  const handleExport = (format: ExportFormat, data: Blob) => {
    console.log(`导出格式: ${format}, 大小: ${data.size} bytes`);
    // 这里可以处理导出的数据，比如上传到服务器或保存到本地
  };

  return (
    <div class="designer-page">
      {/* 顶部工具栏 */}
      <div class="toolbar">
        <div class="mode-switcher">
          <button
            class={currentMode() === 'design' ? 'active' : ''}
            onClick={() => switchMode('design')}
          >
            设计模式
          </button>
          <button
            class={currentMode() === 'data' ? 'active' : ''}
            onClick={() => switchMode('data')}
          >
            数据模式
          </button>
          <button
            class={currentMode() === 'preview' ? 'active' : ''}
            onClick={() => switchMode('preview')}
          >
            预览模式
          </button>
        </div>

        <div class="mode-info">
          {currentMode() === 'design' && (
            <span>🎨 设计模式 - 使用 Canvas 2D 快速渲染</span>
          )}
          {currentMode() === 'data' && (
            <span>📊 数据模式 - 使用 Canvas 2D 快速渲染</span>
          )}
          {currentMode() === 'preview' && (
            <span>👁️ 预览模式 - 使用 Skia 高质量渲染</span>
          )}
        </div>

        <div class="actions">
          <button onClick={() => setShowExportDialog(true)}>
            导出...
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div class="canvas-area">
        <UnifiedCanvas
          mode={currentMode()}
          onExport={handleExport}
        />
      </div>

      {/* 导出对话框 */}
      {showExportDialog() && (
        <div class="export-dialog">
          <div class="dialog-content">
            <h3>导出报表</h3>

            <div class="export-options">
              <h4>图片格式</h4>
              <button onClick={() => exportAs(ExportFormat.PNG)}>
                PNG (无损)
              </button>
              <button onClick={() => exportAs(ExportFormat.JPEG)}>
                JPEG (压缩)
              </button>
              <button onClick={() => exportAs(ExportFormat.WEBP)}>
                WebP (现代格式)
              </button>

              <h4>矢量格式</h4>
              <button onClick={() => exportAs(ExportFormat.PDF)}>
                PDF (打印)
              </button>
              <button onClick={() => exportAs(ExportFormat.SVG)}>
                SVG (矢量)
              </button>

              <h4>Office 格式</h4>
              <button onClick={() => exportAs(ExportFormat.EXCEL)}>
                Excel (.xlsx)
              </button>
              <button onClick={() => exportAs(ExportFormat.WORD)}>
                Word (.docx)
              </button>
              <button onClick={() => exportAs(ExportFormat.POWERPOINT)}>
                PowerPoint (.pptx)
              </button>
            </div>

            <button class="close-btn" onClick={() => setShowExportDialog(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      <style>{`
        .designer-page {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100vh;
          background: #f5f5f5;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .mode-switcher {
          display: flex;
          gap: 2px;
          background: #f0f0f0;
          border-radius: 6px;
          padding: 2px;
        }

        .mode-switcher button {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .mode-switcher button.active {
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .mode-switcher button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.5);
        }

        .mode-info {
          font-size: 14px;
          color: #666;
        }

        .actions button {
          padding: 8px 16px;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .actions button:hover {
          background: #0052cc;
        }

        .canvas-area {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .export-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          min-width: 400px;
          max-width: 600px;
        }

        .dialog-content h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
        }

        .dialog-content h4 {
          margin: 16px 0 8px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .export-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .export-options button {
          padding: 12px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .export-options button:hover {
          background: #e8e8e8;
          border-color: #999;
        }

        .close-btn {
          width: 100%;
          padding: 10px;
          background: #666;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .close-btn:hover {
          background: #555;
        }
      `}</style>
    </div>
  );

  /**
   * 导出为指定格式
   */
  function exportAs(format: ExportFormat) {
    // 切换到导出模式
    setCurrentMode('preview');
    setShowExportDialog(false);

    // 等待渲染器切换完成
    setTimeout(() => {
      // 触发导出（UnifiedCanvas 会处理）
      console.log(`触发导出: ${format}`);
    }, 500);
  }
};

export default DesignerWithModes;