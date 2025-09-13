# 邮件通知配置指南

## 功能说明
配置完成后，每次GitHub Actions构建成功都会：
1. 自动上传到服务器
2. 发送邮件通知
3. 在服务器创建通知文件

## 配置步骤

### 1. SSH配置（必需）

#### 在GitHub设置以下Secrets：
- `SERVER_HOST`: 43.160.200.239
- `SERVER_USERNAME`: root
- `SERVER_PORT`: 22
- `SERVER_SSH_KEY`: SSH私钥内容

#### 获取SSH私钥：
```bash
# 在服务器执行
cat ~/.ssh/id_rsa
```

### 2. 邮件配置（可选）

#### 方案A：使用Gmail

1. **启用两步验证**
   - 登录Gmail → 设置 → 安全性
   - 启用"两步验证"

2. **生成应用专用密码**
   - 在安全性页面，选择"应用专用密码"
   - 选择"邮件"和"其他设备"
   - 复制生成的16位密码

3. **在GitHub设置Secrets**
   - `EMAIL_USERNAME`: 你的Gmail地址
   - `EMAIL_PASSWORD`: 应用专用密码（16位）
   - `NOTIFICATION_EMAIL`: 接收通知的邮箱

#### 方案B：使用QQ邮箱

1. **开启SMTP服务**
   - 登录QQ邮箱 → 设置 → 账户
   - 开启"SMTP服务"
   - 获取授权码

2. **修改工作流文件**
   ```yaml
   server_address: smtp.qq.com
   server_port: 465
   ```

3. **在GitHub设置Secrets**
   - `EMAIL_USERNAME`: 你的QQ邮箱
   - `EMAIL_PASSWORD`: 授权码
   - `NOTIFICATION_EMAIL`: 接收通知的邮箱

#### 方案C：使用企业邮箱

1. **获取SMTP信息**
   - 向IT部门获取SMTP服务器地址和端口
   - 获取邮箱账号密码

2. **修改工作流文件**
   ```yaml
   server_address: 你的SMTP服务器
   server_port: 你的端口
   ```

3. **设置对应的Secrets**

### 3. 测试配置

配置完成后，推送代码测试：
```bash
git commit -m "test: 测试自动部署和邮件通知"
git push
```

### 4. 检查结果

#### 查看GitHub Actions
- 访问: https://github.com/xuweizhengo/jasper-designer-v2/actions
- 应该看到两个工作流都成功

#### 检查服务器
```bash
# SSH到服务器
ssh root@43.160.200.239

# 查看通知文件
cat /root/NEW_GITHUB_BUILD_READY.txt

# 查看构建文件
ls -la /root/project/jasper/builds/github-actions/
```

#### 检查邮件
- 检查配置的接收邮箱
- 可能在垃圾邮件文件夹

## 故障排除

### SSH连接失败
- 确认SSH密钥正确（包括BEGIN/END行）
- 确认服务器可以访问
- 检查防火墙设置

### 邮件发送失败
- 检查应用专用密码是否正确
- 确认SMTP设置正确
- 查看Actions日志了解具体错误

### 如果不需要邮件通知
删除或注释掉deploy-and-notify.yml中的邮件步骤即可。

## 安全建议

1. **使用专用邮箱**：建议创建专门用于通知的邮箱
2. **定期更换密码**：定期更新应用专用密码
3. **限制接收人**：只发送给必要的接收人
4. **使用私有仓库**：确保Secrets不会泄露

## 完整的Secrets列表

必需的：
- `SERVER_HOST`
- `SERVER_USERNAME`
- `SERVER_PORT`
- `SERVER_SSH_KEY`

可选的（邮件通知）：
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `NOTIFICATION_EMAIL`