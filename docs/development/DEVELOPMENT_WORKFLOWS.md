# 🔄 Jasper Designer V2.0 - 开发工作流程图

## 📋 流程图概览

本文档包含 Jasper Designer V2.0 项目的核心工作流程图，为开发团队提供标准化的操作指引。

---

## 🚀 日常开发工作流程

```mermaid
flowchart TD
    Start([开始开发]) --> Check{检查项目状态}
    Check --> Pull[git pull 最新代码]
    Pull --> Branch[创建功能分支]
    Branch --> Setup[检查环境配置]
    Setup --> Dev[开始开发]
    
    Dev --> Code[编写代码]
    Code --> Test[本地测试]
    Test --> TestPass{测试通过?}
    TestPass -->|否| Fix[修复问题]
    Fix --> Test
    TestPass -->|是| Build[本地构建验证]
    
    Build --> BuildPass{构建成功?}
    BuildPass -->|否| FixBuild[修复构建错误]
    FixBuild --> Build
    BuildPass -->|是| Commit[提交代码]
    
    Commit --> Push[推送到远程]
    Push --> PR[创建 Pull Request]
    PR --> Review[代码审查]
    Review --> ReviewPass{审查通过?}
    ReviewPass -->|否| Modify[修改代码]
    Modify --> Push
    ReviewPass -->|是| Merge[合并到主分支]
    Merge --> Deploy[部署测试]
    Deploy --> End([完成])
    
    style Start fill:#e1f5fe
    style End fill:#e8f5e8
    style TestPass fill:#fff3e0
    style BuildPass fill:#fff3e0
    style ReviewPass fill:#fff3e0
```

### 🔧 开发环境检查清单

```mermaid
flowchart LR
    EnvCheck([环境检查]) --> Rust[Rust 1.70.0+]
    EnvCheck --> Node[Node.js 18.0.0+]
    EnvCheck --> Git[Git 配置]
    
    Rust --> RustOK{版本正确?}
    Node --> NodeOK{版本正确?}
    Git --> GitOK{配置正确?}
    
    RustOK -->|否| InstallRust[安装/更新 Rust]
    NodeOK -->|否| InstallNode[安装/更新 Node.js]
    GitOK -->|否| ConfigGit[配置 Git]
    
    RustOK -->|是| Ready
    NodeOK -->|是| Ready
    GitOK -->|是| Ready
    InstallRust --> Ready
    InstallNode --> Ready
    ConfigGit --> Ready
    
    Ready([环境就绪])
    
    style Ready fill:#e8f5e8
```

---

## 🏗️ 系统架构交互流程

```mermaid
graph TB
    subgraph "前端 (Solid.js)"
        UI[用户界面组件]
        Canvas[画布渲染引擎]
        Store[状态管理 Store]
        API[API 调用层]
    end
    
    subgraph "通信层 (Tauri)"
        Commands[Tauri 命令]
        Events[事件系统]
        IPC[进程间通信]
    end
    
    subgraph "后端 (Rust)"
        State[应用状态管理]
        Core[核心业务逻辑]
        File[文件系统操作]
        Export[导出引擎]
    end
    
    subgraph "外部系统"
        FS[文件系统]
        PDF[PDF 引擎]
        Jasper[JasperReports]
    end
    
    %% 交互流程
    UI --> Store
    Store --> API
    API --> Commands
    Commands --> IPC
    IPC --> State
    State --> Core
    Core --> File
    Core --> Export
    
    %% 反向数据流
    State --> Events
    Events --> Store
    Store --> Canvas
    Canvas --> UI
    
    %% 外部系统交互
    File --> FS
    Export --> PDF
    Export --> Jasper
    
    %% 样式
    classDef frontend fill:#e3f2fd
    classDef communication fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class UI,Canvas,Store,API frontend
    class Commands,Events,IPC communication  
    class State,Core,File,Export backend
    class FS,PDF,Jasper external
```

### 🔄 典型用户操作流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant UI as 前端UI
    participant S as Store
    participant C as Tauri Commands
    participant R as Rust后端
    
    U->>UI: 点击创建元素
    UI->>S: dispatch action
    S->>C: invoke create_element
    C->>R: 执行业务逻辑
    R->>R: 更新应用状态
    R->>C: 返回结果
    C->>S: 更新前端状态
    S->>UI: 触发重渲染
    UI->>U: 显示新元素
    
    Note over U,R: 类型安全的端到端通信
```

---

## 📦 构建与发布流程

```mermaid
flowchart TD
    Start([开始构建]) --> CheckEnv[检查构建环境]
    CheckEnv --> InstallDeps[安装依赖]
    InstallDeps --> TypeCheck[TypeScript 类型检查]
    
    TypeCheck --> TypeOK{类型检查通过?}
    TypeOK -->|否| FixTypes[修复类型错误]
    FixTypes --> TypeCheck
    TypeOK -->|是| RustCheck[Rust 代码检查]
    
    RustCheck --> RustOK{Rust 检查通过?}
    RustOK -->|否| FixRust[修复 Rust 错误]
    FixRust --> RustCheck
    RustOK -->|是| BuildFrontend[构建前端]
    
    BuildFrontend --> BuildTauri[Tauri 应用构建]
    BuildTauri --> BuildSuccess{构建成功?}
    BuildSuccess -->|否| DebugBuild[调试构建错误]
    DebugBuild --> BuildTauri
    BuildSuccess -->|是| Test[运行测试]
    
    Test --> TestOK{测试通过?}
    TestOK -->|否| FixTests[修复测试]
    FixTests --> Test
    TestOK -->|是| Package[打包应用]
    
    Package --> Sign[代码签名]
    Sign --> Distribute[分发/部署]
    Distribute --> End([构建完成])
    
    %% 错误处理
    DebugBuild --> Log[查看构建日志]
    Log --> Analyze[分析错误原因]
    Analyze --> DebugBuild
    
    style Start fill:#e1f5fe
    style End fill:#e8f5e8
    style TypeOK fill:#fff3e0
    style RustOK fill:#fff3e0
    style BuildSuccess fill:#fff3e0
    style TestOK fill:#fff3e0
```

### 📋 构建命令参考

```mermaid
graph LR
    Dev[开发构建] --> DevCmd["npm run tauri dev"]
    Prod[生产构建] --> ProdCmd["npm run tauri build"]
    Debug[调试构建] --> DebugCmd["RUST_LOG=debug npm run tauri dev"]
    
    DevCmd --> DevFeature[热重载<br/>实时预览]
    ProdCmd --> ProdFeature[优化构建<br/>代码签名]
    DebugCmd --> DebugFeature[详细日志<br/>错误调试]
    
    style Dev fill:#e1f5fe
    style Prod fill:#e8f5e8  
    style Debug fill:#fff3e0
```

---

## 🎯 M3 功能开发流程

```mermaid
flowchart TD
    M3Start([M3 开发开始]) --> Current{当前进度检查}
    Current --> Progress85[M3 已完成 85%]
    
    Progress85 --> Phase4A[Phase 4A: 核心快捷键]
    Phase4A --> Shortcuts[实现 Ctrl+C/V/X/Z/Y]
    Shortcuts --> DeleteKey[实现 Delete 键]
    DeleteKey --> ShortcutTest[快捷键功能测试]
    
    ShortcutTest --> TestOK{测试通过?}
    TestOK -->|否| FixShortcuts[修复快捷键问题]
    FixShortcuts --> ShortcutTest
    TestOK -->|是| Phase4AComplete[Phase 4A 完成]
    
    Phase4AComplete --> M3Complete{M3 是否完成?}
    M3Complete -->|是| M3Done[M3 里程碑完成]
    M3Complete -->|否| Phase4B[考虑 Phase 4B]
    
    Phase4B --> GroupDesign[群组功能设计已完成]
    GroupDesign --> ContextMenu[右键菜单设计已完成]
    ContextMenu --> Implement{是否立即实现?}
    
    Implement -->|是| DevPhase4B[开发 Phase 4B]
    Implement -->|否| DelayPhase4B[延期到 M4]
    
    DevPhase4B --> GroupDev[实现群组功能]
    GroupDev --> MenuDev[实现右键菜单]
    MenuDev --> Integration[功能集成测试]
    Integration --> M3Final[M3 完全完成]
    
    DelayPhase4B --> M3Done
    M3Done --> M4Planning[M4 规划]
    M3Final --> M4Planning
    
    style M3Start fill:#e1f5fe
    style Phase4AComplete fill:#e8f5e8
    style M3Done fill:#4caf50,color:#fff
    style M3Final fill:#2196f3,color:#fff
```

### 🔧 M3 剩余任务优先级

```mermaid
graph TD
    Remaining[M3 剩余任务] --> High[高优先级 10%]
    Remaining --> Low[低优先级 5%]
    
    High --> KeyboardShortcuts[核心快捷键系统]
    KeyboardShortcuts --> CtrlCV[Ctrl+C/V 复制粘贴]
    KeyboardShortcuts --> CtrlZ[Ctrl+Z/Y 撤销重做]  
    KeyboardShortcuts --> Delete[Delete 删除键]
    
    Low --> GroupFeature[群组操作功能]
    Low --> ContextMenu[右键上下文菜单]
    
    CtrlCV --> Complete[完成 M3]
    CtrlZ --> Complete
    Delete --> Complete
    
    GroupFeature --> Optional[可选实现]
    ContextMenu --> Optional
    Optional --> NextMilestone[推迟到下个里程碑]
    
    style High fill:#ffcdd2
    style KeyboardShortcuts fill:#fff3e0
    style Complete fill:#e8f5e8
    style Optional fill:#f3e5f5
```

---

## 🧹 技术债务清理流程

```mermaid
flowchart TD
    DebtStart([开始债务清理]) --> Assess[评估技术债务]
    Assess --> Priority{优先级分类}
    
    Priority --> High[高优先级债务]
    Priority --> Medium[中等优先级债务] 
    Priority --> Low[低优先级债务]
    
    High --> CleanBuilds[清理构建产物 96MB]
    CleanBuilds --> MergeScripts[合并11个打包脚本]
    MergeScripts --> UpdateGitignore[更新 .gitignore]
    
    Medium --> CreateFlows[创建流程图]
    CreateFlows --> OptimizeArchitecture[优化架构结构]
    
    Low --> AutomationTools[自动化工具链]
    AutomationTools --> CIOptimization[CI/CD 优化]
    
    UpdateGitignore --> Verify[验证清理效果]
    OptimizeArchitecture --> Verify
    CIOptimization --> Verify
    
    Verify --> Success{清理成功?}
    Success -->|是| Document[更新文档]
    Success -->|否| Retry[重新清理]
    Retry --> Assess
    
    Document --> Monitor[建立监控机制]
    Monitor --> DebtEnd([债务清理完成])
    
    style DebtStart fill:#e1f5fe
    style High fill:#ffcdd2
    style Medium fill:#fff3e0
    style Low fill:#e8f5e8
    style DebtEnd fill:#4caf50,color:#fff
```

---

## 📋 使用说明

### 🎯 如何使用这些流程图

1. **日常开发**: 参考"开发工作流程"确保标准化操作
2. **架构理解**: 通过"系统架构交互流程"了解组件关系
3. **构建发布**: 使用"构建与发布流程"确保稳定交付
4. **M3 开发**: 遵循"M3 功能开发流程"完成当前里程碑
5. **债务清理**: 按照"技术债务清理流程"维护代码质量

### 📚 相关文档

- [技术债务深度分析](TECHNICAL_DEBT_ANALYSIS.md)
- [M3 状态跟踪](../milestones/m3-advanced-editing/status.md)
- [V2 架构设计](../v2-architecture-design.md)
- [构建指南](BUILD_GUIDE.md)

---

**更新日期**: 2025-08-19  
**维护者**: 开发团队  
**版本**: 1.0