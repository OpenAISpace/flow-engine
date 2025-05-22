import {
  StepConfig,
  SchemaDefinition,
  RetryPolicy,
  ConditionExpression,
  LoopConfig,
} from "../types/index.js";

/**
 * 步骤定义类
 */
export class StepDefinition implements StepConfig {
  id: string;
  name: string;
  type: "task" | "condition" | "parallel" | "loop" | "custom";
  handler: string;
  input?: SchemaDefinition;
  output?: SchemaDefinition;
  inputMapping: Record<string, any>;
  retry: RetryPolicy;
  timeout: number;
  condition?: ConditionExpression;
  dependsOn: string[];
  parallel: boolean;
  loop?: LoopConfig;
  onError: "throw" | "continue" | "retry";
  metadata: Record<string, any>;

  constructor(config: StepConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type; // 'task', 'condition', 'parallel', 'loop', 'custom'
    this.handler = config.handler;

    // Schema定义
    this.input = config.input || { type: "object" };
    this.output = config.output || { type: "object" };

    // 映射配置
    this.inputMapping = config.inputMapping || {};

    // 重试配置
    this.retry = config.retry || { maxRetries: 0, delay: 1000 };

    // 超时配置
    this.timeout = config.timeout || 10000;

    // 条件执行
    this.condition = config.condition;

    // 依赖步骤
    this.dependsOn = config.dependsOn || [];

    // 并行执行配置
    this.parallel = config.parallel || false;

    // 循环配置
    this.loop = config.loop;

    // 错误处理
    this.onError = config.onError || "throw";

    // 元数据
    this.metadata = config.metadata || {};
  }
}
