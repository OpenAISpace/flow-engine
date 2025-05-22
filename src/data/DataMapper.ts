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

  static evaluateExpression(expression: any, scope: Record<string, any>): any {
    if (typeof expression === "string") {
      if (expression.startsWith("$")) {
        return this.evaluateJSONPath(expression, scope);
      } else {
        return expression;
      }
    } else if (typeof expression === "object" && expression !== null) {
      return this.evaluateComplexExpression(expression, scope);
    }

    return expression;
  }

  static evaluateJSONPath(path: string, scope: Record<string, any>): any {
    const cleanPath = path.substring(1); // 去掉开头的$
    const value = this.getNestedValue(scope, cleanPath);
    if (value === undefined) {
      console.warn(`在作用域中未找到路径: ${path}`);
    }
    return value;
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
        if (evaluatedArgs[0] === undefined || evaluatedArgs[0] === null) {
          //允许length作用于undefined或null，返回0
          return 0;
        }
        if (
          typeof evaluatedArgs[0] !== "string" &&
          !Array.isArray(evaluatedArgs[0])
        ) {
          console.warn(
            `函数 "length" 的参数必须是字符串或数组，但收到: ${typeof evaluatedArgs[0]}`
          );
          return 0;
        }
        return evaluatedArgs[0]?.length || 0;
      case "upper":
        if (typeof evaluatedArgs[0] !== "string") {
          console.warn(
            `函数 "upper" 的参数必须是字符串，但收到: ${typeof evaluatedArgs[0]}`
          );
          return String(evaluatedArgs[0]); // 尝试转换为字符串
        }
        return String(evaluatedArgs[0]).toUpperCase();
      case "lower":
        if (typeof evaluatedArgs[0] !== "string") {
          console.warn(
            `函数 "lower" 的参数必须是字符串，但收到: ${typeof evaluatedArgs[0]}`
          );
          return String(evaluatedArgs[0]); // 尝试转换为字符串
        }
        return String(evaluatedArgs[0]).toLowerCase();
      case "sum":
        // 修复sum函数逻辑
        if (Array.isArray(evaluatedArgs[0])) {
          // 如果第一个参数是数组，计算数组中所有数字的和
          return evaluatedArgs[0].reduce((sum, val) => {
            const num = Number(val);
            if (isNaN(num)) {
              console.warn(`函数 "sum" 在累加时遇到非数字值: ${val}`);
              return sum;
            }
            return sum + num;
          }, 0);
        } else {
          // 如果不是数组而是提供了多个参数，计算所有参数的和
          return evaluatedArgs.reduce((sum, val) => {
            const num = Number(val);
            if (isNaN(num)) {
              console.warn(`函数 "sum" 在累加时遇到非数字值: ${val}`);
              return sum;
            }
            return sum + num;
          }, 0);
        }
      default:
        throw new Error(`未知函数: ${funcName}`);
    }
  }

  static getNestedValue(obj: Record<string, any>, path: string): any {
    // 使用路径获取嵌套值，保留原始类型
    const result = path.split(".").reduce((current, key) => {
      // 检查当前对象是否存在且是对象类型
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        return undefined;
      }

      // 保持原始类型（数字、布尔值等），不要进行类型转换
      return current[key];
    }, obj);

    // 记录嵌套值的类型，帮助调试
    if (result !== undefined) {
      console.log(
        `DataMapper: 获取路径 ${path} 的值 ${result}，类型为 ${typeof result}`
      );
    }

    return result;
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
