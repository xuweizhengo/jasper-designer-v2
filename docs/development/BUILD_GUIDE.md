# 🔨 Jasper Designer V2.0 - 构建打包指南

## 📋 最新更新：2025年8月9日

**项目状态**: ✅ **单技术栈架构** (已淘汰 Spring + React 版本)  
**构建质量**: ✅ **零错误构建** - TypeScript + Rust 完整通过

## 🏗 项目架构
```
jasper/                     # V2.0 纯架构 (无 v2-tauri 嵌套)
├── src/ (Solid.js)         # 前端源码
├── src-tauri/ (Rust)       # 后端源码  
├── builds/                 # 构建产物
├── scripts/                # 构建脚本
├── backup/                 # V1.x 版本备份
└── BUILD_GUIDE.md          # 本文档
```

## 🛠️ 环境要求

### 🔧 必需环境
```bash
# Node.js 环境 (前端)
node --version    # v18.19.1+
npm --version     # 9.2.0+

# Rust 工具链 (后端)  
rustc --version  # 1.88.0+
cargo --version  # 1.88.0+

# 验证 Tauri
npm run tauri --version
```

### 🌍 跨平台支持
```bash
# 安装 Windows 交叉编译工具链 (Linux环境)
rustup target add x86_64-pc-windows-gnu
apt install -y mingw-w64

# 验证目标平台
rustup target list --installed
# 需要包含: x86_64-pc-windows-gnu
```

## 🚀 快速构建

### ⚡ 一键构建
```bash
# 完整构建流程 (推荐)
npm install              # 安装前端依赖
npm run build            # 构建前端资源
npm run tauri build      # 构建桌面应用

# 输出位置:
# src-tauri/target/release/bundle/
```

### 🎯 开发模式
```bash
# 启动开发服务器 (热重载)
npm run tauri dev

# 前后端分别调试
npm run dev              # 前端: http://localhost:1420
cd src-tauri && cargo run   # 后端: Rust 应用
```

## 📦 构建类型对比

### 🏆 生产版本 (推荐)

| 平台 | 命令 | 体积 | DevTools | 性能 | 用途 |
|------|------|------|----------|------|------|
| **Windows** | `npm run tauri build` | **3.4MB** | ✅ | 高性能 | **生产部署** |
| **Linux** | `npm run tauri build` | 5.2MB | ✅ | 高性能 | 生产部署 |
| **macOS** | `npm run tauri build` | 4.8MB | ✅ | 高性能 | 生产部署 |

### 🔧 开发版本

| 类型 | 大小 | 包含内容 | 用途 |
|------|------|----------|------|
| Debug | 22MB | 完整调试符号 | 本地调试 |
| DevTools | 3.4MB + Web工具 | 内置开发工具 | 功能测试 |

## ⚡ 体积优化技术

### 🎯 优化配置 (src-tauri/Cargo.toml)
```toml
[profile.release]
opt-level = "s"         # 优化目标: 体积最小
lto = true              # 链接时优化 (减少 30-50%)
codegen-units = 1       # 单一代码生成 (更好优化)
panic = "abort"         # 移除 panic 展开代码
strip = true            # 自动移除调试符号
```

### 📊 优化效果
- **原始调试版**: 22MB (包含调试信息)
- **发布优化版**: 3.4MB (减少 85%)
- **压缩打包版**: 1.6MB (减少 93%)

### 🔬 关键技术
1. **LTO (链接时优化)**: 跨模块内联和死代码消除
2. **Strip调试符号**: 移除开发调试信息  
3. **Size优化**: 优先文件大小而非执行速度
4. **静态链接**: 减少运行时依赖

## 🛠 构建脚本

### 📋 可用脚本
```bash
# 自动化构建脚本 (./scripts/ 目录)
./scripts/build-all.sh          # 构建所有平台
./scripts/build-windows.sh      # 仅 Windows
./scripts/check-env.sh          # 环境检查
./scripts/cleanup-old.sh        # 清理旧版本
./scripts/package-final.sh      # 最终打包
```

### 🎯 推荐工作流
```bash
# 1. 环境检查
./scripts/check-env.sh

# 2. 清理构建
rm -rf builds/ dist/ src-tauri/target/

# 3. 完整构建
npm install
npm run build
npm run tauri build

# 4. 生成压缩包  
./scripts/package-final.sh
```

## 📂 输出目录结构

### 🗂 构建产物
```
builds/
├── windows/                    # Windows 构建
│   ├── jasper-designer.exe    # 主程序 (3.4MB)
│   ├── WebView2Loader.dll     # WebView2 运行时
│   └── *.tar.gz               # 压缩包 (1.6MB)
├── linux/                     # Linux 构建
│   └── jasper-designer        # Linux 二进制
└── archives/                   # 历史版本
    └── jasper-*.tar.gz        # 带时间戳的归档
```

### 🎁 分发包内容
```
jasper-designer-v2-final-{timestamp}/
├── jasper-designer.exe        # 主程序
├── WebView2Loader.dll         # 依赖库
├── assets/                    # 前端资源
│   ├── index-{hash}.js        # 前端逻辑
│   └── index-{hash}.css       # 样式文件
├── icons/                     # 应用图标
├── run-jasper.bat             # 启动脚本
└── README-FINAL.md            # 说明文档
```

## 🧪 测试与验证

### ✅ 构建验证
```bash
# 1. 类型检查
npx tsc --noEmit            # 前端类型检查
cargo clippy                # Rust 代码检查 (src-tauri目录)

# 2. 构建测试  
npm run build               # 前端构建测试
cargo check                 # Rust 编译检查 (src-tauri目录)

# 3. 功能测试
npm run tauri dev           # 启动应用验证功能

# 4. 最终构建
npm run tauri build         # 生产构建验证
```

### 🎯 质量标准
- **TypeScript 错误**: 0 个
- **Rust 警告**: 0 个
- **构建成功率**: 100%
- **应用启动**: 正常启动并显示界面

## 🐛 故障排除

### 🚨 常见问题解决

#### 1. 环境配置问题
```bash
# 问题: Rust 环境未配置
# 解决: 安装 Rust 工具链
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 问题: Tauri CLI 未安装
# 解决: 通过 npm 安装
npm install -g @tauri-apps/cli
```

#### 2. 交叉编译问题
```bash
# 问题: Windows 交叉编译失败
# 解决: 安装 MinGW 工具链
apt install mingw-w64
rustup target add x86_64-pc-windows-gnu

# 问题: 链接器找不到
# 解决: 配置 .cargo/config
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"
```

#### 3. 前端构建问题
```bash
# 问题: 依赖安装失败
# 解决: 清理缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 问题: TypeScript 错误
# 解决: 运行类型检查定位问题
npx tsc --noEmit
```

#### 4. 应用启动问题  
```bash
# 问题: WebView2 运行时缺失 (Windows)
# 解决: 应用会自动下载，或手动安装
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# 问题: 开发工具打不开
# 解决: 检查 Cargo.toml 是否启用 devtools
tauri = { features = ["api-all", "devtools"] }
```

## 🔄 自动化与 CI/CD

### 🎯 GitHub Actions 示例
```yaml
# .gitee/workflows/build-frontend-only.yml
name: Build Frontend Only
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Dependencies
        run: npm install
      - name: Build Frontend
        run: npm run build
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### 📦 版本管理
```bash
# 自动版本发布
git tag v2.0.0
git push origin v2.0.0

# 构建发布包
./scripts/package-final.sh --version v2.0.0

# 清理旧构建 (保留最新3个)
./scripts/cleanup-old.sh --keep 3
```

## 📊 性能指标

### ⏱ 构建时间
- **前端构建**: 2-5 秒 (Vite 快速构建)
- **Rust编译**: 2-5 分钟 (首次较慢，增量快)
- **打包压缩**: 5-10 秒
- **总构建时间**: 3-6 分钟

### 💾 文件大小对比
```
构建类型             大小        优化程度
================================
Debug版本           22MB        基础版本
Release版本         3.4MB       减少 85%
压缩打包            1.6MB       减少 93%
旧版本备份          21MB        (Spring+React)
```

## 🌟 项目优势

### ✨ 技术优势
- **现代化构建**: Vite + Cargo 快速构建
- **跨平台部署**: 一次构建，多平台运行
- **零错误质量**: TypeScript + Rust 双重保障
- **体积优化**: 业界领先的文件大小

### 🎯 开发体验
- **热重载**: 开发模式实时预览
- **类型安全**: 编译时错误检测
- **调试友好**: DevTools 完整支持
- **文档完善**: 详细的构建指南

---

## 📞 技术支持

### 🔗 相关文档
- **功能测试**: `M2_TESTING_GUIDE.md`  
- **项目进度**: `PROGRESS.md`
- **里程碑**: `docs/milestones/`

### 🆘 问题反馈
如有构建问题：
1. 检查环境依赖是否完整
2. 查看构建日志错误信息
3. 参考故障排除部分
4. 查看项目 Issues 或提交问题

**最后更新**: 2025-08-09  
**维护状态**: ✅ 活跃维护中

## 📦 打包类型

### 版本对比

| 版本类型 | 平台 | 大小 | DevTools | 用途 |
|----------|------|------|----------|------|
| **Windows Release** | Windows | **3.4MB** | ✅ | **生产推荐** |
| Linux Optimized | Linux | 22MB | ✅ | 生产使用 |
| Linux Debug | Linux | 201MB | ✅ | 开发调试 |

### 打包脚本

#### 快速构建 (推荐)
```bash
# 一键构建所有版本
./build-all.sh

# 单独构建 Windows 版本
./build-windows.sh
```

#### 手动打包
```bash
# Windows 版本
./package-windows-fixed.sh

# Linux 优化版本  
./package-optimized.sh

# Linux 调试版本
./package-debug.sh
```

## ⚡ 体积优化技术

### Cargo.toml 优化配置
```toml
[profile.release]
opt-level = "s"   # 体积优化 (size)
lto = true        # 链接时优化 (减少30-50%)
codegen-units = 1 # 单一代码生成单元
panic = "abort"   # 移除panic展开代码
strip = true      # 自动移除调试符号
```

### 优化效果
- **原始调试版**: 201MB (包含完整调试信息)
- **strip优化后**: 22MB (移除调试符号, 减少89%)  
- **Windows发布版**: 3.4MB (全面优化, 减少98%)

### 关键优化技术
1. **调试符号移除**: 节省 179MB
2. **链接时优化 (LTO)**: 跨crate内联优化
3. **死代码消除**: 移除未使用函数
4. **静态链接优化**: Windows平台特有优势

## 🚀 脚本使用

### 统一构建脚本
```bash
# 构建所有版本
./build-all.sh
# 选项:
#   --clean     清理之前的构建
#   --windows   只构建Windows版本  
#   --linux     只构建Linux版本
#   --debug     包含调试版本

# 示例
./build-all.sh --clean --windows
```

### 目录结构
```
v2-tauri/
├── builds/                 # 构建输出目录
│   ├── windows/            # Windows版本
│   ├── linux/              # Linux版本  
│   └── archives/           # 压缩包
├── scripts/                # 构建脚本
│   ├── build-all.sh       # 统一构建
│   ├── build-windows.sh   # Windows构建
│   └── build-linux.sh     # Linux构建
└── BUILD_GUIDE.md          # 本文档
```

## 🐛 故障排除

### 常见问题

#### 1. 交叉编译失败
```bash
# 错误: linker `link.exe` not found
# 解决: 使用 GNU 工具链而非 MSVC
cargo build --target x86_64-pc-windows-gnu --release
```

#### 2. 前后端参数不匹配
```bash
# 错误: invalid args `elementId` for command `select_element`
# 原因: Rust期望snake_case, JS使用camelCase  
# 解决: 前端统一使用 element_id
invoke('select_element', { element_id: elementId })
```

#### 3. DevTools无法打开
```bash
# 检查 Cargo.toml 是否包含 devtools 特性
tauri = { features = ["devtools", ...] }

# 检查 main.rs 是否启用
window.open_devtools();
```

#### 4. 体积过大
```bash
# 检查构建模式
cargo build --release  # 而非 cargo build

# 检查优化配置
grep -A 5 "\[profile.release\]" Cargo.toml
```

### 环境检查脚本
```bash
# 检查环境是否完整
./check-env.sh
# 输出完整的环境诊断信息
```

## 📊 性能基准

### 构建时间
- **前端构建**: ~3秒
- **Linux Debug**: ~2分钟  
- **Linux Release**: ~5分钟
- **Windows Release**: ~5分钟

### 文件大小演进
```
Debug版本(含调试信息): 201MB
    ↓ strip调试符号
Linux优化版: 22MB (减少89%)
    ↓ 发布版优化 + 交叉编译
Windows版本: 3.4MB (减少98%)
```

## 🔄 自动化工作流

### CI/CD 集成
```yaml
# .github/workflows/build.yml
name: Build All Platforms
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build All
        run: ./build-all.sh --clean
      - name: Upload Artifacts
        uses: actions/upload-artifact@v2
        with:
          name: jasper-builds
          path: builds/archives/
```

### 版本管理
```bash
# 自动版本标记
./scripts/tag-release.sh v2.0.1

# 清理旧版本
./scripts/cleanup-old.sh --keep 3
```

---

## 📞 技术支持

如有构建问题，请检查:
1. 环境依赖是否完整
2. 构建日志错误信息  
3. 参考本文档故障排除部分

最后更新: 2025-08-07
维护者: Jasper Team