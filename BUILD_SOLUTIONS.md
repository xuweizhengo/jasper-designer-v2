# 🔨 Jasper Designer V2.0 - 构建方案说明

## 📅 更新时间：2025年8月9日

**项目状态**: ✅ **V2.0 纯架构** (已移除 v2-tauri 嵌套目录)  
**构建质量**: ✅ **零错误构建** - M1-M2 里程碑完成

## 🚀 构建方案对比

| 方案 | 平台支持 | 构建速度 | 功能完整性 | 推荐度 |
|------|----------|----------|------------|--------|
| **本地构建** | 全平台 | ⚡ 最快 | 🔥 完整 | ⭐⭐⭐⭐⭐ |
| **GitHub Actions** | 全平台 | 🐢 较慢 | 🔥 完整 | ⭐⭐⭐⭐ |
| **Gitee Go** | 前端 | ⚡ 快 | 🔸 有限 | ⭐⭐⭐ |
| **Docker方案** | 全平台 | 🐢 慢 | 🔥 完整 | ⭐⭐ |

## 🏆 方案1: 本地构建（强烈推荐）

### ✨ 优势
- ✅ **完全控制**：调试构建问题、自定义配置
- ✅ **最高性能**：本地编译，速度最快
- ✅ **功能完整**：支持所有 Tauri 特性
- ✅ **零配置**：无需外部服务和账户

### 🚀 快速构建
```bash
# 项目根目录执行 (注意：不再是 v2-tauri 嵌套)
cd jasper

# 安装前端依赖
npm install

# 一键构建桌面应用 (推荐)
npm run tauri build

# 或者分步构建
npm run build              # 构建前端
npm run tauri build        # 构建桌面应用

# 输出位置
ls -la src-tauri/target/release/bundle/
```

### 📦 跨平台构建
```bash
# Windows 构建 (在 Linux 环境)
rustup target add x86_64-pc-windows-gnu
apt install mingw-w64
npm run tauri build -- --target x86_64-pc-windows-gnu

# Linux 构建
npm run tauri build

# macOS 构建 (在 macOS 环境)
npm run tauri build
```

### 🔧 自动化脚本
```bash
#!/bin/bash
# build-all.sh - 完整构建脚本

set -e
echo "🎯 构建 Jasper Designer V2.0..."

# 环境检查
echo "📋 检查环境..."
node --version && npm --version && rustc --version

# 清理旧构建
echo "🧹 清理构建缓存..."  
rm -rf dist/ builds/ src-tauri/target/

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建前端
echo "🎨 构建前端..."
npm run build

# 构建桌面应用
echo "🔥 构建桌面应用..."
npm run tauri build

echo "✅ 构建完成！"
echo "📂 构建产物："
find src-tauri/target -name "*.exe" -o -name "jasper-designer" | head -5

# 显示文件大小
echo "📊 文件大小："
find src-tauri/target -name "*.exe" -exec du -sh {} \; 2>/dev/null || true
```

## 🔄 方案2: GitHub Actions（全自动化）

### 🎯 适用场景
- **团队协作**：多人开发，自动构建
- **多平台发布**：Windows + Linux + macOS 同时构建
- **持续集成**：代码推送自动验证

### 🛠 配置步骤
```bash
# 1. 添加 GitHub 远程仓库
git remote add github https://github.com/username/jasper-designer.git

# 2. 创建 Actions 配置
mkdir -p .github/workflows
cat > .github/workflows/build.yml << 'EOF'
name: Build Jasper Designer V2.0
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Install Dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
          
      - name: Build Application
        run: |
          npm ci
          npm run tauri build
          
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: jasper-designer-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
EOF

# 3. 推送到 GitHub
git add .github/
git commit -m "添加 GitHub Actions 自动构建"
git push github main
```

### 📦 自动发布
```yaml
# 在 build.yml 中添加发布步骤
- name: Create Release
  if: startsWith(github.ref, 'refs/tags/')
  uses: softprops/action-gh-release@v1
  with:
    files: |
      src-tauri/target/release/bundle/**/*.exe
      src-tauri/target/release/bundle/**/*.dmg
      src-tauri/target/release/bundle/**/*.deb
```

## 📋 方案3: Gitee Go（前端验证）

### 🎯 当前能力
- ✅ **前端构建**：TypeScript + Vite 编译
- ✅ **代码检查**：ESLint + 类型验证
- ✅ **质量保证**：持续集成检查
- ❌ **桌面应用**：不支持 Rust + Tauri

### 📝 配置文件
```yaml
# .gitee/workflows/build-frontend-only.yml
name: Frontend Build & Check
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
          
      - name: Install & Build
        run: |
          npm ci
          npm run build
          
      - name: Type Check
        run: npx tsc --noEmit
        
      - name: Upload Frontend Dist
        uses: actions/upload-artifact@v3
        with:
          name: frontend-dist
          path: dist/
```

## 🐳 方案4: Docker方案（企业环境）

### 📋 多阶段构建
```dockerfile
# Dockerfile
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY *.config.* ./
RUN npm run build

FROM rust:1.70-slim AS backend-builder
RUN apt-get update && apt-get install -y \
    libgtk-3-dev libwebkit2gtk-4.0-dev \
    libssl-dev pkg-config build-essential

WORKDIR /app
COPY src-tauri/ ./src-tauri/
COPY --from=frontend-builder /app/dist ./dist/
RUN cd src-tauri && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    libgtk-3-0 libwebkit2gtk-4.0-37 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=backend-builder /app/src-tauri/target/release/jasper-designer /usr/local/bin/
EXPOSE 1420
CMD ["jasper-designer"]
```

### 🚀 使用方法
```bash
# 构建镜像
docker build -t jasper-designer:v2.0 .

# 运行容器
docker run -d --name jasper -p 1420:1420 jasper-designer:v2.0

# 提取构建产物
docker cp jasper:/usr/local/bin/jasper-designer ./jasper-designer-linux
```

## 🎯 推荐选择指南

### 👨‍💻 个人开发
**选择方案1 (本地构建)**
- 快速迭代开发
- 完整功能测试
- 自定义构建配置

### 👥 团队协作
**选择方案1 + 方案2**
- 本地开发测试
- GitHub Actions 自动构建
- 多平台同时发布

### 🏢 企业环境
**选择方案4 (Docker)**
- 环境标准化
- 可重复构建
- CI/CD 集成

## ⚡ 快速开始

### 🔥 一键构建脚本
```bash
# 创建快速构建脚本
cat > quick-build.sh << 'EOF'
#!/bin/bash
echo "🎯 Jasper Designer V2.0 - 快速构建"
echo "项目架构: Rust + Tauri + Solid.js"
echo "构建状态: M1-M2 完成，零错误构建"
echo ""

set -e

# 环境验证
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v rustc >/dev/null 2>&1 || { echo "❌ Rust 未安装"; exit 1; }

echo "✅ 环境检查通过"

# 依赖安装
echo "📦 安装依赖..."
npm install

# 构建应用
echo "🔥 构建桌面应用..."
npm run tauri build

echo ""
echo "🎉 构建完成！"
echo "📂 查看构建产物:"
find src-tauri/target -name "*.exe" -o -name "jasper-designer" 2>/dev/null || echo "构建产物位于 src-tauri/target/release/bundle/"
EOF

chmod +x quick-build.sh
```

### 🎯 立即开始
```bash
# 克隆项目
git clone [repository-url] jasper
cd jasper

# 一键构建
./quick-build.sh

# 或者手动构建
npm install
npm run tauri build
```

## 📊 性能对比

### ⏱ 构建时间对比
| 方案 | 首次构建 | 增量构建 | 并行构建 |
|------|----------|----------|----------|
| 本地 | 5-8分钟 | 1-2分钟 | ✅ |
| GitHub Actions | 8-12分钟 | 8-12分钟 | ✅ |
| Docker | 10-15分钟 | 10-15分钟 | ❌ |

### 💾 存储需求
| 方案 | 磁盘占用 | 网络带宽 | 缓存支持 |
|------|----------|----------|----------|
| 本地 | 2-3GB | 低 | ✅ |
| GitHub | 0MB | 中 | ✅ |
| Docker | 3-5GB | 高 | 🔸 |

---

## 📞 技术支持

### 📚 相关文档
- **构建指南**: `BUILD_GUIDE.md`
- **测试指南**: `M2_TESTING_GUIDE.md`
- **项目进度**: `PROGRESS.md`

### 🔗 问题排查
1. **环境问题**: 检查 Node.js + Rust 版本
2. **构建失败**: 查看错误日志定位问题
3. **功能异常**: 参考测试指南验证
4. **性能问题**: 考虑切换构建方案

**推荐方案**: 优先选择本地构建，团队协作可配置 GitHub Actions 辅助！

---

**最后更新**: 2025-08-09  
**项目状态**: ✅ M1-M2 完成，零错误构建基线

## 🐙 方案2: GitHub Actions（全功能）

### 配置步骤
1. **创建 GitHub 仓库**：
   - 在 GitHub 创建同名仓库
   - 添加为远程仓库：`git remote add github https://github.com/username/jasper.git`

2. **推送代码**：
   ```bash
   git push github main
   ```

3. **自动构建**：
   - GitHub Actions 会自动运行
   - 支持 Windows/Linux/macOS 三平台
   - 自动创建 Release

### GitHub Actions 配置
```yaml
# .github/workflows/build.yml
name: Build Tauri App
on: [push, pull_request]
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: dtolnay/rust-toolchain@stable
      - run: cd v2-tauri && npm ci && npm run tauri build
```

## 📦 方案3: Gitee Go（前端构建）

### 当前状态
- ✅ 前端 TypeScript 构建
- ✅ 代码质量检查
- ❌ Rust/Tauri 构建不支持

### 使用场景
- 前端代码验证
- 持续集成检查
- 代码质量监控

## 🐳 方案4: Docker 构建

### 配置文件
```dockerfile
# Dockerfile.build
FROM rust:1.70

RUN apt-get update && apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    nodejs \
    npm

WORKDIR /app
COPY . .
RUN cd v2-tauri && npm ci && npm run tauri build
```

### 使用方法
```bash
# 构建镜像
docker build -f Dockerfile.build -t jasper-builder .

# 运行构建
docker run --rm -v $(pwd)/output:/app/v2-tauri/src-tauri/target jasper-builder
```

## 🎯 推荐流程

### 开发阶段
1. **本地开发**：手动构建 + 热重载
2. **代码检查**：Gitee Go 前端检查
3. **功能验证**：手动构建测试

### 发布阶段  
1. **创建标签**：`git tag v1.0.0`
2. **手动构建**：生成各平台安装包
3. **手动发布**：上传到 Gitee Release

### 完整自动化（可选）
1. **同步到 GitHub**：获得完整 CI/CD
2. **双仓库维护**：Gitee 主开发，GitHub 自动构建

## 🔧 快速开始

选择方案1，创建构建脚本：

```bash
# 创建构建脚本
cat > build.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 构建 Jasper Designer V2..."
cd v2-tauri
npm ci
npm run tauri build -- --target x86_64-pc-windows-gnu
echo "✅ 构建完成！产物位置："
find src-tauri/target -name "*.exe"
EOF

chmod +x build.sh
```

现在运行 `./build.sh` 即可快速构建！

## ❓ 选择建议

- **个人项目**：方案1（手动构建）
- **团队协作**：方案2（GitHub Actions）  
- **仅前端开发**：方案3（Gitee Go）
- **企业环境**：方案4（Docker）

选择最适合你当前需求的方案即可！