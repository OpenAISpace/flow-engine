import { ExecutionContextRuntime, SchemaDefinition } from "../types/index.js";

/**
 * 处理器元数据接口
 */
export interface HandlerMetadata {
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
    // HTTP请求处理器
    this.register(
      "http",
      async (input, context) => {
        const { url, method = "GET", headers = {}, body } = input;

        try {
          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", ...headers },
            body: body ? JSON.stringify(body) : undefined,
          });

          return await response.json();
        } catch (error) {
          throw new Error(`HTTP request failed: ${(error as Error).message}`);
        }
      },
      {
        description: "Makes HTTP requests to external APIs",
        category: "Network",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              format: "uri",
              description: "Target URL for the request",
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
              default: "GET",
            },
            headers: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            body: {
              type: "object",
              description: "Request body (for POST, PUT, PATCH)",
            },
          },
          required: ["url"],
        },
        outputSchema: {
          type: "object",
          description: "Response from the HTTP request",
        },
        examples: [
          {
            name: "获取用户数据",
            input: {
              url: "https://api.example.com/users/1",
              method: "GET",
            },
          },
        ],
      }
    );

    // 延迟处理器
    this.register(
      "delay",
      async input => {
        const { duration = 1000 } = input;
        await new Promise(resolve => setTimeout(resolve, duration));
        return { delayed: true, duration };
      },
      {
        description: "延迟执行指定的毫秒数",
        category: "工具",
        inputSchema: {
          type: "object",
          properties: {
            duration: {
              type: "number",
              description: "延迟时间（毫秒）",
              default: 1000,
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            delayed: { type: "boolean" },
            duration: { type: "number" },
          },
        },
      }
    );

    // 日志处理器
    this.register(
      "log",
      async input => {
        const { message, level = "info", data } = input;

        switch (level) {
          case "error":
            console.error(message, data);
            break;
          case "warn":
            console.warn(message, data);
            break;
          case "debug":
            console.debug(message, data);
            break;
          case "info":
          default:
            console.info(message, data);
        }

        return { logged: true, timestamp: Date.now() };
      },
      {
        description: "记录日志信息",
        category: "工具",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string", description: "日志消息" },
            level: {
              type: "string",
              enum: ["info", "warn", "error", "debug"],
              default: "info",
            },
            data: { type: "object", description: "附加数据" },
          },
          required: ["message"],
        },
        outputSchema: {
          type: "object",
          properties: {
            logged: { type: "boolean" },
            timestamp: { type: "number" },
          },
        },
      }
    );

    // 空操作处理器
    this.register(
      "noop",
      async () => {
        return { executed: true };
      },
      {
        description: "不执行任何操作的处理器",
        category: "工具",
        inputSchema: { type: "object" },
        outputSchema: {
          type: "object",
          properties: {
            executed: { type: "boolean" },
          },
        },
      }
    );
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
