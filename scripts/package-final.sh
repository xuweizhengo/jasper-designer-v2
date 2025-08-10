#!/bin/bash

# Jasper Designer V2 - Final Package Builder
# Creates clean Windows package with fixed drag/selection system

set -e

# Configuration
VERSION="v2.0.0-final"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
PACKAGE_NAME="jasper-designer-${VERSION}-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Jasper Designer V2 Final Package Builder${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}📦 Package: ${PACKAGE_NAME}${NC}"
echo -e "${YELLOW}🎯 Features: Fixed drag/selection conflicts${NC}"
echo ""

# Step 1: Clean build
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
npm run clean || true
rm -rf dist/

# Step 2: Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
npm run build

# Step 3: Build Tauri (Windows target)
echo -e "${BLUE}🦀 Building Rust backend for Windows...${NC}"
npm run tauri build -- --target x86_64-pc-windows-gnu

# Step 4: Create package directory
PACKAGE_DIR="builds/windows/${PACKAGE_NAME}"
echo -e "${BLUE}📁 Creating package directory: ${PACKAGE_DIR}${NC}"
mkdir -p "${PACKAGE_DIR}"

# Step 5: Copy Windows executable and dependencies
echo -e "${BLUE}📋 Copying Windows executable...${NC}"
if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" ]; then
    cp "src-tauri/target/x86_64-pc-windows-gnu/release/jasper-designer.exe" "${PACKAGE_DIR}/"
else
    echo -e "${RED}❌ Windows executable not found!${NC}"
    exit 1
fi

# Step 6: Copy web assets
echo -e "${BLUE}🎨 Copying web assets...${NC}"
cp -r dist/* "${PACKAGE_DIR}/"

# Step 7: Copy icons
echo -e "${BLUE}🎯 Copying icons...${NC}"
mkdir -p "${PACKAGE_DIR}/icons"
cp src-tauri/icons/* "${PACKAGE_DIR}/icons/"

# Step 8: Create startup script
echo -e "${BLUE}📝 Creating startup script...${NC}"
cat > "${PACKAGE_DIR}/run-jasper.bat" << 'EOF'
@echo off
title Jasper Designer V2 - Report Designer
echo Starting Jasper Designer V2...
echo.
echo Features:
echo - Drag & Drop element creation
echo - Multi-element selection (rectangle selection)
echo - Element dragging (conflict-free)
echo - Ctrl/Shift multi-select support
echo.
start "" "jasper-designer.exe"
EOF

# Step 9: Create README
echo -e "${BLUE}📖 Creating README...${NC}"
cat > "${PACKAGE_DIR}/README.md" << 'EOF'
# 🎯 Jasper Designer V2 - Final Release

**版本**: v2.0.0-final  
**大小**: ~1.6MB  
**状态**: ✅ 拖拽与框选冲突已修复  

## ✨ 核心功能

### 🖱️ 无冲突操作系统
- ✅ **元素拖拽**: 平滑移动单个元素，无干扰
- ✅ **框选多元素**: 空白区域拖拽选择多个元素
- ✅ **智能分离**: 拖拽和框选完全独立，零冲突

### 🎮 多选模式
- **普通点击**: 选择单个元素
- **Ctrl+点击**: 切换元素选择状态
- **Shift+点击**: 范围选择扩展
- **框选拖拽**: 批量选择元素

### 🎨 组件库
- 📝 文本元素
- 🔲 矩形形状
- 📊 线条元素
- 🖼️ 图片占位符
- 📋 数据字段

## 🚀 快速开始

1. **运行程序**: 双击 `run-jasper.bat` 或 `jasper-designer.exe`
2. **创建元素**: 从左侧组件库拖拽到画布
3. **选择元素**: 点击元素或框选多个
4. **移动元素**: 拖拽选中的元素
5. **测试功能**: 使用右侧测试面板快速创建测试元素

## 🐛 问题修复

### ✅ 已修复的关键问题
- **拖拽触发框选**: 修复拖拽元素时意外显示选择矩形
- **事件冲突**: 完善事件处理优先级和隔离机制
- **状态同步**: 前后端状态一致性保证

### 🔧 技术细节
- 移除重复的SelectionRect组件
- 事件冒泡阻止和状态检查
- 精确的点击目标判断
- 拖拽状态全局协调

## 📊 测试验证

### 基础测试
1. **拖拽测试**: 拖拽元素应该只显示拖拽效果，无框选矩形
2. **框选测试**: 空白区域拖拽应该显示蓝色选择矩形
3. **多选测试**: Ctrl+点击应该切换选择状态
4. **混合测试**: 拖拽后框选，框选后拖拽，操作独立

### 预期日志
```javascript
🎯 Starting element drag: element-id
🔲 Starting selection rectangle at: x, y
✅ Multi-select completed: [id1, id2, id3]
```

## 🎯 用户体验

- **直观操作**: 符合桌面应用标准交互
- **视觉反馈**: 清晰的选择和拖拽状态显示
- **性能优化**: 流畅的实时操作响应
- **稳定可靠**: 完善的错误处理和状态管理

---

**enjoy your report design experience! 🎉**
EOF

# Step 10: Create archive
echo -e "${BLUE}📦 Creating archive...${NC}"
cd builds/windows/
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}/"
cd ../../

# Step 11: Get file sizes
PACKAGE_SIZE=$(du -sh "builds/windows/${PACKAGE_NAME}" | cut -f1)
ARCHIVE_SIZE=$(du -sh "builds/windows/${PACKAGE_NAME}.tar.gz" | cut -f1)

# Step 12: Success message
echo ""
echo -e "${GREEN}✅ Package created successfully!${NC}"
echo -e "${GREEN}===============================${NC}"
echo ""
echo -e "${YELLOW}📁 Package Directory: builds/windows/${PACKAGE_NAME}${NC}"
echo -e "${YELLOW}📦 Archive File: builds/windows/${PACKAGE_NAME}.tar.gz${NC}"
echo -e "${YELLOW}📏 Package Size: ${PACKAGE_SIZE}${NC}"
echo -e "${YELLOW}📦 Archive Size: ${ARCHIVE_SIZE}${NC}"
echo ""
echo -e "${GREEN}🎯 Key Features:${NC}"
echo -e "${GREEN}  ✅ Drag/Selection conflict completely fixed${NC}"
echo -e "${GREEN}  ✅ Multi-element rectangle selection${NC}"
echo -e "${GREEN}  ✅ Ctrl/Shift multi-select support${NC}"
echo -e "${GREEN}  ✅ Clean event handling system${NC}"
echo ""
echo -e "${BLUE}🚀 Ready for testing and deployment!${NC}"