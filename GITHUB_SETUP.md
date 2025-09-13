# GitHub自动化设置指南

## 功能说明
已为项目配置了以下自动化功能：
1. **自动提交推送**: 每次本地提交后自动推送到GitHub
2. **自动Windows打包**: 推送到main分支后自动触发GitHub Actions进行Windows打包

## 使用方法

### 方法1: 使用自动提交脚本（推荐）
```bash
# 完成功能后，运行自动提交脚本
./scripts/auto-commit.sh "feat: 你的提交信息"

# 示例
./scripts/auto-commit.sh "feat: 添加预览模式功能"
./scripts/auto-commit.sh "fix: 修复数据源连接问题"
```

### 方法2: 常规Git提交（会自动推送）
```bash
git add .
git commit -m "你的提交信息"
# post-commit钩子会自动推送到GitHub
```

### 方法3: 手动控制
```bash
# 如果不想自动推送，可以临时禁用钩子
git commit --no-verify -m "本地提交"

# 手动推送
git push origin main
```

## GitHub Secrets配置

在GitHub仓库设置中配置以下Secrets（Settings -> Secrets and variables -> Actions）：

1. **SERVER_HOST**: 服务器IP地址（如: 43.160.200.239）
2. **SERVER_USERNAME**: 服务器用户名（如: root）
3. **SERVER_PORT**: SSH端口（默认: 22）
4. **SERVER_SSH_KEY**: SSH私钥内容

### 获取SSH私钥：
```bash
# 在本地生成SSH密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 查看私钥内容（用于SERVER_SSH_KEY）
cat ~/.ssh/id_rsa

# 将公钥添加到服务器
ssh-copy-id root@43.160.200.239
```

## GitHub Actions工作流

工作流文件位置: `.github/workflows/build-windows.yml`

### 触发条件：
- 推送到main或master分支
- 创建版本标签（v*）
- 手动触发（在Actions页面）

### 构建流程：
1. 检出代码
2. 设置Node.js和Rust环境
3. 安装依赖
4. 构建Tauri应用
5. 打包构建文件
6. 上传到服务器
7. 创建通知文件
8. 保留GitHub Artifacts备份（30天）

## 查看构建状态

1. **GitHub Actions页面**:
   - 访问: https://github.com/你的用户名/jasper/actions
   - 查看构建日志和状态

2. **服务器通知文件**:
   ```bash
   # SSH到服务器查看
   cat /root/NEW_GITHUB_BUILD_READY.txt
   ```

3. **下载构建文件**:
   ```bash
   # 从服务器下载最新构建
   scp root@43.160.200.239:/root/project/jasper/builds/github-actions/jasper-latest-github.zip ./
   ```

## 故障排除

### 自动推送失败
- 检查网络连接: `ping github.com`
- 检查远程仓库配置: `git remote -v`
- 手动推送: `git push origin main`

### GitHub Actions构建失败
- 检查Secrets配置是否正确
- 查看Actions日志定位问题
- 确保代码能本地构建成功

### SSH连接问题
- 确保SSH密钥权限正确: `chmod 600 ~/.ssh/id_rsa`
- 测试SSH连接: `ssh -T git@github.com`

## 注意事项

1. **首次使用**: 需要先配置GitHub Secrets
2. **分支保护**: 建议为main分支启用保护规则
3. **构建时间**: Windows构建通常需要10-15分钟
4. **存储管理**: 服务器自动保留最新5个构建，旧版本会被清理

## 提交规范建议

使用语义化提交信息：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建或辅助工具变动

示例：
```bash
./scripts/auto-commit.sh "feat: 添加数据源预览功能"
./scripts/auto-commit.sh "fix: 修复属性面板显示问题"
./scripts/auto-commit.sh "docs: 更新README文档"
```