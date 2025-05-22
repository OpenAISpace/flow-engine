import { ExecutionContextRuntime } from "../types/index.js";
import { BaseNode, NodeHandler, NodeMetadata } from "./BaseNode.js";

/**
 * HTTP请求节点
 * 用于发送HTTP请求并获取响应
 */
export class HttpNode extends BaseNode {
  readonly name: string = "http";

  readonly handler: NodeHandler = async (
    input: Record<string, any>,
    context: ExecutionContextRuntime
  ): Promise<any> => {
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
  };

  readonly metadata: NodeMetadata = {
    name: this.name,
    description: "发送HTTP请求到外部API",
    category: "网络",
    displayName: "HTTP请求",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          description: "请求的目标URL",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          default: "GET",
          description: "HTTP请求方法",
        },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "HTTP请求头",
        },
        body: {
          type: "object",
          description: "请求体（用于POST, PUT, PATCH等方法）",
        },
      },
      required: ["url"],
    },
    outputSchema: {
      type: "object",
      description: "HTTP请求的响应数据",
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
  };
}
