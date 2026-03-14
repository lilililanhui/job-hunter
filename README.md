# 求职助手 (Job Hunter)

一个基于 AI 的桌面端求职准备工具，帮助你高效管理求职进度、生成面试素材。

## ✨ 功能特性

### 📊 投递进展看板
- 可视化看板管理投递状态
- 支持拖拽更改状态
- 自动计算匹配度分数

### 🤖 AI 助手
- 自然语言交互
- 智能解析投递信息
- 自动生成面试素材

### 📝 简历管理
- 多版本简历管理
- 项目经历库
- STAR 格式成就记录

### 🎯 智能生成
- 自我介绍生成（1/3/5分钟版本）
- 面试问题预测
- STAR 法则答案生成
- 简历-JD 匹配度分析

## 🛠️ 技术栈

- **桌面框架**: Tauri
- **前端**: React + TypeScript + Tailwind CSS + ShadcnUI
- **状态管理**: Zustand
- **AI 框架**: LangChain.js
- **LLM**: OpenAI API

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Rust (用于 Tauri 桌面端)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 仅前端开发
npm run dev

# Tauri 桌面应用开发（需要 Rust）
npm run tauri dev
```

### 构建

```bash
# 构建前端
npm run build

# 构建桌面应用
npm run tauri build
```

## 📁 项目结构

```
src/
├── agent/              # LangChain Agent 模块
│   ├── llm.ts          # LLM 配置
│   ├── prompts.ts      # 提示词模板
│   ├── orchestrator.ts # Agent 编排器
│   └── tools/          # Agent 工具
│       ├── progressManager.ts   # 投递管理
│       ├── introGenerator.ts    # 自我介绍生成
│       ├── matchCalculator.ts   # 匹配度计算
│       └── interviewHelper.ts   # 面试助手
├── components/         # React 组件
│   ├── ui/             # ShadcnUI 基础组件
│   ├── layout/         # 布局组件
│   └── views/          # 页面视图
├── store/              # Zustand 状态管理
├── types/              # TypeScript 类型定义
└── lib/                # 工具函数
```

## ⚙️ 配置

首次使用需要在「设置」页面配置 OpenAI API Key。

1. 获取 API Key: https://platform.openai.com/api-keys
2. 打开应用 → 设置 → 输入 API Key
3. 点击「验证」确认有效

## 📖 使用指南

### 添加投递记录

1. 在看板页面点击「添加投递」
2. 填写公司名称、职位名称
3. 粘贴 JD 内容（可选）
4. 选择当前状态

### 使用 AI 助手

可以通过自然语言与 AI 助手交互：

- "帮我添加一条投递记录：字节跳动前端工程师"
- "把腾讯的状态更新为面试中"
- "帮我生成一份3分钟的自我介绍"
- "分析这个职位和我的匹配度"

### 管理简历

1. 在「简历管理」添加你的简历内容
2. 添加项目经历（STAR 格式）
3. AI 将基于这些信息生成定制化素材

## 📝 License

MIT
