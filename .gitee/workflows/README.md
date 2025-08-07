# Gitee Go 流水线配置

## 📁 文件说明

### `build.yml` - 完整构建流水线
- **功能**：多平台完整构建（Windows、Linux、macOS）
- **触发**：推送到 main/develop 分支、创建标签、手动触发
- **产物**：Windows exe/msi、Linux deb/AppImage、macOS dmg
- **用途**：正式发布、完整测试

### `build-simple.yml` - 快速构建流水线
- **功能**：仅构建 Windows 版本（使用 GNU 工具链）
- **触发**：推送到 main 分支、手动触发
- **产物**：Windows exe + dll
- **用途**：快速验证、日常开发

### `test.yml` - 代码质量检查
- **功能**：代码质量检查、类型检查、单元测试
- **触发**：每次推送、Pull Request
- **产物**：测试报告
- **用途**：代码质量保证、持续集成

## 🚀 使用方法

### 1. 推送代码自动触发
```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

### 2. 手动触发构建
1. 进入 Gitee 项目页面
2. 点击 `Actions` 标签
3. 选择对应的工作流
4. 点击 `Run workflow`

### 3. 下载构建产物
1. 构建完成后进入 Actions 页面
2. 点击对应的构建任务
3. 在 `Artifacts` 部分下载文件

## ⚙️ 配置说明

### 环境变量
- `WORKING_DIR: v2-tauri` - 项目工作目录
- `NODE_VERSION: '18'` - Node.js 版本
- `RUST_VERSION: 'stable'` - Rust 版本

### 构建目标
- **Windows**: `x86_64-pc-windows-msvc` (完整版), `x86_64-pc-windows-gnu` (简化版)
- **Linux**: `x86_64-unknown-linux-gnu`
- **macOS**: `x86_64-apple-darwin`, `aarch64-apple-darwin`

## 📋 流水线状态

| 流水线 | 状态 | 最后运行 |
|--------|------|----------|
| 完整构建 | [![Build](../../actions/workflows/build.yml/badge.svg)](../../actions/workflows/build.yml) | - |
| 快速构建 | [![Simple Build](../../actions/workflows/build-simple.yml/badge.svg)](../../actions/workflows/build-simple.yml) | - |
| 质量检查 | [![Test](../../actions/workflows/test.yml/badge.svg)](../../actions/workflows/test.yml) | - |

## 🔧 故障排除

### 常见问题

1. **构建失败 - 依赖安装问题**
   - 检查 package.json 和 Cargo.toml 依赖
   - 确保 Node.js 和 Rust 版本兼容

2. **构建失败 - 系统依赖缺失**
   - Linux: 检查 libgtk-3-dev 等系统库
   - Windows: 确保 MSVC 或 MinGW 工具链

3. **构建超时**
   - 启用缓存减少构建时间
   - 考虑分阶段构建

### 优化建议

1. **缓存策略**
   - Cargo 依赖缓存
   - Node.js 模块缓存
   - Rust 工具链缓存

2. **并行构建**
   - 多平台并行执行
   - 测试和构建分离

3. **增量构建**
   - 仅在文件变更时触发
   - 跳过未修改的目标平台

## 📝 更新日志

- **2025-08-07**: 初始版本，支持 Windows/Linux/macOS 构建
- **2025-08-07**: 添加代码质量检查流水线
- **2025-08-07**: 添加快速构建选项