#!/bin/bash

# 🚀 GitHub Actions 快速设置脚本
# 帮助用户快速初始化Git仓库并准备推送到GitHub

echo "🚀 Jasper Designer V2 - GitHub Actions 设置助手"
echo "================================================="
echo

# 检查是否已经是git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    echo "✅ Git仓库初始化完成"
else
    echo "📁 检测到现有Git仓库"
fi

# 检查远程仓库
remote_url=$(git remote get-url origin 2>/dev/null)
if [ $? -ne 0 ]; then
    echo
    echo "🔗 设置GitHub远程仓库"
    echo "请输入你的GitHub仓库URL (例如: https://github.com/username/jasper-designer-v2.git):"
    read -p "GitHub仓库URL: " github_url
    
    if [ -n "$github_url" ]; then
        git remote add origin "$github_url"
        echo "✅ 远程仓库已设置: $github_url"
    else
        echo "❌ 未输入仓库URL，跳过远程仓库设置"
    fi
else
    echo "🔗 检测到现有远程仓库: $remote_url"
fi

echo
echo "📝 添加所有文件到Git..."
git add .

# 检查是否有文件要提交
if git diff --cached --quiet; then
    echo "ℹ️  没有新文件需要提交"
else
    echo "💾 创建初始提交..."
    git commit -m "🎉 Initial commit: Jasper Designer V2 with GitHub Actions

✅ 包含功能:
- M3 高级编辑功能 (85% 完成)
- 技术债务清理完成
- 统一构建管理系统
- GitHub Actions 自动构建配置

✅ 技术栈:
- Rust + Tauri (后端)
- Solid.js + TypeScript (前端)
- GitHub Actions (CI/CD)

✅ 构建配置:
- 自动Windows构建
- 服务器文件通知
- 构建历史管理"
    
    echo "✅ 初始提交创建完成"
fi

echo
echo "🔧 检查分支设置..."
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo "📝 切换到main分支..."
    git branch -M main
    echo "✅ 已切换到main分支"
else
    echo "✅ 当前分支: $current_branch"
fi

echo
echo "📋 接下来你需要做:"
echo "1. 在GitHub创建仓库: jasper-designer-v2"
echo "2. 设置4个Repository Secrets (详见 GITHUB_ACTIONS_SETUP_GUIDE.md)"
echo "3. 执行推送命令:"
echo
echo "   git push -u origin main"
echo
echo "4. 推送成功后，GitHub Actions会自动开始构建"
echo "5. 构建完成后，查看服务器通知: cat /root/NEW_GITHUB_BUILD_READY.txt"

echo
echo "📚 详细设置指南: ./GITHUB_ACTIONS_SETUP_GUIDE.md"
echo "📁 GitHub Actions配置: ./.github/workflows/build-windows.yml"

echo
echo "🎯 Ready to go! 按照上述步骤操作即可启用自动构建！"