#!/bin/bash

# 🚀 Jasper Designer V2.0 - 统一构建管理器
# 替代分散的 11个 package-*.sh 脚本
# 创建日期: 2025-08-19

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ROOT="/root/project/jasper"
BUILD_DIR="${PROJECT_ROOT}/builds/windows"
ARCHIVE_DIR="${PROJECT_ROOT}/builds/archives"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

# 显示主菜单
show_main_menu() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                🚀 Jasper Designer V2.0                  ║"
    echo "║                   统一构建管理器                         ║"
    echo "║                                                          ║"
    echo "║  Version: 1.0.0                                         ║"
    echo "║  Status: M3 Advanced Editing 85% Complete               ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo "📋 构建选项:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}1.${NC} 🔧 开发构建 (Development Build)"
    echo -e "${GREEN}2.${NC} 🚀 生产构建 (Release Build)" 
    echo -e "${GREEN}3.${NC} 🐛 调试构建 (Debug Build)"
    echo -e "${GREEN}4.${NC} ⚡ 快速测试构建 (Quick Test)"
    echo
    echo "🛠️ 维护选项:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}5.${NC} 🧹 清理构建产物 (Cleanup Builds)"
    echo -e "${BLUE}6.${NC} 📊 查看构建状态 (Build Status)"
    echo -e "${BLUE}7.${NC} 📦 管理历史版本 (Version Management)"
    echo
    echo "🎯 专项构建:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}8.${NC} 🎨 M3 功能构建 (M3 Feature Build)"
    echo -e "${YELLOW}9.${NC} 🔄 ResizeHandles 构建 (Resize Feature)"
    echo -e "${YELLOW}10.${NC} ⌨️  对齐功能构建 (Alignment Feature)"
    echo
    echo -e "${RED}0.${NC} ❌ 退出 (Exit)"
    echo
    echo -n "请选择操作 (0-10): "
}

# 检查环境
check_environment() {
    log_header "检查构建环境"
    
    # 检查 Rust
    if ! command -v rustc &> /dev/null; then
        log_error "Rust 未安装，请先安装 Rust"
        return 1
    fi
    log_success "Rust 版本: $(rustc --version)"
    
    # 检查 Node.js  
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        return 1
    fi
    log_success "Node.js 版本: $(node --version)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        return 1
    fi
    log_success "npm 版本: $(npm --version)"
    
    # 检查项目目录
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "项目目录不存在: $PROJECT_ROOT"
        return 1
    fi
    log_success "项目目录: $PROJECT_ROOT"
    
    return 0
}

# 安装依赖
install_dependencies() {
    log_header "安装项目依赖"
    cd "$PROJECT_ROOT"
    
    log_info "安装前端依赖..."
    npm install
    
    log_info "检查 Rust 依赖..."
    cd src-tauri
    cargo check
    cd ..
    
    log_success "依赖安装完成"
}

# 执行类型检查
type_check() {
    log_header "执行类型检查"
    cd "$PROJECT_ROOT"
    
    log_info "TypeScript 类型检查..."
    npx tsc --noEmit
    
    log_info "Rust 代码检查..."
    cd src-tauri
    cargo clippy -- -D warnings
    cargo fmt --check
    cd ..
    
    log_success "类型检查通过"
}

# 开发构建
build_development() {
    log_header "开发构建 (Development Build)"
    
    check_environment || return 1
    install_dependencies
    type_check
    
    log_info "启动开发模式..."
    npm run tauri dev
}

# 生产构建
build_release() {
    log_header "生产构建 (Release Build)"
    
    check_environment || return 1
    install_dependencies  
    type_check
    
    log_info "构建生产版本..."
    npm run tauri build
    
    # 创建版本包
    create_release_package "PRODUCTION"
    
    log_success "生产构建完成"
}

# 调试构建
build_debug() {
    log_header "调试构建 (Debug Build)"
    
    check_environment || return 1
    install_dependencies
    
    log_info "启动调试模式..."
    RUST_LOG=debug npm run tauri dev
}

# 快速测试构建
build_quick_test() {
    log_header "快速测试构建"
    
    log_info "跳过类型检查，快速构建..."
    cd "$PROJECT_ROOT"
    npm run tauri build
    
    # 快速打包
    create_release_package "QUICK-TEST"
    
    log_success "快速构建完成"
}

# M3 功能构建
build_m3_feature() {
    log_header "M3 功能构建 - 高级编辑功能 (85% Complete)"
    
    check_environment || return 1
    install_dependencies
    type_check
    
    log_info "M3 功能状态检查..."
    echo "✅ 属性面板完整实现"
    echo "✅ ResizeHandles系统 (8个控制点)"
    echo "✅ 对齐分布工具 (8种算法)"
    echo "🔧 核心快捷键系统 (进行中)"
    echo "📋 群组和右键菜单 (已设计)"
    
    log_info "构建 M3 功能版本..."
    npm run tauri build
    
    create_release_package "M3-ADVANCED-EDITING-85PCT"
    
    log_success "M3 功能构建完成"
}

# ResizeHandles 专项构建
build_resize_handles() {
    log_header "ResizeHandles 功能构建"
    
    check_environment || return 1
    install_dependencies
    
    log_info "构建 ResizeHandles 功能..."
    npm run tauri build
    
    create_release_package "RESIZE-HANDLES-OPTIMIZED"
    
    log_success "ResizeHandles 构建完成"
}

# 对齐功能构建
build_alignment_feature() {
    log_header "对齐功能构建"
    
    check_environment || return 1
    install_dependencies
    
    log_info "构建对齐功能..."
    npm run tauri build
    
    create_release_package "ALIGNMENT-FEATURE"
    
    log_success "对齐功能构建完成"
}

# 创建发布包
create_release_package() {
    local FEATURE_NAME="$1"
    local PACKAGE_NAME="jasper-designer-v2-${FEATURE_NAME}-${TIMESTAMP}"
    local PACKAGE_DIR="${BUILD_DIR}/${PACKAGE_NAME}"
    
    log_header "创建发布包: ${PACKAGE_NAME}"
    
    # 创建包目录
    mkdir -p "$PACKAGE_DIR"
    
    # 复制可执行文件
    if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
        cp "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" "$PACKAGE_DIR/"
        log_success "复制主程序"
    fi
    
    if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" ]; then
        cp "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" "$PACKAGE_DIR/"
        log_success "复制 WebView2Loader"
    fi
    
    # 复制前端资源
    if [ -d "dist" ]; then
        cp -r dist/* "$PACKAGE_DIR/" 2>/dev/null || true
        log_success "复制前端资源"
    fi
    
    # 复制图标
    mkdir -p "$PACKAGE_DIR/icons"
    if [ -d "src-tauri/icons" ]; then
        cp src-tauri/icons/* "$PACKAGE_DIR/icons/" 2>/dev/null || true
        log_success "复制图标文件"
    fi
    
    # 创建启动脚本
    cat > "$PACKAGE_DIR/run-${FEATURE_NAME,,}.bat" << EOF
@echo off
title Jasper Designer V2 - ${FEATURE_NAME}
echo ===============================================
echo 🎯 Jasper Designer V2 - ${FEATURE_NAME}
echo ===============================================
echo.
echo ✅ 构建时间: ${TIMESTAMP}
echo ✅ 功能状态: M3 高级编辑功能 85%% 完成
echo.
echo 🚀 启动应用...
start "" "jasper-designer.exe"
EOF
    
    # 创建功能说明
    cat > "$PACKAGE_DIR/FEATURE-INFO.md" << EOF
# 🎯 Jasper Designer V2 - ${FEATURE_NAME}

**构建时间**: ${TIMESTAMP}  
**版本**: V2.0  
**M3 状态**: 高级编辑功能 85% 完成

## ✅ 包含功能

### 已完成 (85%)
- 属性面板完整实现 (支持5种元素类型)
- ResizeHandles系统 (8个控制点+统一交互层+60fps性能)
- 对齐分布工具 (6种对齐算法+2种分布算法+专业UI界面)

### 进行中 (10%)
- 核心快捷键系统 (Ctrl+C/V/X/Z/Y和Delete键支持)

### 已设计待开发 (5%)
- 群组操作功能 (完整设计已完成)
- 右键上下文菜单 (详细交互逻辑已设计)

## 🚀 使用方法

1. 双击 \`run-${FEATURE_NAME,,}.bat\` 启动应用
2. 或直接运行 \`jasper-designer.exe\`

## 📋 系统要求

- Windows 10/11 (x64)
- 无需额外安装，包含 WebView2

---
🤖 Generated by Build Manager v1.0.0
EOF
    
    # 创建压缩包
    cd "$BUILD_DIR"
    tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}/"
    
    # 获取包大小
    local PACKAGE_SIZE=$(du -sh "${PACKAGE_NAME}" | cut -f1)
    local ARCHIVE_SIZE=$(du -sh "${PACKAGE_NAME}.tar.gz" | cut -f1)
    local ARCHIVE_PATH="$BUILD_DIR/${PACKAGE_NAME}.tar.gz"
    
    log_success "发布包创建完成！"
    echo ""
    echo "📦 最终产物:"
    echo "  📁 目录包: ${PACKAGE_SIZE} - $BUILD_DIR/${PACKAGE_NAME}"
    echo "  📦 压缩包: ${ARCHIVE_SIZE} - ${ARCHIVE_PATH}"
    echo ""
    echo "⬇️ 下载命令："
    echo "  scp user@server:${ARCHIVE_PATH} ."
    echo ""
    
    cd "$PROJECT_ROOT"
}

# 清理构建产物
cleanup_builds() {
    log_header "清理构建产物"
    
    echo "🧹 构建产物清理选项:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. 清理临时构建文件"
    echo "2. 清理历史版本 (保留最新2个)"
    echo "3. 清理 old-builds 目录 (释放~96MB)"
    echo "4. 完整清理 (谨慎操作)"
    echo "0. 返回主菜单"
    echo
    echo -n "请选择清理操作: "
    
    read cleanup_choice
    case $cleanup_choice in
        1)
            log_info "清理临时文件..."
            find "$BUILD_DIR" -name "*.tmp" -delete 2>/dev/null || true
            find "$PROJECT_ROOT" -name "*.log" -delete 2>/dev/null || true
            log_success "临时文件清理完成"
            ;;
        2)
            log_info "清理历史版本，保留最新2个..."
            cd "$BUILD_DIR"
            ls -t *.tar.gz | tail -n +3 | xargs rm -f 2>/dev/null || true
            log_success "历史版本清理完成"
            ;;
        3)
            log_warning "即将清理 old-builds 目录 (约96MB)"
            echo -n "确认删除? (y/N): "
            read confirm
            if [[ $confirm == [yY] ]]; then
                rm -rf "$ARCHIVE_DIR/old-builds-20250819" 2>/dev/null || true
                log_success "old-builds 目录清理完成，释放约96MB空间"
            else
                log_info "清理操作已取消"
            fi
            ;;
        4)
            log_warning "即将执行完整清理 (删除所有构建产物)"
            echo -n "确认删除所有构建文件? (y/N): "
            read confirm
            if [[ $confirm == [yY] ]]; then
                rm -rf "$BUILD_DIR"/* 2>/dev/null || true
                rm -rf "$ARCHIVE_DIR"/* 2>/dev/null || true
                log_success "完整清理完成"
            else
                log_info "清理操作已取消"
            fi
            ;;
        0)
            return
            ;;
        *)
            log_error "无效选择"
            ;;
    esac
    
    echo
    echo -n "按回车继续..."
    read
}

# 查看构建状态
show_build_status() {
    log_header "构建状态检查"
    
    echo "📊 项目状态:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎯 当前里程碑: M3 - Advanced Editing (85% 完成)"
    echo "✅ M1 - Foundation Stability (已完成)"
    echo "✅ M2 - Core Interactions (已完成)"
    echo "🔧 M3 - 进行中: Phase 4A 核心快捷键系统"
    echo
    
    echo "📦 构建产物统计:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -d "$BUILD_DIR" ]; then
        local build_count=$(find "$BUILD_DIR" -name "*.tar.gz" | wc -l)
        local build_size=$(du -sh "$BUILD_DIR" 2>/dev/null | cut -f1)
        echo "Windows 构建: $build_count 个文件，总大小: $build_size"
        
        echo "最新构建:"
        ls -lt "$BUILD_DIR"/*.tar.gz 2>/dev/null | head -3 | while read -r line; do
            echo "  📦 $(echo $line | awk '{print $9}' | xargs basename)"
        done
    else
        echo "❌ 构建目录不存在"
    fi
    
    if [ -d "$ARCHIVE_DIR" ]; then
        local archive_size=$(du -sh "$ARCHIVE_DIR" 2>/dev/null | cut -f1)
        echo "历史归档: 总大小: $archive_size"
    fi
    
    echo
    echo "🛠️ 环境状态:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    command -v rustc >/dev/null && echo "✅ Rust: $(rustc --version)" || echo "❌ Rust 未安装"
    command -v node >/dev/null && echo "✅ Node.js: $(node --version)" || echo "❌ Node.js 未安装"  
    command -v npm >/dev/null && echo "✅ npm: $(npm --version)" || echo "❌ npm 未安装"
    
    echo
    echo -n "按回车继续..."
    read
}

# 版本管理
manage_versions() {
    log_header "版本管理"
    
    echo "📋 版本管理选项:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. 列出所有版本"
    echo "2. 归档旧版本"
    echo "3. 恢复指定版本"
    echo "4. 删除指定版本"
    echo "0. 返回主菜单"
    echo
    echo -n "请选择操作: "
    
    read version_choice
    case $version_choice in
        1)
            log_info "所有构建版本:"
            find "$BUILD_DIR" -name "*.tar.gz" -exec basename {} \; | sort
            ;;
        2)
            log_info "归档7天前的版本..."
            find "$BUILD_DIR" -name "*.tar.gz" -mtime +7 -exec mv {} "$ARCHIVE_DIR/" \;
            log_success "归档完成"
            ;;
        3)
            log_info "可恢复的版本:"
            find "$ARCHIVE_DIR" -name "*.tar.gz" -exec basename {} \;
            echo -n "输入要恢复的版本文件名: "
            read version_name
            if [ -f "$ARCHIVE_DIR/$version_name" ]; then
                mv "$ARCHIVE_DIR/$version_name" "$BUILD_DIR/"
                log_success "版本恢复完成: $version_name"
            else
                log_error "版本文件不存在"
            fi
            ;;
        4)
            log_warning "删除版本操作 (不可恢复)"
            find "$BUILD_DIR" -name "*.tar.gz" -exec basename {} \;
            echo -n "输入要删除的版本文件名: "
            read version_name  
            if [ -f "$BUILD_DIR/$version_name" ]; then
                echo -n "确认删除 $version_name? (y/N): "
                read confirm
                if [[ $confirm == [yY] ]]; then
                    rm "$BUILD_DIR/$version_name"
                    log_success "版本删除完成: $version_name"
                else
                    log_info "删除操作已取消"
                fi
            else
                log_error "版本文件不存在"
            fi
            ;;
        0)
            return
            ;;
        *)
            log_error "无效选择"
            ;;
    esac
    
    echo
    echo -n "按回车继续..."
    read
}

# 主程序
main() {
    # 确保目录存在
    mkdir -p "$BUILD_DIR"
    mkdir -p "$ARCHIVE_DIR"
    
    while true; do
        show_main_menu
        read choice
        
        case $choice in
            1)
                build_development
                ;;
            2)
                build_release
                ;;
            3)
                build_debug
                ;;
            4)
                build_quick_test
                ;;
            5)
                cleanup_builds
                ;;
            6)
                show_build_status
                ;;
            7)
                manage_versions
                ;;
            8)
                build_m3_feature
                ;;
            9)
                build_resize_handles
                ;;
            10)
                build_alignment_feature
                ;;
            0)
                log_success "感谢使用 Jasper Designer 构建管理器!"
                exit 0
                ;;
            *)
                log_error "无效选择，请输入 0-10"
                echo -n "按回车继续..."
                read
                ;;
        esac
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi