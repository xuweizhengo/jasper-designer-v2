@echo off
title Jasper Designer V2 - MySQL测试版
color 0A
echo.
echo ===============================================
echo 🗄️ Jasper Designer V2 - MySQL数据库测试版
echo ===============================================
echo.
echo 📊 当前MySQL配置信息:
echo    主机: localhost
echo    端口: 3306  
echo    数据库: rehabilitation_system
echo    用户名: root
echo.
echo 🎯 测试步骤:
echo    1. 应用启动后点击顶部工具栏 "🧪测试DB" 按钮
echo    2. 在弹出的测试面板中按顺序点击:
echo       • 🔗 测试连接
echo       • 🔍 发现结构  
echo       • ➕ 创建数据源
echo.
echo 💡 提示: 
echo    - 确保MySQL服务正在运行
echo    - 可使用F12打开开发者工具查看详细日志
echo    - 遇到问题请查看README-MYSQL-TEST.md
echo.
echo 🚀 正在启动应用...
echo.
start "" "jasper-designer.exe"

echo ✅ 应用已启动！
echo.
echo 📋 快速测试检查清单:
echo    □ 应用是否正常启动
echo    □ 工具栏是否显示绿色"🧪测试DB"按钮  
echo    □ 点击按钮是否弹出数据库测试面板
echo    □ MySQL配置信息是否已预填充
echo    □ 连接测试是否成功
echo.
pause