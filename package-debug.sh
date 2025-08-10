#!/bin/bash

# Jasper Designer V2.0 - Debug Package Script
echo "📦 Packaging Jasper Designer V2.0 Debug Version..."

# Check if build exists
if [ ! -f "src-tauri/target/debug/jasper-designer" ]; then
    echo "❌ Debug build not found. Please run build first."
    exit 1
fi

# Create package directory
PACKAGE_DIR="jasper-designer-v2-debug-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PACKAGE_DIR"

# Copy binary
echo "📋 Copying binary..."
cp src-tauri/target/debug/jasper-designer "$PACKAGE_DIR/"

# Copy frontend assets
echo "📋 Copying frontend assets..."
cp -r dist/* "$PACKAGE_DIR/"

# Copy icons
echo "📋 Copying icons..."
mkdir -p "$PACKAGE_DIR/icons"
cp src-tauri/icons/* "$PACKAGE_DIR/icons/"

# Create run script for Linux
cat > "$PACKAGE_DIR/run-jasper.sh" << 'EOF'
#!/bin/bash
# Jasper Designer V2.0 Launch Script
echo "🚀 Starting Jasper Designer V2.0..."
cd "$(dirname "$0")"
./jasper-designer
EOF

chmod +x "$PACKAGE_DIR/run-jasper.sh"

# Create README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Jasper Designer V2.0 - Debug Build

## 系统要求
- Linux x86_64
- GTK 3.22+
- WebKit2GTK 4.0+

## 运行方法
```bash
# 直接运行
./jasper-designer

# 或使用启动脚本
./run-jasper.sh
```

## DevTools调试功能
- F12 或 Ctrl+Shift+I 开启开发者工具
- 点击工具栏黄色调试按钮
- 自动在调试模式下打开DevTools

## 功能特性
- SVG画布渲染
- 元素创建和选择
- 网格背景显示
- 撤销/重做功能
- 前后端通信

## 构建信息
- 版本: V2.0 Debug
- 架构: Rust + SolidJS
- 构建时间: $(date)
- DevTools: 已启用
EOF

# Create archive
echo "🗜️ Creating archive..."
tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"

# Show results
echo "✅ Package created successfully!"
echo ""
echo "📊 Package Information:"
echo "   Directory: $PACKAGE_DIR"
echo "   Archive: ${PACKAGE_DIR}.tar.gz"
echo "   Binary size: $(ls -lh $PACKAGE_DIR/jasper-designer | awk '{print $5}')"
echo "   Archive size: $(ls -lh ${PACKAGE_DIR}.tar.gz | awk '{print $5}')"
echo ""
echo "🚀 Ready for deployment to Windows via WSL or direct Linux usage!"