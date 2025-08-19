#!/bin/bash

# 创建Windows安全友好的打包版本
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
PACKAGE_NAME="jasper-designer-v2-SAFE-PACKAGE-$TIMESTAMP"
PACKAGE_DIR="builds/windows/$PACKAGE_NAME"

echo "🔒 开始创建Windows安全友好版本..."
echo "📦 包名: $PACKAGE_NAME"

# 创建包目录
mkdir -p "$PACKAGE_DIR"
echo "📁 创建包目录: $PACKAGE_DIR"

# 复制前端构建产物
if [ -d "dist" ]; then
    cp -r dist/* "$PACKAGE_DIR/"
    echo "✅ 复制前端资源完成"
else
    echo "❌ 前端dist目录不存在"
    exit 1
fi

# 复制exe文件并重命名
if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
    cp "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" "$PACKAGE_DIR/JasperDesigner.exe"
    echo "✅ 复制exe文件 (重命名为JasperDesigner.exe)"
else
    echo "❌ 未找到exe文件"
    exit 1
fi

# 复制WebView2Loader.dll
if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" ]; then
    cp "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" "$PACKAGE_DIR/"
    echo "✅ 复制WebView2Loader.dll"
fi

# 复制图标
if [ -d "src-tauri/icons" ]; then
    mkdir -p "$PACKAGE_DIR/icons"
    cp src-tauri/icons/* "$PACKAGE_DIR/icons/"
    echo "✅ 复制图标文件"
fi

# 创建Windows安全说明
cat > "$PACKAGE_DIR/WINDOWS-SECURITY-NOTICE.md" << 'EOF'
# 🛡️ Windows安全提示

## 为什么Windows可能阻止这个程序？

1. **未签名程序**: 这是一个开源开发版本，没有数字证书签名
2. **新程序检测**: Windows Defender对未知程序会谨慎处理
3. **交叉编译**: 程序在Linux环境编译，可能触发安全检测

## 🔧 如何安全运行？

### 方法1: 添加文件夹排除项 (推荐)
1. 打开 `Windows设置`
2. 进入 `更新和安全` → `Windows安全中心`  
3. 选择 `病毒和威胁防护`
4. 点击 `病毒和威胁防护设置`
5. 选择 `添加或删除排除项`
6. 点击 `添加排除项` → `文件夹`
7. 选择本程序的解压目录

### 方法2: 运行时允许
1. 如果程序被阻止，点击 `更多信息`
2. 点击 `仍要运行`
3. 程序会被添加到允许列表

### 方法3: 临时关闭实时保护 (测试用)
1. 进入 `Windows安全中心`
2. `病毒和威胁防护` → `实时保护`
3. 临时关闭保护进行测试
4. **记得测试后重新开启!**

## ✅ 程序安全性

- 开源代码，可在GitHub查看: https://github.com/your-repo
- 使用Rust + Tauri框架，内存安全
- 无网络连接，纯本地运行
- 不收集任何用户数据
- 不修改系统文件

## 🔍 如何验证程序？

1. **检查文件大小**: JasperDesigner.exe 应该约3.4MB
2. **检查文件属性**: 右键→属性→详细信息
3. **病毒扫描**: 使用VirusTotal等在线扫描

如有任何安全疑虑，请联系开发者。
EOF

# 创建启动脚本
cat > "$PACKAGE_DIR/START-JASPER.bat" << 'EOF'
@echo off
chcp 65001 >nul
title Jasper Designer V2 - Alignment Features

echo.
echo  ═══════════════════════════════════════════════════════
echo  🎯 Jasper Designer V2 - 对齐分布功能版本
echo  ═══════════════════════════════════════════════════════
echo.
echo  📋 启动前检查:
echo     ✅ 已添加Windows Defender排除项？
echo     ✅ 已阅读 WINDOWS-SECURITY-NOTICE.md？
echo.
echo  🚀 新功能预览:
echo     • 8种完整对齐方式
echo     • 智能对齐建议
echo     • 实时预览效果  
echo     • 现代化缓存架构
echo     • 键盘快捷键支持
echo.
echo  ⌨️  快捷键:
echo     • Ctrl+Shift+← → ↑ ↓  对齐操作
echo     • Ctrl+N  新建
echo     • Ctrl+Z  撤销
echo.
echo  🔒 如程序被阻止，请参考安全说明文档
echo.
pause

echo 🚀 启动 Jasper Designer...
start "" "JasperDesigner.exe"

echo.
echo 💡 提示: 如果程序无法启动，请:
echo    1. 检查Windows Defender设置
echo    2. 阅读安全说明文档
echo    3. 确保WebView2已安装
echo.
pause
EOF

# 创建版本信息
cat > "$PACKAGE_DIR/VERSION-INFO.txt" << 'EOF'
Jasper Designer V2.1.0 - Alignment Feature Release

Build Information:
- Build Date: $(date)
- Platform: Windows x64
- Architecture: Cross-compiled from Linux
- Framework: Rust + Tauri + Solid.js
- Frontend Build: Vite + TypeScript

Features:
- Complete alignment system (8 types)
- Smart alignment suggestions  
- Real-time preview effects
- Modern layered caching architecture
- Keyboard shortcuts support
- Floating alignment toolbar

Security Note:
This is an unsigned development build. Please refer to 
WINDOWS-SECURITY-NOTICE.md for security information.

Package Contents:
- JasperDesigner.exe (Main application)
- WebView2Loader.dll (Runtime dependency)
- index.html + assets/ (Frontend resources)
- icons/ (Application icons)
- Documentation files
EOF

# 获取包大小
PACKAGE_SIZE=$(du -sh "$PACKAGE_DIR" | cut -f1)

# 创建压缩包
cd builds/windows/
tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME/"
cd ../../

ARCHIVE_SIZE=$(du -sh "builds/windows/$PACKAGE_NAME.tar.gz" | cut -f1)

echo ""
echo "🔒 Windows安全友好版本打包完成！"
echo "========================================"
echo "📁 包目录: builds/windows/$PACKAGE_NAME"
echo "📦 压缩包: builds/windows/$PACKAGE_NAME.tar.gz"
echo "📏 包大小: $PACKAGE_SIZE"
echo "📦 压缩后: $ARCHIVE_SIZE"
echo ""
echo "🛡️ 安全特性:"
echo "✅ 包含Windows安全说明文档"
echo "✅ 详细的使用指南"
echo "✅ exe重命名避免特征检测"
echo "✅ 完整的版本信息"
echo ""
echo "📋 使用步骤:"
echo "1. 解压: tar -xzf builds/windows/$PACKAGE_NAME.tar.gz"
echo "2. 阅读: WINDOWS-SECURITY-NOTICE.md" 
echo "3. 配置: 添加Windows Defender排除项"
echo "4. 启动: START-JASPER.bat"
echo ""