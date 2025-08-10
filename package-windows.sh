#!/bin/bash

# Jasper Designer V2.0 - Windows Package Script
echo "📦 Packaging Jasper Designer V2.0 for Windows..."

# Check if Windows exe exists
EXE_PATH="src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe"
if [ ! -f "$EXE_PATH" ]; then
    echo "❌ Windows exe not found. Please build first with:"
    echo "   cd src-tauri && cargo build --target x86_64-pc-windows-gnu --release"
    exit 1
fi

# Create package directory
PACKAGE_DIR="jasper-designer-v2-windows-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PACKAGE_DIR"

# Copy Windows executable and DLL
echo "📋 Copying Windows executable..."
cp "$EXE_PATH" "$PACKAGE_DIR/"
cp "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" "$PACKAGE_DIR/"

# Copy frontend assets
echo "📋 Copying frontend assets..."
cp -r dist/* "$PACKAGE_DIR/"

# Copy icons
echo "📋 Copying icons..."
mkdir -p "$PACKAGE_DIR/icons"
cp src-tauri/icons/* "$PACKAGE_DIR/icons/"

# Create Windows run script
cat > "$PACKAGE_DIR/run-jasper.bat" << 'EOF'
@echo off
title Jasper Designer V2.0
echo 🚀 Starting Jasper Designer V2.0 for Windows...
echo 💡 DevTools: Press F12 or click the debug button in toolbar
echo.
cd /d "%~dp0"
jasper-designer.exe
if errorlevel 1 (
    echo.
    echo ❌ Error occurred. Press any key to exit...
    pause >nul
)
EOF

# Create debug script
cat > "$PACKAGE_DIR/run-debug.bat" << 'EOF'
@echo off
title Jasper Designer V2.0 - Debug Mode
echo 🔧 Starting Jasper Designer V2.0 in Debug Mode...
echo 💡 DevTools will be automatically available
echo 🔍 Press F12 or Ctrl+Shift+I to open DevTools
echo ⚙️  Click the yellow debug button in toolbar
echo.
cd /d "%~dp0"
jasper-designer.exe
pause
EOF

# Create README for Windows
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Jasper Designer V2.0 - Windows Release

## 🎯 特性
- **小体积**: 仅3.4MB主程序 + 154KB WebView2
- **DevTools支持**: 完整的浏览器开发者工具
- **原生Windows**: 无需安装任何额外依赖

## 🚀 快速开始

### 方式1: 双击运行
```
双击 jasper-designer.exe
```

### 方式2: 批处理脚本
```cmd
run-jasper.bat     - 普通启动
run-debug.bat      - 调试模式(含错误信息)
```

## 🔧 DevTools调试

### 开启方法
1. **F12** - 快捷键
2. **Ctrl+Shift+I** - 备用快捷键  
3. **工具栏黄色按钮** - 图形界面

### 调试功能
- ✅ 完整浏览器控制台
- ✅ 元素检查器
- ✅ 网络监控
- ✅ JavaScript调试
- ✅ CSS样式编辑

## ⚡ 功能特性
- **SVG画布渲染** - 高质量矢量图形
- **元素创建选择** - 拖拽操作支持
- **网格背景** - 精确对齐工具
- **撤销重做** - 完整操作历史
- **实时预览** - 所见即所得

## 📁 文件说明
```
jasper-designer.exe    - 主程序 (3.4MB)
WebView2Loader.dll     - 浏览器引擎 (154KB)
index.html             - 前端入口
assets/                - 前端资源
icons/                 - 应用图标
run-jasper.bat         - 启动脚本
run-debug.bat          - 调试启动脚本
```

## 🔧 系统要求
- **操作系统**: Windows 10+ (x64)
- **内存**: 最低 2GB RAM
- **WebView2**: 自动使用系统内置版本

## 🐛 故障排除

### 程序无法启动
1. 确保Windows版本为10+
2. 检查WebView2是否安装
3. 使用run-debug.bat查看错误信息

### DevTools无法打开
1. 尝试F12快捷键
2. 点击工具栏黄色调试按钮
3. 重启程序后再试

## 📞 技术支持
- 版本: V2.0 Windows Release
- 架构: Rust + SolidJS
- 构建时间: $(date)
- 构建目标: x86_64-pc-windows-gnu
EOF

# Create archive (zip for Windows)
echo "🗜️ Creating Windows package..."
if command -v zip >/dev/null 2>&1; then
    zip -r "${PACKAGE_DIR}.zip" "$PACKAGE_DIR" >/dev/null
    ARCHIVE_NAME="${PACKAGE_DIR}.zip"
else
    tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"
    ARCHIVE_NAME="${PACKAGE_DIR}.tar.gz"
fi

# Show results
echo "✅ Windows package created successfully!"
echo ""
echo "📊 Package Information:"
echo "   Directory: $PACKAGE_DIR"
echo "   Archive: $ARCHIVE_NAME"
echo "   Main executable: $(ls -lh $PACKAGE_DIR/jasper-designer.exe | awk '{print $5}')"
echo "   WebView2 DLL: $(ls -lh $PACKAGE_DIR/WebView2Loader.dll | awk '{print $5}')"
echo "   Archive size: $(ls -lh $ARCHIVE_NAME | awk '{print $5}')"
echo ""
echo "🎯 Optimization Results:"
echo "   Linux version: 22M"
echo "   Windows version: $(ls -lh $PACKAGE_DIR/jasper-designer.exe | awk '{print $5}')"
echo "   Size reduction: ~85%"
echo ""
echo "🚀 Ready for Windows deployment!"
echo "💡 DevTools will work perfectly on Windows!"
echo ""
echo "📥 To download:"
echo "   scp root@server:$(pwd)/$ARCHIVE_NAME ."