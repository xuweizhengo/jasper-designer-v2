# PowerShell 脚本 - 在 Windows 上运行
# Windows Syncthing 自动配置脚本

Write-Host "=== Windows Syncthing 配置 ===" -ForegroundColor Cyan

# 下载 Syncthing
$downloadUrl = "https://github.com/syncthing/syncthing/releases/latest/download/syncthing-windows-amd64.zip"
$installPath = "$env:LOCALAPPDATA\Syncthing"
$syncFolder = "C:\JasperBuilds"

Write-Host "1. 下载 Syncthing..." -ForegroundColor Yellow
if (!(Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force
}

# 下载并解压
$zipPath = "$env:TEMP\syncthing.zip"
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $installPath -Force

# 创建同步文件夹
Write-Host "2. 创建同步文件夹..." -ForegroundColor Yellow
if (!(Test-Path $syncFolder)) {
    New-Item -ItemType Directory -Path $syncFolder -Force
}

# 创建启动脚本
Write-Host "3. 创建自启动配置..." -ForegroundColor Yellow
$startupScript = @"
@echo off
cd /d "$installPath\syncthing-windows-amd64"
start syncthing.exe -no-browser
"@

$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\syncthing.bat"
$startupScript | Out-File -FilePath $startupPath -Encoding ASCII

# 启动 Syncthing
Write-Host "4. 启动 Syncthing..." -ForegroundColor Yellow
Start-Process "$installPath\syncthing-windows-amd64\syncthing.exe" -ArgumentList "-no-browser"

Start-Sleep -Seconds 5

# 打开 Web 界面
Write-Host "5. 打开配置界面..." -ForegroundColor Yellow
Start-Process "http://localhost:8384"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✅ Syncthing 已安装并启动！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "`n配置步骤："
Write-Host "1. 在打开的网页中点击 '添加远程设备'"
Write-Host "2. 输入服务器的设备 ID"
Write-Host "3. 在 '共享文件夹' 中选择服务器的文件夹"
Write-Host "4. 本地路径设置为: $syncFolder"
Write-Host "`n同步文件夹: $syncFolder" -ForegroundColor Cyan
Write-Host "所有文件将自动同步到此文件夹！" -ForegroundColor Cyan