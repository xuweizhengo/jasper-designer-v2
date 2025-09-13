# 预览模式实施路线图

## 🎯 实施策略

### 分阶段渐进式实施
- **MVP优先**: 先实现核心功能（PDF + PNG）
- **增量交付**: 每个阶段都有可用的功能
- **风险控制**: 关键技术优先验证
- **质量保证**: 每阶段都有完整测试

## 📅 详细实施计划

### 🚀 Phase 1: 基础架构搭建 (3-4天)

#### Day 1: 项目准备和依赖配置
**目标**: 完成开发环境准备和核心依赖集成

**任务清单**:
- [ ] **1.1** 更新 Cargo.toml，添加预览相关依赖
  ```toml
  resvg = "0.37"
  tiny-skia = "0.11"  
  usvg = "0.37"
  printpdf = "0.6"
  image = "0.24"
  moka = { version = "0.12", features = ["sync"] }
  ```
- [ ] **1.2** 创建预览模块目录结构
- [ ] **1.3** 定义核心类型和错误处理
- [ ] **1.4** 建立单元测试框架

**验收标准**:
✅ 项目编译通过  
✅ 基础模块结构创建完成  
✅ 类型定义完整且编译通过  

**风险点**: 依赖版本兼容性  
**缓解措施**: 创建最小化测试项目验证依赖

---

#### Day 2-3: 核心渲染引擎
**目标**: 实现SVG转换和基础渲染能力

**任务清单**:
- [ ] **2.1** 实现 `SvgConverter` - 元素到SVG转换
  - 文本元素SVG化
  - 矩形、线条等形状转换  
  - 保持与ElementRenderer.tsx一致的渲染逻辑
- [ ] **2.2** 实现 `PreviewRenderer` 核心类
  - SVG解析和优化
  - 缓存系统集成
  - 错误处理机制
- [ ] **2.3** 基础PNG渲染器实现
- [ ] **2.4** 单元测试覆盖核心功能

**验收标准**:
✅ 能将ReportElement转换为有效SVG  
✅ SVG能正确渲染为PNG图片  
✅ 基础缓存功能正常工作  
✅ 单元测试覆盖率 >80%

**关键测试**:
```rust
#[test]
fn test_text_element_to_svg() {
    let element = create_test_text_element();
    let svg = SvgConverter::element_to_svg(&element).unwrap();
    assert!(svg.contains("<text"));
    assert!(svg.contains("font-family"));
}

#[test]
fn test_png_rendering_performance() {
    let svg = create_test_svg();
    let start = Instant::now();
    let _png = render_to_png(&svg).unwrap();
    let duration = start.elapsed();
    assert!(duration.as_millis() < 200); // <200ms目标
}
```

---

#### Day 4: PDF渲染器实现
**目标**: 实现高质量PDF输出

**任务清单**:
- [ ] **3.1** 实现 `PdfRenderer` 类
  - PDF页面设置和布局
  - 字体嵌入和管理
  - 矢量图形渲染
- [ ] **3.2** PDF选项配置系统
- [ ] **3.3** PDF质量优化
- [ ] **3.4** PDF输出测试

**验收标准**:
✅ PDF生成时间 <500ms (100个元素)  
✅ PDF文件大小合理 (<5MB标准文档)  
✅ 字体正确嵌入，无乱码  
✅ 矢量图形保持清晰度

**关键测试**:
```rust
#[test]
fn test_pdf_generation_performance() {
    let elements = create_100_test_elements();
    let start = Instant::now();
    let _pdf = render_to_pdf(&elements).unwrap();
    let duration = start.elapsed();
    assert!(duration.as_millis() < 500);
}

#[test]
fn test_pdf_font_embedding() {
    let pdf_data = render_text_to_pdf("测试中文").unwrap();
    // 验证PDF包含字体信息
    assert!(pdf_contains_embedded_fonts(&pdf_data));
}
```

---

### 🎨 Phase 2: 前端集成 (2-3天)

#### Day 5-6: 预览UI组件
**目标**: 实现完整的预览用户界面

**任务清单**:
- [ ] **4.1** 更新 PreviewModeContext.tsx
  - 移除"即将推出"占位符
  - 启用真实预览模式
- [ ] **4.2** 创建 PreviewRenderer.tsx 组件
  - 预览画布显示
  - 格式选择器  
  - 质量设置面板
- [ ] **4.3** 实现预览控制面板
  - 渲染选项配置
  - 导出功能按钮
  - 进度指示器
- [ ] **4.4** 集成Tauri命令调用

**验收标准**:
✅ 预览模式完全可用，无占位符  
✅ 用户能选择不同输出格式  
✅ 预览结果正确显示  
✅ 导出功能正常工作

**关键组件**:
```typescript
// PreviewRenderer.tsx 核心实现
const PreviewRenderer: Component = () => {
  const { state } = useAppContext();
  const [renderResult, setRenderResult] = createSignal<RenderResult>();
  
  const generatePreview = async () => {
    const request: PreviewRequest = {
      elements: state.elements,
      canvasConfig: state.canvas_config,
      options: renderOptions(),
      useCache: true,
    };
    
    const result = await PreviewAPI.generatePreview(request);
    setRenderResult(result);
  };
  
  return (
    <div class="preview-container">
      <PreviewCanvas result={renderResult()} />
      <PreviewControls onRender={generatePreview} />
    </div>
  );
};
```

---

#### Day 7: Tauri命令集成
**目标**: 完善前后端通信

**任务清单**:
- [ ] **5.1** 实现所有预览相关Tauri命令
- [ ] **5.2** 添加命令到main.rs注册列表
- [ ] **5.3** 创建PreviewAPI TypeScript封装
- [ ] **5.4** 实现usePreview Hook
- [ ] **5.5** 错误处理和用户反馈

**验收标准**:
✅ 所有命令正确注册和调用  
✅ 错误处理完善，用户体验良好  
✅ API调用性能满足要求  
✅ TypeScript类型安全

**命令注册**:
```rust
// main.rs 更新
.invoke_handler(tauri::generate_handler![
    // 现有命令...
    commands::preview::generate_preview,
    commands::preview::batch_render,
    commands::preview::generate_thumbnail,
    commands::preview::get_supported_formats,
    commands::preview::get_default_render_options,
    commands::preview::export_to_file,
])
```

---

### 📊 Phase 3: Excel集成 (2天)

#### Day 8-9: Excel渲染器
**目标**: 实现Excel格式导出

**任务清单**:
- [ ] **6.1** 实现 `ExcelRenderer` 类
  - 单元格映射策略
  - 格式化保持
  - 工作表布局优化
- [ ] **6.2** Excel选项配置界面  
- [ ] **6.3** Excel导出测试和优化
- [ ] **6.4** 大数据量处理优化

**验收标准**:
✅ Excel导出功能正常工作  
✅ 格式化信息正确保持  
✅ 大数据量导出稳定 (>1000行)  
✅ 导出时间 <1秒 (标准文档)

**关键实现**:
```rust
impl FormatRenderer for ExcelRenderer {
    async fn render(&self, elements: &[ReportElement], options: &RenderOptions) -> Result<Vec<u8>, PreviewError> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet().set_name("Report")?;
        
        // 智能布局算法
        let layout = self.calculate_optimal_layout(elements);
        
        for element in elements {
            match element.content.type {
                ContentType::Text => self.render_text_to_cell(worksheet, element, &layout)?,
                ContentType::DataField => self.render_data_field(worksheet, element, &layout)?,
                // ...
            }
        }
        
        workbook.save_to_buffer()
    }
}
```

---

### ⚡ Phase 4: 性能优化 (2天)

#### Day 10-11: 缓存和并发优化
**目标**: 达到性能目标指标

**任务清单**:
- [ ] **7.1** 实现智能缓存系统
  - 元素级别缓存
  - SVG缓存优化  
  - LRU策略实现
- [ ] **7.2** 并发渲染优化
  - 多线程任务队列
  - 优先级调度
  - 内存池管理
- [ ] **7.3** 内存使用优化
  - 内存泄漏检测
  - 大文档处理优化
  - 垃圾回收策略
- [ ] **7.4** 性能基准测试

**验收标准**:
✅ PDF生成 <500ms (100个元素)  
✅ PNG输出 <200ms (4K分辨率)  
✅ 内存使用 <50MB (基础), <200MB (峰值)  
✅ 缓存命中率 >90%

**缓存系统**:
```rust
pub struct RenderCache {
    element_cache: moka::sync::Cache<String, CachedElement>,
    svg_cache: moka::sync::Cache<String, String>,
    output_cache: moka::sync::Cache<CacheKey, Vec<u8>>,
}

impl RenderCache {
    pub fn get_or_render<F>(&self, key: CacheKey, render_fn: F) -> Result<Vec<u8>, CacheError>
    where F: FnOnce() -> Result<Vec<u8>, RenderError> 
    {
        if let Some(cached) = self.output_cache.get(&key) {
            return Ok(cached);
        }
        
        let result = render_fn()?;
        self.output_cache.insert(key, result.clone());
        Ok(result)
    }
}
```

---

### 🧪 Phase 5: 测试和质量保证 (2天)

#### Day 12-13: 全面测试
**目标**: 确保功能稳定性和质量

**任务清单**:
- [ ] **8.1** 单元测试完善
  - 所有核心函数测试覆盖
  - 边界条件测试  
  - 错误处理测试
- [ ] **8.2** 集成测试
  - 端到端渲染测试
  - 多格式输出测试
  - 性能回归测试
- [ ] **8.3** 用户验收测试
  - 复杂布局测试
  - 大文档压力测试
  - 用户界面测试
- [ ] **8.4** 文档和示例

**测试覆盖目标**:
✅ 单元测试覆盖率 >90%  
✅ 集成测试覆盖所有关键路径  
✅ 性能测试通过基准要求  
✅ 用户验收测试通过

**关键测试用例**:
```rust
#[tokio::test]
async fn test_complex_document_rendering() {
    let elements = create_complex_test_document(); // 1000个元素
    
    let pdf_result = render_to_pdf(&elements).await?;
    assert!(pdf_result.render_time_ms < 2000); // 复杂文档<2s
    
    let png_result = render_to_png(&elements).await?;
    assert!(png_result.metadata.dimensions.width > 0);
    
    // 验证视觉一致性
    let visual_diff = compare_outputs(&pdf_result, &png_result);
    assert!(visual_diff < 0.01); // <1%差异
}

#[tokio::test] 
async fn test_memory_stability() {
    let initial_memory = get_memory_usage();
    
    // 连续渲染100次
    for _ in 0..100 {
        let _result = render_to_pdf(&test_elements).await?;
    }
    
    let final_memory = get_memory_usage();
    let memory_growth = final_memory - initial_memory;
    
    assert!(memory_growth < 10_000_000); // <10MB增长
}
```

---

## 🎯 每日检查点 (Daily Checkpoints)

### 每日完成标准
- [ ] **代码质量**: 无编译错误，无警告
- [ ] **测试通过**: 所有相关测试通过
- [ ] **文档更新**: README和注释保持最新
- [ ] **性能达标**: 关键指标不退化
- [ ] **功能验证**: 新功能手动验证通过

### 每日风险评估
- 🔴 **高风险**: 阻塞后续开发的问题
- 🟡 **中风险**: 可能影响进度的问题  
- 🟢 **低风险**: 不影响主流程的问题

---

## 📊 里程碑验收标准

### 🏁 Phase 1 完成标准
- [x] PDF和PNG基础渲染功能完成
- [x] 渲染性能达到基准要求
- [x] 核心缓存系统正常工作
- [x] 单元测试覆盖率 >80%

### 🏁 Phase 2 完成标准  
- [x] 预览模式UI完全可用
- [x] 用户能正常切换格式和配置
- [x] 前后端通信稳定
- [x] 错误处理完善

### 🏁 Phase 3 完成标准
- [x] Excel导出功能正常
- [x] 支持复杂数据结构导出
- [x] Excel格式化保持正确
- [x] 导出性能满足要求

### 🏁 Phase 4 完成标准
- [x] 所有性能指标达标
- [x] 内存使用稳定  
- [x] 并发处理无问题
- [x] 缓存效率优化

### 🏁 Phase 5 完成标准
- [x] 测试覆盖率 >90%
- [x] 所有验收测试通过
- [x] 文档完整准确
- [x] 用户体验良好

---

## 🚨 风险预案

### 技术风险缓解
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 渲染库兼容性问题 | 中 | 高 | 提前POC验证，准备备选方案 |
| 性能不达标 | 低 | 高 | 分步优化，关键指标监控 |
| 内存泄漏 | 中 | 中 | 严格测试，内存监控工具 |
| 字体渲染问题 | 中 | 中 | 标准字体库，回退机制 |

### 时间风险缓解
- **缓冲时间**: 每阶段预留20%缓冲
- **并行开发**: 前后端可部分并行  
- **MVP策略**: 优先核心功能，非核心功能可延后
- **技术债务**: 记录但不影响主线开发

---

## 📈 成功度量指标

### 功能指标
- ✅ 支持格式数: 目标4种 (PDF, PNG, Excel, JPG)
- ✅ 功能完整性: 100%核心功能可用
- ✅ 兼容性: 100%现有元素支持

### 性能指标  
- ✅ PDF生成: <500ms (100个元素)
- ✅ PNG输出: <200ms (4K分辨率)
- ✅ 内存使用: <50MB基础, <200MB峰值
- ✅ 缓存命中率: >90%

### 质量指标
- ✅ 测试覆盖率: >90%
- ✅ Bug数量: <5个严重bug
- ✅ 用户满意度: >4.5/5.0

### 开发效率指标
- ✅ 按时完成率: >90%
- ✅ 代码review通过率: >95%  
- ✅ 文档完整性: 100%

---

## 🎯 最终交付清单

### 代码交付
- [ ] 完整的Rust后端预览模块
- [ ] TypeScript前端预览组件
- [ ] 完整的单元测试和集成测试
- [ ] 性能测试基准套件

### 文档交付  
- [ ] API文档 (自动生成)
- [ ] 用户使用指南
- [ ] 开发者文档  
- [ ] 架构设计文档

### 质量保证
- [ ] 性能测试报告
- [ ] 兼容性测试报告
- [ ] 安全审计报告
- [ ] 用户验收测试报告

---

**实施开始日期**: 2025-09-11  
**预计完成日期**: 2025-09-25 (13个工作日)  
**负责人**: Claude Code Assistant  
**状态**: 准备开始实施