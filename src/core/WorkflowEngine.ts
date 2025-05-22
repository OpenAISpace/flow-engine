import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import {
  WorkflowDefinition,
  WorkflowEngineOptions,
  StepConfig,
  ExecutionContextData,
  EventData,
} from "../types/index.js";
import { WorkflowDSL } from "./WorkflowDSL.js";
import { StepHandlerRegistry, HandlerMetadata } from "./StepHandlerRegistry.js";
import { ExecutionContext } from "./ExecutionContext.js";
import { DataMapper } from "../data/DataMapper.js";
import { ConditionEvaluator } from "../data/ConditionEvaluator.js";

/**
 * 工作流引擎核心
 */
export class WorkflowEngine {
  private handlerRegistry: StepHandlerRegistry;
  private executionStore: Map<string, ExecutionContext>;
  private eventEmitter: EventEmitter;
  private config: {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    enableBreakpoints: boolean;
    persistExecution: boolean;
  };

  constructor(options: WorkflowEngineOptions = {}) {
    this.handlerRegistry = new StepHandlerRegistry();
    this.executionStore = options.executionStore || new Map();
    this.eventEmitter = options.eventEmitter || new EventEmitter();

    this.config = {
      maxConcurrentExecutions: options.maxConcurrentExecutions || 10,
      defaultTimeout: options.defaultTimeout || 30000,
      enableBreakpoints: options.enableBreakpoints || false,
      persistExecution: options.persistExecution || false,
    };
  }

  /**
   * 注册步骤处理器
   */
  registerHandler(name: string, handler: Function): void {
    this.handlerRegistry.register(name, async (input, context) => {
      return await handler(input, context);
    });
  }

  /**
   * 执行工作流
   */
  async execute(
    workflowDefinition: WorkflowDefinition | Partial<WorkflowDefinition>,
    initialData: Record<string, any> = {},
    options: { breakpoints?: string[] } = {}
  ): Promise<{
    executionId: string;
    status: string;
    result: Record<string, any>;
    context: ExecutionContextData;
  }> {
    // 创建完整的工作流定义
    const workflow =
      "id" in workflowDefinition
        ? (workflowDefinition as WorkflowDefinition)
        : WorkflowDSL.createWorkflow(workflowDefinition);

    // 创建执行上下文
    const context = new ExecutionContext(workflow.id, initialData);

    // 应用全局配置
    Object.assign(context.globalContext, workflow.global?.context || {});

    // 设置断点
    if (options.breakpoints) {
      options.breakpoints.forEach(bp => context.breakpoints.add(bp));
    }

    // 存储执行上下文
    this.executionStore.set(context.executionId, context);

    try {
      // 发送开始事件
      this.emitEvent("workflow.started", { context, workflow });

      // 构建依赖图
      const graph = this.buildDependencyGraph(workflow.steps);

      // 执行工作流
      const result = await this.executeWorkflow(workflow, context, graph);

      // 标记为完成
      context.status = "completed";
      context.endTime = Date.now();

      // 发送完成事件
      this.emitEvent("workflow.completed", { context, workflow, result });

      return {
        executionId: context.executionId,
        status: context.status,
        result,
        context: context.serialize(),
      };
    } catch (error) {
      // 处理错误
      context.status = "failed";
      context.endTime = Date.now();
      context.errors.push({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now(),
      });

      // 发送失败事件
      this.emitEvent("workflow.failed", { context, workflow, error });

      throw error;
    }
  }

  /**
   * 从断点继续执行
   */
  async resume(
    executionId: string
  ): Promise<{ status: string; executionId: string }> {
    const context = this.executionStore.get(executionId);

    if (!context) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (context.status !== "paused") {
      throw new Error(`Execution is not paused: ${executionId}`);
    }

    context.status = "running";
    context.isPaused = false;

    this.emitEvent("workflow.resumed", { context });

    return { status: "resumed", executionId };
  }

  /**
   * 暂停执行
   */
  async pause(
    executionId: string
  ): Promise<{ status: string; executionId: string }> {
    const context = this.executionStore.get(executionId);

    if (!context) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    context.status = "paused";
    context.isPaused = true;

    this.emitEvent("workflow.paused", { context });

    return { status: "paused", executionId };
  }

  /**
   * 取消执行
   */
  async cancel(
    executionId: string
  ): Promise<{ status: string; executionId: string }> {
    const context = this.executionStore.get(executionId);

    if (!context) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    context.status = "cancelled";

    this.emitEvent("workflow.cancelled", { context });

    return { status: "cancelled", executionId };
  }

  /**
   * 获取执行状态
   */
  getExecutionStatus(executionId: string): Record<string, any> | null {
    const context = this.executionStore.get(executionId);

    if (!context) {
      return null;
    }

    return {
      executionId: context.executionId,
      status: context.status,
      startTime: context.startTime,
      endTime: context.endTime,
      currentStep: context.currentStep,
      completedSteps: Array.from(context.completedSteps),
      failedSteps: Array.from(context.failedSteps),
      errors: context.errors,
    };
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(steps: StepConfig[]): Map<
    string,
    {
      step: StepConfig;
      dependencies: string[];
      dependents: string[];
    }
  > {
    const graph = new Map();

    // 建立步骤映射
    for (const step of steps) {
      graph.set(step.id, {
        step,
        dependencies: step.dependsOn || [],
        dependents: [],
      });
    }

    // 建立依赖关系
    for (const [stepId, node] of graph.entries()) {
      for (const depId of node.dependencies) {
        const depNode = graph.get(depId);
        if (depNode) {
          depNode.dependents.push(stepId);
        }
      }
    }

    return graph;
  }

  /**
   * 执行工作流
   */
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    context: ExecutionContext,
    dependencyGraph: Map<
      string,
      { step: StepConfig; dependencies: string[]; dependents: string[] }
    >
  ): Promise<Record<string, any>> {
    const executionQueue: StepConfig[] = [];
    const executing = new Set<string>();
    const completed = new Set<string>();
    const results: Record<string, any> = {};

    // 找到入口步骤（没有依赖的步骤）
    const entrySteps = Array.from(dependencyGraph.values())
      .filter(node => node.dependencies.length === 0)
      .map(node => node.step);

    // 添加入口步骤到队列
    for (const step of entrySteps) {
      executionQueue.push(step);
    }

    while (executionQueue.length > 0 || executing.size > 0) {
      // 检查是否暂停
      if (context.isPaused) {
        break;
      }

      // 找出可以执行的步骤
      const readySteps = executionQueue.filter(
        step =>
          !executing.has(step.id) &&
          (step.dependsOn || []).every(depId => completed.has(depId))
      );

      if (readySteps.length === 0 && executing.size === 0) {
        break; // 没有可执行的步骤，退出循环
      }

      // 并行执行准备好的步骤
      const execPromises = readySteps.map(async step => {
        executing.add(step.id);

        try {
          // 执行步骤
          const result = await this.executeStep(step, context, workflow);

          // 记录结果
          results[step.id] = result;
          context.setStepResult(step.id, result);
          context.completedSteps.add(step.id);
          completed.add(step.id);

          // 添加依赖此步骤的步骤到队列
          const dependentSteps = Array.from(dependencyGraph.values())
            .filter(node => node.dependencies.includes(step.id))
            .map(node => node.step)
            .filter(s => !executionQueue.includes(s) && !executing.has(s.id));

          executionQueue.push(...dependentSteps);
        } catch (error) {
          // 记录失败
          context.failedSteps.add(step.id);
          context.errors.push({
            stepId: step.id,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now(),
          });

          // 检查错误处理策略
          if (step.onError === "throw") {
            throw error;
          }
        } finally {
          executing.delete(step.id);
        }
      });

      // 从队列中移除已处理的步骤
      for (const step of readySteps) {
        const index = executionQueue.findIndex(s => s.id === step.id);
        if (index > -1) {
          executionQueue.splice(index, 1);
        }
      }

      // 等待至少一个步骤完成
      if (execPromises.length > 0) {
        await Promise.race(execPromises);
      }
    }

    return results;
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: StepConfig,
    context: ExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<any> {
    // 更新当前步骤
    context.currentStep = step.id;

    // 发送步骤开始事件
    this.emitEvent("step.started", { step, context });

    // 检查条件
    if (
      step.condition &&
      !ConditionEvaluator.evaluate(step.condition, context)
    ) {
      context.skippedSteps.add(step.id);
      this.emitEvent("step.skipped", { step, context, reason: "condition" });
      return null;
    }

    // 检查断点
    if (context.breakpoints.has(step.id)) {
      context.isPaused = true;
      context.status = "paused";
      this.emitEvent("step.breakpoint", { step, context });
      return null;
    }

    // 准备输入数据
    const inputData = DataMapper.mapInput(
      context.initialData,
      step.inputMapping || {},
      context
    );

    // 重试逻辑
    const maxRetries = step.retry?.maxRetries || 0;
    const retryDelay = step.retry?.delay || 1000;

    let lastError: unknown = null;

    // 执行步骤（包含重试逻辑）
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 设置超时
        const timeout =
          step.timeout ||
          workflow.global?.timeout ||
          this.config.defaultTimeout;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error(`Step timeout: ${step.id}`)),
            timeout
          );
        });

        // 执行处理器
        const handlerPromise = this.handlerRegistry.executeHandler(
          step.handler,
          inputData,
          context
        );

        // 等待执行结果或超时
        const result = await Promise.race([handlerPromise, timeoutPromise]);

        // 处理输出映射
        const mappedResult = DataMapper.mapOutput(
          result,
          step.outputMapping || {},
          context
        );

        // 发送步骤完成事件
        this.emitEvent("step.completed", {
          step,
          context,
          result: mappedResult,
        });

        return mappedResult;
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // 记录重试日志
          this.emitEvent("step.retry", {
            step,
            context,
            error,
            attempt: attempt + 1,
            maxRetries,
          });

          // 等待重试间隔
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // 如果所有重试都失败，抛出最后一个错误
    this.emitEvent("step.failed", { step, context, error: lastError });
    throw lastError;
  }

  /**
   * 发送事件
   */
  private emitEvent(eventName: string, data: EventData): void {
    this.eventEmitter.emit(eventName, { detail: data });
  }

  /**
   * 添加事件监听器
   */
  on(eventName: string, handler: (event: any) => void): void {
    this.eventEmitter.on(eventName, handler);
  }

  /**
   * 移除事件监听器
   */
  off(eventName: string, handler: (event: any) => void): void {
    this.eventEmitter.off(eventName, handler);
  }

  /**
   * 获取所有可用的处理器元数据
   * @returns 所有注册的处理器元数据列表
   */
  getAvailableHandlers(): HandlerMetadata[] {
    return this.handlerRegistry.getAllMetadata();
  }

  /**
   * 获取特定处理器的元数据
   * @param handlerName 处理器名称
   * @returns 处理器元数据，如果不存在返回undefined
   */
  getHandlerMetadata(handlerName: string): HandlerMetadata | undefined {
    return this.handlerRegistry.getMetadata(handlerName);
  }

  /**
   * 获取工作流步骤的详细信息（包括输入输出Schema）
   * @param workflowDefinition 工作流定义
   * @returns 工作流步骤的详细信息
   */
  getWorkflowStepsInfo(workflowDefinition: WorkflowDefinition): Array<{
    id: string;
    name: string;
    type: string;
    handler: string;
    inputSchema: any;
    outputSchema: any;
    description?: string;
    handlerMetadata?: HandlerMetadata;
  }> {
    return workflowDefinition.steps.map(step => {
      const handlerMetadata = this.handlerRegistry.getMetadata(step.handler);

      return {
        id: step.id,
        name: step.name,
        type: step.type,
        handler: step.handler,
        inputSchema: step.input ||
          handlerMetadata?.inputSchema || { type: "object", properties: {} },
        outputSchema: step.output ||
          handlerMetadata?.outputSchema || { type: "object", properties: {} },
        description: step.metadata?.description,
        handlerMetadata,
      };
    });
  }
}
