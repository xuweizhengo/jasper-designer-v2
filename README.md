# Jasper在线报表设计器

[![Build Status](https://gitee.com/your-username/jasper/workflows/Simple%20Build/badge.svg)](https://gitee.com/your-username/jasper/actions)
[![Quality Check](https://gitee.com/your-username/jasper/workflows/Code%20Quality%20Check/badge.svg)](https://gitee.com/your-username/jasper/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

基于Figma/墨刀设计理念的JasperReports可视化设计器，专注银行回单业务场景。

## 📋 项目概述

本项目是一个Web端的报表设计工具，让业务人员能够无需学习复杂的JasperStudio，通过直观的拖拽操作快速设计银行回单等报表模板。

### 🎯 核心目标
用户能在10分钟内创建包含标题、表格数据、页脚的银行回单报表。

## 🏗 项目结构

```
jasper/
├── frontend/           # React前端应用
├── backend/           # Spring Boot后端服务
├── docs/             # 项目文档
│   ├── design-document.md
│   ├── api/          # API文档
│   ├── deployment/   # 部署文档
│   └── user-guide/   # 用户指南
└── README.md
```

## 🚀 快速开始

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
./mvnw spring-boot:run
```

## 🎨 设计理念

- **极简界面**: 隐藏复杂性，突出核心功能
- **即时反馈**: 所见即所得，实时预览
- **组件化思维**: 拖拽式组件库
- **智能引导**: 减少用户认知负担

## 📱 技术栈

**前端**
- React 18 + TypeScript
- Konva.js (Canvas渲染)
- Zustand (状态管理)
- dnd-kit (拖拽)
- Tailwind CSS

**后端**
- Spring Boot 3.0
- JasperReports 6.20
- H2/PostgreSQL
- RESTful API

## 📖 文档

- [设计文档](./docs/design-document.md)
- [API文档](./docs/api/)
- [部署指南](./docs/deployment/)
- [用户指南](./docs/user-guide/)

## 🎯 开发路线图

- [x] 项目架构设计
- [ ] 基础框架搭建
- [ ] 画布渲染引擎
- [ ] 拖拽交互系统
- [ ] 数据绑定功能
- [ ] 银行回单模板
- [ ] 报表生成和预览

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。