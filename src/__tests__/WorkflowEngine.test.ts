import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowEngine, WorkflowBuilder } from "../index.js";

describe("WorkflowEngine", () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    // 避免测试中的console输出
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("类型验证功能", () => {
    it("应成功执行具有有效输入数据的工作流", async () => {
      const workflow = new WorkflowBuilder()
        .setBasicInfo({
          name: "类型验证工作流",
          description: "测试类型验证",
        })
        .setInputSchema({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer", minimum: 18 },
            email: { type: "string", format: "email" },
          },
          required: ["name", "age"],
        })
        .addStep({
          id: "step1",
          name: "步骤1",
          type: "task",
          handler: "log",
          inputMapping: {
            message: "处理用户数据",
            data: {
              name: "$input.name",
              age: "$input.age",
              isAdult: true,
            },
          },
        })
        .build();

      const result = await engine.execute(workflow, {
        name: "张三",
        age: 25,
        email: "zhangsan@example.com",
      });

      expect(result.status).toBe("completed");
    });

    it("当输入数据类型错误时应抛出错误", async () => {
      const workflow = new WorkflowBuilder()
        .setBasicInfo({
          name: "类型验证工作流",
        })
        .setInputSchema({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer" },
          },
          required: ["name", "age"],
        })
        .addStep({
          id: "step1",
          name: "步骤1",
          type: "task",
          handler: "log",
          input: {
            type: "object",
            properties: {
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "integer" },
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
            },
          },
        })
        .build();

      // 确保在输入Schema上设置了严格验证
      if (
        workflow.input &&
        workflow.input.properties &&
        workflow.input.properties.age
      ) {
        workflow.input.properties.age.type = "integer"; // 强制要求整数类型
      }

      try {
        await engine.execute(workflow, {
          name: "李四",
          age: "30", // 应该是数字，但提供了字符串
        });
        // 如果执行到这里，说明没有抛出错误，测试应该失败
        expect("未抛出类型错误").toBe("应该抛出类型错误");
      } catch (error) {
        // 确保错误消息包含类型验证失败相关内容
        expect((error as Error).message).toMatch(/验证失败/);
      }
    });

    it("当步骤输入不满足约束条件时应抛出错误", async () => {
      const workflow = new WorkflowBuilder()
        .setBasicInfo({
          name: "约束验证工作流",
        })
        .addStep({
          id: "step1",
          name: "步骤1",
          type: "task",
          handler: "log",
          input: {
            type: "object",
            properties: {
              message: { type: "string" },
              number: { type: "integer", minimum: 10, maximum: 20 },
            },
            required: ["message", "number"],
          },
          inputMapping: {
            message: "验证数字范围",
            number: 5, // 低于最小值10
          },
        })
        .build();

      await expect(engine.execute(workflow, {})).rejects.toThrow();
    });

    it("应验证嵌套对象的属性类型", async () => {
      const workflow = new WorkflowBuilder()
        .setBasicInfo({
          name: "嵌套类型验证工作流",
        })
        .addStep({
          id: "step1",
          name: "步骤1",
          type: "task",
          handler: "log",
          input: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  profile: {
                    type: "object",
                    properties: {
                      age: { type: "integer", minimum: 18 },
                    },
                    required: ["age"],
                  },
                },
                required: ["profile"],
              },
            },
            required: ["user"],
          },
          inputMapping: {
            user: {
              profile: {
                age: 16, // 低于最小值18
              },
            },
          },
        })
        .build();

      await expect(engine.execute(workflow, {})).rejects.toThrow();
    });

    it("当步骤处理器不存在时应抛出错误", async () => {
      const workflow = new WorkflowBuilder()
        .setBasicInfo({
          name: "错误处理器工作流",
        })
        .addStep({
          id: "step1",
          name: "步骤1",
          type: "task",
          handler: "nonExistentHandler",
          inputMapping: {
            data: "test",
          },
        })
        .build();

      await expect(engine.execute(workflow, {})).rejects.toThrow(
        /Handler not found/
      );
    });
  });
});
