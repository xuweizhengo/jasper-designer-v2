#!/bin/bash

# 配置
SOURCE_DIR="/root/project/jasper/builds/windows"
SHARE_DIR="/mnt/windows-share"  # Windows 共享文件夹挂载点
SYNC_INTERVAL=10  # 同步间隔（秒）

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 自动同步到 Windows 共享文件夹 ===${NC}"
echo -e "源目录: ${SOURCE_DIR}"
echo -e "目标: ${SHARE_DIR}"
echo -e "同步间隔: ${SYNC_INTERVAL}秒"

# 检查挂载点
if ! mountpoint -q "$SHARE_DIR"; then
    echo -e "${RED}错误: 共享文件夹未挂载！${NC}"
    echo "请先运行: ./setup-windows-share.sh"
    exit 1
fi

# 使用 inotifywait 实时监控（如果可用）
if command -v inotifywait &> /dev/null; then
    echo -e "${GREEN}使用实时监控模式${NC}"

    # 初始同步
    echo -e "${YELLOW}执行初始同步...${NC}"
    rsync -av --progress "$SOURCE_DIR/" "$SHARE_DIR/"

    # 监控文件变化并自动同步
    inotifywait -m -r -e modify,create,delete,move "$SOURCE_DIR" |
    while read -r directory event filename; do
        echo -e "${YELLOW}检测到变化: $directory$filename ($event)${NC}"

        # 同步文件
        rsync -av --delete "$SOURCE_DIR/" "$SHARE_DIR/" && {
            echo -e "${GREEN}✅ 同步成功！${NC}"

            # 显示同步的文件
            if [[ -f "$directory$filename" ]]; then
                size=$(du -h "$directory$filename" | cut -f1)
                echo -e "${BLUE}文件: $filename (大小: $size)${NC}"
            fi
        } || {
            echo -e "${RED}❌ 同步失败${NC}"
        }
    done
else
    echo -e "${YELLOW}使用定期同步模式${NC}"
    echo "提示: 安装 inotify-tools 可启用实时同步"
    echo "sudo apt-get install inotify-tools"

    # 定期同步
    while true; do
        # 检查是否有新文件
        if [[ -d "$SOURCE_DIR" ]]; then
            # 同步所有文件
            echo -e "${YELLOW}正在同步...${NC}"
            rsync -av --delete --progress "$SOURCE_DIR/" "$SHARE_DIR/" && {
                echo -e "${GREEN}✅ 同步完成${NC}"

                # 显示统计
                file_count=$(find "$SHARE_DIR" -type f | wc -l)
                total_size=$(du -sh "$SHARE_DIR" 2>/dev/null | cut -f1)
                echo -e "${BLUE}共享文件夹: ${file_count} 个文件, 总大小: ${total_size}${NC}"
            } || {
                echo -e "${RED}❌ 同步失败${NC}"
            }
        fi

        sleep "$SYNC_INTERVAL"
    done
fi