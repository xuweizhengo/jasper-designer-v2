#!/bin/bash

echo "=== Windows 共享文件夹快速设置 ==="
echo

# 获取用户输入
read -p "请输入 Windows IP 地址: " WINDOWS_IP
read -p "请输入共享文件夹名称 (如 JasperBuilds): " SHARE_NAME
read -p "请输入 Windows 用户名: " WINDOWS_USER
read -s -p "请输入 Windows 密码: " WINDOWS_PASS
echo

# 安装依赖
echo "安装必要工具..."
sudo apt-get update > /dev/null 2>&1
sudo apt-get install -y cifs-utils rsync inotify-tools > /dev/null 2>&1

# 创建挂载点
MOUNT_POINT="/mnt/jasper-share"
sudo mkdir -p "$MOUNT_POINT"

# 直接挂载测试
echo "测试连接..."
sudo mount -t cifs "//${WINDOWS_IP}/${SHARE_NAME}" "$MOUNT_POINT" \
    -o username="$WINDOWS_USER",password="$WINDOWS_PASS",uid=$(id -u),gid=$(id -g)

if mountpoint -q "$MOUNT_POINT"; then
    echo "✅ 连接成功！"

    # 创建后台同步服务
    cat > /tmp/jasper-sync.service << EOF
[Unit]
Description=Jasper Auto Sync to Windows
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'while true; do rsync -a /root/project/jasper/builds/windows/ $MOUNT_POINT/; sleep 5; done'
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

    # 安装服务
    sudo mv /tmp/jasper-sync.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable jasper-sync
    sudo systemctl start jasper-sync

    echo "✅ 自动同步服务已启动！"
    echo "文件将自动同步到: \\\\${WINDOWS_IP}\\${SHARE_NAME}"
    echo
    echo "管理命令:"
    echo "  查看状态: systemctl status jasper-sync"
    echo "  停止同步: systemctl stop jasper-sync"
    echo "  启动同步: systemctl start jasper-sync"
else
    echo "❌ 连接失败，请检查:"
    echo "1. Windows 防火墙是否允许文件共享"
    echo "2. 共享文件夹权限设置"
    echo "3. 用户名密码是否正确"
fi