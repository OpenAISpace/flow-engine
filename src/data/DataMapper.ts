import { ExecutionContextRuntime } from "../types/index.js";

/**
 * 数据映射器
 */
export class DataMapper {
  static mapInput(
    data: Record<string, any>,
    mapping: Record<string, any>,
    context: ExecutionContextRuntime
  ): Record<string, any> {
    if (!mapping || Object.keys(mapping).length === 0) {
      return data;
    }

    const result: Record<string, any> = {};

    for (const [targetKey, sourceExpression] of Object.entries(mapping)) {
      result[targetKey] = this.evaluateExpression(sourceExpression, {
        input: data,
        context: context.globalContext,
        variables: Object.fromEntries(context.variables),
        stepResults: this.mapToObject(context.stepResults),
      });
    }

    return result;
  }

  static mapOutput(
    data: Record<string, any>,
    mapping: Record<string, any>,
    context: ExecutionContextRuntime
  ): Record<string, any> {
    if (!mapping || Object.keys(mapping).length === 0) {
      return data;
    }

    const result: Record<string, any> = {};

    for (const [targetKey, sourceExpression] of Object.entries(mapping)) {
      result[targetKey] = this.evaluateExpression(sourceExpression, {
        output: data,
        context: context.globalContext,
        variables: Object.fromEntries(context.variables),
        stepResults: this.mapToObject(context.stepResults),
      });
    }

    return result;
  }

  static evaluateExpression(expression: any, scope: Record<string, any>): any {
    if (typeof expression === "string") {
      if (expression.startsWith("$")) {
        return this.evaluateJSONPath(expression, scope);
      } else {
        return this.evaluatePropertyPath(expression, scope);
      }
    } else if (typeof expression === "object" && expression !== null) {
      return this.evaluateComplexExpression(expression, scope);
    }

    return expression;
  }

  static evaluateJSONPath(path: string, scope: Record<string, any>): any {
    const cleanPath = path.substring(1);
    return this.getNestedValue(scope, cleanPath);
  }

  static evaluatePropertyPath(path: string, scope: Record<string, any>): any {
    return this.getNestedValue(scope, path);
  }

  static evaluateComplexExpression(
    expr: Record<string, any>,
    scope: Record<string, any>
  ): any {
    if (expr.type === "concat") {
      return expr.values
        .map((v: any) => this.evaluateExpression(v, scope))
        .join(expr.separator || "");
    } else if (expr.type === "template") {
      return this.evaluateTemplate(expr.template, scope);
    } else if (expr.type === "function") {
      return this.evaluateFunction(expr.name, expr.args, scope);
    }

    return expr;
  }

  static evaluateTemplate(
    template: string,
    scope: Record<string, any>
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(scope, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  static evaluateFunction(
    funcName: string,
    args: any[],
    scope: Record<string, any>
  ): any {
    const evaluatedArgs = args.map(arg => this.evaluateExpression(arg, scope));

    switch (funcName) {
      case "now":
        return Date.now();
      case "uuid":
        return this.generateUUID();
      case "length":
        return evaluatedArgs[0]?.length || 0;
      case "upper":
        return String(evaluatedArgs[0]).toUpperCase();
      case "lower":
        return String(evaluatedArgs[0]).toLowerCase();
      case "sum":
        return evaluatedArgs.reduce((sum, val) => sum + (Number(val) || 0), 0);
      default:
        throw new Error(`Unknown function: ${funcName}`);
    }
  }

  static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : undefined;
    }, obj);
  }

  static mapToObject<T>(map: Map<string, T>): Record<string, T> {
    const obj: Record<string, T> = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
