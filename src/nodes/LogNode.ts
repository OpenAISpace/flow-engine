import { ExecutionContextRuntime } from "../types/index.js";
import { BaseNode, NodeHandler, NodeMetadata } from "./BaseNode.js";

/**
 * 日志节点
 * 用于记录日志信息
 */
export class LogNode extends BaseNode {
  readonly name: string = "log";

  readonly handler: NodeHandler = async (
    input: Record<string, any>
  ): Promise<any> => {
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
  };

  readonly metadata: NodeMetadata = {
    name: this.name,
    description: "记录日志信息",
    category: "工具",
    displayName: "日志",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "日志消息" },
        level: {
          type: "string",
          enum: ["info", "warn", "error", "debug"],
          default: "info",
          description: "日志级别",
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
  };
}
