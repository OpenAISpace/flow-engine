import {
  WorkflowEngine,
  WorkflowDSL,
  StepDefinition,
  HandlerMetadata,
  SchemaDefinition,
  ExecutionContextRuntime,
  StepHandlerRegistry,
} from "../index.js";

// 1. 创建工作流引擎
const engine = new WorkflowEngine();

// 3. 手动注册处理器元数据
const mathOpMetadata: HandlerMetadata = {
  name: "mathOperation",
  description: "执行基本数学运算",
  category: "数学",
  displayName: "数学运算",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "要执行的操作",
      },
      a: { type: "number", description: "第一个操作数" },
      b: { type: "number", description: "第二个操作数" },
    },
    required: ["operation", "a", "b"],
  },
  outputSchema: {
    type: "object",
    properties: {
      result: { type: "number", description: "运算结果" },
    },
  },
  examples: [
    {
      name: "加法示例",
      input: { operation: "add", a: 5, b: 3 },
      output: { result: 8 },
    },
  ],
};

// 2. 注册自定义处理器并提供元数据
engine.registerHandler(
  "mathOperation",
  async (input: Record<string, any>, context: ExecutionContextRuntime) => {
    const { operation, a, b } = input;

    let result;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) throw new Error("除数不能为零");
        result = a / b;
        break;
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }

    return { result };
  },
  mathOpMetadata
);

// 4. 创建工作流定义
const workflow = WorkflowDSL.createWorkflow({
  name: "数学计算工作流",
  description: "演示数学运算处理器",
  steps: [
    {
      id: "step1",
      name: "加法运算",
      type: "task",
      handler: "mathOperation",
      inputMapping: {
        operation: "add",
        a: "$input.firstNumber",
        b: "$input.secondNumber",
      },
    },
    {
      id: "step2",
      name: "乘法运算",
      type: "task",
      handler: "mathOperation",
      inputMapping: {
        operation: "multiply",
        a: "$stepResults.step1.result.result",
        b: "$input.multiplier",
      },
      dependsOn: ["step1"],
    },
  ],
  input: {
    type: "object",
    properties: {
      firstNumber: { type: "number", description: "第一个数" },
      secondNumber: { type: "number", description: "第二个数" },
      multiplier: { type: "number", description: "乘数" },
    },
    required: ["firstNumber", "secondNumber", "multiplier"],
  },
  output: {
    type: "object",
    properties: {
      sum: { type: "number", description: "两数之和" },
      product: { type: "number", description: "与乘数相乘的结果" },
    },
  },
});

// 5. 获取并打印所有可用处理器
console.log("\n可用的处理器:");
const handlers = engine.getAvailableHandlers();
handlers.forEach(handler => {
  console.log(`- ${handler.name}: ${handler.description}`);
});

// 6. 获取并打印工作流步骤信息
console.log("\n工作流步骤信息:");
const stepsInfo = engine.getWorkflowStepsInfo(workflow);
stepsInfo.forEach(step => {
  console.log(`\n步骤: ${step.name} (${step.id})`);
  console.log(`处理器: ${step.handler}`);
});

// 7. 执行工作流
async function executeWorkflow() {
  try {
    const result = await engine.execute(workflow, {
      firstNumber: 10,
      secondNumber: 20,
      multiplier: 2,
    });

    console.log("\n工作流执行结果:");
    console.log(result.result);
  } catch (error) {
    console.error("工作流执行失败:", error);
  }
}

// 执行示例
executeWorkflow();
