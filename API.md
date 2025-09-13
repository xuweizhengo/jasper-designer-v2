# Jasper Designer API 文档

## Tauri Commands API

### 元素操作
```typescript
// 创建元素
invoke('create_element', {
  element_type: string,
  position: Position,
  size: Size,
  content_data: Record<string, any>
})

// 更新元素
invoke('update_element', {
  id: string,
  updates: Record<string, any>
})

// 删除元素
invoke('delete_elements', { ids: string[] })

// 选择元素
invoke('select_elements', { ids: string[] })
```

### 画布操作
```typescript
// 更新画布配置
invoke('update_canvas_config', {
  zoom?: number,
  offset_x?: number,
  offset_y?: number,
  show_grid?: boolean
})

// 清空画布
invoke('clear_canvas')
```

### 撤销/重做
```typescript
invoke('undo')
invoke('redo')
invoke('can_undo') // -> boolean
invoke('can_redo') // -> boolean
```

### 数据源（待实现）
```typescript
// 测试连接
invoke('test_database_connection', { config: DatabaseConfig })

// 执行查询
invoke('execute_query', {
  source_id: string,
  query: string
})

// 获取数据
invoke('fetch_data', {
  source_id: string,
  options: FetchOptions
})
```

### 导出（待实现）
```typescript
// 生成预览
invoke('generate_preview', {
  elements: ReportElement[],
  options: RenderOptions
})

// 导出文件
invoke('export_to_file', {
  format: 'pdf' | 'png' | 'excel',
  options: ExportOptions
})
```

## 前端 Hooks

### useAppContext
管理应用状态和元素操作

### usePreview
预览模式控制

### useDataContext
数据源管理

## WebSocket Events（规划中）
- 实时协作
- 数据更新推送
- 导出进度