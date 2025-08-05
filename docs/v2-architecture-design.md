# Jasper在线报表设计器 V2.0 架构设计文档

## 文档信息
- **项目名称**: Jasper在线报表设计器 V2.0
- **设计理念**: 代码质量优先 + 用户体验至上
- **创建日期**: 2025-08-05
- **架构原则**: 类型安全、编译时错误检查、零运行时异常

---

## 1. 现有架构问题分析

### 1.1 当前架构存在的问题

**前端问题：**
- ❌ React版本冲突频发（如刚遇到的ReactCurrentDispatcher错误）
- ❌ 复杂的状态管理容易出现竞态条件
- ❌ JavaScript运行时错误难以预防
- ❌ 依赖管理混乱（workspace + 外部依赖冲突）
- ❌ 类型检查不够严格，存在隐式any

**后端问题：**
- ❌ Spring Boot过于重量级，启动慢
- ❌ JVM内存开销大，部署复杂
- ❌ Java空指针异常风险
- ❌ 缺乏编译时保证的类型安全

**架构问题：**
- ❌ 前后端分离导致类型不一致
- ❌ 网络通信增加了故障点
- ❌ 复杂的异步状态同步

### 1.2 质量要求分析

**零错误目标：**
- 编译期捕获99%的错误
- 运行时异常接近零
- 类型安全贯穿整个应用
- 状态管理可预测
- 依赖管理简单可靠

---

## 2. 新架构技术选型

### 2.1 核心架构：Rust + Tauri

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri 应用                                │
├─────────────────────────────────────────────────────────────┤
│  前端层 (Solid.js + TypeScript)                            │
│  • 纯UI渲染和事件处理                                        │
│  • 类型安全的组件                                          │
│  • 编译时优化                                              │
├─────────────────────────────────────────────────────────────┤
│  通信层 (Tauri Commands)                                    │
│  • 类型安全的序列化                                        │
│  • 自动生成TypeScript类型定义                               │
├─────────────────────────────────────────────────────────────┤
│  后端层 (Rust Core)                                        │
│  • 报表引擎                                                │
│  • 业务逻辑                                                │
│  • 文件系统操作                                            │
│  • 数据库操作                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈详细选择

#### **后端核心：Rust**
```rust
// 优势示例：编译期保证的类型安全
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReportElement {
    pub id: ElementId,
    pub position: Position,
    pub size: Size,
    pub content: ElementContent,
    pub style: ElementStyle,
}

// 不可能的运行时错误
impl ReportElement {
    pub fn update_position(&mut self, new_pos: Position) -> Result<(), ValidationError> {
        new_pos.validate()?; // 编译器强制错误处理
        self.position = new_pos;
        Ok(())
    }
}
```

**选择Rust的理由：**
- ✅ 内存安全，无空指针、无数据竞争
- ✅ 零成本抽象，性能接近C++
- ✅ 强类型系统，编译期捕获错误
- ✅ 优秀的并发模型
- ✅ 丰富的生态（serde、tokio、sqlx等）

#### **前端：Solid.js + TypeScript**
```typescript
// 优势示例：响应式 + 类型安全
const ReportCanvas: Component<{
  elements: ReadonlyArray<ReportElement>
  selectedIds: ReadonlySet<ElementId>
}> = (props) => {
  // Solid.js的响应式系统，编译时优化
  const selectedElements = createMemo(() => 
    props.elements.filter(el => props.selectedIds.has(el.id))
  )
  
  return (
    <div class="canvas">
      <For each={props.elements}>
        {(element) => (
          <ElementRenderer 
            element={element}
            selected={props.selectedIds.has(element.id)}
            onSelect={(id) => invoke('select_element', { id })}
          />
        )}
      </For>
    </div>
  )
}
```

**选择Solid.js的理由：**
- ✅ 编译时优化，运行时开销极小
- ✅ 真正的响应式，无虚拟DOM复杂性
- ✅ 简单的心智模型，减少错误
- ✅ 优秀的TypeScript支持

#### **桌面应用：Tauri**
```rust
// 类型安全的前后端通信
#[tauri::command]
async fn create_element(
    element_type: ElementType,
    position: Position,
    state: State<'_, AppState>
) -> Result<ElementId, CommandError> {
    let mut app_state = state.lock().await;
    let element = ReportElement::new(element_type, position)?;
    let id = element.id.clone();
    app_state.add_element(element)?;
    Ok(id)
}
```

**选择Tauri的理由：**
- ✅ 轻量级，比Electron小90%
- ✅ 安全性高，沙盒化前端
- ✅ 类型安全的通信机制
- ✅ 原生性能和系统集成

---

## 3. 详细架构设计

### 3.1 项目结构

```
jasper-v2/
├── src-tauri/                  # Rust后端
│   ├── src/
│   │   ├── main.rs            # 应用入口
│   │   ├── commands/          # Tauri命令
│   │   │   ├── element.rs     # 元素操作
│   │   │   ├── template.rs    # 模板管理
│   │   │   ├── export.rs      # 报表导出
│   │   │   └── mod.rs
│   │   ├── core/              # 核心业务逻辑
│   │   │   ├── element.rs     # 元素模型
│   │   │   ├── canvas.rs      # 画布管理
│   │   │   ├── template.rs    # 模板引擎
│   │   │   ├── export/        # 导出引擎
│   │   │   │   ├── pdf.rs     # PDF导出
│   │   │   │   ├── jasper.rs  # JasperReports
│   │   │   │   └── mod.rs
│   │   │   └── mod.rs
│   │   ├── database/          # 数据层
│   │   │   ├── models.rs      # 数据模型
│   │   │   ├── migrations/    # 数据库迁移
│   │   │   └── mod.rs
│   │   ├── utils/             # 工具函数
│   │   └── errors.rs          # 错误定义
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                       # 前端源码
│   ├── components/           # UI组件
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── ElementRenderer.tsx
│   │   │   └── SelectionBox.tsx
│   │   ├── Panels/
│   │   │   ├── ComponentLibrary.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── DataPanel.tsx
│   │   ├── Toolbar/
│   │   │   ├── MainToolbar.tsx
│   │   │   └── ContextToolbar.tsx
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── ColorPicker.tsx
│   ├── stores/               # 状态管理
│   │   ├── app.ts           # 应用状态
│   │   ├── canvas.ts        # 画布状态
│   │   └── selection.ts     # 选择状态
│   ├── types/               # 类型定义
│   │   ├── element.ts       # 与Rust同步的类型
│   │   ├── canvas.ts
│   │   └── api.ts
│   ├── utils/               # 工具函数
│   │   ├── geometry.ts      # 几何计算
│   │   ├── validation.ts    # 数据验证
│   │   └── api.ts           # API调用封装
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 应用入口
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 3.2 类型系统设计

#### **共享类型定义**
```rust
// src-tauri/src/core/types.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ElementId(Uuid);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Position {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.x < 0.0 || self.y < 0.0 {
            return Err(ValidationError::InvalidPosition);
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ElementContent {
    Text { 
        content: String,
        font_family: String,
        font_size: f64,
    },
    Image { 
        src: String,
        alt: Option<String>,
    },
    Rectangle {
        fill_color: Option<String>,
        border_color: Option<String>,
        border_width: f64,
    },
    DataField {
        expression: String,
        format: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportElement {
    pub id: ElementId,
    pub position: Position,
    pub size: Size,
    pub content: ElementContent,
    pub z_index: i32,
    pub visible: bool,
}
```

```typescript
// src/types/element.ts - 自动生成或手动同步
export interface ElementId {
  readonly value: string
}

export interface Position {
  readonly x: number
  readonly y: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

export type ElementContent = 
  | { type: 'Text'; content: string; font_family: string; font_size: number }
  | { type: 'Image'; src: string; alt?: string }
  | { type: 'Rectangle'; fill_color?: string; border_color?: string; border_width: number }
  | { type: 'DataField'; expression: string; format?: string }

export interface ReportElement {
  readonly id: ElementId
  readonly position: Position
  readonly size: Size
  readonly content: ElementContent
  readonly z_index: number
  readonly visible: boolean
}
```

### 3.3 状态管理架构

#### **Rust状态管理**
```rust
// src-tauri/src/core/state.rs
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct AppState {
    canvas: Canvas,
    elements: HashMap<ElementId, ReportElement>,
    selected_ids: HashSet<ElementId>,
    clipboard: Vec<ReportElement>,
    undo_stack: Vec<StateSnapshot>,
    redo_stack: Vec<StateSnapshot>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            canvas: Canvas::default(),
            elements: HashMap::new(),
            selected_ids: HashSet::new(),
            clipboard: Vec::new(),
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        }
    }
    
    // 状态变更方法都返回Result，强制错误处理
    pub fn add_element(&mut self, element: ReportElement) -> Result<(), StateError> {
        if self.elements.contains_key(&element.id) {
            return Err(StateError::ElementAlreadyExists(element.id));
        }
        
        // 保存快照用于撤销
        self.save_snapshot();
        self.elements.insert(element.id.clone(), element);
        
        // 通知前端状态变化
        self.emit_state_change();
        Ok(())
    }
    
    pub fn select_element(&mut self, id: ElementId) -> Result<(), StateError> {
        if !self.elements.contains_key(&id) {
            return Err(StateError::ElementNotFound(id));
        }
        
        self.selected_ids.clear();
        self.selected_ids.insert(id);
        self.emit_state_change();
        Ok(())
    }
    
    fn save_snapshot(&mut self) {
        let snapshot = StateSnapshot {
            elements: self.elements.clone(),
            selected_ids: self.selected_ids.clone(),
            timestamp: std::time::Instant::now(),
        };
        
        self.undo_stack.push(snapshot);
        
        // 限制撤销栈大小
        if self.undo_stack.len() > 50 {
            self.undo_stack.remove(0);
        }
        
        // 清空重做栈
        self.redo_stack.clear();
    }
    
    fn emit_state_change(&self) {
        // 发送状态到前端
        let state_dto = AppStateDto {
            elements: self.elements.values().cloned().collect(),
            selected_ids: self.selected_ids.clone(),
            canvas_config: self.canvas.config.clone(),
        };
        
        // Tauri事件发送
        emit_all("state_changed", &state_dto);
    }
}
```

#### **前端状态管理**
```typescript
// src/stores/app.ts
import { createSignal, createEffect } from 'solid-js'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'

export interface AppState {
  readonly elements: ReadonlyArray<ReportElement>
  readonly selectedIds: ReadonlySet<ElementId>
  readonly canvasConfig: CanvasConfig
}

// 全局状态信号
const [appState, setAppState] = createSignal<AppState>({
  elements: [],
  selectedIds: new Set(),
  canvasConfig: defaultCanvasConfig,
})

// 监听Rust状态变化
listen<AppState>('state_changed', (event) => {
  setAppState(event.payload)
})

// 状态访问器
export const useAppState = () => appState

// 命令分发器 - 所有操作都通过Rust
export const commands = {
  async createElement(type: ElementType, position: Position): Promise<ElementId> {
    return await invoke('create_element', { element_type: type, position })
  },
  
  async selectElement(id: ElementId): Promise<void> {
    await invoke('select_element', { id })
  },
  
  async updateElement(id: ElementId, updates: Partial<ReportElement>): Promise<void> {
    await invoke('update_element', { id, updates })
  },
  
  async deleteElements(ids: ElementId[]): Promise<void> {
    await invoke('delete_elements', { ids })
  },
  
  async undo(): Promise<void> {
    await invoke('undo')
  },
  
  async redo(): Promise<void> {
    await invoke('redo')
  },
}
```

### 3.4 Canvas渲染引擎

#### **基于SVG的高性能渲染**
```typescript
// src/components/Canvas/Canvas.tsx
import { For, createMemo } from 'solid-js'
import { useAppState, commands } from '../../stores/app'

const Canvas: Component = () => {
  const state = useAppState()
  
  // 计算可见元素（视窗裁剪）
  const visibleElements = createMemo(() => 
    state().elements.filter(el => 
      el.visible && isInViewport(el, state().canvasConfig.viewport)
    )
  )
  
  const handleCanvasClick = (event: MouseEvent) => {
    const rect = (event.target as SVGElement).getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    
    // 检查是否点击了元素
    const clickedElement = findElementAtPosition(state().elements, position)
    if (clickedElement) {
      commands.selectElement(clickedElement.id)
    } else {
      commands.clearSelection()
    }
  }
  
  return (
    <div class="canvas-container">
      <svg 
        width={state().canvasConfig.width}
        height={state().canvasConfig.height}
        viewBox={`0 0 ${state().canvasConfig.width} ${state().canvasConfig.height}`}
        onClick={handleCanvasClick}
      >
        {/* 网格背景 */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* 元素渲染 */}
        <For each={visibleElements()}>
          {(element) => (
            <ElementRenderer 
              element={element}
              selected={state().selectedIds.has(element.id)}
            />
          )}
        </For>
        
        {/* 选择框 */}
        <SelectionBox selectedIds={state().selectedIds} elements={state().elements} />
      </svg>
    </div>
  )
}
```

#### **元素渲染器**
```typescript
// src/components/Canvas/ElementRenderer.tsx
const ElementRenderer: Component<{
  element: ReportElement
  selected: boolean
}> = (props) => {
  const renderContent = () => {
    const { content, position, size } = props.element
    
    switch (content.type) {
      case 'Text':
        return (
          <text
            x={position.x}
            y={position.y + content.font_size * 0.8} // 基线调整
            font-family={content.font_family}
            font-size={content.font_size}
            fill="currentColor"
          >
            {content.content}
          </text>
        )
        
      case 'Rectangle':
        return (
          <rect
            x={position.x}
            y={position.y}
            width={size.width}
            height={size.height}
            fill={content.fill_color || 'transparent'}
            stroke={content.border_color || '#000'}
            stroke-width={content.border_width}
          />
        )
        
      case 'Image':
        return (
          <image
            x={position.x}
            y={position.y}
            width={size.width}
            height={size.height}
            href={content.src}
          />
        )
        
      default:
        const _exhaustive: never = content
        throw new Error(`Unknown content type: ${_exhaustive}`)
    }
  }
  
  return (
    <g 
      class={`element ${props.selected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        commands.selectElement(props.element.id)
      }}
    >
      {renderContent()}
      
      {/* 选中状态的控制手柄 */}
      {props.selected && (
        <ResizeHandles 
          element={props.element}
          onResize={(newSize) => 
            commands.updateElement(props.element.id, { size: newSize })
          }
        />
      )}
    </g>
  )
}
```

### 3.5 报表导出引擎

#### **PDF导出**
```rust
// src-tauri/src/core/export/pdf.rs
use printpdf::*;
use crate::core::element::ReportElement;

pub struct PdfExporter {
    page_width: f64,
    page_height: f64,
}

impl PdfExporter {
    pub fn new(width: f64, height: f64) -> Self {
        Self {
            page_width: width,
            page_height: height,
        }
    }
    
    pub fn export_elements(&self, elements: &[ReportElement]) -> Result<Vec<u8>, ExportError> {
        let (doc, page, layer) = PdfDocument::new(
            "Jasper Report",
            Mm(self.page_width), 
            Mm(self.page_height),
            "Layer 1"
        );
        
        let current_layer = doc.get_page(page).get_layer(layer);
        
        // 按z-index排序渲染
        let mut sorted_elements = elements.to_vec();
        sorted_elements.sort_by_key(|e| e.z_index);
        
        for element in sorted_elements {
            self.render_element_to_pdf(&current_layer, &element)?;
        }
        
        let pdf_bytes = doc.save_to_bytes()
            .map_err(|e| ExportError::PdfGeneration(e.to_string()))?;
            
        Ok(pdf_bytes)
    }
    
    fn render_element_to_pdf(
        &self, 
        layer: &PdfLayerReference, 
        element: &ReportElement
    ) -> Result<(), ExportError> {
        match &element.content {
            ElementContent::Text { content, font_family, font_size } => {
                let font = doc.add_builtin_font(BuiltinFont::HelveticaBold)?;
                layer.use_text(
                    content,
                    *font_size,
                    Mm(element.position.x),
                    Mm(self.page_height - element.position.y), // PDF坐标系转换
                    &font
                );
            },
            ElementContent::Rectangle { fill_color, border_color, border_width } => {
                // 绘制矩形
                let rectangle = Rect::new(
                    Mm(element.position.x),
                    Mm(self.page_height - element.position.y - element.size.height),
                    Mm(element.size.width),
                    Mm(element.size.height),
                );
                layer.add_shape(rectangle);
            },
            _ => {
                // 其他元素类型的处理
            }
        }
        Ok(())
    }
}
```

#### **JasperReports集成**
```rust
// src-tauri/src/core/export/jasper.rs
use std::process::Command;
use crate::core::element::ReportElement;

pub struct JasperExporter {
    jasper_jar_path: String,
}

impl JasperExporter {
    pub fn export_to_jrxml(&self, elements: &[ReportElement]) -> Result<String, ExportError> {
        let jrxml = self.generate_jrxml(elements)?;
        Ok(jrxml)
    }
    
    fn generate_jrxml(&self, elements: &[ReportElement]) -> Result<String, ExportError> {
        let mut jrxml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports 
              http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
              name="JasperReport" pageWidth="595" pageHeight="842">
    <title>
        <band height="50">
"#);
        
        for element in elements {
            match &element.content {
                ElementContent::Text { content, font_family, font_size } => {
                    jrxml.push_str(&format!(r#"
            <staticText>
                <reportElement x="{}" y="{}" width="{}" height="{}"/>
                <textElement>
                    <font fontName="{}" size="{}"/>
                </textElement>
                <text><![CDATA[{}]]></text>
            </staticText>"#,
                        element.position.x as i32,
                        element.position.y as i32,
                        element.size.width as i32,
                        element.size.height as i32,
                        font_family,
                        *font_size as i32,
                        content
                    ));
                },
                ElementContent::DataField { expression, format } => {
                    jrxml.push_str(&format!(r#"
            <textField>
                <reportElement x="{}" y="{}" width="{}" height="{}"/>
                <textElement/>
                <textFieldExpression><![CDATA[{}]]></textFieldExpression>
            </textField>"#,
                        element.position.x as i32,
                        element.position.y as i32,
                        element.size.width as i32,
                        element.size.height as i32,
                        expression
                    ));
                },
                _ => {}
            }
        }
        
        jrxml.push_str(r#"
        </band>
    </title>
</jasperReport>"#);
        
        Ok(jrxml)
    }
}
```

---

## 4. 开发流程和质量保证

### 4.1 代码质量检查

#### **Rust端质量检查**
```toml
# src-tauri/Cargo.toml
[lints.rust]
unsafe_code = "forbid"  # 禁止unsafe代码
unused_variables = "deny"
dead_code = "deny"
missing_docs = "warn"

[lints.clippy]
all = "deny"
pedantic = "warn"
nursery = "warn"
```

#### **前端质量检查**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### 4.2 测试策略

#### **Rust单元测试**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_element_creation() {
        let element = ReportElement {
            id: ElementId::new(),
            position: Position { x: 100.0, y: 50.0 },
            size: Size { width: 200.0, height: 30.0 },
            content: ElementContent::Text {
                content: "Test".to_string(),
                font_family: "Arial".to_string(),
                font_size: 12.0,
            },
            z_index: 0,
            visible: true,
        };
        
        assert_eq!(element.position.x, 100.0);
        assert!(element.visible);
    }
    
    #[tokio::test]
    async fn test_state_operations() {
        let mut state = AppState::new();
        let element = create_test_element();
        
        let result = state.add_element(element.clone());
        assert!(result.is_ok());
        
        let result = state.add_element(element); // 重复添加应该失败
        assert!(result.is_err());
    }
}
```

#### **前端组件测试**
```typescript
// src/components/Canvas/ElementRenderer.test.tsx
import { render } from '@solidjs/testing-library'
import { ElementRenderer } from './ElementRenderer'

describe('ElementRenderer', () => {
  it('renders text element correctly', () => {
    const element: ReportElement = {
      id: { value: 'test-1' },
      position: { x: 100, y: 200 },
      size: { width: 150, height: 30 },
      content: {
        type: 'Text',
        content: 'Hello World',
        font_family: 'Arial',
        font_size: 14,
      },
      z_index: 0,
      visible: true,
    }
    
    const { getByText } = render(() => 
      <ElementRenderer element={element} selected={false} />
    )
    
    expect(getByText('Hello World')).toBeInTheDocument()
  })
})
```

### 4.3 CI/CD流程

```yaml
# .github/workflows/ci.yml
name: CI/CD

on: [push, pull_request]

jobs:
  rust-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Check formatting
        run: cargo fmt --check
      - name: Run clippy
        run: cargo clippy -- -D warnings
      - name: Run tests
        run: cargo test

  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npx tsc --noEmit
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build

  build-app:
    needs: [rust-check, frontend-check]
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - name: Setup Tauri environment
        uses: tauri-apps/tauri-action@v0
        with:
          tagName: v__VERSION__
          releaseName: 'Jasper Designer v__VERSION__'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
```

---

## 5. 部署和分发

### 5.1 构建配置

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Jasper Designer",
    "version": "2.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "copyFile": true,
        "createDir": true,
        "removeDir": true,
        "removeFile": true,
        "renameFile": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      }
    },
    "bundle": {
      "active": true,
      "category": "ProductivityApp",
      "copyright": "",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.jasper.designer",
      "longDescription": "",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    }
  }
}
```

### 5.2 自动更新机制

```rust
// src-tauri/src/main.rs
use tauri_plugin_updater::UpdaterExt;

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // 检查更新
            let handle = app.handle();
            tauri::async_runtime::spawn(async move {
                if let Ok(update) = handle.updater().check().await {
                    if update.is_update_available() {
                        println!("Update available: {}", update.latest_version());
                        
                        if let Err(e) = update.download_and_install().await {
                            eprintln!("Failed to update: {}", e);
                        }
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_element,
            commands::select_element,
            commands::update_element,
            commands::delete_elements,
            commands::export_pdf,
            commands::export_jrxml,
            commands::undo,
            commands::redo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 6. 开发路线图

### Phase 1: 核心架构搭建 (2-3周)
- [x] Tauri项目初始化
- [ ] Rust核心数据模型
- [ ] 基础的Tauri命令
- [ ] Solid.js前端框架
- [ ] 类型安全的通信层

### Phase 2: 基础编辑功能 (3-4周) 
- [ ] Canvas渲染引擎
- [ ] 元素创建和删除
- [ ] 基础的选择和移动
- [ ] 属性面板集成
- [ ] 撤销重做系统

### Phase 3: 高级编辑功能 (2-3周)
- [ ] 多选和群组操作
- [ ] 复制粘贴
- [ ] 对齐和分布
- [ ] 拖拽调整大小
- [ ] 键盘快捷键

### Phase 4: 报表导出 (2-3周)
- [ ] PDF导出引擎
- [ ] JasperReports集成
- [ ] 模板系统
- [ ] 数据绑定功能

### Phase 5: 优化和发布 (2周)
- [ ] 性能优化
- [ ] 用户体验改进
- [ ] 文档编写
- [ ] 打包和分发

### Phase 6: 企业级功能 (按需)
- [ ] 协作编辑
- [ ] 版本控制
- [ ] 插件系统
- [ ] 云端同步

---

## 7. 总结

这个V2.0架构通过以下方式实现了高代码质量目标：

### 7.1 错误预防机制
- **编译时检查**: Rust + 严格TypeScript捕获99%错误
- **类型安全**: 端到端类型安全，消除类型相关错误
- **内存安全**: Rust保证无内存泄漏、无空指针
- **状态一致性**: 单一数据源，避免状态同步错误

### 7.2 开发体验改进
- **即时反馈**: 编译器提供清晰的错误信息
- **重构安全**: 类型系统保证重构的正确性
- **工具支持**: 优秀的IDE支持和调试体验
- **测试友好**: 纯函数式设计便于测试

### 7.3 长期维护性
- **简单架构**: 清晰的职责分离
- **文档化**: 自文档化的类型系统
- **可扩展**: 模块化设计便于功能扩展
- **性能**: 编译时优化，运行时高效

通过这个架构，我们可以构建一个既高质量又高性能的报表设计器应用。