#!/bin/bash

# Jasper Designer V2.0 - 环境检查脚本
# 用法: ./scripts/check-env.sh

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "========================================"
echo "  Jasper Designer V2.0 环境检查"
echo "========================================"

# 检查基础工具
log_info "检查基础开发工具..."

# Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_success "Node.js: $NODE_VERSION"
else
    log_error "Node.js 未安装"
    echo "  安装命令: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

# npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_success "npm: v$NPM_VERSION"
else
    log_error "npm 未安装"
fi

# Rust
if command -v rustc >/dev/null 2>&1; then
    RUST_VERSION=$(rustc --version)
    log_success "Rust: $RUST_VERSION"
else
    log_error "Rust 未安装"
    echo "  安装命令: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

# Cargo
if command -v cargo >/dev/null 2>&1; then
    CARGO_VERSION=$(cargo --version)
    log_success "Cargo: $CARGO_VERSION"
else
    log_error "Cargo 未安装"
fi

echo ""
log_info "检查 Rust 目标平台..."

# 检查已安装的目标平台
if command -v rustup >/dev/null 2>&1; then
    TARGETS=$(rustup target list --installed)
    
    if echo "$TARGETS" | grep -q "x86_64-unknown-linux-gnu"; then
        log_success "Linux 目标平台: x86_64-unknown-linux-gnu"
    else
        log_warning "Linux 目标平台未安装"
    fi
    
    if echo "$TARGETS" | grep -q "x86_64-pc-windows-gnu"; then
        log_success "Windows 目标平台: x86_64-pc-windows-gnu"
    else
        log_warning "Windows 目标平台未安装"
        echo "  安装命令: rustup target add x86_64-pc-windows-gnu"
    fi
    
    if echo "$TARGETS" | grep -q "x86_64-pc-windows-msvc"; then
        log_success "Windows MSVC 目标平台: x86_64-pc-windows-msvc"
    else
        log_warning "Windows MSVC 目标平台未安装 (可选)"
    fi
else
    log_error "rustup 未安装"
fi

echo ""
log_info "检查交叉编译工具..."

# MinGW 编译器
if command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1; then
    MINGW_VERSION=$(x86_64-w64-mingw32-gcc --version | head -n1)
    log_success "MinGW: $MINGW_VERSION"
else
    log_warning "MinGW 交叉编译器未安装"
    echo "  安装命令: sudo apt install -y mingw-w64"
fi

# 其他必要工具
echo ""
log_info "检查其他必要工具..."

if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    log_success "Git: $GIT_VERSION"
else
    log_warning "Git 未安装"
fi

if command -v tar >/dev/null 2>&1; then
    log_success "tar: 已安装"
else
    log_error "tar 未安装"
fi

if command -v gzip >/dev/null 2>&1; then
    log_success "gzip: 已安装"
else
    log_error "gzip 未安装"
fi

# 检查项目依赖
echo ""
log_info "检查项目依赖..."

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f "package.json" ]; then
    log_success "package.json 存在"
    
    if [ -d "node_modules" ]; then
        log_success "node_modules 已安装"
    else
        log_warning "node_modules 未安装"
        echo "  运行: npm install"
    fi
else
    log_error "package.json 不存在"
fi

if [ -f "src-tauri/Cargo.toml" ]; then
    log_success "Cargo.toml 存在"
else
    log_error "src-tauri/Cargo.toml 不存在"
fi

# 检查构建产物
echo ""
log_info "检查现有构建产物..."

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    log_success "前端构建产物: dist/ ($DIST_SIZE)"
else
    log_warning "前端未构建 (dist/ 不存在)"
    echo "  运行: npm run build"
fi

if [ -f "src-tauri/target/debug/jasper-designer" ]; then
    DEBUG_SIZE=$(ls -lh src-tauri/target/debug/jasper-designer | awk '{print $5}')
    log_success "Linux Debug 版本: $DEBUG_SIZE"
else
    log_warning "Linux Debug 版本未构建"
fi

if [ -f "src-tauri/target/release/jasper-designer" ]; then
    RELEASE_SIZE=$(ls -lh src-tauri/target/release/jasper-designer | awk '{print $5}')
    log_success "Linux Release 版本: $RELEASE_SIZE"
else
    log_warning "Linux Release 版本未构建"
fi

if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
    WINDOWS_SIZE=$(ls -lh src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe | awk '{print $5}')
    log_success "Windows 版本: $WINDOWS_SIZE"
else
    log_warning "Windows 版本未构建"
fi

# 检查构建目录结构
echo ""
log_info "检查构建目录结构..."

DIRS_TO_CHECK=("builds" "builds/windows" "builds/linux" "builds/archives" "scripts")
for dir in "${DIRS_TO_CHECK[@]}"; do
    if [ -d "$dir" ]; then
        log_success "目录存在: $dir/"
    else
        log_warning "目录不存在: $dir/"
    fi
done

# 系统信息
echo ""
log_info "系统信息..."

if [ -f /etc/os-release ]; then
    OS_INFO=$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)
    log_success "操作系统: $OS_INFO"
else
    log_success "操作系统: $(uname -s) $(uname -r)"
fi

ARCH=$(uname -m)
log_success "架构: $ARCH"

# 内存和存储
MEMORY=$(free -h | grep '^Mem:' | awk '{print $2}')
log_success "内存: $MEMORY"

DISK_USAGE=$(df -h . | tail -1 | awk '{print "已用 " $3 " / 总计 " $2 " (" $5 " 已使用)"}')
log_success "磁盘: $DISK_USAGE"

# 环境变量
echo ""
log_info "相关环境变量..."

if [ -n "$CARGO_HOME" ]; then
    log_success "CARGO_HOME: $CARGO_HOME"
else
    log_info "CARGO_HOME: 未设置 (使用默认 ~/.cargo)"
fi

if [ -n "$RUSTUP_HOME" ]; then
    log_success "RUSTUP_HOME: $RUSTUP_HOME"
else
    log_info "RUSTUP_HOME: 未设置 (使用默认 ~/.rustup)"
fi

# 构建建议
echo ""
echo "========================================"
echo "  构建建议"
echo "========================================"

echo "🚀 快速构建:"
echo "  ./scripts/build-all.sh              # 构建所有版本"
echo "  ./scripts/build-windows.sh          # 只构建 Windows"
echo "  ./scripts/build-all.sh --clean      # 清理后构建"
echo ""
echo "📋 手动构建:"
echo "  npm run build                       # 构建前端"
echo "  cd src-tauri && cargo build --release  # Linux 版本" 
echo "  cd src-tauri && cargo build --target x86_64-pc-windows-gnu --release  # Windows 版本"
echo ""
echo "🔍 查看文档:"
echo "  cat BUILD_GUIDE.md                  # 详细构建指南"

echo ""
log_success "环境检查完成!"