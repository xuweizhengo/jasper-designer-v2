// === 可视化查询构建器组件 ===
import { createSignal, createMemo, Show, For, onMount } from 'solid-js';
import { DatabaseSchema, DatabaseColumnInfo } from '../../api/data-sources';

interface VisualQueryBuilderProps {
  selectedTables: string[];
  schema: DatabaseSchema | null;
  onQueryChange: (sql: string) => void;
  disabled?: boolean;
}

interface SelectedField {
  table: string;
  column: string;
  alias?: string | undefined;
  aggregate?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT' | undefined;
}

interface JoinCondition {
  id: string;
  leftTable: string;
  leftColumn: string;
  rightTable: string;
  rightColumn: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

interface WhereCondition {
  id: string;
  table: string;
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value: string;
  logicalOperator: 'AND' | 'OR';
}

interface OrderByField {
  table: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

export default function VisualQueryBuilder(props: VisualQueryBuilderProps) {
  const [selectedFields, setSelectedFields] = createSignal<SelectedField[]>([]);
  const [joinConditions, setJoinConditions] = createSignal<JoinCondition[]>([]);
  const [whereConditions, setWhereConditions] = createSignal<WhereCondition[]>([]);
  const [orderByFields] = createSignal<OrderByField[]>([]);
  const [groupByFields] = createSignal<string[]>([]);
  const [limitValue, setLimitValue] = createSignal<number | undefined>(undefined);
  const [distinctMode, setDistinctMode] = createSignal(false);

  // 获取可用的表信息
  const availableTables = createMemo(() => {
    if (!props.schema?.schemas?.[0]?.tables) return [];
    return props.schema.schemas[0].tables.filter((table: any) => 
      props.selectedTables.includes(table.name)
    );
  });

  // 获取表的列信息
  const getTableColumns = (tableName: string): DatabaseColumnInfo[] => {
    const table = availableTables().find((t: any) => t.name === tableName);
    return table?.columns || [];
  };

  // 生成SQL查询
  const generateSQL = createMemo(() => {
    const tables = availableTables();
    if (tables.length === 0 || selectedFields().length === 0) {
      return '';
    }

    let sql = '';
    
    // SELECT 子句
    sql += distinctMode() ? 'SELECT DISTINCT ' : 'SELECT ';
    
    const fieldsClauses = selectedFields().map(field => {
      let fieldClause = `${field.table}.${field.column}`;
      
      if (field.aggregate) {
        if (field.aggregate === 'DISTINCT') {
          fieldClause = `DISTINCT ${fieldClause}`;
        } else {
          fieldClause = `${field.aggregate}(${fieldClause})`;
        }
      }
      
      if (field.alias) {
        fieldClause += ` AS ${field.alias}`;
      }
      
      return fieldClause;
    });
    
    sql += fieldsClauses.join(',\n       ');
    
    // FROM 子句
    sql += `\nFROM ${tables[0]?.name || 'table1'}`;
    
    // JOIN 子句
    const joins = joinConditions();
    for (const join of joins) {
      sql += `\n${join.joinType} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`;
    }
    
    // WHERE 子句
    const conditions = whereConditions();
    if (conditions.length > 0) {
      sql += '\nWHERE ';
      const conditionClauses = conditions.map((condition, index) => {
        let clause = '';
        
        if (index > 0) {
          clause += `${condition.logicalOperator} `;
        }
        
        clause += `${condition.table}.${condition.column} ${condition.operator}`;
        
        if (!['IS NULL', 'IS NOT NULL'].includes(condition.operator)) {
          if (condition.operator === 'IN') {
            clause += ` (${condition.value})`;
          } else if (condition.operator === 'LIKE') {
            clause += ` '%${condition.value}%'`;
          } else {
            clause += ` '${condition.value}'`;
          }
        }
        
        return clause;
      });
      
      sql += conditionClauses.join(' ');
    }
    
    // GROUP BY 子句
    const groupBy = groupByFields();
    if (groupBy.length > 0) {
      sql += `\nGROUP BY ${groupBy.join(', ')}`;
    }
    
    // ORDER BY 子句
    const orderBy = orderByFields();
    if (orderBy.length > 0) {
      const orderClauses = orderBy.map(field => 
        `${field.table}.${field.column} ${field.direction}`
      );
      sql += `\nORDER BY ${orderClauses.join(', ')}`;
    }
    
    // LIMIT 子句
    if (limitValue()) {
      sql += `\nLIMIT ${limitValue()}`;
    }
    
    return sql;
  });

  // 当SQL发生变化时通知父组件
  onMount(() => {
    // 初始化时自动选择一些字段
    autoSelectFields();
  });

  // 监听SQL变化
  const updateSQL = () => {
    props.onQueryChange(generateSQL());
  };

  // 自动选择字段
  const autoSelectFields = () => {
    const tables = availableTables();
    if (tables.length === 0) return;
    
    // 为每个表选择前3个字段
    const autoFields: SelectedField[] = [];
    tables.forEach((table: any) => {
      const columns = table.columns?.slice(0, 3) || [];
      columns.forEach((column: any) => {
        autoFields.push({
          table: table.name,
          column: column.name
        });
      });
    });
    
    setSelectedFields(autoFields);
    updateSQL();
  };

  // 添加字段
  const addField = () => {
    const tables = availableTables();
    if (tables.length === 0) return;
    
    const firstTable = tables[0];
    if (!firstTable) return;
    
    const firstColumn = firstTable.columns?.[0]?.name || 'id';
    
    setSelectedFields(prev => [...prev, {
      table: firstTable.name,
      column: firstColumn
    }]);
    updateSQL();
  };

  // 移除字段
  const removeField = (index: number) => {
    setSelectedFields(prev => prev.filter((_, i) => i !== index));
    updateSQL();
  };

  // 更新字段
  const updateField = (index: number, updates: Partial<SelectedField>) => {
    setSelectedFields(prev => prev.map((f, i) => {
      if (i === index) {
        const updated = { ...f, ...updates };
        // Handle undefined values explicitly
        if (updates.hasOwnProperty('aggregate') && updates.aggregate === undefined) {
          delete updated.aggregate;
        }
        if (updates.hasOwnProperty('alias') && updates.alias === undefined) {
          delete updated.alias;
        }
        return updated;
      }
      return f;
    }));
    updateSQL();
  };

  // 添加JOIN条件
  const addJoin = () => {
    const tables = availableTables();
    if (tables.length < 2) return;
    
    const leftTable = tables[0];
    const rightTable = tables[1];
    if (!leftTable || !rightTable) return;
    
    const leftColumn = leftTable.columns?.[0]?.name || 'id';
    const rightColumn = rightTable.columns?.[0]?.name || 'id';
    
    const newJoin: JoinCondition = {
      id: Date.now().toString(),
      leftTable: leftTable.name,
      leftColumn: leftColumn,
      rightTable: rightTable.name,
      rightColumn: rightColumn,
      joinType: 'INNER'
    };
    
    setJoinConditions(prev => [...prev, newJoin]);
    updateSQL();
  };

  // 移除JOIN条件
  const removeJoin = (id: string) => {
    setJoinConditions(prev => prev.filter(j => j.id !== id));
    updateSQL();
  };

  // 更新JOIN条件
  const updateJoin = (id: string, updates: Partial<JoinCondition>) => {
    setJoinConditions(prev => prev.map(j => 
      j.id === id ? { ...j, ...updates } : j
    ));
    updateSQL();
  };

  // 添加WHERE条件
  const addWhere = () => {
    const tables = availableTables();
    if (tables.length === 0) return;
    
    const firstTable = tables[0];
    if (!firstTable) return;
    
    const firstColumn = firstTable.columns?.[0]?.name || 'id';
    
    const newWhere: WhereCondition = {
      id: Date.now().toString(),
      table: firstTable.name,
      column: firstColumn,
      operator: '=',
      value: '',
      logicalOperator: 'AND'
    };
    
    setWhereConditions(prev => [...prev, newWhere]);
    updateSQL();
  };

  // 移除WHERE条件
  const removeWhere = (id: string) => {
    setWhereConditions(prev => prev.filter(w => w.id !== id));
    updateSQL();
  };

  // 更新WHERE条件
  const updateWhere = (id: string, updates: Partial<WhereCondition>) => {
    setWhereConditions(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ));
    updateSQL();
  };

  return (
    <div class="visual-query-builder">
      {/* 查询选项 */}
      <div class="query-options">
        <label class="option-checkbox">
          <input
            type="checkbox"
            checked={distinctMode()}
            onChange={(e) => {
              setDistinctMode(e.currentTarget.checked);
              updateSQL();
            }}
            disabled={props.disabled}
          />
          <span>去重查询 (DISTINCT)</span>
        </label>
      </div>

      {/* 字段选择 */}
      <div class="builder-section">
        <div class="section-header">
          <h4>📋 选择字段 (SELECT)</h4>
          <button 
            class="add-btn"
            onClick={addField}
            disabled={props.disabled}
          >
            + 添加字段
          </button>
        </div>
        
        <div class="fields-list">
          <For each={selectedFields()}>
            {(field, index) => (
              <div class="field-item">
                <select
                  value={field.table}
                  onChange={(e) => {
                    const tables = availableTables();
                    const firstTable = tables.find((t: any) => t.name === e.currentTarget.value);
                    const firstColumn = firstTable?.columns?.[0]?.name || 'id';
                    updateField(index(), { 
                      table: e.currentTarget.value,
                      column: firstColumn
                    });
                  }}
                  disabled={props.disabled}
                >
                  <For each={availableTables()}>
                    {(table) => <option value={table.name}>{table.name}</option>}
                  </For>
                </select>
                
                <span class="separator">.</span>
                
                <select
                  value={field.column}
                  onChange={(e) => updateField(index(), { column: e.currentTarget.value })}
                  disabled={props.disabled}
                >
                  <For each={getTableColumns(field.table)}>
                    {(column) => (
                      <option value={column.name}>
                        {column.name} ({column.data_type})
                      </option>
                    )}
                  </For>
                </select>
                
                <select
                  value={field.aggregate || ''}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    if (value === '') {
                      updateField(index(), { aggregate: undefined });
                    } else {
                      updateField(index(), { 
                        aggregate: value as SelectedField['aggregate']
                      });
                    }
                  }}
                  disabled={props.disabled}
                >
                  <option value="">无聚合</option>
                  <option value="COUNT">COUNT</option>
                  <option value="SUM">SUM</option>
                  <option value="AVG">AVG</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                  <option value="DISTINCT">DISTINCT</option>
                </select>
                
                <input
                  type="text"
                  placeholder="别名 (可选)"
                  value={field.alias || ''}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    if (value === '') {
                      updateField(index(), { alias: undefined });
                    } else {
                      updateField(index(), { alias: value });
                    }
                  }}
                  disabled={props.disabled}
                />
                
                <button 
                  class="remove-btn"
                  onClick={() => removeField(index())}
                  disabled={props.disabled}
                >
                  ×
                </button>
              </div>
            )}
          </For>
          
          <Show when={selectedFields().length === 0}>
            <div class="empty-message">
              <p>请选择要查询的字段</p>
              <button onClick={autoSelectFields} disabled={props.disabled}>
                自动选择字段
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* JOIN条件 */}
      <Show when={availableTables().length > 1}>
        <div class="builder-section">
          <div class="section-header">
            <h4>🔗 表关联 (JOIN)</h4>
            <button 
              class="add-btn"
              onClick={addJoin}
              disabled={props.disabled}
            >
              + 添加关联
            </button>
          </div>
          
          <div class="joins-list">
            <For each={joinConditions()}>
              {(join) => (
                <div class="join-item">
                  <select
                    value={join.joinType}
                    onChange={(e) => updateJoin(join.id, { 
                      joinType: e.currentTarget.value as JoinCondition['joinType'] 
                    })}
                    disabled={props.disabled}
                  >
                    <option value="INNER">INNER JOIN</option>
                    <option value="LEFT">LEFT JOIN</option>
                    <option value="RIGHT">RIGHT JOIN</option>
                    <option value="FULL">FULL JOIN</option>
                  </select>
                  
                  <div class="join-condition">
                    <select
                      value={join.leftTable}
                      onChange={(e) => updateJoin(join.id, { leftTable: e.currentTarget.value })}
                      disabled={props.disabled}
                    >
                      <For each={availableTables()}>
                        {(table) => <option value={table.name}>{table.name}</option>}
                      </For>
                    </select>
                    
                    <select
                      value={join.leftColumn}
                      onChange={(e) => updateJoin(join.id, { leftColumn: e.currentTarget.value })}
                      disabled={props.disabled}
                    >
                      <For each={getTableColumns(join.leftTable)}>
                        {(column) => <option value={column.name}>{column.name}</option>}
                      </For>
                    </select>
                    
                    <span>=</span>
                    
                    <select
                      value={join.rightTable}
                      onChange={(e) => updateJoin(join.id, { rightTable: e.currentTarget.value })}
                      disabled={props.disabled}
                    >
                      <For each={availableTables()}>
                        {(table) => <option value={table.name}>{table.name}</option>}
                      </For>
                    </select>
                    
                    <select
                      value={join.rightColumn}
                      onChange={(e) => updateJoin(join.id, { rightColumn: e.currentTarget.value })}
                      disabled={props.disabled}
                    >
                      <For each={getTableColumns(join.rightTable)}>
                        {(column) => <option value={column.name}>{column.name}</option>}
                      </For>
                    </select>
                  </div>
                  
                  <button 
                    class="remove-btn"
                    onClick={() => removeJoin(join.id)}
                    disabled={props.disabled}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* WHERE条件 */}
      <div class="builder-section">
        <div class="section-header">
          <h4>🔍 筛选条件 (WHERE)</h4>
          <button 
            class="add-btn"
            onClick={addWhere}
            disabled={props.disabled}
          >
            + 添加条件
          </button>
        </div>
        
        <div class="where-list">
          <For each={whereConditions()}>
            {(where, index) => (
              <div class="where-item">
                <Show when={index() > 0}>
                  <select
                    value={where.logicalOperator}
                    onChange={(e) => updateWhere(where.id, { 
                      logicalOperator: e.currentTarget.value as 'AND' | 'OR' 
                    })}
                    disabled={props.disabled}
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </Show>
                
                <select
                  value={where.table}
                  onChange={(e) => updateWhere(where.id, { table: e.currentTarget.value })}
                  disabled={props.disabled}
                >
                  <For each={availableTables()}>
                    {(table) => <option value={table.name}>{table.name}</option>}
                  </For>
                </select>
                
                <select
                  value={where.column}
                  onChange={(e) => updateWhere(where.id, { column: e.currentTarget.value })}
                  disabled={props.disabled}
                >
                  <For each={getTableColumns(where.table)}>
                    {(column) => <option value={column.name}>{column.name}</option>}
                  </For>
                </select>
                
                <select
                  value={where.operator}
                  onChange={(e) => updateWhere(where.id, { 
                    operator: e.currentTarget.value as WhereCondition['operator'] 
                  })}
                  disabled={props.disabled}
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="LIKE">LIKE</option>
                  <option value="IN">IN</option>
                  <option value="IS NULL">IS NULL</option>
                  <option value="IS NOT NULL">IS NOT NULL</option>
                </select>
                
                <Show when={!['IS NULL', 'IS NOT NULL'].includes(where.operator)}>
                  <input
                    type="text"
                    placeholder={where.operator === 'IN' ? '值1,值2,值3' : '值'}
                    value={where.value}
                    onInput={(e) => updateWhere(where.id, { value: e.currentTarget.value })}
                    disabled={props.disabled}
                  />
                </Show>
                
                <button 
                  class="remove-btn"
                  onClick={() => removeWhere(where.id)}
                  disabled={props.disabled}
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* 排序和限制 */}
      <div class="builder-section">
        <div class="section-header">
          <h4>⚙️ 其他选项</h4>
        </div>
        
        <div class="options-grid">
          <div class="option-group">
            <label>限制行数 (LIMIT):</label>
            <input
              type="number"
              placeholder="无限制"
              value={limitValue() || ''}
              onInput={(e) => {
                const value = parseInt(e.currentTarget.value) || undefined;
                setLimitValue(value);
                updateSQL();
              }}
              disabled={props.disabled}
              min="1"
              max="10000"
            />
          </div>
        </div>
      </div>

      <style>{`
        .visual-query-builder {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .query-options {
          display: flex;
          gap: 16px;
        }

        .option-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .builder-section {
          background: white;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #dee2e6;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }

        .section-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 14px;
        }

        .add-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
        }

        .add-btn:hover:not(:disabled) {
          background: #218838;
        }

        .field-item, .join-item, .where-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          flex-wrap: wrap;
        }

        .join-condition {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .separator {
          font-weight: bold;
          color: #6c757d;
        }

        select, input {
          padding: 4px 8px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 13px;
        }

        select {
          background: white;
        }

        input[type="text"] {
          min-width: 100px;
          flex: 1;
        }

        input[type="number"] {
          width: 100px;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 14px;
        }

        .remove-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .empty-message {
          text-align: center;
          padding: 20px;
          color: #6c757d;
        }

        .empty-message button {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          margin-top: 8px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .option-group label {
          font-weight: bold;
          color: #495057;
          font-size: 13px;
        }

        button:disabled, select:disabled, input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}