import { ExecutionContextRuntime, SchemaDefinition } from "../types/index.js";

/**
 * 节点处理器接口
 */
export type NodeHandler = (
  input: Record<string, any>,
  context: ExecutionContextRuntime
) => Promise<any>;

/**
 * 节点元数据接口
 */
export interface NodeMetadata {
  name: string;
  description?: string;
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
  category?: string;
  icon?: string;
  displayName?: string;
  examples?: Array<{
    name: string;
    input: Record<string, any>;
    output?: Record<string, any>;
  }>;
}

/**
 * 基础节点类
 * 所有具体的节点类都应该继承这个类
 */
export abstract class BaseNode {
  abstract readonly name: string;
  abstract readonly handler: NodeHandler;
  abstract readonly metadata: NodeMetadata;

  /**
   * 执行节点处理器
   */
  async execute(
    input: Record<string, any>,
    context: ExecutionContextRuntime
  ): Promise<any> {
    return this.handler(input, context);
  }

  /**
   * 获取节点元数据
   */
  getMetadata(): NodeMetadata {
    return this.metadata;
  }
}
