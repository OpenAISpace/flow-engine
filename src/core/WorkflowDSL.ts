import { WorkflowDefinition } from "../types/index.js";

/**
 * 工作流DSL定义接口
 */
export class WorkflowDSL {
  static createWorkflow(
    definition: Partial<WorkflowDefinition>
  ): WorkflowDefinition {
    return {
      id: definition.id || this.generateId(),
      name: definition.name || "",
      version: definition.version || "1.0.0",
      description: definition.description,

      // 全局配置
      global: {
        timeout: definition.global?.timeout || 30000,
        retryPolicy: definition.global?.retryPolicy || {
          maxRetries: 3,
          delay: 1000,
        },
        context: definition.global?.context || {},
        variables: definition.global?.variables || {},
      },

      // 输入输出Schema
      input: definition.input || { type: "object", properties: {} },
      output: definition.output || { type: "object", properties: {} },

      // 步骤定义
      steps: definition.steps || [],

      // 依赖关系
      dependencies: definition.dependencies || [],

      // 条件分支
      conditions: definition.conditions || [],

      // 错误处理
      errorHandlers: definition.errorHandlers || [],

      // 元数据
      metadata: definition.metadata || {},
    };
  }

  static generateId(): string {
    return `workflow_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }
}
