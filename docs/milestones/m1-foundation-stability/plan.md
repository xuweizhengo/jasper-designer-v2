# M1: Foundation Stability - 详细计划

## 目标重述

修复当前项目中的所有构建问题，确保项目可以稳定构建和运行，为后续开发建立可靠的基础平台。

## 具体任务分解

### 阶段1: 构建问题修复 (优先级: 🔴 High)

#### 1.1 TypeScript类型错误修复
**当前问题**: 12个TypeScript错误阻塞构建

**具体错误清单**:
- [ ] `Canvas.tsx:12` - 未使用的canvasSize变量
- [ ] `Canvas.tsx:39` - 可能为undefined的字符串参数
- [ ] `Canvas.tsx:64` - 未使用的canvasTransform变量
- [ ] `ElementRenderer.tsx:31,131` - SVG text元素不支持width/height属性
- [ ] `ElementRenderer.tsx:153` - SVG g元素不支持key属性
- [ ] `ComponentLibrary.tsx:18,36,55,71,83,98,116,135` - ElementContent缺少type字段
- [ ] `MainLayout.tsx:9` - 未使用的state变量
- [ ] `Toolbar.tsx:29` - 未使用的resetZoom变量
- [ ] `main.tsx:7` - ImportMeta.env属性访问问题
- [ ] `AppContext.tsx:1,4` - 未使用的导入

**解决策略**:
1. 移除未使用的变量和导入
2. 修复SVG属性类型问题
3. 完善ElementContent类型定义
4. 修复环境变量访问

#### 1.2 Rust代码质量检查
- [ ] 运行`cargo clippy`检查所有警告
- [ ] 运行`cargo fmt`格式化代码
- [ ] 修复所有Rust编译警告

### 阶段2: 基础功能验证 (优先级: 🟡 Medium)

#### 2.1 应用启动验证
- [ ] 验证`npm run tauri dev`可以正常启动
- [ ] 验证桌面窗口正常显示
- [ ] 验证前后端通信正常

#### 2.2 画布渲染验证
- [ ] 验证SVG画布正常显示
- [ ] 验证网格背景正常渲染
- [ ] 验证基础元素(文字、矩形、线条)可以渲染
- [ ] 验证元素属性正确应用

### 阶段3: 质量保证建立 (优先级: 🟢 Low)

#### 3.1 测试覆盖
- [ ] 为核心组件添加单元测试
- [ ] 为Rust核心逻辑添加测试
- [ ] 建立测试运行流程

#### 3.2 代码质量检查
- [ ] 建立ESLint配置
- [ ] 建立Prettier配置
- [ ] 配置pre-commit hooks

## 技术实施细节

### TypeScript修复方案

#### SVG属性修复
```typescript
// 错误的写法
<text width={size.width} height={size.height}>

// 正确的写法  
<text>
```

#### ElementContent类型修复
```typescript
// 需要为所有create_content返回值添加type字段
create_content: () => ({
  type: 'Text',  // 添加这行
  content: '文字内容',
  style: { ... }
})
```

### 环境配置优化
```typescript
// vite-env.d.ts中添加类型定义
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 风险识别和缓解

### 技术风险
1. **类型系统复杂性**
   - 风险: SVG类型定义可能需要深度定制
   - 缓解: 采用渐进式修复，保持最小变更

2. **依赖兼容性**
   - 风险: Solid.js和TypeScript版本冲突
   - 缓解: 锁定版本，建立兼容性测试

### 进度风险
1. **修复时间超预期**
   - 风险: 类型错误修复比预期复杂
   - 缓解: 设置时间盒，必要时简化类型定义

## 验收准备

### 自动化检查清单
- [ ] `npm run build` 零错误零警告
- [ ] `npm run tauri dev` 正常启动
- [ ] `cargo clippy` 零警告
- [ ] `cargo test` 所有测试通过

### 手动测试清单  
- [ ] 应用启动后画布正常显示
- [ ] 可以看到网格背景
- [ ] 预设的测试元素正常渲染
- [ ] 窗口可以正常调整大小

## 成功标准

1. **构建系统**: 100%构建成功率
2. **代码质量**: 零类型错误，零编译警告
3. **功能基线**: 基础画布和元素渲染正常
4. **开发体验**: 开发服务器启动时间<10秒

## 交付物

- [ ] 可构建的源代码
- [ ] 质量检查配置文件
- [ ] 基础测试套件
- [ ] 开发环境文档更新