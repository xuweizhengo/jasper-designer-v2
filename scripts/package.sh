#!/bin/bash
# === Jasper Designer V2 打包工具集 ===
# 统一入口脚本，提供交互式选择或无交互参数化构建

set -Eeuo pipefail

# -------- Helpers --------
req() { command -v "$1" >/dev/null 2>&1 || { echo -e "\033[0;31m✖ 缺少依赖: $1\033[0m"; exit 1; }; }
die() { echo -e "\033[0;31m✖ $*\033[0m"; exit 1; }

# 预检（可通过 PRECHECK=0 跳过）
precheck() {
  [[ "${PRECHECK:-1}" == "0" ]] && return 0
  echo_info "运行预检… (可通过 PRECHECK=0 跳过)"
  echo_info "Node: $(node -v 2>/dev/null || echo '未安装') | NPM: $(npm -v 2>/dev/null || echo '未安装') | Cargo: $(cargo --version 2>/dev/null || echo '未安装')"
  req node; req npm; req cargo
  if npm run -s lint >/dev/null 2>&1; then
    echo_success "ESLint 通过"
  else
    echo_warning "ESLint 检查未通过或未安装，继续构建但建议先修复 (npm i && npm run lint)"
  fi
}

# 获取项目根目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/builds/windows"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_title() { echo -e "${CYAN}🎯 $1${NC}"; }

clear
echo_title "======================================"
echo_title "   Jasper Designer V2 打包工具"
echo_title "======================================"
echo ""

# 参数解析（优先无交互）
ACTION=""; FEATURE_NAME=""; BASE_PACKAGE=""; CLEAN_FLAG="";
while [[ ${1:-} ]]; do
  case "$1" in
    full) ACTION="full" ;;
    smart|incremental) ACTION="smart" ;;
    list) ACTION="list" ;;
    clean) ACTION="clean" ;;
    --feature) FEATURE_NAME="${2:-}"; shift ;;
    --base) BASE_PACKAGE="${2:-}"; shift ;;
    --clean-history) CLEAN_FLAG="--clean-history" ;;
    -y|--yes) export YES_ALL=1 ;;
    *) echo_warning "未知参数: $1" ;;
  esac
  shift || true
done

# 预检
precheck

# 快速子命令模式
if [[ -n "$ACTION" ]]; then
  case "$ACTION" in
    full)
      FEATURE_NAME=${FEATURE_NAME:-"FULL-BUILD"}
      [[ -n "${CLEAN_FLAG}" ]] && echo_info "启用清理历史版本"
      [[ ! -x "$SCRIPT_DIR/package-full-optimized.sh" ]] && die "缺少脚本: package-full-optimized.sh"
      "$SCRIPT_DIR/package-full-optimized.sh" "$FEATURE_NAME" "$CLEAN_FLAG"
      echo_success "全量打包完成"
      exit 0
      ;;
    smart)
      FEATURE_NAME=${FEATURE_NAME:-"UI-UPDATE"}
      [[ ! -d "$BUILD_DIR" ]] && die "未找到构建目录: $BUILD_DIR，请先执行全量打包"
      [[ ! -x "$SCRIPT_DIR/package-smart.sh" ]] && die "缺少脚本: package-smart.sh"
      "$SCRIPT_DIR/package-smart.sh" "$FEATURE_NAME" "$BASE_PACKAGE"
      echo_success "增量打包完成"
      exit 0
      ;;
    list)
      ACTION_MENU=3; # 复用下方逻辑
      ;;
    clean)
      ACTION_MENU=4
      ;;
  esac
fi

# 检查脚本文件权限
chmod +x scripts/package-full.sh 2>/dev/null || true
chmod +x scripts/package-incremental.sh 2>/dev/null || true

# 显示菜单
echo "请选择打包类型:"
echo ""
echo "  1) 🏗️  全量打包 (完整重新构建)"
echo "     - 适用于: 新功能、后端修改、发布版本"
echo "     - 时间: 优化后 (5-12分钟，原20分钟)"
echo "     - 特性: 智能检测、增量构建、性能优化"
echo ""
echo "  2) ⚡ 智能增量 (检测变更构建)"
echo "     - 适用于: 代码修改、日常开发、快速测试"
echo "     - 时间: 极短 (30秒-2分钟)"
echo "     - 特性: 智能检测、按需构建、缓存复用"
echo ""
echo "  3) 📋 查看现有包"
echo "     - 列出所有构建的版本包"
echo ""
echo "  4) 🧹 清理历史版本"
echo "     - 仅保留最新3个版本，其余移至archives"
echo ""
echo "  q) 退出"
echo ""

# 读取用户选择
read -p "请输入选项 (1-4, q): " -n 1 -r
echo ""
echo ""

case ${ACTION_MENU:-$REPLY} in
    1)
        echo_title "选择了全量打包"
        echo ""
        
        # 输入功能名称
        read -p "请输入功能名称 (默认: FULL-BUILD): " FEATURE_NAME
        FEATURE_NAME=${FEATURE_NAME:-"FULL-BUILD"}
        
        # 询问是否清理历史版本
        read -p "是否清理历史版本? (y/n, 默认: n): " -n 1 -r CLEAN_REPLY
        echo ""
        
        CLEAN_FLAG=""
        if [[ $CLEAN_REPLY =~ ^[Yy]$ ]]; then
            CLEAN_FLAG="--clean-history"
        fi
        
        echo_info "开始优化全量打包..."
        [[ ! -x "$SCRIPT_DIR/package-full-optimized.sh" ]] && die "缺少脚本: package-full-optimized.sh"
        "$SCRIPT_DIR/package-full-optimized.sh" "$FEATURE_NAME" "$CLEAN_FLAG"
        ;;
        
    2)
        echo_title "选择了增量打包"
        echo ""
        
        # 检查是否有可用的基础包
        if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A "$BUILD_DIR" 2>/dev/null)" ]; then
            echo_warning "未找到任何基础包，请先进行全量打包"
            exit 1
        fi
        
        # 显示可用的基础包
        echo "可用的基础包:"
        ls -1t "$BUILD_DIR" | grep "jasper-designer-v2-" | head -5 | nl
        echo ""
        
        # 输入功能名称
        read -p "请输入功能名称 (默认: UI-UPDATE): " FEATURE_NAME
        FEATURE_NAME=${FEATURE_NAME:-"UI-UPDATE"}
        
        # 可选择特定基础包
        read -p "指定基础包名称 (留空自动选择最新): " BASE_PACKAGE
        
        echo_info "开始智能增量打包..."
        [[ ! -x "$SCRIPT_DIR/package-smart.sh" ]] && die "缺少脚本: package-smart.sh"
        "$SCRIPT_DIR/package-smart.sh" "$FEATURE_NAME" "$BASE_PACKAGE"
        ;;
        
    3)
        echo_title "现有版本包"
        echo ""
        
        if [ -d "$BUILD_DIR" ] && [ "$(ls -A "$BUILD_DIR" 2>/dev/null)" ]; then
            echo "📦 主版本包:"
            ls -la "$BUILD_DIR" | grep "jasper-designer-v2-" | awk '{print "  " $9 " - " $6 " " $7 " " $8 " - " $5}'
            echo ""
            
            if [ -d "$BUILD_DIR/archives" ]; then
                echo "📚 归档版本:"
                ls -la "$BUILD_DIR/archives" | grep "jasper-designer-v2-" | awk '{print "  " $9 " - " $6 " " $7 " " $8 " - " $5}'
            fi
            
            # 显示磁盘使用情况
            echo ""
            echo "💾 磁盘使用情况:"
            du -sh "$BUILD_DIR"/* 2>/dev/null | sort -hr | head -10 || true
        else
            echo_warning "未找到任何版本包"
        fi
        ;;
        
    4)
        echo_title "清理历史版本"
        echo ""
        
        if [ -d "$BUILD_DIR" ]; then
            # 统计版本包（目录和压缩包）
            DIR_COUNT=$(ls -1 "$BUILD_DIR" | grep "^jasper-designer-v2-" | grep -v "\.tar\.gz$" | wc -l)
            TAR_COUNT=$(ls -1 "$BUILD_DIR" | grep "^jasper-designer-v2-.*\.tar\.gz$" | wc -l)
            TOTAL_COUNT=$((DIR_COUNT + TAR_COUNT))
            
            echo_info "发现版本包统计："
            echo "  📁 目录包: $DIR_COUNT 个"
            echo "  📦 压缩包: $TAR_COUNT 个" 
            echo "  📊 总计: $TOTAL_COUNT 个"
            echo ""
            
            if [ "$TOTAL_COUNT" -gt 6 ]; then
                echo_warning "版本过多，建议清理。将保留最新3个版本"
                echo ""
                
                echo "📁 目录包（按时间排序）："
                ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-" | grep -v "\.tar\.gz$" | head -5
                echo ""
                echo "📦 压缩包（按时间排序）："
                ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-.*\.tar\.gz$" | head -5
                echo ""
                
                echo "即将移动到archives的版本:"
                echo "📁 旧目录包:"
                ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-" | grep -v "\.tar\.gz$" | tail -n +4
                echo "📦 旧压缩包:"
                ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-.*\.tar\.gz$" | tail -n +4
                echo ""
                
                if [[ -n "${YES_ALL:-}" ]]; then REPLY="y"; else read -p "确认清理? (y/n): " -n 1 -r; fi
                echo ""
                
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    mkdir -p "$BUILD_DIR/archives"
                    
                    # 清理旧的目录包
                    ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-" | grep -v "\.tar\.gz$" | tail -n +4 | while read dir; do
                        if [ -d "$BUILD_DIR/$dir" ]; then
                            echo_info "归档目录: $dir"
                            mv "$BUILD_DIR/$dir" "$BUILD_DIR/archives/"
                        fi
                    done
                    
                    # 清理旧的压缩包
                    ls -1t "$BUILD_DIR" | grep "^jasper-designer-v2-.*\.tar\.gz$" | tail -n +4 | while read file; do
                        if [ -f "$BUILD_DIR/$file" ]; then
                            echo_info "归档压缩包: $file"
                            mv "$BUILD_DIR/$file" "$BUILD_DIR/archives/"
                        fi
                    done
                    
                    # 显示清理结果
                    NEW_DIR_COUNT=$(ls -1 "$BUILD_DIR" | grep "^jasper-designer-v2-" | grep -v "\.tar\.gz$" | wc -l)
                    NEW_TAR_COUNT=$(ls -1 "$BUILD_DIR" | grep "^jasper-designer-v2-.*\.tar\.gz$" | wc -l)
                    
                    echo_success "历史版本清理完成!"
                    echo_info "清理后统计: 📁 $NEW_DIR_COUNT 目录包, 📦 $NEW_TAR_COUNT 压缩包"
                else
                    echo_info "取消清理"
                fi
            else
                echo_success "版本数量合理 ($TOTAL_COUNT ≤ 6)，无需清理"
            fi
        else
            echo_warning "builds/windows目录不存在"
        fi
        ;;
        
    q|Q)
        echo_info "退出打包工具"
        exit 0
        ;;
        
    *)
        echo_warning "无效选项，请重新运行脚本"
        exit 1
        ;;
esac

echo ""
echo_success "操作完成！"
