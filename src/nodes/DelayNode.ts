import { ExecutionContextRuntime } from "../types/index.js";
import { BaseNode, NodeHandler, NodeMetadata } from "./BaseNode.js";

/**
 * 延迟节点
 * 用于暂停工作流执行一段时间
 */
export class DelayNode extends BaseNode {
  readonly name: string = "delay";

  readonly handler: NodeHandler = async (
    input: Record<string, any>
  ): Promise<any> => {
    const { duration = 1000 } = input;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { delayed: true, duration };
  };

  readonly metadata: NodeMetadata = {
    name: this.name,
    description: "延迟执行指定的毫秒数",
    category: "工具",
    displayName: "延迟",
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
  };
}
