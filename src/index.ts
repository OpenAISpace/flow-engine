// 核心组件导出
export { WorkflowDSL } from "./core/WorkflowDSL.js";
export { StepDefinition } from "./core/StepDefinition.js";
export { ExecutionContext } from "./core/ExecutionContext.js";
export { WorkflowEngine } from "./core/WorkflowEngine.js";
export { WorkflowBuilder } from "./core/WorkflowBuilder.js";
export {
  StepHandlerRegistry,
  type StepHandler,
  type HandlerMetadata,
} from "./core/StepHandlerRegistry.js";

// 数据处理组件导出
export { DataMapper } from "./data/DataMapper.js";
export { ConditionEvaluator } from "./data/ConditionEvaluator.js";

// 节点组件导出
export {
  BaseNode,
  HttpNode,
  TypeConvertNode,
  DelayNode,
  LogNode,
  NoopNode,
  getBuiltinNodes,
  type NodeHandler,
  type NodeMetadata,
} from "./nodes/index.js";

// 工具类导出
export {
  SchemaValidator,
  type ValidationResult,
} from "./utils/SchemaValidator.js";
export { TypeConverter, type ConversionResult } from "./utils/TypeConverter.js";

// 类型定义导出
export * from "./types/index.js";

// 导出默认配置
export const DEFAULT_CONFIG = {
  maxConcurrentExecutions: 10,
  defaultTimeout: 30000,
  enableBreakpoints: false,
  persistExecution: false,
};
