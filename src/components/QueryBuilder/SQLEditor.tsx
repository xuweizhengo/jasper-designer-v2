// === SQL编辑器组件 ===
import { createSignal, onMount } from 'solid-js';

interface SQLEditorProps {
  sql: string;
  onSQLChange: (sql: string) => void;
  databaseType: string;
  disabled?: boolean;
}

export default function SQLEditor(props: SQLEditorProps) {
  let textareaRef: HTMLTextAreaElement | undefined;
  const [focused, setFocused] = createSignal(false);
  const [cursorPosition, setCursorPosition] = createSignal({ line: 1, column: 1 });

  // 处理SQL输入
  const handleSQLChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    props.onSQLChange(target.value);
    updateCursorPosition();
  };

  // 更新光标位置信息
  const updateCursorPosition = () => {
    if (!textareaRef) return;
    
    const cursorPos = textareaRef.selectionStart;
    const textBeforeCursor = props.sql.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    
    setCursorPosition({
      line: lines.length,
      column: (lines[lines.length - 1] || '').length + 1
    });
  };

  // 处理Tab键缩进
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!textareaRef || props.disabled) return;

    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      
      // 插入两个空格作为缩进
      const newValue = props.sql.substring(0, start) + '  ' + props.sql.substring(end);
      props.onSQLChange(newValue);
      
      // 延迟设置光标位置，确保DOM更新完成
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + 2;
          updateCursorPosition();
        }
      }, 0);
    } else if (e.key === 'Enter') {
      // 自动缩进：检测前一行的缩进级别
      const lines = props.sql.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine?.match(/^\s*/)?.[0] || '';
      
      // 如果当前行以关键字结尾，增加缩进
      const trimmedLine = currentLine?.trim().toUpperCase() || '';
      const shouldIndent = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING'].some(
        keyword => trimmedLine.endsWith(keyword) || trimmedLine.includes(keyword + ' ')
      );
      
      const newIndent = shouldIndent ? indent + '  ' : indent;
      
      if (newIndent) {
        e.preventDefault();
        const newValue = props.sql.substring(0, start) + '\n' + newIndent + props.sql.substring(end);
        props.onSQLChange(newValue);
        
        setTimeout(() => {
          if (textareaRef) {
            const newPos = start + 1 + newIndent.length;
            textareaRef.selectionStart = textareaRef.selectionEnd = newPos;
            updateCursorPosition();
          }
        }, 0);
      }
    }
  };

  // 格式化SQL快捷键
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      // 触发格式化（由父组件处理）
      console.log('格式化快捷键触发');
    }
  };

  // 插入SQL模板
  const insertTemplate = (template: string) => {
    if (!textareaRef || props.disabled) return;
    
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const newValue = props.sql.substring(0, start) + template + props.sql.substring(end);
    
    props.onSQLChange(newValue);
    
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        textareaRef.selectionStart = textareaRef.selectionEnd = start + template.length;
        updateCursorPosition();
      }
    }, 0);
  };

  // 组件挂载后设置焦点和位置更新
  onMount(() => {
    updateCursorPosition();
    
    // 监听选择变化
    if (textareaRef) {
      textareaRef.addEventListener('selectionchange', updateCursorPosition);
      textareaRef.addEventListener('click', updateCursorPosition);
    }
  });

  // SQL模板
  const sqlTemplates = [
    {
      name: '基础查询',
      template: 'SELECT * FROM table_name WHERE condition;'
    },
    {
      name: '联表查询', 
      template: 'SELECT t1.*, t2.*\nFROM table1 t1\nJOIN table2 t2 ON t1.id = t2.table1_id\nWHERE condition;'
    },
    {
      name: '聚合查询',
      template: 'SELECT column, COUNT(*), AVG(value)\nFROM table_name\nGROUP BY column\nHAVING COUNT(*) > 1\nORDER BY column;'
    },
    {
      name: '子查询',
      template: 'SELECT *\nFROM table1\nWHERE column IN (\n  SELECT column\n  FROM table2\n  WHERE condition\n);'
    }
  ];

  return (
    <div class="sql-editor">
      {/* 编辑器工具栏 */}
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <span class="editor-label">SQL编辑器</span>
          <span class="database-type">({props.databaseType.toUpperCase()})</span>
        </div>
        
        <div class="toolbar-right">
          <span class="cursor-position">
            行 {cursorPosition().line}, 列 {cursorPosition().column}
          </span>
          <span class="character-count">
            {props.sql.length} 字符
          </span>
        </div>
      </div>

      {/* SQL模板快捷插入 */}
      <div class="template-toolbar">
        <span class="template-label">模板:</span>
        {sqlTemplates.map(template => (
          <button
            class="template-btn"
            onClick={() => insertTemplate(template.template)}
            disabled={props.disabled}
            title={`插入${template.name}模板`}
          >
            {template.name}
          </button>
        ))}
      </div>

      {/* 主编辑区域 */}
      <div class={`editor-container ${focused() ? 'focused' : ''} ${props.disabled ? 'disabled' : ''}`}>
        <textarea
          ref={textareaRef}
          class="sql-textarea"
          value={props.sql}
          onInput={handleSQLChange}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={props.disabled}
          placeholder="请输入SQL查询语句...

示例:
SELECT u.username, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.username, u.email
ORDER BY order_count DESC
LIMIT 10;"
          rows={15}
          spellcheck={false}
        />
        
        {/* 行号显示 */}
        <div class="line-numbers">
          {props.sql.split('\n').map((_, index) => (
            <div class="line-number">{index + 1}</div>
          ))}
        </div>
      </div>

      {/* 编辑器帮助提示 */}
      <div class="editor-help">
        <div class="help-item">
          <kbd>Tab</kbd> 缩进
        </div>
        <div class="help-item">
          <kbd>Ctrl+F</kbd> 格式化
        </div>
        <div class="help-item">
          <kbd>Enter</kbd> 自动缩进
        </div>
      </div>

      <style>{`
        .sql-editor {
          display: flex;
          flex-direction: column;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        }

        .editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .editor-label {
          font-weight: bold;
          color: #2c3e50;
        }

        .database-type {
          background: #3498db;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
        }

        .template-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f1f3f5;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }

        .template-label {
          color: #666;
          font-weight: bold;
        }

        .template-btn {
          background: #e9ecef;
          border: 1px solid #ced4da;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-btn:hover:not(:disabled) {
          background: #dee2e6;
          border-color: #adb5bd;
        }

        .template-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .editor-container {
          position: relative;
          flex: 1;
          min-height: 300px;
        }

        .editor-container.focused {
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .editor-container.disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .sql-textarea {
          width: 100%;
          height: 100%;
          padding: 12px 12px 12px 48px;
          border: none;
          outline: none;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          background: transparent;
        }

        .line-numbers {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 36px;
          background: #f8f9fa;
          border-right: 1px solid #e9ecef;
          padding: 12px 4px;
          user-select: none;
          overflow: hidden;
        }

        .line-number {
          text-align: right;
          font-size: 12px;
          color: #6c757d;
          line-height: 1.5;
          padding-right: 8px;
        }

        .editor-help {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 6px;
          background: #f8f9fa;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #666;
        }

        .help-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        kbd {
          background: #e9ecef;
          border: 1px solid #ced4da;
          border-radius: 3px;
          padding: 2px 4px;
          font-size: 10px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}