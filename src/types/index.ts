import { EventEmitter } from "events";

/**
 * 工作流定义接口
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  version?: string;
  description?: string;
  global?: {
    timeout?: number;
    retryPolicy?: RetryPolicy;
    context?: Record<string, any>;
    variables?: Record<string, any>;
  };
  input?: SchemaDefinition;
  output?: SchemaDefinition;
  steps: StepConfig[];
  dependencies?: Dependency[];
  conditions?: ConditionRule[];
  errorHandlers?: ErrorHandler[];
  metadata?: Record<string, any>;
}

/**
 * 重试策略接口
 */
export interface RetryPolicy {
  maxRetries: number;
  delay: number;
  backoffRate?: number;
  maxDelay?: number;
}

/**
 * Schema定义接口
 */
export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

export interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  [key: string]: any;
}

/**
 * 步骤配置接口
 */
export interface StepConfig {
  id: string;
  name: string;
  type: "task" | "condition" | "parallel" | "loop" | "custom";
  handler: string;
  input?: SchemaDefinition;
  output?: SchemaDefinition;
  inputMapping?: Record<string, any>;
  retry?: RetryPolicy;
  timeout?: number;
  condition?: ConditionExpression;
  dependsOn?: string[];
  parallel?: boolean;
  loop?: LoopConfig;
  onError?: "throw" | "continue" | "retry";
  metadata?: Record<string, any>;
}

/**
 * 循环配置接口
 */
export interface LoopConfig {
  items: string | any[];
  itemVariable?: string;
  condition?: ConditionExpression;
  maxIterations?: number;
}

/**
 * 依赖关系接口
 */
export interface Dependency {
  from: string;
  to: string;
  type?: string;
}

/**
 * 条件表达式类型
 */
export type ConditionExpression = string | ConditionObject;

/**
 * 条件对象接口
 */
export interface ConditionObject {
  operator:
    | "and"
    | "or"
    | "not"
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "in";
  left?: any;
  right?: any;
  conditions?: ConditionExpression[];
}

/**
 * 条件规则接口
 */
export interface ConditionRule {
  id: string;
  condition: ConditionExpression;
  trueStep?: string;
  falseStep?: string;
}

/**
 * 错误处理接口
 */
export interface ErrorHandler {
  stepId: string;
  action: "retry" | "continue" | "abort" | "compensate";
  maxRetries?: number;
  compensationStep?: string;
}

/**
 * 步骤结果接口
 */
export interface StepResult {
  result: any;
  timestamp: number;
  executionTime: number;
}

/**
 * 执行错误接口
 */
export interface ExecutionError {
  stepId?: string;
  message: string;
  stack?: string;
  timestamp: number;
}

/**
 * 历史记录接口
 */
export interface HistoryRecord {
  type: string;
  stepId?: string;
  data?: any;
  timestamp: number;
}

/**
 * 执行上下文接口 - 序列化格式
 */
export interface ExecutionContextData {
  workflowId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "paused" | "cancelled";
  globalContext: Record<string, any>;
  stepResults: Record<string, StepResult>;
  variables: Record<string, any>;
  initialData: Record<string, any>;
  currentStep: string | null;
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];
  errors: ExecutionError[];
  executionHistory: HistoryRecord[];
  breakpoints: string[];
  isPaused: boolean;
}

/**
 * 执行上下文接口 - 运行时格式
 */
export interface ExecutionContextRuntime {
  workflowId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "paused" | "cancelled";
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

  // 方法
  generateExecutionId(): string;
  setStepResult(stepId: string, result: any): void;
  getStepResult(stepId: string): StepResult | undefined;
  addHistoryRecord(record: Omit<HistoryRecord, "timestamp">): void;
  serialize(): ExecutionContextData;
}

/**
 * 事件数据接口
 */
export interface EventData {
  context: ExecutionContextRuntime;
  workflow?: WorkflowDefinition;
  step?: StepConfig;
  error?: unknown;
  result?: any;
  [key: string]: any;
}

/**
 * 工作流引擎选项接口
 */
export interface WorkflowEngineOptions {
  executionStore?: Map<string, ExecutionContextRuntime>;
  eventEmitter?: EventEmitter;
  maxConcurrentExecutions?: number;
  defaultTimeout?: number;
  enableBreakpoints?: boolean;
  persistExecution?: boolean;
}
