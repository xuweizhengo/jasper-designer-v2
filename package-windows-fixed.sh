#!/bin/bash

# Jasper Designer V2.0 - Windows Package Script (Fixed Version)
echo "📦 Packaging Jasper Designer V2.0 for Windows (Bug Fixed)..."

# Check if Windows exe exists
EXE_PATH="src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe"
if [ ! -f "$EXE_PATH" ]; then
    echo "❌ Windows exe not found. Please build first."
    exit 1
fi

# Create package directory  
PACKAGE_DIR="jasper-designer-v2-windows-fixed-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PACKAGE_DIR"

# Copy Windows executable and DLL
echo "📋 Copying Windows executable..."
cp "$EXE_PATH" "$PACKAGE_DIR/"
cp "src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll" "$PACKAGE_DIR/"

# Copy updated frontend assets
echo "📋 Copying updated frontend assets..."
cp -r dist/* "$PACKAGE_DIR/"

# Copy icons
echo "📋 Copying icons..."
mkdir -p "$PACKAGE_DIR/icons"
cp src-tauri/icons/* "$PACKAGE_DIR/icons/"

# Create Windows run script
cat > "$PACKAGE_DIR/run-jasper.bat" << 'EOF'
@echo off
title Jasper Designer V2.0 - Fixed
echo 🚀 Starting Jasper Designer V2.0 (Fixed Version)...
echo 🐛 Bug Fixed: Element selection now works properly
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

# Create README for Windows
cat > "$PACKAGE_DIR/README-FIXED.md" << 'EOF'
# Jasper Designer V2.0 - Windows Fixed Release

## 🐛 Bug Fixed
- **Element Selection**: Fixed parameter naming issue between frontend and backend
- **矩形选择**: 现在可以正常选择矩形组件了
- **DevTools**: 完整支持调试功能

## 🔧 Technical Fix
```
Error: Failed to select element: invalid args `elementId` for command `select_element`
Fixed: Changed frontend parameter from { elementId } to { element_id }
```

## 🚀 如何使用

### 直接运行
```
双击 jasper-designer.exe
```

### 测试选择功能
1. 启动应用
2. 从组件库拖拽矩形到画布
3. 点击矩形 - 应该能正常选中（之前会报错）
4. 按F12查看控制台，确认无错误

## 🔧 DevTools调试
- **F12**: 开启开发者工具
- **控制台**: 查看详细调试信息
- **元素检查**: 检查UI结构

## 📁 文件大小
- 主程序: 3.4MB
- 总体积: ~4MB
- 压缩包: ~1.6MB

构建时间: $(date)
修复版本: 解决元素选择问题
EOF

# Create archive
echo "🗜️ Creating fixed Windows package..."
tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"

# Show results
echo "✅ Fixed Windows package created successfully!"
echo ""
echo "🐛 Bug Fixed:"
echo "   - Element selection parameter naming"
echo "   - Frontend-backend communication"
echo "   - Rectangle component selection"
echo ""
echo "📊 Package Information:"
echo "   Directory: $PACKAGE_DIR"
echo "   Archive: ${PACKAGE_DIR}.tar.gz"
echo "   Archive size: $(ls -lh ${PACKAGE_DIR}.tar.gz | awk '{print $5}')"
echo ""
echo "🚀 Ready for testing M2 element selection!"
echo ""
echo "📥 To download:"
echo "   scp root@server:$(pwd)/${PACKAGE_DIR}.tar.gz ."