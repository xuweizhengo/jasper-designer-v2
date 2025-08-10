#!/bin/bash

# Jasper Designer V2.0 - 清理旧版本脚本
# 用法: ./scripts/cleanup-old.sh [--keep N] [--dry-run]

set -e

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 默认参数
KEEP_COUNT=3
DRY_RUN=false

# 显示帮助
show_help() {
    cat << EOF
Jasper Designer V2.0 清理脚本

用法: $0 [选项]

选项:
  --keep N     保留最新的 N 个版本 (默认: 3)
  --dry-run    只显示将要删除的文件，不实际删除
  --help       显示此帮助信息

示例:
  $0                    # 保留最新 3 个版本
  $0 --keep 5          # 保留最新 5 个版本  
  $0 --dry-run         # 预览要删除的文件
  $0 --keep 1 --dry-run # 预览只保留 1 个版本时的清理
EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep)
            KEEP_COUNT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
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

# 验证参数
if ! [[ "$KEEP_COUNT" =~ ^[0-9]+$ ]] || [ "$KEEP_COUNT" -lt 1 ]; then
    log_error "保留数量必须是正整数"
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo "  Jasper Designer V2.0 清理脚本"
echo "========================================"

log_info "清理配置:"
log_info "  保留最新版本数: $KEEP_COUNT"
log_info "  预览模式: $($DRY_RUN && echo "是" || echo "否")"
log_info "  项目目录: $PROJECT_ROOT"

# 清理函数
cleanup_pattern() {
    local pattern="$1"
    local description="$2"
    
    # 找到匹配的文件，按修改时间排序
    local files=($(ls -1t $pattern 2>/dev/null || true))
    local total=${#files[@]}
    
    if [ $total -eq 0 ]; then
        log_info "$description: 无文件需要清理"
        return
    fi
    
    if [ $total -le $KEEP_COUNT ]; then
        log_info "$description: 共 $total 个文件，全部保留"
        return
    fi
    
    local to_delete=$((total - KEEP_COUNT))
    log_info "$description: 共 $total 个文件，保留 $KEEP_COUNT 个，删除 $to_delete 个"
    
    # 保留的文件
    echo "  保留文件:"
    for i in $(seq 0 $((KEEP_COUNT - 1))); do
        if [ $i -lt $total ]; then
            local file_info=$(ls -lh "${files[$i]}" 2>/dev/null | awk '{print $5 "\t" $9}' || echo "N/A\t${files[$i]}")
            echo "    ✓ $file_info"
        fi
    done
    
    # 要删除的文件
    if [ $to_delete -gt 0 ]; then
        echo "  将删除文件:"
        for i in $(seq $KEEP_COUNT $((total - 1))); do
            if [ $i -lt $total ]; then
                local file_info=$(ls -lh "${files[$i]}" 2>/dev/null | awk '{print $5 "\t" $9}' || echo "N/A\t${files[$i]}")
                echo "    ✗ $file_info"
                
                if [ "$DRY_RUN" = false ]; then
                    rm -f "${files[$i]}"
                fi
            fi
        done
        
        if [ "$DRY_RUN" = false ]; then
            log_success "$description: 已删除 $to_delete 个旧文件"
        fi
    fi
}

# 清理不同类型的文件
echo ""
log_info "开始清理..."

# 清理根目录的打包文件
cleanup_pattern "jasper-designer-v2-*.tar.gz" "根目录压缩包"

# 清理构建目录的压缩包
if [ -d "builds/archives" ]; then
    cd builds/archives
    cleanup_pattern "*.tar.gz" "构建压缩包"
    cleanup_pattern "*.zip" "构建ZIP包"
    cd "$PROJECT_ROOT"
fi

# 清理临时目录
echo ""
log_info "清理临时文件和目录..."

temp_dirs=(
    "jasper-designer-v2-*"
    "node_modules/.cache"
    "src-tauri/target/debug/.fingerprint"
    "src-tauri/target/release/.fingerprint"
)

for pattern in "${temp_dirs[@]}"; do
    dirs=($(ls -1dt $pattern 2>/dev/null || true))
    if [ ${#dirs[@]} -gt 0 ]; then
        log_info "临时目录 $pattern: 发现 ${#dirs[@]} 个"
        for dir in "${dirs[@]}"; do
            if [ -d "$dir" ]; then
                dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "N/A")
                echo "    ✗ $dir ($dir_size)"
                
                if [ "$DRY_RUN" = false ]; then
                    rm -rf "$dir"
                fi
            fi
        done
        
        if [ "$DRY_RUN" = false ]; then
            log_success "已清理临时目录: $pattern"
        fi
    fi
done

# 清理大的构建缓存
echo ""
log_info "清理构建缓存..."

cache_dirs=(
    "src-tauri/target/debug"
    "src-tauri/target/release"
    "src-tauri/target/x86_64-pc-windows-gnu/debug"
)

for dir in "${cache_dirs[@]}"; do
    if [ -d "$dir" ] && [ "$DRY_RUN" = false ]; then
        # 只保留最终的可执行文件，删除其他缓存
        find "$dir" -name "*.rlib" -o -name "*.rmeta" -o -name "deps" -type d | head -20 | while read file; do
            if [ -e "$file" ]; then
                echo "    ✗ 清理缓存: $(basename "$file")"
                rm -rf "$file"
            fi
        done
    fi
done

# 显示清理后的统计
echo ""
log_info "清理统计:"

if [ -d "builds/archives" ]; then
    archive_count=$(ls builds/archives/*.tar.gz 2>/dev/null | wc -l || echo 0)
    archive_size=$(du -sh builds/archives 2>/dev/null | cut -f1 || echo "0B")
    echo "  压缩包数量: $archive_count"
    echo "  压缩包总大小: $archive_size"
fi

if [ -d "src-tauri/target" ]; then
    target_size=$(du -sh src-tauri/target 2>/dev/null | cut -f1 || echo "0B")
    echo "  构建缓存大小: $target_size"
fi

disk_usage=$(df -h . | tail -1 | awk '{print $4}')
echo "  可用磁盘空间: $disk_usage"

# 建议
echo ""
echo "========================================"
echo "  清理建议"
echo "========================================"

echo "🧹 定期清理命令:"
echo "  ./scripts/cleanup-old.sh            # 保留最新 3 个版本"
echo "  ./scripts/cleanup-old.sh --keep 1   # 只保留最新版本"
echo "  ./scripts/cleanup-old.sh --dry-run  # 预览清理内容"
echo ""
echo "🗑️  完全清理 (慎用):"
echo "  rm -rf src-tauri/target             # 清理所有构建缓存"
echo "  rm -rf node_modules dist            # 清理前端"
echo "  rm -rf builds jasper-designer-*     # 清理所有构建产物"

if [ "$DRY_RUN" = true ]; then
    echo ""
    log_warning "这是预览模式，没有实际删除文件"
    echo "要实际执行清理，请运行: $0 --keep $KEEP_COUNT"
else
    echo ""
    log_success "🎉 清理完成!"
fi