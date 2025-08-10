# 🎯 Jasper Designer V2.0

**现代化报表设计器** - 基于 Rust + Tauri + Solid.js 构建的高性能桌面应用

## 📊 项目状态

🎉 **当前版本**: V2.0 (单技术栈架构)  
✅ **开发状态**: M1-M2 完成，进入 M3 阶段  
🔧 **架构**: 纯 Rust + Tauri 架构 (已淘汰 Spring + React 版本)

### 🏆 已完成里程碑

- **✅ M1 - Foundation Stability** (2025-08-07完成)
  - 零错误构建系统
  - 完整类型安全保障
  - SVG画布渲染系统
  - 前后端通信稳定

- **✅ M2 - Core Interactions** (2025-08-08完成)  
  - 完整选择系统 (单选/框选/Ctrl多选/Shift多选)
  - 无冲突拖拽系统 (单选拖拽/多选批量拖拽)
  - 组件创建系统 (文本/矩形/线条/图片/数据字段)
  - 事件冲突完美解决

## 🚀 快速开始

### 🛠 环境要求

- **Rust**: 1.70.0+ 
- **Node.js**: 18.0.0+
- **操作系统**: Windows 10/11, macOS, Linux

### 📦 安装与运行

```bash
# 1. 克隆项目
git clone [repository-url]
cd jasper

# 2. 安装前端依赖
npm install

# 3. 安装 Rust 环境 (如需要)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update

# 4. 启动开发模式
npm run tauri dev

# 5. 构建生产版本
npm run tauri build
```

### 🎮 功能演示

构建完成的可执行文件位于 `builds/windows/` 目录，包含：
- **jasper-designer.exe** (3.4MB) - Windows 可执行文件
- **压缩包** (1.6MB) - 便携版本

## 🏗 技术架构

### 🔧 技术选型

| 层级 | 技术 | 版本 | 作用 |
|------|------|------|------|
| **后端** | Rust + Tauri | 1.0+ | 高性能状态管理、文件操作 |
| **前端** | Solid.js + TypeScript | 1.8+ | 响应式UI、类型安全 |
| **构建** | Vite + TypeScript | 5.0+ | 快速编译、热更新 |
| **通信** | Tauri Commands | - | 类型安全的前后端通信 |

### 📁 项目结构

```
jasper/                     # 项目根目录
├── src/                    # 前端源码 (Solid.js)
│   ├── components/         
│   │   ├── Canvas/         # 画布组件
│   │   ├── Panels/         # 面板组件  
│   │   └── Layout/         # 布局组件
│   ├── stores/             # 状态管理 (AppContext)
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
├── src-tauri/              # 后端源码 (Rust)
│   ├── src/
│   │   ├── commands/       # Tauri 命令集
│   │   ├── core/           # 核心业务逻辑
│   │   └── main.rs         # 应用入口
│   └── Cargo.toml          # Rust 依赖配置
├── builds/                 # 构建产物
├── docs/                   # 项目文档
│   └── milestones/         # 里程碑跟踪
└── backup/                 # 旧版本备份
    └── legacy-versions.tar.gz  # Spring+React 版本备份
```

## 🎯 核心功能

### ✅ 已实现功能 (M1-M2)

#### 🖱 交互系统
- **元素选择**: 单击选择、框选多个、Ctrl/Shift修饰键
- **拖拽系统**: 流畅的元素移动、多选批量拖拽
- **无冲突操作**: 完美解决拖拽与框选的事件冲突

#### 🎨 画布系统  
- **SVG渲染**: 高性能矢量图形渲染
- **网格显示**: 精确的网格对齐和标尺
- **视觉反馈**: 选择状态、拖拽效果

#### 🧱 组件系统
- **基础组件**: 文本、矩形、线条、图片
- **数据组件**: 动态数据字段绑定
- **属性面板**: 实时属性编辑

### 🔄 开发中功能 (M3)

- **高级编辑**: 多层管理、对齐工具
- **模板系统**: 保存/加载模板
- **导出引擎**: PDF、图片格式导出

## 🧪 测试与验证

### 📋 功能测试
详见 `M2_TESTING_GUIDE.md` - 完整的测试指南和验收标准

### 🔧 开发命令

```bash
# 代码质量检查
npm run build          # TypeScript 构建检查
cargo clippy           # Rust 代码检查 (在 src-tauri 目录)
cargo fmt              # Rust 代码格式化

# 调试模式
RUST_LOG=debug npm run tauri dev     # 启用 Rust 调试日志
```

## 📋 API 文档

### 🔌 Tauri 命令接口

#### 元素操作
```rust
create_element(request: CreateElementRequest) -> Result<Element>
update_element(request: UpdateElementRequest) -> Result<()>  
delete_element(element_id: String) -> Result<()>
```

#### 选择管理
```rust
select_element(element_id: String) -> Result<()>
select_multiple(element_ids: Vec<String>) -> Result<()>
clear_selection() -> Result<()>
toggle_selection(element_id: String) -> Result<()>
```

#### 状态管理
```rust
get_app_state() -> Result<AppState>
undo() -> Result<()>
redo() -> Result<()>
```

## 📦 部署指南

### 🖥 Windows 构建
```bash
npm run tauri build
# 产物: src-tauri/target/release/bundle/msi/
```

### 🍎 macOS 构建  
```bash
export APPLE_CERTIFICATE="Developer ID Application: Your Name"
npm run tauri build  
# 产物: src-tauri/target/release/bundle/dmg/
```

### 🐧 Linux 构建
```bash
npm run tauri build
# 产物: src-tauri/target/release/bundle/deb/
```

## 📊 版本历史

### V2.0.0 (当前版本)
- ✅ 完整的交互系统 
- ✅ 无冲突拖拽体验
- ✅ 类型安全的架构
- 📦 备份了 V1.x 版本 (Spring + React)

### V1.x (已废弃)
- ❌ Spring Boot + React 架构
- 📦 已备份至 `backup/legacy-versions.tar.gz`

## 🎉 开发成就

### 🏆 技术突破
- **事件冲突解决**: 完美解决拖拽与框选的复杂交互问题
- **类型安全**: 端到端的 TypeScript + Rust 类型保障  
- **性能优化**: 零错误构建，高效的状态管理
- **用户体验**: 符合桌面应用标准的交互体验

### 📈 质量指标
- **TypeScript 错误**: 0 个 (从 16个 → 0个)
- **构建成功率**: 100%
- **代码覆盖**: 完整的功能测试指南
- **文档完整性**: 详细的里程碑和技术文档

## 🛠 开发指南

### Rust后端开发

```bash
cd src-tauri

# 运行测试
cargo test

# 检查代码
cargo clippy

# 格式化代码
cargo fmt
```

### 前端开发

```bash
# 类型检查
npx tsc --noEmit

# 构建前端
npm run build

# 预览构建结果
npm run preview
```

### 调试

```bash
# 启用Rust调试日志
RUST_LOG=debug npm run tauri dev

# 启用前端调试
VITE_DEBUG=true npm run tauri dev
```

## 📋 API文档

### Tauri命令

#### 元素操作
- `create_element(request: CreateElementRequest)` - 创建元素
- `update_element(request: UpdateElementRequest)` - 更新元素
- `delete_element(elementId: string)` - 删除元素
- `select_element(elementId: string)` - 选择元素

#### 画布操作
- `update_canvas_config(request: UpdateCanvasConfigRequest)` - 更新画布配置
- `get_canvas_config()` - 获取画布配置

#### 历史操作
- `undo()` - 撤销操作
- `redo()` - 重做操作

#### 文件操作
- `save_template(request: SaveTemplateRequest)` - 保存模板
- `load_template(request: LoadTemplateRequest)` - 加载模板

## 🔧 配置

### Tauri配置 (src-tauri/tauri.conf.json)

```json
{
  "build": {
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Jasper Designer",
    "version": "2.0.0"
  }
}
```

### Vite配置 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

## 🚀 部署

### 本地构建

```bash
npm run tauri build
```

### 应用签名 (macOS)

```bash
# 设置签名身份
export APPLE_CERTIFICATE="Developer ID Application: Your Name"
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"

npm run tauri build
```

### 应用打包 (Windows)

```bash
# 需要Visual Studio Build Tools
npm run tauri build
```

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 文档: [项目文档]