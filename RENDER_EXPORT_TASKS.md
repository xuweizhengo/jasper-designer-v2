# 渲染导出模块实施任务

## 当前Sprint（2025-09-13开始）

### Task 1: 实现SVG转换器 ⏳
**文件**: `src-tauri/src/preview/svg_converter.rs`

```rust
// 需要实现的方法
impl SvgConverter {
    pub fn element_to_svg(element: &ReportElement) -> Result<String, PreviewError> {
        match element.content {
            ElementContent::Text { .. } => self.convert_text(element),
            ElementContent::Rectangle { .. } => self.convert_rectangle(element),
            ElementContent::Line { .. } => self.convert_line(element),
            ElementContent::Image { .. } => self.convert_image(element),
            ElementContent::DataField { .. } => self.convert_data_field(element),
        }
    }
}
```

**验收标准**:
- [ ] 所有元素类型都能转换为有效SVG
- [ ] 样式属性正确映射
- [ ] 单元测试覆盖率>90%

### Task 2: 实现图片渲染器 ⏳
**文件**: `src-tauri/src/preview/formats/image.rs`

```rust
use resvg::{Tree, Options};
use tiny_skia::Pixmap;

pub async fn render_to_png(svg: &str, options: &ImageQuality) -> Result<Vec<u8>, PreviewError> {
    // 1. 解析SVG
    let tree = Tree::from_str(svg, &Options::default())?;

    // 2. 创建画布
    let pixmap = Pixmap::new(width, height)?;

    // 3. 渲染
    resvg::render(&tree, Transform::default(), &mut pixmap.as_mut());

    // 4. 编码为PNG
    pixmap.encode_png()
}
```

### Task 3: 实现PDF渲染器 ⏳
**文件**: `src-tauri/src/preview/formats/pdf/renderer.rs`

关键挑战:
- 中文字体嵌入
- 矢量图形保持
- 分页处理

### Task 4: 前端API集成 ⏳
**文件**: `src/api/preview.ts`

```typescript
export const PreviewAPI = {
    async generatePreview(request: PreviewRequest): Promise<RenderResult> {
        return await invoke('generate_preview', { request });
    },

    async exportToFile(request: PreviewRequest, filePath: string): Promise<string> {
        return await invoke('export_to_file', { request, filePath });
    }
};
```

## 测试用例

### 单元测试
```rust
#[test]
fn test_text_to_svg() {
    let element = create_text_element("Hello", 100.0, 100.0);
    let svg = SvgConverter::element_to_svg(&element).unwrap();
    assert!(svg.contains("<text"));
    assert!(svg.contains("Hello"));
}
```

### 集成测试
```rust
#[tokio::test]
async fn test_pdf_generation() {
    let elements = vec![create_text_element(), create_rect_element()];
    let pdf = render_to_pdf(&elements).await.unwrap();
    assert!(pdf.len() > 1000); // PDF should have content
}
```

## 性能目标
- SVG转换: <10ms per element
- PNG渲染: <200ms (4K resolution)
- PDF生成: <500ms (100 elements)
- 内存使用: <50MB base

## 依赖项
```toml
[dependencies]
resvg = "0.37"
tiny-skia = "0.11"
usvg = "0.37"
printpdf = "0.6"
image = "0.24"
tokio = { version = "1", features = ["full"] }
moka = { version = "0.12", features = ["sync"] }
```

## 风险和缓解
1. **中文字体问题** → 预先准备开源中文字体
2. **内存溢出** → 分批处理大文档
3. **性能瓶颈** → 实现渲染缓存

## 完成标准
- [ ] 能导出PDF文件
- [ ] 能导出PNG/JPG图片
- [ ] 前端有导出按钮
- [ ] 错误处理完善
- [ ] 性能达标