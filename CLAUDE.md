# Claude AI Assistant Guidelines for Jasper Designer

## Project Overview
Jasper Designer V2 是一个基于 Tauri + SolidJS 的报表设计器应用。

## Important Development Rules

### 1. TypeScript and Rust Interop
- **Field Naming Convention**:
  - TypeScript 使用 camelCase（如 `customProperties`）
  - Rust 结构体必须添加 `#[serde(rename_all = "camelCase")]` 来自动转换字段名
  - 这避免了前后端字段名不匹配导致的错误

### 2. Code Quality Standards
- 始终运行 lint 和 typecheck 命令验证代码质量
- 使用 `npm run lint` 和 `npm run typecheck`
- 在提交前确保没有类型错误

### 3. Testing Requirements
- 不要假设测试框架，先检查 package.json 或 README
- 运行现有的测试脚本验证修改

### 4. Git Workflow
- 只在用户明确要求时才执行 git commit
- 使用 scripts/auto-commit.sh 脚本进行提交
- 提交信息应该清晰描述修改内容

### 5. File Operations
- 优先修改现有文件，避免创建新文件
- 不要主动创建文档文件（*.md），除非用户明确要求

### 6. Component Structure
- 使用 SolidJS 的响应式模式
- 组件文件放在 src/components/ 目录
- API 调用通过 src/api/ 目录的服务类

### 7. Tauri Commands
- 所有 Tauri 命令通过 invoke 调用
- 命令定义在 src-tauri/src/commands/ 目录
- 类型定义保持前后端同步

### 8. Build and Deploy
- GitHub Actions 自动构建在 push 后触发
- 构建产物保存在 /root/project/jasper/builds/github-actions/
- 使用 Syncthing 自动同步到 Windows 客户端

## Common Issues and Solutions

### Issue: Field name mismatch between TypeScript and Rust
**Solution**: 在 Rust 结构体上添加 `#[serde(rename_all = "camelCase")]`

### Issue: Export dialog not showing
**Solution**: 避免使用 Portal 组件，直接渲染或使用内联样式

### Issue: TypeScript/Rust type mismatch
**Solution**: 检查 src/types/ 和 src-tauri/src/types/ 的类型定义是否一致

## File Locations
- Frontend code: `/root/project/jasper/src/`
- Backend code: `/root/project/jasper/src-tauri/src/`
- Build scripts: `/root/project/jasper/scripts/`
- Build outputs: `/root/project/jasper/builds/`

## Syncthing Configuration
- Device ID: `AOYMTNI-AMBE6OC-SFBAYTN-6VGPNND-X5G7Y3R-52XTWQV-JQ4VUCC-MNB3FAJ`
- Shared folder: `/root/project/jasper/builds/github-actions/`
- Folder ID: `jasper-github-builds`