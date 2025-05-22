import {
  ExecutionContextData,
  ExecutionContextRuntime,
  StepResult,
  ExecutionError,
  HistoryRecord,
} from '../types/index.js';

/**
 * 执行上下文类
 */
export class ExecutionContext implements ExecutionContextRuntime {
  workflowId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  globalContext: Record<string, any>;
  stepResults: Map<string, StepResult>;
  variables: Map<string, any>;
  initialData: Record<string, any>;
  currentStep: string | null;
  completedSteps: Set<string>;
  failedSteps: Set<string>;
  skippedSteps: Set<string>;
  errors: ExecutionError[];
  executionHistory: HistoryRecord[];
  breakpoints: Set<string>;
  isPaused: boolean;

  constructor(workflowId: string, initialData: Record<string, any> = {}) {
    this.workflowId = workflowId;
    this.executionId = this.generateExecutionId();
    this.startTime = Date.now();
    this.status = 'running';

    // 数据上下文
    this.globalContext = {};
    this.stepResults = new Map();
    this.variables = new Map();
    this.initialData = initialData;

    // 执行状态
    this.currentStep = null;
    this.completedSteps = new Set();
    this.failedSteps = new Set();
    this.skippedSteps = new Set();

    // 错误信息
    this.errors = [];

    // 执行历史
    this.executionHistory = [];

    // 断点信息
    this.breakpoints = new Set();
    this.isPaused = false;
  }

  generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  setStepResult(stepId: string, result: any): void {
    this.stepResults.set(stepId, {
      result,
      timestamp: Date.now(),
      executionTime: Date.now() - this.startTime,
    });
  }

  getStepResult(stepId: string): StepResult | undefined {
    return this.stepResults.get(stepId);
  }

  addHistoryRecord(record: Omit<HistoryRecord, 'timestamp'>): void {
    this.executionHistory.push({
      ...record,
      timestamp: Date.now(),
    });
  }

  serialize(): ExecutionContextData {
    return {
      workflowId: this.workflowId,
      executionId: this.executionId,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      globalContext: this.globalContext,
      stepResults: Object.fromEntries(this.stepResults),
      variables: Object.fromEntries(this.variables),
      initialData: this.initialData,
      currentStep: this.currentStep,
      completedSteps: Array.from(this.completedSteps),
      failedSteps: Array.from(this.failedSteps),
      skippedSteps: Array.from(this.skippedSteps),
      errors: this.errors,
      executionHistory: this.executionHistory,
      breakpoints: Array.from(this.breakpoints),
      isPaused: this.isPaused,
    };
  }

  static deserialize(data: ExecutionContextData): ExecutionContext {
    const context = new ExecutionContext(data.workflowId, data.initialData);

    context.executionId = data.executionId;
    context.startTime = data.startTime;
    context.endTime = data.endTime;
    context.status = data.status;
    context.globalContext = data.globalContext;
    context.initialData = data.initialData;
    context.currentStep = data.currentStep;
    context.errors = data.errors;
    context.executionHistory = data.executionHistory;
    context.isPaused = data.isPaused;

    // 恢复集合和映射
    context.stepResults = new Map(Object.entries(data.stepResults));
    context.variables = new Map(Object.entries(data.variables));
    context.completedSteps = new Set(data.completedSteps);
    context.failedSteps = new Set(data.failedSteps);
    context.skippedSteps = new Set(data.skippedSteps);
    context.breakpoints = new Set(data.breakpoints);

    return context;
  }
}
