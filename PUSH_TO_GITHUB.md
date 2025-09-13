# 推送到GitHub的步骤

## 方法1: 添加SSH密钥到GitHub（推荐）

### 1. 获取你的SSH公钥
```bash
cat ~/.ssh/github_key.pub
```

### 2. 添加到GitHub
1. 登录GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单选择 **SSH and GPG keys**
4. 点击 **New SSH key**
5. Title: "Jasper Server"
6. Key: 粘贴上面命令输出的内容
7. 点击 **Add SSH key**

### 3. 测试连接
```bash
ssh -T git@github.com
```

### 4. 推送代码
```bash
git push -u origin main
```

## 方法2: 使用Personal Access Token

### 1. 创建Token
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. 勾选 `repo` 权限
5. 生成并复制token

### 2. 推送代码
```bash
# 设置远程仓库URL（包含token）
git remote set-url origin https://你的token@github.com/xuweizhengo/jasper-designer-v2.git

# 推送
git push -u origin main
```

## 方法3: 使用GitHub CLI

### 1. 安装GitHub CLI
```bash
# 如果还没安装
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. 登录认证
```bash
gh auth login
# 选择GitHub.com
# 选择HTTPS
# 按提示完成认证
```

### 3. 推送代码
```bash
git push -u origin main
```

## 当前仓库信息
- 仓库地址: https://github.com/xuweizhengo/jasper-designer-v2
- 当前分支: main
- 远程名称: origin

## 推送成功后
1. 访问 https://github.com/xuweizhengo/jasper-designer-v2/actions 查看自动构建
2. 配置Secrets以启用自动打包到服务器功能