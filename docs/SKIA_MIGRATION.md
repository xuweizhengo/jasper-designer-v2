# Jasper Designer V2 - Skia 统一渲染架构迁移文档

## 项目概述

将 Jasper Designer V2 从当前的多渲染器架构迁移到基于 Skia 的统一渲染架构，实现设计、预览、导出的像素级一致性和性能大幅提升。

## 迁移目标

- ✅ 统一前后端渲染引擎
- ✅ 性能提升 8-15 倍
- ✅ 代码量减少 60%
- ✅ 支持所有主流导出格式
- ✅ 保持与现有功能 100% 兼容

## 迁移时间线

- 开始时间: 2025-01-14
- 预计完成: 2-3 周
- 当前状态: 进行中

## 一、准备阶段

### 1.1 环境要求
- Node.js 18+
- Rust 1.70+
- Tauri CLI

### 1.2 备份策略
```bash
# 创建备份分支
git checkout -b backup/pre-skia-migration
git push origin backup/pre-skia-migration

# 创建迁移分支
git checkout -b feature/skia-migration
```

## 二、依赖配置

### 2.1 前端依赖
```json
{
  "dependencies": {
    "canvaskit-wasm": "^0.38.2"
  }
}
```

### 2.2 后端依赖
```toml
[dependencies]
skia-safe = { version = "0.72", features = ["gl", "textlayout", "svg", "pdf"] }
```

## 三、架构设计

### 3.1 目录结构
```
src/
├── renderer/                # 统一渲染层
│   ├── skia/
│   │   ├── core/           # 核心渲染器
│   │   ├── elements/       # 元素渲染器
│   │   ├── effects/        # 特效系统
│   │   └── utils/          # 工具函数
│   └── types/              # 类型定义
```

### 3.2 数据流
```
用户操作 → SolidJS State → Skia Renderer → Canvas/Export
```

## 四、实施步骤

### Phase 1: 基础架构 (第1周)
- [x] 创建迁移文档
- [ ] 安装依赖
- [ ] 创建目录结构
- [ ] 实现核心渲染器

### Phase 2: 功能迁移 (第2周)
- [ ] 迁移设计模式
- [ ] 迁移预览模式
- [ ] 实现导出功能

### Phase 3: 优化测试 (第3周)
- [ ] 性能优化
- [ ] 完整测试
- [ ] 文档更新

## 五、技术细节

### 5.1 前端渲染器
- 使用 CanvasKit (Skia WASM 版本)
- WebGL 加速优先，CPU 渲染降级
- 统一渲染管线

### 5.2 后端渲染器
- 使用 skia-safe (Rust 绑定)
- 支持 PDF/SVG/PNG/JPG 导出
- 与前端渲染逻辑一致

### 5.3 性能指标
- 渲染性能: 提升 8-15x
- 内存使用: 减少 60%
- 代码复用: 提升 70%

## 六、风险与对策

### 风险点
1. CanvasKit 体积较大 (7MB)
2. 学习曲线
3. 兼容性问题

### 对策
1. 使用 CDN + 缓存
2. 渐进式迁移
3. 充分测试

## 七、验收标准

- [ ] 所有现有功能正常工作
- [ ] 性能提升达到预期
- [ ] 导出功能完整
- [ ] 测试覆盖率 > 80%

## 八、参考资源

- [Skia 官方文档](https://skia.org)
- [CanvasKit API](https://skia.org/docs/user/modules/canvaskit/)
- [skia-safe Rust 文档](https://rust-skia.github.io/doc/skia_safe/)

---

最后更新: 2025-01-14