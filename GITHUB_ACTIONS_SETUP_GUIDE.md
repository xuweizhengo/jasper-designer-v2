# 🚀 GitHub Actions 自动构建设置指南

## 📋 设置步骤总览

你需要在GitHub上完成3个主要步骤：
1. **上传代码** - 将当前项目推送到GitHub
2. **设置Secrets** - 添加4个服务器连接密钥
3. **触发构建** - 推送代码自动构建或手动触发

---

## 📤 步骤1: 上传代码到GitHub

### A. 创建GitHub仓库
1. 登录 GitHub.com
2. 点击右上角 "+" → "New repository"
3. 仓库名: `jasper-designer-v2`
4. 设置为 Private (推荐) 或 Public
5. **不要**勾选 "Initialize with README" (我们已有代码)
6. 点击 "Create repository"

### B. 推送本地代码
在你的服务器上执行：
```bash
cd /root/project/jasper

# 初始化git仓库
git init
git add .
git commit -m "🎉 Initial commit: Jasper Designer V2 with technical debt cleanup"

# 添加GitHub远程仓库 (替换为你的仓库地址)
git remote add origin https://github.com/YOUR_USERNAME/jasper-designer-v2.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 步骤2: 设置GitHub Secrets

### A. 进入Secrets设置
1. 进入你的GitHub仓库页面
2. 点击 **Settings** (仓库设置，不是个人设置)
3. 左侧菜单点击 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

### B. 添加4个Secrets

逐一添加以下4个secrets：

#### Secret 1: SERVER_HOST
- **Name**: `SERVER_HOST`
- **Secret**: `43.160.200.239`

#### Secret 2: SERVER_USERNAME  
- **Name**: `SERVER_USERNAME`
- **Secret**: `root`

#### Secret 3: SERVER_PORT
- **Name**: `SERVER_PORT` 
- **Secret**: `22`

#### Secret 4: SERVER_SSH_KEY
- **Name**: `SERVER_SSH_KEY`
- **Secret**: (复制下面完整的私钥内容，包括BEGIN和END行)

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

### C. 验证Secrets设置
设置完成后，你应该看到4个secrets：
- ✅ SERVER_HOST
- ✅ SERVER_USERNAME  
- ✅ SERVER_PORT
- ✅ SERVER_SSH_KEY

---

## 🚀 步骤3: 触发构建

### A. 自动触发 (推荐)
```bash
# 在服务器上推送任何代码更改都会触发构建
cd /root/project/jasper
git add .
git commit -m "🚀 Enable GitHub Actions auto build"
git push
```

### B. 手动触发
1. 进入GitHub仓库页面
2. 点击 **Actions** 标签
3. 左侧选择 "Build Windows and Notify Server"
4. 右侧点击 **Run workflow** → **Run workflow**

### C. 标签触发 (版本发布)
```bash
# 创建版本标签会触发构建
git tag v2.0.0
git push origin v2.0.0
```

---

## 📱 接收通知方式

### 方式1: 服务器文件通知 (主要方式)
构建完成后，你会在服务器上看到：
- **通知文件**: `/root/NEW_GITHUB_BUILD_READY.txt`
- **构建历史**: `/root/github-build-history.log`
- **最新构建**: `/root/project/jasper/builds/github-actions/jasper-latest-github.zip`

查看通知：
```bash
# SSH登录服务器后
cat /root/NEW_GITHUB_BUILD_READY.txt

# 查看构建历史
tail /root/github-build-history.log

# 下载最新构建
cd /root/project/jasper/builds/github-actions/
ls -la jasper-*.zip
```

### 方式2: GitHub页面通知
1. 进入仓库 → **Actions**
2. 查看构建状态和日志
3. 下载Artifacts (备份文件，保存30天)

### 方式3: 邮件通知 (可选)
如果需要邮件通知，可以后续添加邮件发送步骤。

---

## 🧪 测试构建成功

### 验证构建完成
1. **GitHub Actions页面**: 构建状态显示绿色✅
2. **服务器通知文件**: 存在 `/root/NEW_GITHUB_BUILD_READY.txt`
3. **构建文件**: 存在 `/root/project/jasper/builds/github-actions/jasper-designer-v2-GITHUB-*.zip`

### 下载和测试
```bash
# 在服务器上解压查看
cd /root/project/jasper/builds/github-actions/
unzip jasper-latest-github.zip
ls -la jasper-designer-v2-GITHUB-*/

# 下载到本地Windows环境
scp root@43.160.200.239:/root/project/jasper/builds/github-actions/jasper-latest-github.zip ./
```

---

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
- 检查GitHub Actions日志
- 验证package.json和Cargo.toml配置
- 确认Tauri依赖完整

#### 2. SSH连接失败
- 验证Secrets中的私钥完整性
- 检查服务器SSH服务状态
- 确认authorized_keys权限正确

#### 3. 文件上传失败
- 检查服务器磁盘空间
- 确认目标目录权限
- 验证网络连接稳定性

### 调试命令
```bash
# 检查SSH密钥
cat /root/.ssh/authorized_keys | grep github-actions

# 检查构建目录
ls -la /root/project/jasper/builds/github-actions/

# 查看最近的构建记录
tail -10 /root/github-build-history.log
```

---

## 🎯 预期效果

设置完成后，每次推送代码：
1. **自动触发**: GitHub Actions自动开始构建
2. **Windows环境**: 在真实的Windows环境中编译
3. **自动上传**: 构建完成自动上传到你的服务器
4. **通知创建**: 在服务器创建详细的通知文件
5. **历史管理**: 自动清理旧构建，保留最新5个版本

**预计构建时间**: 5-10分钟  
**构建频率**: 每次推送代码或手动触发  
**存储位置**: `/root/project/jasper/builds/github-actions/`  
**通知文件**: `/root/NEW_GITHUB_BUILD_READY.txt`

---

🚀 **准备就绪！按照上述步骤设置，就能实现完全自动化的Windows构建和通知系统！**