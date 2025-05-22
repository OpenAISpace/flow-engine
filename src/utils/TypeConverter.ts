import { SchemaDefinition } from "../types/index.js";

/**
 * 类型转换结果接口
 */
export interface ConversionResult {
  success: boolean;
  value: any;
  errors: string[];
}

/**
 * 类型转换器
 */
export class TypeConverter {
  /**
   * 将数据转换为符合目标Schema的格式
   * @param value 要转换的数据
   * @param targetSchema 目标Schema
   * @returns 转换结果
   */
  static convert(value: any, targetSchema: SchemaDefinition): ConversionResult {
    const errors: string[] = [];
    let convertedValue = value;

    try {
      // 处理null值
      if (value === null) {
        if (
          Array.isArray(targetSchema.type) &&
          targetSchema.type.includes("null")
        ) {
          return { success: true, value: null, errors: [] };
        } else if (targetSchema.type === "null") {
          return { success: true, value: null, errors: [] };
        } else {
          errors.push(`无法将null转换为 ${targetSchema.type}`);
          return { success: false, value, errors };
        }
      }

      // 处理undefined值
      if (value === undefined) {
        if (targetSchema.default !== undefined) {
          return { success: true, value: targetSchema.default, errors: [] };
        } else {
          errors.push(`无法将undefined转换为 ${targetSchema.type}`);
          return { success: false, value, errors };
        }
      }

      // 根据目标类型进行转换
      const targetType = Array.isArray(targetSchema.type)
        ? targetSchema.type.filter(t => t !== "null")[0] || targetSchema.type[0]
        : targetSchema.type;

      switch (targetType) {
        case "string":
          convertedValue = this.convertToString(value, errors);
          break;
        case "number":
          convertedValue = this.convertToNumber(value, errors);
          break;
        case "integer":
          convertedValue = this.convertToInteger(value, errors);
          break;
        case "boolean":
          convertedValue = this.convertToBoolean(value, errors);
          break;
        case "array":
          convertedValue = this.convertToArray(value, targetSchema, errors);
          break;
        case "object":
          convertedValue = this.convertToObject(value, targetSchema, errors);
          break;
        case "date":
        case "datetime":
          convertedValue = this.convertToDate(value, errors);
          break;
        default:
          errors.push(`不支持转换到类型: ${targetType}`);
          return { success: false, value, errors };
      }

      // 如果有错误，则转换失败
      if (errors.length > 0) {
        return { success: false, value, errors };
      }

      return { success: true, value: convertedValue, errors: [] };
    } catch (error) {
      errors.push(
        `转换过程中出错: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { success: false, value, errors };
    }
  }

  /**
   * 转换为字符串
   */
  private static convertToString(value: any, errors: string[]): string {
    if (typeof value === "string") {
      return value;
    }

    if (value === null || value === undefined) {
      errors.push("无法将null或undefined转换为字符串");
      return "";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (e) {
        errors.push(
          `无法将对象转换为JSON字符串: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * 转换为数字
   */
  private static convertToNumber(value: any, errors: string[]): number {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const num = Number(value);
      if (!isNaN(num)) {
        return num;
      } else {
        errors.push(`无法将字符串 "${value}" 转换为数字`);
        return 0;
      }
    }

    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    errors.push(`无法将类型 ${typeof value} 转换为数字`);
    return 0;
  }

  /**
   * 转换为整数
   */
  private static convertToInteger(value: any, errors: string[]): number {
    const num = this.convertToNumber(value, errors);
    if (errors.length > 0) {
      return 0;
    }

    const int = Math.floor(num);
    if (int !== num) {
      errors.push(`数字 ${num} 被截断为整数 ${int}`);
    }

    return int;
  }

  /**
   * 转换为布尔值
   */
  private static convertToBoolean(value: any, errors: string[]): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const lowercased = value.toLowerCase().trim();
      if (["true", "yes", "1", "on"].includes(lowercased)) {
        return true;
      }
      if (["false", "no", "0", "off"].includes(lowercased)) {
        return false;
      }

      errors.push(`无法将字符串 "${value}" 转换为布尔值`);
      return false;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    errors.push(`无法将类型 ${typeof value} 转换为布尔值`);
    return false;
  }

  /**
   * 转换为数组
   */
  private static convertToArray(
    value: any,
    schema: SchemaDefinition,
    errors: string[]
  ): any[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // 尝试解析为逗号分隔的值
        return value.split(",").map(item => item.trim());
      }
    }

    // 如果不是数组，将其包装成数组
    return [value];
  }

  /**
   * 转换为对象
   */
  private static convertToObject(
    value: any,
    schema: SchemaDefinition,
    errors: string[]
  ): Record<string, any> {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return parsed;
        } else {
          errors.push(`解析的JSON不是对象: ${value}`);
          return {};
        }
      } catch (e) {
        errors.push(
          `无法将字符串解析为JSON对象: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
        return {};
      }
    }

    if (Array.isArray(value)) {
      // 尝试将数组转换为对象（如果数组元素是键值对）
      try {
        const obj: Record<string, any> = {};
        for (let i = 0; i < value.length; i += 2) {
          if (i + 1 < value.length) {
            const key = String(value[i]);
            obj[key] = value[i + 1];
          }
        }
        return obj;
      } catch (e) {
        errors.push(
          `无法将数组转换为对象: ${e instanceof Error ? e.message : String(e)}`
        );
        return {};
      }
    }

    errors.push(`无法将类型 ${typeof value} 转换为对象`);
    return {};
  }

  /**
   * 转换为日期
   */
  private static convertToDate(value: any, errors: string[]): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      } else {
        errors.push(`无法将字符串 "${value}" 解析为日期`);
        return new Date();
      }
    }

    if (typeof value === "number") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      } else {
        errors.push(`无法将数字 ${value} 转换为日期`);
        return new Date();
      }
    }

    errors.push(`无法将类型 ${typeof value} 转换为日期`);
    return new Date();
  }
}
