# Jasper Designer V2.0

基于Rust + Tauri + Solid.js的高性能报表设计器。

## 🚀 快速开始

### 开发环境要求

- **Rust**: 1.70.0+
- **Node.js**: 18.0.0+
- **npm**: 8.0.0+

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装Rust工具链 (如果还没有安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update

# 安装Tauri CLI
cargo install tauri-cli
```

### 开发模式

```bash
# 启动开发服务器
npm run tauri dev

# 或者分别启动前端和后端
npm run dev        # 前端开发服务器
cargo run          # Rust后端 (在src-tauri目录中)
```

### 构建生产版本

```bash
# 构建应用程序
npm run tauri build

# 构建结果会在src-tauri/target/release/bundle/目录中
```

## 🏗 项目架构

### 技术栈

- **后端**: Rust + Tauri
  - 类型安全的数据模型
  - 零运行时错误保证
  - 高性能状态管理
  - 原生文件系统访问

- **前端**: Solid.js + TypeScript
  - 编译时优化
  - 响应式UI更新
  - 类型安全的组件

- **通信**: Tauri Commands
  - 类型安全的序列化
  - 异步命令处理

### 目录结构

```
v2-tauri/
├── src/                    # 前端源码
│   ├── components/         # UI组件
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── src-tauri/             # Rust后端
│   ├── src/
│   │   ├── commands/      # Tauri命令
│   │   ├── core/          # 核心业务逻辑
│   │   └── main.rs        # 应用入口
│   ├── Cargo.toml         # Rust依赖配置
│   └── tauri.conf.json    # Tauri应用配置
├── package.json           # 前端依赖配置
└── vite.config.ts         # Vite构建配置
```

## 🎯 核心功能

### 已实现功能

- ✅ **项目架构搭建**
  - Tauri桌面应用框架
  - Rust后端类型安全数据模型
  - Solid.js响应式前端

- ✅ **状态管理系统**
  - 单一数据源架构
  - 撤销/重做功能
  - 历史操作记录

- ✅ **SVG画布渲染**
  - 高性能元素渲染
  - 网格和标尺显示
  - 缩放和平移支持

- ✅ **组件库系统**
  - 基础组件：文字、矩形、线条、图片
  - 数据组件：数据字段
  - 银行组件：专用业务组件

- ✅ **属性编辑面板**
  - 实时属性修改
  - 类型安全的属性更新
  - 内容特定的属性编辑器

### 待实现功能

- 🔄 **拖拽交互系统**
  - 组件拖拽到画布
  - 元素移动和调整大小
  - 多选和批量操作

- 🔄 **报表导出功能**
  - PDF导出
  - JasperReports集成
  - 多种输出格式

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