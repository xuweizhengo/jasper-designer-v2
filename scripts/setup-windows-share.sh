#!/bin/bash

# Windows 共享配置
WINDOWS_IP="192.168.1.100"  # 修改为你的 Windows IP
SHARE_NAME="JasperBuilds"    # Windows 共享文件夹名
WINDOWS_USER="your_username"  # Windows 用户名
MOUNT_POINT="/mnt/windows-share"  # Linux 挂载点

# 安装必要的包
echo "安装 CIFS 工具..."
sudo apt-get update
sudo apt-get install -y cifs-utils

# 创建挂载点
sudo mkdir -p "$MOUNT_POINT"

# 创建凭据文件（更安全）
CRED_FILE="/root/.smbcredentials"
echo "创建凭据文件..."
cat > "$CRED_FILE" << EOF
username=$WINDOWS_USER
password=your_password
domain=WORKGROUP
EOF
chmod 600 "$CRED_FILE"

# 挂载共享文件夹
echo "挂载 Windows 共享文件夹..."
sudo mount -t cifs "//${WINDOWS_IP}/${SHARE_NAME}" "$MOUNT_POINT" \
    -o credentials="$CRED_FILE",uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777

# 检查挂载
if mountpoint -q "$MOUNT_POINT"; then
    echo "✅ 挂载成功！"
    echo "共享文件夹已挂载到: $MOUNT_POINT"
    ls -la "$MOUNT_POINT"
else
    echo "❌ 挂载失败"
    exit 1
fi

# 添加到 fstab 实现开机自动挂载（可选）
echo "是否添加到开机自动挂载？(y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    echo "//${WINDOWS_IP}/${SHARE_NAME} $MOUNT_POINT cifs credentials=$CRED_FILE,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777 0 0" | sudo tee -a /etc/fstab
    echo "已添加到 /etc/fstab"
fi