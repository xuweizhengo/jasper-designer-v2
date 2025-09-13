#!/bin/bash

# 自动提交脚本 - 用于快速提交功能更新
# 使用方法: ./scripts/auto-commit.sh "提交信息"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否提供了提交信息
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供提交信息${NC}"
    echo -e "${YELLOW}使用方法: $0 \"提交信息\"${NC}"
    echo -e "${YELLOW}示例: $0 \"feat: 添加新的预览功能\"${NC}"
    exit 1
fi

COMMIT_MSG="$1"

# 显示当前状态
echo -e "${BLUE}=== 检查Git状态 ===${NC}"
git status --short

# 询问是否继续
echo -e "${YELLOW}准备提交以上更改，是否继续？(y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消提交${NC}"
    exit 0
fi

# 添加所有更改
echo -e "${GREEN}[1/3] 添加所有更改...${NC}"
git add -A

# 创建提交
echo -e "${GREEN}[2/3] 创建提交...${NC}"
git commit -m "$COMMIT_MSG"

# 推送到远程（post-commit hook会自动执行，但这里也可以手动推送）
echo -e "${GREEN}[3/3] 推送到GitHub...${NC}"
if git push origin main 2>&1; then
    echo -e "${GREEN}✅ 成功推送到GitHub！${NC}"
    echo -e "${GREEN}🚀 GitHub Actions已触发，正在进行Windows打包...${NC}"
    echo -e "${BLUE}查看构建状态: https://github.com/你的用户名/jasper/actions${NC}"
else
    echo -e "${YELLOW}⚠️  自动推送失败，请手动执行: git push origin main${NC}"
fi

echo -e "${GREEN}=== 完成 ===${NC}"