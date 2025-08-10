#!/bin/bash

# Jasper Designer V2.0 - 统一构建脚本
# 用法: ./scripts/build-all.sh [选项]
# 选项:
#   --clean     清理之前的构建
#   --windows   只构建Windows版本  
#   --linux     只构建Linux版本
#   --debug     包含调试版本
#   --help      显示帮助信息

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Jasper Designer V2.0 构建脚本

用法: $0 [选项]

选项:
  --clean      清理之前的构建产物
  --windows    只构建Windows版本
  --linux      只构建Linux版本  
  --debug      包含调试版本 (默认只构建release)
  --help       显示此帮助信息

示例:
  $0                    # 构建所有平台release版本
  $0 --clean --windows # 清理后只构建Windows版本
  $0 --debug           # 构建所有版本包括debug
  
构建输出目录:
  builds/windows/      Windows版本
  builds/linux/        Linux版本
  builds/archives/     压缩包文件
EOF
}

# 解析命令行参数
CLEAN=false
BUILD_WINDOWS=true
BUILD_LINUX=true
BUILD_DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --windows)
            BUILD_WINDOWS=true
            BUILD_LINUX=false
            shift
            ;;
        --linux)
            BUILD_WINDOWS=false
            BUILD_LINUX=true
            shift
            ;;
        --debug)
            BUILD_DEBUG=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

log_info "开始构建 Jasper Designer V2.0"
log_info "项目目录: $PROJECT_ROOT"

# 清理函数
cleanup_builds() {
    log_info "清理构建产物..."
    rm -rf builds/windows/* builds/linux/* builds/archives/*
    rm -rf dist/ src-tauri/target/
    rm -f jasper-designer-* *.tar.gz *.zip
    log_success "清理完成"
}

# 检查环境
check_environment() {
    log_info "检查构建环境..."
    
    # 检查 Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 Rust
    if ! command -v cargo >/dev/null 2>&1; then
        log_error "Rust 未安装"
        exit 1
    fi
    
    # 检查 Windows 目标平台
    if $BUILD_WINDOWS && ! rustup target list --installed | grep -q "x86_64-pc-windows-gnu"; then
        log_warning "Windows 目标平台未安装，正在安装..."
        rustup target add x86_64-pc-windows-gnu
    fi
    
    # 检查交叉编译工具
    if $BUILD_WINDOWS && ! command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1; then
        log_error "MinGW 交叉编译工具未安装"
        log_info "请运行: apt install -y mingw-w64"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    
    if [ ! -d "node_modules" ]; then
        log_info "安装 npm 依赖..."
        npm install
    fi
    
    npm run build
    log_success "前端构建完成"
}

# 构建 Linux 版本
build_linux() {
    log_info "构建 Linux 版本..."
    
    cd src-tauri
    
    if $BUILD_DEBUG; then
        log_info "构建 Linux 调试版本..."
        cargo build
        
        if [ -f "target/debug/jasper-designer" ]; then
            # 创建调试版本包
            cp target/debug/jasper-designer ../builds/linux/jasper-designer-debug
            
            # 优化版本 (strip)
            cp target/debug/jasper-designer ../builds/linux/jasper-designer-optimized
            strip --strip-debug ../builds/linux/jasper-designer-optimized
            
            log_success "Linux 调试版本构建完成"
        fi
    fi
    
    log_info "构建 Linux 发布版本..."
    cargo build --release
    
    if [ -f "target/release/jasper-designer" ]; then
        cp target/release/jasper-designer ../builds/linux/jasper-designer-release
        log_success "Linux 发布版本构建完成"
    fi
    
    cd ..
}

# 构建 Windows 版本
build_windows() {
    log_info "构建 Windows 版本..."
    
    cd src-tauri
    cargo build --target x86_64-pc-windows-gnu --release
    
    if [ -f "target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
        cp target/x86_64-pc-windows-gnu/release/jasper-designer.exe ../builds/windows/
        cp target/x86_64-pc-windows-gnu/release/WebView2Loader.dll ../builds/windows/
        log_success "Windows 版本构建完成"
    fi
    
    cd ..
}

# 打包函数
create_packages() {
    log_info "创建发布包..."
    
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Linux 包
    if $BUILD_LINUX && [ -f "builds/linux/jasper-designer-release" ]; then
        LINUX_DIR="jasper-designer-v2-linux-$TIMESTAMP"
        mkdir -p "$LINUX_DIR"
        
        cp builds/linux/jasper-designer-release "$LINUX_DIR/jasper-designer"
        cp -r dist/* "$LINUX_DIR/"
        cp -r src-tauri/icons "$LINUX_DIR/"
        
        # 创建启动脚本
        cat > "$LINUX_DIR/run-jasper.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Jasper Designer V2.0..."
cd "$(dirname "$0")"
./jasper-designer
EOF
        chmod +x "$LINUX_DIR/run-jasper.sh"
        
        tar -czf "builds/archives/$LINUX_DIR.tar.gz" "$LINUX_DIR"
        rm -rf "$LINUX_DIR"
        log_success "Linux 包创建完成: $LINUX_DIR.tar.gz"
    fi
    
    # Windows 包
    if $BUILD_WINDOWS && [ -f "builds/windows/jasper-designer.exe" ]; then
        WINDOWS_DIR="jasper-designer-v2-windows-$TIMESTAMP"
        mkdir -p "$WINDOWS_DIR"
        
        cp builds/windows/jasper-designer.exe "$WINDOWS_DIR/"
        cp builds/windows/WebView2Loader.dll "$WINDOWS_DIR/"
        cp -r dist/* "$WINDOWS_DIR/"
        cp -r src-tauri/icons "$WINDOWS_DIR/"
        
        # 创建 Windows 启动脚本
        cat > "$WINDOWS_DIR/run-jasper.bat" << 'EOF'
@echo off
title Jasper Designer V2.0
echo 🚀 Starting Jasper Designer V2.0...
echo 💡 DevTools: Press F12 or click debug button
cd /d "%~dp0"
jasper-designer.exe
EOF
        
        # 创建 README
        cat > "$WINDOWS_DIR/README.md" << EOF
# Jasper Designer V2.0 - Windows Release

## 快速开始
双击 \`jasper-designer.exe\` 或运行 \`run-jasper.bat\`

## DevTools 调试
- F12: 开启开发者工具
- 工具栏黄色按钮: DevTools 切换

## 文件说明
- jasper-designer.exe: 主程序 (3.4MB)
- WebView2Loader.dll: 浏览器引擎 (154KB)
- 总体积: ~4MB

构建时间: $(date)
构建脚本: build-all.sh
EOF
        
        tar -czf "builds/archives/$WINDOWS_DIR.tar.gz" "$WINDOWS_DIR"
        rm -rf "$WINDOWS_DIR"
        log_success "Windows 包创建完成: $WINDOWS_DIR.tar.gz"
    fi
}

# 显示构建信息
show_build_info() {
    log_info "显示构建信息..."
    
    echo ""
    echo "📊 构建统计:"
    
    if [ -f "builds/linux/jasper-designer-release" ]; then
        echo "  Linux Release: $(ls -lh builds/linux/jasper-designer-release | awk '{print $5}')"
    fi
    
    if $BUILD_DEBUG && [ -f "builds/linux/jasper-designer-debug" ]; then
        echo "  Linux Debug:   $(ls -lh builds/linux/jasper-designer-debug | awk '{print $5}')"
        echo "  Linux Optimized: $(ls -lh builds/linux/jasper-designer-optimized | awk '{print $5}')"
    fi
    
    if [ -f "builds/windows/jasper-designer.exe" ]; then
        echo "  Windows:       $(ls -lh builds/windows/jasper-designer.exe | awk '{print $5}')"
    fi
    
    echo ""
    echo "📦 发布包:"
    if [ -d "builds/archives" ] && [ "$(ls -A builds/archives)" ]; then
        ls -lh builds/archives/
    else
        echo "  无发布包"
    fi
    
    echo ""
    echo "📥 下载命令:"
    for archive in builds/archives/*.tar.gz; do
        if [ -f "$archive" ]; then
            echo "  scp root@server:$PROJECT_ROOT/$archive ."
        fi
    done
}

# 主构建流程
main() {
    echo "========================================"
    echo "  Jasper Designer V2.0 构建脚本"
    echo "========================================"
    
    # 清理
    if $CLEAN; then
        cleanup_builds
    fi
    
    # 环境检查
    check_environment
    
    # 构建前端
    build_frontend
    
    # 构建后端
    if $BUILD_LINUX; then
        build_linux
    fi
    
    if $BUILD_WINDOWS; then
        build_windows
    fi
    
    # 打包
    create_packages
    
    # 显示信息
    show_build_info
    
    log_success "🎉 所有构建任务完成!"
}

# 执行主函数
main "$@"