import { WorkflowEngine, WorkflowBuilder, SchemaValidator } from "../index.js";

async function runExample() {
  console.log("=== 工作流类型检查示例 ===");

  // 创建工作流引擎
  const engine = new WorkflowEngine();

  // 创建一个工作流，其中包含需要进行类型检查的步骤
  const workflowBuilder = new WorkflowBuilder()
    .setBasicInfo({
      name: "类型检查示例工作流",
      description: "演示工作流引擎中的类型验证功能",
    })
    .setInputSchema({
      type: "object",
      properties: {
        name: { type: "string", description: "用户名" },
        age: { type: "integer", description: "年龄" },
        email: {
          type: "string",
          format: "email",
          description: "电子邮件地址",
        },
      },
      required: ["name", "age"],
    })
    .addStep({
      id: "validate_input",
      name: "验证输入",
      type: "task",
      handler: "log",
      inputMapping: {
        message: "验证输入数据",
        data: "$input",
      },
    })
    .addStep({
      id: "process_data",
      name: "处理数据",
      type: "task",
      handler: "log",
      input: {
        type: "object",
        properties: {
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              age: { type: "integer", minimum: 18 },
            },
            required: ["age"],
          },
        },
        required: ["message", "data"],
      },
      inputMapping: {
        message: "处理用户数据",
        data: {
          name: "$input.name",
          age: "$input.age",
          isAdult: true,
        },
      },
      dependsOn: ["validate_input"],
    });

  const workflow = workflowBuilder.build();

  // 场景1：有效数据 - 成功执行
  console.log("\n▶ 场景1：有效数据");
  try {
    const result1 = await engine.execute(workflow, {
      name: "张三",
      age: 25,
      email: "zhangsan@example.com",
    });
    console.log("✅ 工作流执行成功:", result1.result);
  } catch (error) {
    console.error(
      "❌ 工作流执行失败:",
      error instanceof Error ? error.message : String(error)
    );
  }

  // 场景2：类型错误 - age 应该是 integer 但提供了 string
  console.log("\n▶ 场景2：类型错误");
  try {
    const result2 = await engine.execute(workflow, {
      name: "李四",
      age: "30", // 明确的类型错误：字符串而非数字
      email: "lisi@example.com",
    });
    console.log("✅ 工作流执行成功:", result2.result);
  } catch (error) {
    console.error(
      "❌ 工作流执行失败:",
      error instanceof Error ? error.message : String(error)
    );
  }

  // 场景3：约束错误 - age 低于最小值
  console.log("\n▶ 场景3：约束错误");
  try {
    const result3 = await engine.execute(workflow, {
      name: "王五",
      age: 16, // 约束错误：低于最小值18
      email: "wangwu@example.com",
    });
    console.log("✅ 工作流执行成功:", result3.result);
  } catch (error) {
    console.error(
      "❌ 工作流执行失败:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 执行示例
runExample().catch(err =>
  console.error(
    "示例运行失败:",
    err instanceof Error ? err.message : String(err)
  )
);
