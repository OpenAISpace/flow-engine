import {
  WorkflowDefinition,
  StepConfig,
  SchemaDefinition,
  RetryPolicy,
  Dependency,
  ConditionRule,
  ErrorHandler,
} from "../types/index.js";
import { WorkflowDSL } from "./WorkflowDSL.js";
import { StepDefinition } from "./StepDefinition.js";
import { v4 as uuidv4 } from "uuid";

/**
 * 工作流构建器 - 用于创建工作流
 */
export class WorkflowBuilder {
  private workflow: Partial<WorkflowDefinition>;

  constructor() {
    this.workflow = {
      id: uuidv4(),
      name: "",
      version: "1.0.0",
      description: "",
      global: {
        timeout: 30000,
        retryPolicy: { maxRetries: 3, delay: 1000 },
        context: {},
        variables: {},
      },
      input: { type: "object", properties: {} },
      output: { type: "object", properties: {} },
      steps: [],
      dependencies: [],
      conditions: [],
      errorHandlers: [],
      metadata: {},
    };
  }

  /**
   * 设置基本信息
   */
  setBasicInfo(info: {
    name: string;
    description?: string;
    version?: string;
    id?: string;
  }): WorkflowBuilder {
    this.workflow.name = info.name;

    if (info.description) {
      this.workflow.description = info.description;
    }

    if (info.version) {
      this.workflow.version = info.version;
    }

    if (info.id) {
      this.workflow.id = info.id;
    }

    return this;
  }

  /**
   * 设置全局配置
   */
  setGlobalConfig(config: {
    timeout?: number;
    retryPolicy?: RetryPolicy;
    context?: Record<string, any>;
    variables?: Record<string, any>;
  }): WorkflowBuilder {
    if (!this.workflow.global) {
      this.workflow.global = {};
    }

    if (config.timeout) {
      this.workflow.global.timeout = config.timeout;
    }

    if (config.retryPolicy) {
      this.workflow.global.retryPolicy = config.retryPolicy;
    }

    if (config.context) {
      this.workflow.global.context = {
        ...this.workflow.global.context,
        ...config.context,
      };
    }

    if (config.variables) {
      this.workflow.global.variables = {
        ...this.workflow.global.variables,
        ...config.variables,
      };
    }

    return this;
  }

  /**
   * 添加步骤
   */
  addStep(stepConfig: StepConfig): WorkflowBuilder {
    if (!this.workflow.steps) {
      this.workflow.steps = [];
    }

    const step = new StepDefinition(stepConfig);
    this.workflow.steps.push(step);

    return this;
  }

  /**
   * 更新步骤
   */
  updateStep(stepId: string, updates: Partial<StepConfig>): WorkflowBuilder {
    if (!this.workflow.steps) {
      return this;
    }

    const stepIndex = this.workflow.steps.findIndex(s => s.id === stepId);

    if (stepIndex !== -1) {
      this.workflow.steps[stepIndex] = {
        ...this.workflow.steps[stepIndex],
        ...updates,
      };
    }

    return this;
  }

  /**
   * 删除步骤
   */
  removeStep(stepId: string): WorkflowBuilder {
    if (!this.workflow.steps) {
      return this;
    }

    this.workflow.steps = this.workflow.steps.filter(s => s.id !== stepId);

    return this;
  }

  /**
   * 添加依赖关系
   */
  addDependency(
    fromStepId: string,
    toStepId: string,
    type?: string
  ): WorkflowBuilder {
    // 检查步骤是否存在
    if (
      !this.workflow.steps?.find(s => s.id === fromStepId) ||
      !this.workflow.steps?.find(s => s.id === toStepId)
    ) {
      throw new Error(`步骤不存在: ${fromStepId} 或 ${toStepId}`);
    }

    // 在步骤上添加依赖
    const toStep = this.workflow.steps.find(s => s.id === toStepId);
    if (toStep) {
      if (!toStep.dependsOn) {
        toStep.dependsOn = [];
      }

      if (!toStep.dependsOn.includes(fromStepId)) {
        toStep.dependsOn.push(fromStepId);
      }
    }

    // 添加到依赖列表
    if (!this.workflow.dependencies) {
      this.workflow.dependencies = [];
    }

    this.workflow.dependencies.push({
      from: fromStepId,
      to: toStepId,
      type,
    });

    return this;
  }

  /**
   * 移除依赖关系
   */
  removeDependency(fromStepId: string, toStepId: string): WorkflowBuilder {
    // 从步骤上移除依赖
    if (this.workflow.steps) {
      const toStep = this.workflow.steps.find(s => s.id === toStepId);
      if (toStep && toStep.dependsOn) {
        toStep.dependsOn = toStep.dependsOn.filter(id => id !== fromStepId);
      }
    }

    // 从依赖列表移除
    if (this.workflow.dependencies) {
      this.workflow.dependencies = this.workflow.dependencies.filter(
        d => !(d.from === fromStepId && d.to === toStepId)
      );
    }

    return this;
  }

  /**
   * 设置输入Schema
   */
  setInputSchema(schema: SchemaDefinition): WorkflowBuilder {
    this.workflow.input = schema;
    return this;
  }

  /**
   * 设置输出Schema
   */
  setOutputSchema(schema: SchemaDefinition): WorkflowBuilder {
    this.workflow.output = schema;
    return this;
  }

  /**
   * 添加条件规则
   */
  addConditionRule(rule: ConditionRule): WorkflowBuilder {
    if (!this.workflow.conditions) {
      this.workflow.conditions = [];
    }

    this.workflow.conditions.push(rule);
    return this;
  }

  /**
   * 添加错误处理器
   */
  addErrorHandler(handler: ErrorHandler): WorkflowBuilder {
    if (!this.workflow.errorHandlers) {
      this.workflow.errorHandlers = [];
    }

    this.workflow.errorHandlers.push(handler);
    return this;
  }

  /**
   * 验证工作流
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查基本信息
    if (!this.workflow.name) {
      errors.push("工作流名称是必需的");
    }

    // 检查步骤
    if (!this.workflow.steps || this.workflow.steps.length === 0) {
      errors.push("至少需要一个步骤");
    } else {
      // 检查步骤ID唯一性
      const stepIds = this.workflow.steps.map(s => s.id);
      const uniqueIds = new Set(stepIds);

      if (uniqueIds.size !== stepIds.length) {
        const duplicates = stepIds.filter(
          (id, index) => stepIds.indexOf(id) !== index
        );
        errors.push(`存在重复的步骤ID: ${duplicates.join(", ")}`);
      }

      // 检查依赖的步骤是否存在
      for (const step of this.workflow.steps) {
        if (step.dependsOn) {
          for (const depId of step.dependsOn) {
            if (!stepIds.includes(depId)) {
              errors.push(`步骤 ${step.id} 依赖不存在的步骤: ${depId}`);
            }
          }
        }
      }

      // 检查循环依赖
      if (this.hasCyclicDependency()) {
        errors.push("检测到循环依赖");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查循环依赖
   */
  private hasCyclicDependency(): boolean {
    if (!this.workflow.steps) {
      return false;
    }

    const graph = new Map<string, string[]>();

    // 构建图
    for (const step of this.workflow.steps) {
      graph.set(step.id, step.dependsOn || []);
    }

    // DFS检查循环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = graph.get(nodeId) || [];
      for (const depId of dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const stepId of graph.keys()) {
      if (hasCycle(stepId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 构建工作流
   */
  build(): WorkflowDefinition {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`工作流验证失败: ${validation.errors.join(", ")}`);
    }

    return WorkflowDSL.createWorkflow(this.workflow);
  }

  /**
   * 导出为JSON字符串
   */
  toJSON(): string {
    return JSON.stringify(this.workflow, null, 2);
  }

  /**
   * 从JSON导入
   */
  fromJSON(json: string | Record<string, any>): WorkflowBuilder {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    this.workflow = { ...this.workflow, ...data };
    return this;
  }
}
