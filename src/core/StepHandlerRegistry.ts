import { ExecutionContextRuntime } from "../types/index.js";
import { getBuiltinNodes } from "../nodes/index.js";

/**
 * 处理器元数据接口
 */
export interface HandlerMetadata {
  name: string;
  description?: string;
  inputSchema: any;
  outputSchema: any;
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
 * 步骤处理器类型定义
 */
export type StepHandler = (
  input: Record<string, any>,
  context: ExecutionContextRuntime
) => Promise<any>;

/**
 * 步骤执行器注册表
 */
export class StepHandlerRegistry {
  private handlers: Map<string, StepHandler> = new Map();
  private metadata: Map<string, HandlerMetadata> = new Map();

  constructor() {
    this.registerBuiltinHandlers();
  }

  /**
   * 注册步骤处理器
   */
  register(
    name: string,
    handler: StepHandler,
    metadata?: Partial<HandlerMetadata>
  ): void {
    this.handlers.set(name, handler);

    // 注册元数据
    if (metadata) {
      this.registerMetadata(name, {
        name,
        description: metadata.description || `Handler for ${name}`,
        inputSchema: metadata.inputSchema || { type: "object", properties: {} },
        outputSchema: metadata.outputSchema || {
          type: "object",
          properties: {},
        },
        category: metadata.category,
        icon: metadata.icon,
        displayName: metadata.displayName || name,
        examples: metadata.examples || [],
      });
    }
  }

  /**
   * 注册处理器元数据
   */
  registerMetadata(name: string, metadata: HandlerMetadata): void {
    this.metadata.set(name, metadata);
  }

  /**
   * 获取处理器元数据
   */
  getMetadata(name: string): HandlerMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * 获取所有处理器元数据
   */
  getAllMetadata(): HandlerMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * 获取步骤处理器
   */
  get(name: string): StepHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * 检查处理器是否存在
   */
  has(name: string): boolean {
    return this.handlers.has(name);
  }

  /**
   * 注册内置处理器
   */
  private registerBuiltinHandlers(): void {
    // 获取所有内置节点
    const builtinNodes = getBuiltinNodes();

    // 注册每个节点的处理器和元数据
    for (const node of builtinNodes) {
      this.register(
        node.name,
        async (input, context) => await node.execute(input, context),
        node.metadata as HandlerMetadata
      );
    }
  }

  /**
   * 执行处理器
   */
  async executeHandler(
    handlerName: string,
    input: Record<string, any>,
    context: ExecutionContextRuntime
  ): Promise<any> {
    const handler = this.get(handlerName);

    if (!handler) {
      throw new Error(`Handler not found: ${handlerName}`);
    }

    return await handler(input, context);
  }
}
