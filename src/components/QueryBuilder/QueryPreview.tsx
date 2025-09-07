// === 查询结果预览组件 ===
import { createSignal, Show, For, createMemo } from 'solid-js';
import { QueryResult } from '../../api/data-sources';

interface QueryPreviewProps {
  result: QueryResult;
  onClose?: () => void;
}

export default function QueryPreview(props: QueryPreviewProps) {
  const [currentPage, setCurrentPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(10);
  const [sortColumn, setSortColumn] = createSignal<string | null>(null);
  const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc'>('asc');

  // 计算分页数据
  const paginatedData = createMemo(() => {
    let data = [...props.result.rows];
    
    // 排序
    if (sortColumn()) {
      const col = sortColumn()!;
      data.sort((a, b) => {
        const aVal = a[col];
        const bVal = b[col];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection() === 'asc' ? comparison : -comparison;
      });
    }
    
    // 分页
    const start = (currentPage() - 1) * pageSize();
    const end = start + pageSize();
    
    return {
      data: data.slice(start, end),
      totalPages: Math.ceil(data.length / pageSize()),
      totalRows: data.length
    };
  });

  // 处理列头点击排序
  const handleColumnSort = (column: string) => {
    if (sortColumn() === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 格式化数据值显示
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    
    if (typeof value === 'number') {
      // 如果是整数，直接显示
      if (Number.isInteger(value)) {
        return value.toLocaleString();
      }
      // 如果是小数，保留适当位数
      return value.toFixed(2);
    }
    
    const str = String(value);
    
    // 如果是日期字符串，尝试格式化
    if (str.match(/^\d{4}-\d{2}-\d{2}/) || str.includes('T')) {
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('zh-CN');
        }
      } catch (e) {
        // 忽略日期解析错误
      }
    }
    
    // 长文本截断
    if (str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    
    return str;
  };

  // 获取数据类型
  const getDataType = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
    if (typeof value === 'object') return 'object';
    
    const str = String(value);
    if (str.match(/^\d{4}-\d{2}-\d{2}/) || str.includes('T')) {
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) return 'datetime';
      } catch (e) {}
    }
    
    return 'string';
  };

  // 导出为CSV
  const exportToCSV = () => {
    const headers = props.result.columns.join(',');
    const rows = props.result.rows.map(row => 
      props.result.columns.map(col => {
        const value = row[col];
        const str = formatCellValue(value);
        // 如果包含逗号或引号，需要用引号包围并转义
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
    
    const csv = headers + '\n' + rows;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div class="query-preview">
      {/* 预览头部 */}
      <div class="preview-header">
        <div class="header-info">
          <h4>📊 查询结果预览</h4>
          <div class="result-stats">
            <span class="stat-item">
              📋 {(props.result as any).totalCount ?? (props.result as any).total_rows} 行数据
            </span>
            <span class="stat-item">
              📊 {props.result.columns.length} 列
            </span>
            <span class="stat-item">
              ⏱️ {props.result.execution_time}ms
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            class="action-btn export-btn"
            onClick={exportToCSV}
            title="导出为CSV文件"
          >
            📤 导出CSV
          </button>
          
          <Show when={props.onClose}>
            <button 
              class="action-btn close-btn"
              onClick={props.onClose}
              title="关闭预览"
            >
              ✕
            </button>
          </Show>
        </div>
      </div>

      {/* 查询信息 */}
      <div class="query-info">
        <details>
          <summary>🔍 查询详情</summary>
          <div class="query-details">
            <div class="query-sql">
              <strong>SQL查询:</strong>
              <pre class="sql-code">{props.result.query}</pre>
            </div>
            <div class="query-metadata">
              <div class="metadata-item">
                <strong>执行时间:</strong> {props.result.execution_time}ms
              </div>
              <div class="metadata-item">
                <strong>返回行数:</strong> {(props.result as any).totalCount ?? (props.result as any).total_rows}
              </div>
              <div class="metadata-item">
                <strong>列数量:</strong> {props.result.columns.length}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* 数据表格 */}
      <div class="table-container">
        <Show 
          when={props.result.rows.length > 0}
          fallback={
            <div class="empty-result">
              <div class="empty-icon">📭</div>
              <div class="empty-text">查询未返回任何数据</div>
              <div class="empty-hint">请检查查询条件或数据源</div>
            </div>
          }
        >
          <table class="result-table">
            <thead>
              <tr>
                <For each={props.result.columns}>
                  {(column) => (
                    <th 
                      class={`sortable ${sortColumn() === column ? `sorted-${sortDirection()}` : ''}`}
                      onClick={() => handleColumnSort(column)}
                      title={`点击排序 ${column}`}
                    >
                      <div class="column-header">
                        <span class="column-name">{column}</span>
                        <span class="sort-indicator">
                          {sortColumn() === column ? (
                            sortDirection() === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </div>
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={paginatedData().data}>
                {(row, rowIndex) => (
                  <tr class={rowIndex() % 2 === 0 ? 'even' : 'odd'}>
                    <For each={props.result.columns}>
                      {(column) => (
                        <td 
                          class={`cell-${getDataType(row[column])}`}
                          title={`${column}: ${formatCellValue(row[column])}`}
                        >
                          {formatCellValue(row[column])}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      {/* 分页控制 */}
      <Show when={paginatedData().totalPages > 1}>
        <div class="pagination">
          <div class="pagination-info">
            显示 {(currentPage() - 1) * pageSize() + 1} - {Math.min(currentPage() * pageSize(), paginatedData().totalRows)} 
            / {paginatedData().totalRows} 行
          </div>
          
          <div class="pagination-controls">
            <select 
              value={pageSize()}
              onChange={(e) => {
                setPageSize(parseInt(e.currentTarget.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10行/页</option>
              <option value={25}>25行/页</option>
              <option value={50}>50行/页</option>
              <option value={100}>100行/页</option>
            </select>
            
            <div class="page-buttons">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage() === 1}
              >
                首页
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage() === 1}
              >
                上一页
              </button>
              
              <span class="page-info">
                {currentPage()} / {paginatedData().totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(paginatedData().totalPages, prev + 1))}
                disabled={currentPage() === paginatedData().totalPages}
              >
                下一页
              </button>
              <button 
                onClick={() => setCurrentPage(paginatedData().totalPages)}
                disabled={currentPage() === paginatedData().totalPages}
              >
                末页
              </button>
            </div>
          </div>
        </div>
      </Show>

      <style>{`
        .query-preview {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .header-info h4 {
          margin: 0 0 8px 0;
          color: #2c3e50;
        }

        .result-stats {
          display: flex;
          gap: 16px;
          font-size: 13px;
        }

        .stat-item {
          color: #6c757d;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .close-btn:hover {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .query-info {
          padding: 12px 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .query-details {
          margin-top: 8px;
        }

        .query-sql {
          margin-bottom: 12px;
        }

        .sql-code {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 12px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 12px;
          overflow-x: auto;
          margin: 4px 0;
        }

        .query-metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          font-size: 13px;
        }

        .metadata-item {
          color: #495057;
        }

        .table-container {
          overflow: auto;
          max-height: 500px;
        }

        .result-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .result-table th {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .result-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .result-table th.sortable:hover {
          background: #e9ecef;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sort-indicator {
          opacity: 0.5;
          font-size: 12px;
        }

        .result-table th.sorted-asc .sort-indicator,
        .result-table th.sorted-desc .sort-indicator {
          opacity: 1;
          color: #007bff;
        }

        .result-table td {
          border: 1px solid #dee2e6;
          padding: 6px 12px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-table tr.even {
          background: #f8f9fa;
        }

        .result-table tr:hover {
          background: #e3f2fd;
        }

        .cell-null {
          color: #6c757d;
          font-style: italic;
        }

        .cell-boolean {
          text-align: center;
          font-weight: bold;
        }

        .cell-integer, .cell-float {
          text-align: right;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .cell-datetime {
          font-family: 'Monaco', 'Consolas', monospace;
          color: #6f42c1;
        }

        .cell-object {
          font-family: 'Monaco', 'Consolas', monospace;
          color: #e83e8c;
        }

        .empty-result {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .empty-hint {
          font-size: 14px;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          font-size: 13px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-buttons button {
          padding: 4px 8px;
          border: 1px solid #ced4da;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .page-buttons button:hover:not(:disabled) {
          background: #e9ecef;
        }

        .page-buttons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .page-info {
          margin: 0 8px;
          font-weight: 500;
        }

        details summary {
          cursor: pointer;
          font-weight: 500;
          color: #495057;
        }

        details[open] summary {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
