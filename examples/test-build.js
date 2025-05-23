// 测试打包后的库
import {
  WorkflowBuilder,
  WorkflowEngine,
  BaseNode,
} from "../dist/flow-engine.es.js";

// 自定义节点类，继承BaseNode
class CustomNode extends BaseNode {
  get name() {
    return "customProcessor";
  }

  get handler() {
    return async (input, context) => {
      console.log("执行自定义节点:", input);
      return {
        success: true,
        data: {
          ...input,
          processed: true,
          timestamp: Date.now(),
        },
      };
    };
  }

  get metadata() {
    return {
      name: this.name,
      description: "自定义处理节点",
      category: "自定义",
      displayName: "自定义处理器",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "要处理的数据",
          },
          options: {
            type: "object",
            description: "处理选项",
            properties: {
              transform: { type: "boolean", default: false },
            },
          },
        },
        required: ["data"],
      },
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
        },
      },
      examples: [
        {
          name: "基本处理示例",
          input: { data: { value: 123 } },
          output: { success: true, data: { value: 123, processed: true } },
        },
      ],
    };
  }
}

// 创建一个复杂的工作流
const workflow = new WorkflowBuilder()
  .setBasicInfo({
    name: "复杂工作流示例",
    description: "包含条件分支、循环和自定义节点的工作流",
  })
  .addStep({
    id: "start",
    name: "开始节点",
    type: "task",
    handler: "log",
    inputMapping: {
      message: "工作流开始执行",
      data: {
        customNodeData: { type: "customNodeData", value: 456 },
      },
    },
  })
  .addStep({
    id: "customProcessor",
    name: "自定义节点类处理",
    type: "custom",
    handler: "customProcessor",
    inputMapping: {
      data: { type: "customNodeData", value: 456 },
      options: { transform: true },
    },
  })
  .addStep({
    id: "branch2",
    name: "分支2",
    type: "task",
    handler: "log",
    dependsOn: ["customProcessor"],
    inputMapping: {
      message: "执行分支2",
      data: "$stepResults.customProcessor.result.data",
    },
  })
  .addStep({
    id: "end",
    name: "结束节点",
    type: "task",
    handler: "log",
    dependsOn: ["branch2"],
    inputMapping: {
      message: "工作流执行完成",
      summary: {
        customNodeData: "$stepResults.customProcessor.result.data",
      },
    },
  })
  .build();

// 创建工作流引擎
const engine = new WorkflowEngine();

// 创建自定义Node实例并注册
const customNode = new CustomNode();
engine.registerHandler(
  customNode.name,
  customNode.handler,
  customNode.metadata
);

// 执行工作流
async function run() {
  try {
    console.log("开始执行复杂工作流...");
    const result = await engine.execute(workflow, {});
    console.log("工作流执行完成:", result.status);
    console.log("执行结果:", result.result);
  } catch (error) {
    console.error("工作流执行失败:", error);
  }
}

run();
