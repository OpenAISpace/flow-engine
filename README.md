# Flow Engine - 工作流引擎框架

一个基于 TypeScript 的无状态工作流引擎框架，支持可视化拖拽、DSL 定义、断点继续、自动重试等高级功能。

## 功能特点

- 🔄 **无状态设计**: 工作流引擎采用无状态设计，便于云原生部署和水平扩展
- 📑 **DSL 支持**: 强大的领域特定语言（DSL）定义工作流逻辑
- 🌈 **可视化支持**: 易于与 React Flow 等可视化工具集成
- ⏯️ **断点调试**: 支持在任意步骤设置断点，暂停和继续执行
- 🔁 **自动重试**: 细粒度的重试策略控制
- 🧩 **插件架构**: 可扩展的插件系统
- 🛠️ **TypeScript 支持**: 完整的类型定义，提供智能提示和类型检查

## 安装

```bash
npm install flow-engine
```

## 基本使用

```typescript
import { WorkflowEngine, WorkflowBuilder } from "flow-engine";

// 1. 创建工作流引擎
const engine = new WorkflowEngine();

// 2. 注册自定义处理器
engine.registerHandler("validator", async (input, context) => {
  // 实现数据验证逻辑
  return { valid: true, data: input.data };
});

engine.registerHandler("processor", async (input, context) => {
  // 实现数据处理逻辑
  return { success: true, result: input.data };
});

// 3. 创建工作流
const workflow = new WorkflowBuilder()
  .setBasicInfo({
    name: "数据处理流程",
    description: "验证并处理数据",
  })
  .addStep({
    id: "validate",
    name: "验证数据",
    type: "task",
    handler: "validator",
    inputMapping: {
      data: "input",
    },
  })
  .addStep({
    id: "process",
    name: "处理数据",
    type: "task",
    handler: "processor",
    dependsOn: ["validate"],
    inputMapping: {
      data: "$stepResults.validate.result",
    },
  })
  .build();

// 4. 执行工作流
const result = await engine.execute(workflow, {
  name: "张三",
  email: "zhangsan@example.com",
});

console.log("执行结果:", result);
```

## 工作流 DSL 定义

```typescript
const workflowDSL = {
  name: "用户注册流程",
  description: "处理用户注册的完整流程",
  input: {
    type: "object",
    properties: {
      username: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
    },
  },
  steps: [
    {
      id: "validate",
      name: "验证用户输入",
      type: "task",
      handler: "validation",
      inputMapping: {
        data: "input",
      },
    },
    {
      id: "create_user",
      name: "创建用户",
      type: "task",
      handler: "database",
      dependsOn: ["validate"],
      inputMapping: {
        data: "$stepResults.validate.result",
      },
    },
  ],
};
```

## 高级功能

### 断点和继续执行

```typescript
// 设置断点
const result = await engine.execute(workflow, data, {
  breakpoints: ["create_user"],
});

// 从断点继续执行
await engine.resume(result.executionId);
```

### 错误处理和重试

```typescript
// 添加步骤级别的重试策略
.addStep({
  id: "api_call",
  name: "调用外部API",
  type: "task",
  handler: "http",
  retry: {
    maxRetries: 3,
    delay: 1000
  },
  onError: "continue" // 错误时继续执行
})
```

### 条件执行

```typescript
// 基于条件执行步骤
.addStep({
  id: "send_notification",
  name: "发送通知",
  type: "task",
  handler: "email",
  condition: "$stepResults.create_user.result.success === true"
})
```

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

欢迎提交问题和功能请求！请随时贡献代码和改进。

## 许可证

MIT
