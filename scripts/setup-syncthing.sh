#!/bin/bash

echo "=== 安装 Syncthing 自动同步服务 ==="

# 安装 Syncthing
echo "1. 安装 Syncthing..."
curl -s https://syncthing.net/release-key.txt | sudo apt-key add -
echo "deb https://apt.syncthing.net/ syncthing stable" | sudo tee /etc/apt/sources.list.d/syncthing.list
sudo apt update
sudo apt install -y syncthing

# 创建 Syncthing 服务配置
echo "2. 配置 Syncthing 服务..."
cat > /etc/systemd/system/syncthing@.service << 'EOF'
[Unit]
Description=Syncthing - Open Source Continuous File Synchronization for %I
Documentation=man:syncthing(1)
After=network.target

[Service]
User=%i
ExecStart=/usr/bin/syncthing -no-browser -gui-address="0.0.0.0:8384"
Restart=on-failure
RestartSec=5
SuccessExitStatus=3 4
RestartForceExitStatus=3 4

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
echo "3. 启动 Syncthing 服务..."
sudo systemctl enable syncthing@root
sudo systemctl start syncthing@root

# 配置防火墙
echo "4. 配置防火墙..."
sudo ufw allow 22000/tcp  # 同步端口
sudo ufw allow 8384/tcp   # Web UI 端口
sudo ufw allow 21027/udp  # 发现端口

# 获取设备 ID
echo "5. 获取设备信息..."
sleep 3
DEVICE_ID=$(syncthing -device-id 2>/dev/null)

# 创建共享文件夹配置
SYNC_DIR="/root/project/jasper/builds"
mkdir -p "$SYNC_DIR"

echo
echo "========================================="
echo "✅ Syncthing 安装完成！"
echo "========================================="
echo
echo "📱 设备 ID: $DEVICE_ID"
echo "📁 同步目录: $SYNC_DIR"
echo "🌐 Web 界面: http://$(hostname -I | awk '{print $1}'):8384"
echo
echo "在 Windows 端设置："
echo "1. 下载 Syncthing: https://syncthing.net/downloads/"
echo "2. 安装并启动 Syncthing"
echo "3. 打开 http://localhost:8384"
echo "4. 添加远程设备，输入上面的设备 ID"
echo "5. 共享文件夹选择 'jasper-builds'"
echo
echo "多台 Windows 都可以连接到同一个设备 ID！"