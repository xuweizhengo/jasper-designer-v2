# Jasper Designer V2 架构重构指导文档

## 概述

本文档描述了 Jasper Designer V2 渲染系统的架构重构方案，旨在解决当前存在的架构冲突、类型不匹配和线程安全问题。

## 当前问题

1. **架构设计冲突**：存在两套不兼容的数据模型
   - `skia_export.rs`：面向前端的Web友好模型
   - `renderer/types.rs`：面向Skia的抽象模型

2. **线程安全问题**：Skia的Surface和FontMgr不支持Send trait

3. **类型系统缺陷**：大量字段缺失和命名不一致

## 新架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         Frontend (TypeScript)        │
└──────────────┬──────────────────────┘
               │ invoke
┌──────────────▼──────────────────────┐
│      API Layer (Commands)           │
│   保持Web友好的接口定义              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Domain Layer (Core Models)      │
│   统一的业务领域模型                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Adapter Layer (Converters)       │
│   各种格式转换适配器                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Renderer Layer (Implementations)   │
│   Skia, Canvas, PDF等具体实现        │
└─────────────────────────────────────┘
```

## 核心组件设计

### 1. 领域模型 (Domain Models)

位置：`src-tauri/src/core/models.rs`

```rust
// 核心元素模型
pub struct Element {
    pub id: ElementId,
    pub element_type: ElementType,
    pub geometry: Geometry,
    pub style: Style,
    pub content: Option<Content>,
    pub metadata: Metadata,
    pub children: Vec<Element>,
}

// 几何信息
pub struct Geometry {
    pub bounds: Rectangle,      // 位置和大小
    pub transform: Transform,    // 变换矩阵
    pub clip: Option<ClipPath>, // 裁剪路径
}

// 样式信息
pub struct Style {
    pub fill: FillStyle,
    pub stroke: StrokeStyle,
    pub text: TextStyle,
    pub effects: Effects,
    pub opacity: f32,
    pub blend_mode: BlendMode,
}

// 内容类型
pub enum Content {
    Text(TextContent),
    Image(ImageContent),
    Path(PathContent),
    Shape(ShapeContent),
}
```

### 2. 渲染器抽象 (Renderer Abstraction)

位置：`src-tauri/src/core/renderer_trait.rs`

```rust
#[async_trait]
pub trait Renderer: Send + Sync {
    type Output;
    type Error: std::error::Error;

    async fn render(&self, model: &Element) -> Result<Self::Output, Self::Error>;

    async fn export(
        &self,
        model: &Element,
        format: ExportFormat,
        options: ExportOptions
    ) -> Result<Vec<u8>, Self::Error>;

    fn supported_formats(&self) -> Vec<ExportFormat>;
    fn validate(&self, model: &Element) -> ValidationResult;
}
```

### 3. 适配器层 (Adapters)

位置：`src-tauri/src/adapters/`

```rust
// Skia适配器
pub struct SkiaAdapter;

impl SkiaAdapter {
    pub fn from_domain(element: &Element) -> SkiaElement {
        // 领域模型 -> Skia格式
    }

    pub fn to_domain(skia_element: &SkiaElement) -> Element {
        // Skia格式 -> 领域模型
    }
}

// 前端API适配器
pub struct ApiAdapter;

impl ApiAdapter {
    pub fn from_frontend(data: FrontendElement) -> Element {
        // 前端数据 -> 领域模型
    }

    pub fn to_frontend(element: &Element) -> FrontendElement {
        // 领域模型 -> 前端数据
    }
}
```

### 4. 渲染器池 (Renderer Pool)

位置：`src-tauri/src/core/renderer_pool.rs`

```rust
pub struct RendererPool<R: Renderer> {
    pool: Arc<Mutex<Vec<R>>>,
    factory: Arc<dyn Fn() -> R + Send + Sync>,
    max_size: usize,
}

impl<R: Renderer> RendererPool<R> {
    pub async fn with_renderer<F, T>(&self, f: F) -> Result<T>
    where
        F: FnOnce(&R) -> Future<Output = T>,
    {
        let renderer = self.checkout().await?;
        let result = f(&renderer).await;
        self.checkin(renderer).await;
        Ok(result)
    }
}
```

### 5. 导出策略系统 (Export Strategy)

位置：`src-tauri/src/export/`

```rust
pub trait ExportStrategy: Send + Sync {
    fn export(
        &self,
        element: &Element,
        options: &ExportOptions
    ) -> Result<ExportResult>;

    fn validate(&self, element: &Element) -> ValidationResult;

    fn optimize(&self, element: &mut Element);
}

pub struct ExportManager {
    strategies: HashMap<ExportFormat, Box<dyn ExportStrategy>>,
}

impl ExportManager {
    pub fn export(
        &self,
        element: &Element,
        format: ExportFormat,
        options: ExportOptions
    ) -> Result<ExportResult> {
        let strategy = self.strategies.get(&format)
            .ok_or(ExportError::UnsupportedFormat)?;

        strategy.validate(element)?;
        let mut optimized = element.clone();
        strategy.optimize(&mut optimized);
        strategy.export(&optimized, &options)
    }
}
```

## 实施步骤

### 第一阶段：基础架构（第1-2天）

1. **创建核心模块结构**
   ```
   src-tauri/src/
   ├── core/
   │   ├── mod.rs
   │   ├── models.rs         # 领域模型
   │   ├── renderer_trait.rs # 渲染器抽象
   │   └── errors.rs         # 错误定义
   ├── adapters/
   │   ├── mod.rs
   │   ├── skia_adapter.rs
   │   └── api_adapter.rs
   └── export/
       ├── mod.rs
       └── strategies/
   ```

2. **定义基础类型**
   - Element及相关结构体
   - 错误类型
   - 渲染器trait

### 第二阶段：适配器实现（第3-4天）

1. **实现API适配器**
   - 前端数据结构映射
   - 类型转换函数
   - 验证逻辑

2. **实现Skia适配器**
   - Skia类型映射
   - 坐标系转换
   - 样式映射

### 第三阶段：渲染器重构（第5-7天）

1. **重构SkiaRenderer**
   - 实现Renderer trait
   - 使用领域模型
   - 处理线程安全

2. **实现渲染器池**
   - 对象池管理
   - 并发控制
   - 资源回收

### 第四阶段：导出系统（第8-9天）

1. **实现导出策略**
   - PDF导出策略
   - 图片导出策略
   - SVG导出策略
   - Office格式策略

2. **集成导出管理器**
   - 策略注册
   - 格式路由
   - 错误处理

### 第五阶段：测试与优化（第10天）

1. **单元测试**
   - 模型转换测试
   - 渲染器测试
   - 导出测试

2. **性能优化**
   - 缓存实现
   - 增量渲染
   - 内存优化

## 迁移策略

### 保持向后兼容

1. **渐进式迁移**
   - 保留旧API，标记为deprecated
   - 新旧系统并行运行
   - 逐步迁移功能

2. **版本控制**
   ```rust
   #[deprecated(since = "2.1.0", note = "Use new render API")]
   pub async fn old_render_command() { }

   pub async fn render_v2_command() { }
   ```

### 数据迁移

```rust
// 自动检测和转换旧格式
pub fn migrate_element(data: Value) -> Result<Element> {
    let version = detect_version(&data)?;
    match version {
        Version::V1 => migrate_from_v1(data),
        Version::V2 => Ok(serde_json::from_value(data)?),
    }
}
```

## 错误处理规范

```rust
#[derive(Error, Debug)]
pub enum RenderError {
    #[error("Validation failed: {0}")]
    ValidationError(String),

    #[error("Conversion failed: {source}")]
    ConversionError {
        #[from]
        source: ConversionError,
    },

    #[error("Renderer error: {0}")]
    RendererError(String),

    #[error("Export failed for format {format}: {reason}")]
    ExportError {
        format: String,
        reason: String,
    },
}
```

## 性能考虑

### 缓存策略

```rust
pub struct RenderCache {
    // LRU缓存用于几何计算
    geometry_cache: LruCache<ElementId, ComputedGeometry>,

    // 纹理缓存
    texture_cache: TextureCache,

    // 字体缓存
    font_cache: FontCache,
}
```

### 并发优化

- 使用tokio进行异步IO
- 渲染器池支持并发渲染
- 增量更新减少重绘

## 监控和日志

```rust
#[instrument(skip(element))]
pub async fn render(element: &Element) -> Result<RenderOutput> {
    let span = tracing::info_span!("render",
        element_id = %element.id,
        element_type = ?element.element_type
    );

    async move {
        // 渲染逻辑
    }.instrument(span).await
}
```

## 配置管理

```toml
# render_config.toml
[renderer]
pool_size = 4
timeout_ms = 5000

[cache]
max_geometry_cache_size = 1000
max_texture_cache_mb = 512

[export]
default_dpi = 300
max_concurrent_exports = 3
```

## 代码规范

1. **命名规范**
   - 模块：snake_case
   - 结构体：PascalCase
   - 函数：snake_case
   - 常量：SCREAMING_SNAKE_CASE

2. **文档要求**
   - 所有public API必须有文档
   - 复杂逻辑需要内联注释
   - 示例代码在doc tests中

3. **错误处理**
   - 使用Result类型
   - 提供有意义的错误信息
   - 支持错误链

## 依赖管理

```toml
[dependencies]
# 核心依赖
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
thiserror = "1.0"
anyhow = "1.0"

# 序列化
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# 渲染相关
skia-safe = "0.72"

# 工具类
tracing = "0.1"
lru = "0.12"
dashmap = "5.5"

[dev-dependencies]
mockall = "0.11"
proptest = "1.0"
criterion = "0.5"
```

## 部署清单

- [ ] 完成核心模型定义
- [ ] 实现渲染器抽象
- [ ] 创建适配器层
- [ ] 重构SkiaRenderer
- [ ] 实现渲染器池
- [ ] 完成导出系统
- [ ] 编写测试用例
- [ ] 性能基准测试
- [ ] 更新API文档
- [ ] 迁移指南

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|-----|-----|---------|
| API不兼容 | 高 | 保持旧API，渐进迁移 |
| 性能下降 | 中 | 充分测试，优化关键路径 |
| 内存增加 | 中 | 实现智能缓存策略 |
| 复杂度增加 | 低 | 良好的文档和示例 |

## 成功标准

1. 所有现有功能正常工作
2. 性能不低于当前版本
3. 测试覆盖率 > 80%
4. 无编译警告
5. CI/CD全部通过

## 维护计划

- 每周代码审查
- 月度性能评估
- 季度架构回顾
- 持续文档更新

---

本文档将随项目进展持续更新。最后更新：2024年1月