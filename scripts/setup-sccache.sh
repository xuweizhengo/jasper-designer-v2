#!/bin/bash
# === sccache 安装和配置脚本 ===
# 用于加速 Rust 编译的分布式缓存工具

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo "====================================="
echo "    sccache 安装配置工具"
echo "====================================="
echo ""

# 检查是否已安装
if command -v sccache >/dev/null 2>&1; then
    CURRENT_VERSION=$(sccache --version | head -n1)
    echo_info "检测到已安装 sccache: $CURRENT_VERSION"
    echo ""
    
    # 显示当前统计
    echo_info "当前缓存统计:"
    sccache --show-stats || true
    echo ""
    
    read -p "是否重新配置? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "跳过配置"
        exit 0
    fi
else
    echo_info "sccache 未安装，开始安装..."
    echo ""
fi

# 安装 sccache
install_sccache() {
    echo_info "安装方式选择:"
    echo "  1) 使用 cargo install (推荐)"
    echo "  2) 从 GitHub releases 下载预编译版本"
    echo ""
    
    read -p "请选择 (1-2): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            echo_info "使用 cargo install 安装..."
            if ! command -v cargo >/dev/null 2>&1; then
                echo_error "cargo 未安装，请先安装 Rust"
                exit 1
            fi
            
            cargo install sccache --locked
            echo_success "sccache 安装完成"
            ;;
            
        2)
            echo_info "从 GitHub 下载预编译版本..."
            
            # 检测系统架构
            ARCH=$(uname -m)
            OS=$(uname -s | tr '[:upper:]' '[:lower:]')
            
            # 确定下载 URL
            if [[ "$OS" == "linux" && "$ARCH" == "x86_64" ]]; then
                SCCACHE_URL="https://github.com/mozilla/sccache/releases/latest/download/sccache-dist-x86_64-unknown-linux-musl.tar.gz"
            elif [[ "$OS" == "darwin" && "$ARCH" == "x86_64" ]]; then
                SCCACHE_URL="https://github.com/mozilla/sccache/releases/latest/download/sccache-dist-x86_64-apple-darwin.tar.gz"
            elif [[ "$OS" == "darwin" && "$ARCH" == "arm64" ]]; then
                SCCACHE_URL="https://github.com/mozilla/sccache/releases/latest/download/sccache-dist-aarch64-apple-darwin.tar.gz"
            else
                echo_error "不支持的系统架构: $OS/$ARCH"
                echo_info "请使用 cargo install sccache 安装"
                exit 1
            fi
            
            # 下载和安装
            TEMP_DIR=$(mktemp -d)
            cd "$TEMP_DIR"
            
            echo_info "下载 sccache..."
            curl -L "$SCCACHE_URL" -o sccache.tar.gz
            
            echo_info "解压..."
            tar -xzf sccache.tar.gz
            
            echo_info "安装到 ~/.cargo/bin..."
            mkdir -p ~/.cargo/bin
            mv sccache*/sccache ~/.cargo/bin/
            chmod +x ~/.cargo/bin/sccache
            
            # 清理临时文件
            cd - >/dev/null
            rm -rf "$TEMP_DIR"
            
            echo_success "sccache 安装完成"
            
            # 确保 PATH 包含 ~/.cargo/bin
            if ! echo "$PATH" | grep -q "$HOME/.cargo/bin"; then
                echo_warning "请将 ~/.cargo/bin 添加到 PATH:"
                echo "  export PATH=\"\$HOME/.cargo/bin:\$PATH\""
            fi
            ;;
            
        *)
            echo_error "无效选择"
            exit 1
            ;;
    esac
}

# 如果未安装，执行安装
if ! command -v sccache >/dev/null 2>&1; then
    install_sccache
fi

# 配置 sccache
echo ""
echo_info "配置 sccache..."

# 设置缓存目录
SCCACHE_DIR="${HOME}/.cache/sccache"
mkdir -p "$SCCACHE_DIR"

# 配置环境变量
cat > ~/.sccache_env << EOF
# sccache 配置
export RUSTC_WRAPPER=sccache
export SCCACHE_DIR="$SCCACHE_DIR"
export SCCACHE_CACHE_SIZE="10G"
# 可选：配置远程缓存（S3、Redis等）
# export SCCACHE_REDIS="redis://localhost:6379"
# export SCCACHE_S3_BUCKET="my-sccache-bucket"
EOF

echo_success "配置文件已创建: ~/.sccache_env"

# 启动 sccache 服务
echo_info "启动 sccache 服务..."
sccache --start-server 2>/dev/null || true

# 显示配置信息
echo ""
echo_success "sccache 配置完成！"
echo ""
echo_info "使用方法:"
echo "  1. 在构建脚本中添加: source ~/.sccache_env"
echo "  2. 或在 shell 配置中添加: source ~/.sccache_env"
echo ""
echo_info "查看缓存统计: sccache --show-stats"
echo_info "清空缓存: sccache --zero-stats"
echo_info "停止服务: sccache --stop-server"
echo ""

# 显示当前状态
echo_info "当前状态:"
sccache --show-stats 2>/dev/null || echo_warning "sccache 服务未运行"

# 提示添加到 shell 配置
echo ""
echo_info "建议将以下内容添加到 ~/.bashrc 或 ~/.zshrc:"
echo ""
echo "  # sccache 配置"
echo "  source ~/.sccache_env"
echo ""

# 测试 sccache
echo_info "测试 sccache..."
if command -v rustc >/dev/null 2>&1; then
    # 创建测试文件
    TEST_FILE=$(mktemp --suffix=.rs)
    echo 'fn main() { println!("Hello, sccache!"); }' > "$TEST_FILE"
    
    # 编译测试
    if RUSTC_WRAPPER=sccache rustc "$TEST_FILE" -o /tmp/test_sccache 2>/dev/null; then
        echo_success "sccache 测试成功"
        rm -f /tmp/test_sccache
    else
        echo_warning "sccache 测试失败，请检查配置"
    fi
    
    rm -f "$TEST_FILE"
else
    echo_warning "rustc 未安装，跳过测试"
fi

echo ""
echo_success "配置完成！sccache 已准备就绪，可以加速 Rust 编译了"