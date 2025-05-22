import { ExecutionContextRuntime } from "../types/index.js";
import { BaseNode, NodeHandler, NodeMetadata } from "./BaseNode.js";

/**
 * 空操作节点
 * 不执行任何操作，仅返回执行状态
 */
export class NoopNode extends BaseNode {
  readonly name: string = "noop";

  readonly handler: NodeHandler = async (): Promise<any> => {
    return { executed: true };
  };

  readonly metadata: NodeMetadata = {
    name: this.name,
    description: "不执行任何操作的处理器",
    category: "工具",
    displayName: "空操作",
    inputSchema: { type: "object" },
    outputSchema: {
      type: "object",
      properties: {
        executed: { type: "boolean" },
      },
    },
  };
}
