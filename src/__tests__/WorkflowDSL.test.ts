import { WorkflowDSL } from "../core/WorkflowDSL.js";

describe("WorkflowDSL", () => {
  describe("createWorkflow", () => {
    it("应该使用提供的值创建工作流定义", () => {
      const definition = {
        name: "测试工作流",
        description: "用于测试的工作流",
        steps: [
          {
            id: "step1",
            name: "步骤1",
            type: "task" as const,
            handler: "testHandler",
          },
        ],
      };

      const workflow = WorkflowDSL.createWorkflow(definition);

      expect(workflow.name).toBe("测试工作流");
      expect(workflow.description).toBe("用于测试的工作流");
      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0].id).toBe("step1");
    });

    it("应该为缺失的字段提供默认值", () => {
      const definition = {
        name: "测试工作流",
        steps: [],
      };

      const workflow = WorkflowDSL.createWorkflow(definition);

      expect(workflow.id).toBeDefined();
      expect(workflow.version).toBe("1.0.0");
      expect(workflow.global).toBeDefined();
      expect(workflow.global?.timeout).toBe(30000);
      expect(workflow.global?.retryPolicy).toBeDefined();
      expect(workflow.input).toBeDefined();
      expect(workflow.output).toBeDefined();
    });

    it("应该生成一个唯一的ID", () => {
      const workflow1 = WorkflowDSL.createWorkflow({
        name: "工作流1",
        steps: [],
      });
      const workflow2 = WorkflowDSL.createWorkflow({
        name: "工作流2",
        steps: [],
      });

      expect(workflow1.id).not.toBe(workflow2.id);
    });
  });

  describe("generateId", () => {
    it("应该生成一个以workflow_开头的字符串", () => {
      const id = WorkflowDSL.generateId();
      expect(id).toMatch(/^workflow_/);
    });

    it("应该每次生成不同的ID", () => {
      const id1 = WorkflowDSL.generateId();
      const id2 = WorkflowDSL.generateId();
      expect(id1).not.toBe(id2);
    });
  });
});
