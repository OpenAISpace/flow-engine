import {
  ConditionExpression,
  ConditionObject,
  ExecutionContextRuntime,
} from "../types/index.js";
import { DataMapper } from "./DataMapper.js";

/**
 * 条件计算器
 */
export class ConditionEvaluator {
  static evaluate(
    condition: ConditionExpression | undefined,
    context: ExecutionContextRuntime
  ): boolean {
    if (!condition) return true;

    if (typeof condition === "string") {
      return this.evaluateExpression(condition, context);
    } else if (typeof condition === "object") {
      return this.evaluateConditionObject(condition, context);
    }

    return Boolean(condition);
  }

  static evaluateExpression(
    expr: string,
    context: ExecutionContextRuntime
  ): boolean {
    const scope = {
      context: context.globalContext,
      variables: Object.fromEntries(context.variables),
      stepResults: DataMapper.mapToObject(context.stepResults),
    };

    try {
      return this.safeEval(expr, scope);
    } catch (error) {
      console.warn("Condition evaluation failed:", error);
      return false;
    }
  }

  static evaluateConditionObject(
    condition: ConditionObject,
    context: ExecutionContextRuntime
  ): boolean {
    const { operator, left, right, conditions } = condition;

    switch (operator) {
      case "and":
        return conditions?.every(c => this.evaluate(c, context)) ?? false;
      case "or":
        return conditions?.some(c => this.evaluate(c, context)) ?? false;
      case "not":
        return !this.evaluate(conditions?.[0], context);
      case "eq":
        return this.getValue(left, context) === this.getValue(right, context);
      case "ne":
        return this.getValue(left, context) !== this.getValue(right, context);
      case "gt":
        return this.getValue(left, context) > this.getValue(right, context);
      case "gte":
        return this.getValue(left, context) >= this.getValue(right, context);
      case "lt":
        return this.getValue(left, context) < this.getValue(right, context);
      case "lte":
        return this.getValue(left, context) <= this.getValue(right, context);
      case "contains":
        return String(this.getValue(left, context)).includes(
          String(this.getValue(right, context))
        );
      case "in": {
        const rightValue = this.getValue(right, context);
        return (
          Array.isArray(rightValue) &&
          rightValue.includes(this.getValue(left, context))
        );
      }
      default:
        console.warn(`未知的条件操作符: ${operator}`);
        return false;
    }
  }

  static getValue(value: any, context: ExecutionContextRuntime): any {
    if (typeof value === "string" && value.startsWith("$")) {
      return DataMapper.evaluateExpression(value, {
        context: context.globalContext,
        variables: Object.fromEntries(context.variables),
        stepResults: DataMapper.mapToObject(context.stepResults),
      });
    }
    return value;
  }

  static safeEval(expr: string, scope: Record<string, any>): boolean {
    // 简化版安全计算器
    const cleanExpr = expr.replace(/\$(\w+\.?\w*)/g, (match, path) => {
      return JSON.stringify(DataMapper.getNestedValue(scope, path));
    });

    // 这里应该使用更安全的表达式引擎，如expr-eval
    // 在生产环境中应该替换为更安全的实现
    // 以下实现仅用于演示
    try {
      // eslint-disable-next-line no-new-func
      return new Function("scope", `return Boolean(${cleanExpr})`)(scope);
    } catch (error) {
      console.error(
        `在 safeEval 中执行表达式 "${expr}" (清理后为 "${cleanExpr}") 时出错:`,
        error
      );
      return false;
    }
  }
}
