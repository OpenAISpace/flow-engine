# Flow Engine - 高性能工作流引擎框架

> **注意：** 本项目目前正在积极开发中，API 可能会发生变化。

一个基于 TypeScript 的无状态工作流引擎框架，支持可视化拖拽、DSL 定义、断点继续、自动重试等高级功能。专为构建复杂业务流程自动化、数据处理管道和集成场景而设计。

## 安装

```bash
npm install flow-engine
```

## 快速开始

以下是一个简单的工作流示例：

```javascript
import { WorkflowBuilder, WorkflowEngine } from "flow-engine";

// 创建工作流
const workflow = new WorkflowBuilder()
  .setBasicInfo({
    name: "简单工作流示例",
    description: "演示基本功能的工作流",
  })
  .addStep({
    id: "start",
    name: "开始节点",
    type: "task",
    handler: "log",
    inputMapping: {
      message: "工作流开始执行",
    },
  })
  .addStep({
    id: "process",
    name: "处理节点",
    type: "task",
    handler: "log",
    inputMapping: {
      message: "处理数据",
      data: { value: 42 },
    },
  })
  .addStep({
    id: "end",
    name: "结束节点",
    type: "task",
    handler: "log",
    inputMapping: {
      message: "工作流执行完成",
      result: "$stepResults.process.result",
    },
  })
  .build();

// 创建工作流引擎
const engine = new WorkflowEngine();

// 执行工作流
async function run() {
  try {
    const result = await engine.execute(workflow, { inputData: "示例输入" });
    console.log("工作流执行结果:", result);
  } catch (error) {
    console.error("工作流执行失败:", error);
  }
}

run();
```

## 自定义节点

您可以轻松创建和注册自定义节点：

```javascript
// 创建自定义节点处理器
const customHandler = async (input, context) => {
  console.log("执行自定义处理:", input);
  return {
    success: true,
    data: {
      ...input,
      processed: true,
      timestamp: Date.now(),
    },
  };
};

// 注册自定义处理器
engine.registerHandler("customProcessor", customHandler, {
  description: "自定义处理节点",
  inputSchema: {
    type: "object",
    properties: {
      data: { type: "object" },
    },
  },
});

// 在工作流中使用
workflow.addStep({
  id: "customStep",
  name: "自定义处理",
  type: "custom",
  handler: "customProcessor",
  inputMapping: {
    data: { value: 123 },
  },
});
```

## 项目介绍

Flow Engine 是一个轻量级但功能强大的工作流引擎，使开发人员能够以声明式方式定义和执行复杂的业务流程。它采用无状态架构设计，可以无缝集成到现代云原生环境中，同时保持高性能和可靠性。

本框架的核心优势在于将业务逻辑与执行流程分离，让开发者能够专注于构建业务功能，而不必担心执行编排、错误处理和状态管理等复杂问题。

## 适用场景

Flow Engine 适用于多种场景：

- **业务流程自动化**：订单处理、审批流程、用户注册等多步骤业务流程
- **数据处理管道**：ETL 作业、数据清洗和转换流程
- **系统集成**：连接多个 API 和服务的复杂集成场景
- **微服务编排**：跨多个微服务的工作流协调
- **低代码/无代码平台**：作为可视化工作流编辑器的后端引擎
- **决策引擎**：实现基于规则的复杂业务决策流程

## 核心优势

- 🔄 **无状态设计**: 工作流引擎采用无状态设计，便于云原生部署和水平扩展
- 📑 **强大的 DSL**: 直观的领域特定语言（DSL）定义工作流逻辑，便于版本控制和共享
- 🌈 **前端集成友好**: 提供完整 Schema 信息，易于与 React Flow 等可视化工具集成
- ⏯️ **断点调试**: 支持在任意步骤设置断点，暂停和继续执行，方便开发和测试
- 🔁 **智能重试策略**: 细粒度的重试策略控制，支持指数退避和自定义重试逻辑
- 🧩 **可扩展架构**: 插件系统允许自定义处理器、条件评估器和数据映射器
- 📊 **可观测性**: 内置事件系统，支持与监控工具集成
- 🔄 **异步并行执行**: 基于依赖图的智能并行执行，提高处理效率
- 🛠️ **TypeScript 支持**: 完整的类型定义，提供智能提示和类型检查，减少开发错误
- 🚀 **高性能**: 优化的执行引擎，能够处理高吞吐量的工作流

## 与其他解决方案比较

| 特性            | Flow Engine | 传统 BPM 工具 | Serverless 工作流 |
| --------------- | ----------- | ------------- | ----------------- |
| 学习曲线        | 低          | 高            | 中                |
| 轻量级          | ✅          | ❌            | ⚠️                |
| 编程友好        | ✅          | ⚠️            | ✅                |
| 可视化支持      | ✅          | ✅            | ⚠️                |
| 无状态设计      | ✅          | ❌            | ✅                |
| 自定义处理器    | ✅          | ⚠️            | ✅                |
| 断点调试        | ✅          | ⚠️            | ❌                |
| TypeScript 支持 | ✅          | ❌            | ⚠️                |
| 数据映射        | ✅          | ✅            | ⚠️                |
| 事件驱动        | ✅          | ✅            | ✅                |

## 项目状态

Flow Engine 目前处于活跃开发阶段。以下是当前进展：

- ✅ 核心工作流引擎
- ✅ 基本 DSL 解析器
- ✅ 步骤处理器注册表
- ✅ 数据映射系统
- ✅ 条件评估器
- ✅ 工作流构建器 API
- ✅ 异常处理和重试机制
- ✅ 前端集成 Schema API
- 🚧 文档完善
- 🚧 单元测试覆盖
- 🚧 性能优化
- 🚧 示例应用

## 开发计划

1. 完善核心功能和 API
2. 增加更多内置处理器
3. 完善文档和示例
4. 添加可视化设计器组件
5. 发布稳定版本

## 开发

```bash
# 安装依赖
npm install

# 编译TypeScript
npm run build

# 运行开发模式
npm run dev

# 运行测试
npm test
```

## 贡献

欢迎提交问题和功能请求！请随时贡献代码和改进。详见 [贡献指南](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
