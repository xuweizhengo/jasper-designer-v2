#!/bin/bash

# Jasper Designer V2.0 - Windows 专用构建脚本
# 用法: ./scripts/build-windows.sh [--clean]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 清理选项
if [[ "$1" == "--clean" ]]; then
    log_info "清理 Windows 构建产物..."
    rm -rf builds/windows/* builds/archives/*windows*
    rm -rf src-tauri/target/x86_64-pc-windows-gnu/
fi

log_info "开始 Windows 专用构建..."

# 检查环境
if ! rustup target list --installed | grep -q "x86_64-pc-windows-gnu"; then
    log_info "安装 Windows 目标平台..."
    rustup target add x86_64-pc-windows-gnu
fi

# 构建前端
log_info "构建前端..."
npm run build

# 构建 Windows 后端
log_info "构建 Windows 后端..."
cd src-tauri
cargo build --target x86_64-pc-windows-gnu --release
cd ..

# 创建 Windows 包
if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    WINDOWS_DIR="jasper-designer-v2-windows-$TIMESTAMP"
    
    mkdir -p "$WINDOWS_DIR"
    mkdir -p builds/windows builds/archives
    
    # 复制文件
    cp src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe "$WINDOWS_DIR/"
    cp src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll "$WINDOWS_DIR/"
    cp -r dist/* "$WINDOWS_DIR/"
    cp -r src-tauri/icons "$WINDOWS_DIR/"
    
    # 也复制到 builds 目录
    cp src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe builds/windows/
    cp src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll builds/windows/
    
    # 创建启动脚本
    cat > "$WINDOWS_DIR/run-jasper.bat" << 'EOF'
@echo off
title Jasper Designer V2.0
echo 🚀 Starting Jasper Designer V2.0...
echo 💡 DevTools: Press F12 or click debug button
cd /d "%~dp0"
jasper-designer.exe
if errorlevel 1 (
    echo.
    echo ❌ Error occurred. Press any key to exit...
    pause >nul
)
EOF
    
    # 创建调试脚本
    cat > "$WINDOWS_DIR/run-debug.bat" << 'EOF'
@echo off
title Jasper Designer V2.0 - Debug
echo 🔧 Starting Jasper Designer V2.0 (Debug Mode)...
echo 💡 DevTools available with F12
cd /d "%~dp0"
jasper-designer.exe
pause
EOF
    
    # 创建 README
    cat > "$WINDOWS_DIR/README.md" << EOF
# Jasper Designer V2.0 - Windows Release

## 🚀 快速开始
\`\`\`
双击 jasper-designer.exe
或
双击 run-jasper.bat
\`\`\`

## 🔧 DevTools 调试
- **F12**: 开启开发者工具
- **Ctrl+Shift+I**: 备用快捷键
- **工具栏黄色按钮**: DevTools 切换

## 📁 文件说明
- \`jasper-designer.exe\`: 主程序 (3.4MB)
- \`WebView2Loader.dll\`: 浏览器引擎 (154KB)
- \`run-jasper.bat\`: 普通启动脚本
- \`run-debug.bat\`: 调试启动脚本

## 🎯 特性
- 超小体积: 仅 3.4MB 主程序
- 完整 DevTools 支持
- 无需额外依赖安装
- 原生 Windows 性能

构建时间: $(date)
构建方式: Rust 交叉编译 (Ubuntu → Windows)
优化级别: Release + LTO + Strip
EOF
    
    # 创建压缩包
    tar -czf "builds/archives/$WINDOWS_DIR.tar.gz" "$WINDOWS_DIR"
    rm -rf "$WINDOWS_DIR"
    
    log_success "Windows 包构建完成!"
    echo ""
    echo "📊 构建信息:"
    echo "  可执行文件: $(ls -lh builds/windows/jasper-designer.exe | awk '{print $5}')"
    echo "  WebView2 DLL: $(ls -lh builds/windows/WebView2Loader.dll | awk '{print $5}')"
    echo "  压缩包: $(ls -lh builds/archives/$WINDOWS_DIR.tar.gz | awk '{print $5}')"
    echo ""
    echo "📥 下载命令:"
    echo "  scp root@server:$PROJECT_ROOT/builds/archives/$WINDOWS_DIR.tar.gz ."
    echo ""
    log_success "🎉 Windows 构建完成!"
else
    echo "❌ Windows 构建失败"
    exit 1
fi