# 📦 Jasper Designer V2 打包工具集

提供全量打包、增量打包、版本管理等完整的构建解决方案。

## 🚀 快速开始

### 一键交互式打包
```bash
./scripts/package.sh
```
提供交互式菜单，包含所有打包选项。

### 直接命令行使用（无交互参数）

#### 全量打包（Tauri CLI 优先）
```bash
# 统一入口（推荐）
./scripts/package.sh full --feature RELEASE-2.1 [--clean-history]

# 深度清理（dist + src-tauri/target + vite 缓存 + 重新安装依赖）
DEEP_CLEAN=1 ./scripts/package.sh full --feature TRY-CLEAN

# 兼容旧脚本
./scripts/package-full.sh "DATA-SOURCE-FEATURE" [--clean-history]
```

#### 增量打包（智能检测 + 可复用基础包）
```bash
# 统一入口（推荐）
./scripts/package.sh smart --feature UI-UPDATE [--base jasper-designer-v2-YYYYmmdd-HHMMSS]

# 兼容旧脚本
./scripts/package-incremental.sh "UI-FIXES" ["jasper-designer-v2-YYYYmmdd-HHMMSS"]
```

## 📋 打包策略指南

### 🏗️ 全量打包场景
- ✅ **新功能开发** - 添加导出模块、数据源管理等
- ✅ **Rust后端修改** - 新增Tauri命令、修改API
- ✅ **依赖更新** - 更新npm包、Cargo依赖
- ✅ **发布版本** - 正式版本发布
- ✅ **重大Bug修复** - 确保完整性

### ⚡ 增量打包场景  
- ✅ **UI调整** - 样式修改、布局优化
- ✅ **前端组件** - React/Solid组件修改
- ✅ **快速迭代** - 开发期间快速测试
- ✅ **文档更新** - README、帮助文档

## 🛠️ 功能特性

### 全量打包 (`package-full.sh`)
- 🧹 **智能缓存清理** - 清理所有构建缓存
- 🔍 **模块检测** - 自动检测新增模块
- 📚 **历史版本管理** - 可选清理旧版本到archives
- ✅ **完整性验证** - 构建产物验证
- 📋 **详细日志** - 彩色输出，清晰的进度指示

### 增量打包 (`package-incremental.sh`)
- 🎯 **智能检测** - 自动检测前端/后端变更
- 📦 **基础包复用** - 基于现有包进行增量更新
- ⚠️ **安全提醒** - 后端变更时提醒使用全量打包
- ⚡ **快速构建** - 仅更新变更部分

### 统一入口 (`package.sh`)
- 🎨 **交互式界面** - 彩色菜单，用户友好
- 📊 **版本管理** - 查看、清理历史版本
- 💾 **磁盘监控** - 显示存储使用情况
- 🧪 **预检** - Node/NPM/Cargo/ESLint 状态摘要（可通过 `PRECHECK=0` 跳过）

## 📁 目录结构

```
builds/windows/
├── jasper-designer-v2-FEATURE-20250823-120000/    # 最新版本
├── jasper-designer-v2-STABLE-20250823-110000/     # 稳定版本  
├── jasper-designer-v2-HOTFIX-INCR-20250823-115000/ # 增量版本
└── archives/                                       # 历史版本归档
    ├── jasper-designer-v2-OLD-20250820-100000/
    └── ...
```

## 📋 包信息与产物

每个包都包含构建信息：

- **PACKAGE_INFO.md** - 构建摘要（包名/功能/时间/分支/提交/清理级别/基础包/大小/SHA256）
- **OPTIMIZATION-NOTES.md** - 全量构建优化说明（如有）
- 产物：目录包 + 压缩包（.tar.gz）

> 注：新版 `package-full-optimized.sh` 与 `package-smart.sh` 会自动生成 PACKAGE_INFO.md

## ⚠️ 注意事项

### 新增模块处理
当你添加新模块（如导出功能）时：

1. **代码组织** - 将模块放在合适的目录
   ```
   src/components/Export/        # 前端导出组件
   src-tauri/src/export/         # 后端导出逻辑
   ```

2. **自动检测** - 脚本会自动检测新模块并记录

3. **必须全量打包** - 新模块需要完整构建链路

### 版本管理建议

- **开发期间**: 多用增量打包
- **功能完成**: 全量打包测试  
- **发布前**: 全量打包 + 清理历史版本
- **紧急修复**: 视情况选择打包方式

## 🎯 使用示例

### 新功能开发流程
```bash
# 1. 开发新功能时
./scripts/package.sh
# 选择: 1) 全量打包
# 输入功能名: EXPORT-MODULE

# 2. UI调整时
./scripts/package.sh  
# 选择: 2) 增量打包
# 输入功能名: UI-POLISH

# 3. 发布前清理
./scripts/package.sh
# 选择: 1) 全量打包
# 功能名: RELEASE-V2.1
# 清理历史版本: y
```

---

**现在你可以一键完成所有打包操作，脚本会智能处理模块检测、版本管理、缓存清理等所有细节！**

---

## ❓ 常见问题（FAQ）

### 1) 构建时报错：`The distDir configuration is set to "../dist" but this path doesn't exist`
- 原因：直接 `cargo build` 时 `dist/` 未生成，`tauri::generate_context!` 编译期校验失败。
- 解决：
  - 使用 `scripts/package.sh full` 或 `npm run tauri build`（会先 `npm run build`）
  - 或先 `npm run build` 再 `cargo build --manifest-path src-tauri/Cargo.toml --release`

### 2) 输出提示：`未检测到 Tauri CLI，回退到 cargo build`
- 原因：本地没有 `node_modules/.bin/tauri`，且 `npx` 无法联网拉取。
- 解决：
  - `npm ci` 安装依赖，或用 `DEEP_CLEAN=1 ./scripts/package.sh full` 让脚本自动安装
  - 无法安装时，脚本会先 `npm run build` 再 `cargo build`，以保证 `dist/` 存在

### 3) 需要清理哪些缓存？
- 级别 A（默认）：清理 `dist/`
- 级别 B：A + 清理 `src-tauri/target/`（Rust/依赖变更）
- 级别 C：B + 清理 `node_modules/.vite` + `npm ci`（`--deep-clean` 或 `DEEP_CLEAN=1`）

### 4) 打包结果在哪里？
- 输出目录：`builds/windows/jasper-designer-v2-<FEATURE>-<YYYYmmdd-HHMMSS>/`
- 归档目录：`builds/windows/archives/`
- 完整信息见 `PACKAGE_INFO.md`

### 5) 如何在 CI 中使用？
```bash
PRECHECK=0 ./scripts/package.sh full --feature CI-BUILD --clean-history
```
或：
```bash
npm ci
DEEP_CLEAN=1 ./scripts/package.sh full --feature CI-BUILD
```
