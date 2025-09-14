#!/bin/bash

# Windows 配置
WINDOWS_USER="your_username"
WINDOWS_IP="192.168.1.100"  # 修改为你的 Windows IP
WINDOWS_PATH="/c/Users/your_username/Desktop/jasper-builds/"  # Windows 目标路径
WATCH_DIR="/root/project/jasper/builds/windows"
CHECK_INTERVAL=30  # 检查间隔（秒）

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 自动推送服务启动 ===${NC}"
echo -e "监控目录: ${WATCH_DIR}"
echo -e "目标: ${WINDOWS_USER}@${WINDOWS_IP}:${WINDOWS_PATH}"
echo -e "检查间隔: ${CHECK_INTERVAL}秒"

# 记录已推送的文件
PUSHED_FILES_LOG="/tmp/pushed_files.log"
touch "$PUSHED_FILES_LOG"

# 使用 inotifywait 监控文件变化（更高效）
if command -v inotifywait &> /dev/null; then
    echo -e "${GREEN}使用 inotify 监控模式${NC}"

    inotifywait -m -r -e close_write,moved_to --format '%w%f' "$WATCH_DIR" |
    while read FILE; do
        if [[ "$FILE" == *.zip ]] || [[ "$FILE" == *.exe ]]; then
            echo -e "${YELLOW}检测到新文件: $FILE${NC}"

            # 检查是否已推送
            if grep -q "$FILE" "$PUSHED_FILES_LOG"; then
                echo "文件已推送过，跳过"
                continue
            fi

            # 推送文件
            echo -e "${GREEN}推送文件到 Windows...${NC}"
            scp "$FILE" "${WINDOWS_USER}@${WINDOWS_IP}:${WINDOWS_PATH}" && {
                echo -e "${GREEN}✅ 推送成功！${NC}"
                echo "$FILE" >> "$PUSHED_FILES_LOG"

                # 发送 Windows 通知（如果配置了 SSH）
                ssh "${WINDOWS_USER}@${WINDOWS_IP}" "msg * /TIME:5 '新文件已同步: $(basename $FILE)'" 2>/dev/null || true
            } || {
                echo -e "${RED}❌ 推送失败${NC}"
            }
        fi
    done
else
    echo -e "${YELLOW}使用轮询模式（安装 inotify-tools 可提高效率）${NC}"

    # 轮询模式
    while true; do
        # 查找最新的构建文件
        LATEST_FILE=$(find "$WATCH_DIR" -type f \( -name "*.zip" -o -name "*.exe" \) -mmin -5 2>/dev/null | head -1)

        if [[ -n "$LATEST_FILE" ]]; then
            # 检查是否已推送
            if ! grep -q "$LATEST_FILE" "$PUSHED_FILES_LOG"; then
                echo -e "${YELLOW}发现新文件: $LATEST_FILE${NC}"

                # 等待文件写入完成
                sleep 2

                # 推送文件
                echo -e "${GREEN}推送文件到 Windows...${NC}"
                scp "$LATEST_FILE" "${WINDOWS_USER}@${WINDOWS_IP}:${WINDOWS_PATH}" && {
                    echo -e "${GREEN}✅ 推送成功！${NC}"
                    echo "$LATEST_FILE" >> "$PUSHED_FILES_LOG"
                } || {
                    echo -e "${RED}❌ 推送失败${NC}"
                }
            fi
        fi

        sleep "$CHECK_INTERVAL"
    done
fi