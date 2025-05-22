export { BaseNode, type NodeHandler, type NodeMetadata } from "./BaseNode.js";
export { HttpNode } from "./HttpNode.js";
export { TypeConvertNode } from "./TypeConvertNode.js";
export { DelayNode } from "./DelayNode.js";
export { LogNode } from "./LogNode.js";
export { NoopNode } from "./NoopNode.js";

/**
 * 获取所有内置节点实例
 * @returns 内置节点实例数组
 */
import { HttpNode } from "./HttpNode.js";
import { TypeConvertNode } from "./TypeConvertNode.js";
import { DelayNode } from "./DelayNode.js";
import { LogNode } from "./LogNode.js";
import { NoopNode } from "./NoopNode.js";
import { BaseNode } from "./BaseNode.js";

export function getBuiltinNodes(): BaseNode[] {
  return [
    new HttpNode(),
    new TypeConvertNode(),
    new DelayNode(),
    new LogNode(),
    new NoopNode(),
  ];
}
