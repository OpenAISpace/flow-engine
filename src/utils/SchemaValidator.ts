import { SchemaDefinition } from "../types/index.js";

/**
 * Schema验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Schema验证器
 */
export class SchemaValidator {
  /**
   * 验证数据是否符合Schema
   * @param data 要验证的数据
   * @param schema Schema定义
   * @returns 验证结果
   */
  static validate(data: any, schema: SchemaDefinition): ValidationResult {
    const errors: string[] = [];

    try {
      // 基础类型验证
      if (!this.validateType(data, schema.type)) {
        errors.push(`类型不匹配: 期望 ${schema.type}，实际为 ${typeof data}`);
        // 如果类型不匹配，则不进行进一步验证
        return { valid: false, errors };
      }

      // 根据不同类型进行特定验证
      switch (this.getPrimaryType(schema.type)) {
        case "string":
          this.validateString(data, schema, errors);
          break;
        case "number":
        case "integer":
          this.validateNumber(data, schema, errors);
          break;
        case "boolean":
          // 布尔类型不需要额外验证
          break;
        case "array":
          this.validateArray(data, schema, errors);
          break;
        case "object":
          this.validateObject(data, schema, errors);
          break;
        case "date":
        case "datetime":
          this.validateDate(data, schema, errors);
          break;
      }

      // 验证枚举值
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push(
          `值 ${data} 不在允许的枚举值 [${schema.enum.join(", ")}] 中`
        );
      }
    } catch (error) {
      errors.push(
        `验证过程中出错: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取主要类型（如果是类型数组，返回第一个非null类型）
   */
  private static getPrimaryType(type: string | string[]): string {
    if (Array.isArray(type)) {
      // 过滤掉 "null"，返回第一个非null类型
      const nonNullTypes = type.filter(t => t !== "null");
      return nonNullTypes.length > 0 ? nonNullTypes[0] : type[0];
    }
    return type;
  }

  /**
   * 验证类型是否匹配
   */
  private static validateType(
    data: any,
    schemaType: string | string[]
  ): boolean {
    if (data === null) {
      // 检查是否允许null
      return Array.isArray(schemaType) && schemaType.includes("null");
    }

    const jsType = typeof data;

    // 处理数组类型
    if (
      Array.isArray(data) &&
      (schemaType === "array" ||
        (Array.isArray(schemaType) && schemaType.includes("array")))
    ) {
      return true;
    }

    // 处理日期类型
    if (
      (data instanceof Date ||
        (typeof data === "string" && !isNaN(Date.parse(data)))) &&
      (schemaType === "date" ||
        schemaType === "datetime" ||
        (Array.isArray(schemaType) &&
          (schemaType.includes("date") || schemaType.includes("datetime"))))
    ) {
      return true;
    }

    // 处理数字类型
    if (jsType === "number") {
      if (schemaType === "number" || schemaType === "integer") {
        if (schemaType === "integer" && !Number.isInteger(data)) {
          return false;
        }
        return true;
      }
      if (
        Array.isArray(schemaType) &&
        (schemaType.includes("number") || schemaType.includes("integer"))
      ) {
        if (schemaType.includes("integer") && !Number.isInteger(data)) {
          return schemaType.includes("number");
        }
        return true;
      }
    }

    // 处理其他基本类型
    if (Array.isArray(schemaType)) {
      return schemaType.some(type => this.matchType(jsType, type));
    }

    return this.matchType(jsType, schemaType);
  }

  /**
   * 匹配JavaScript类型和Schema类型
   */
  private static matchType(jsType: string, schemaType: string): boolean {
    switch (schemaType) {
      case "string":
        return jsType === "string";
      case "number":
        return jsType === "number";
      case "integer":
        return jsType === "number";
      case "boolean":
        return jsType === "boolean";
      case "object":
        return jsType === "object" && !Array.isArray(jsType);
      case "array":
        return Array.isArray(jsType);
      default:
        return false;
    }
  }

  /**
   * 验证字符串
   */
  private static validateString(
    value: string,
    schema: SchemaDefinition,
    errors: string[]
  ): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(
        `字符串长度 ${value.length} 小于最小长度 ${schema.minLength}`
      );
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(
        `字符串长度 ${value.length} 大于最大长度 ${schema.maxLength}`
      );
    }

    if (schema.pattern) {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(value)) {
          errors.push(`字符串不匹配模式 ${schema.pattern}`);
        }
      } catch (e) {
        errors.push(`无效的正则表达式模式: ${schema.pattern}`);
      }
    }

    if (schema.format) {
      // 这里可以添加对常见格式的验证，如email, date-time, uri等
      switch (schema.format) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`值不是有效的电子邮件格式`);
          }
          break;
        case "uri":
          try {
            new URL(value);
          } catch {
            errors.push(`值不是有效的URI格式`);
          }
          break;
        // 可以添加更多格式验证
      }
    }
  }

  /**
   * 验证数字
   */
  private static validateNumber(
    value: number,
    schema: SchemaDefinition,
    errors: string[]
  ): void {
    if (schema.type === "integer" && !Number.isInteger(value)) {
      errors.push(`值 ${value} 不是整数`);
    }

    if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
      errors.push(`值 ${value} 不是 ${schema.multipleOf} 的倍数`);
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`值 ${value} 大于最大值 ${schema.maximum}`);
    }

    if (
      schema.exclusiveMaximum !== undefined &&
      value >= schema.exclusiveMaximum
    ) {
      errors.push(
        `值 ${value} 大于或等于独占最大值 ${schema.exclusiveMaximum}`
      );
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`值 ${value} 小于最小值 ${schema.minimum}`);
    }

    if (
      schema.exclusiveMinimum !== undefined &&
      value <= schema.exclusiveMinimum
    ) {
      errors.push(
        `值 ${value} 小于或等于独占最小值 ${schema.exclusiveMinimum}`
      );
    }
  }

  /**
   * 验证数组
   */
  private static validateArray(
    value: any[],
    schema: SchemaDefinition,
    errors: string[]
  ): void {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`数组长度 ${value.length} 小于最小长度 ${schema.minItems}`);
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`数组长度 ${value.length} 大于最大长度 ${schema.maxItems}`);
    }

    if (schema.uniqueItems && new Set(value).size !== value.length) {
      errors.push(`数组包含重复项，但要求唯一项`);
    }

    // 验证数组项
    if (schema.items) {
      if (Array.isArray(schema.items)) {
        // 元组验证
        for (let i = 0; i < Math.min(value.length, schema.items.length); i++) {
          const itemSchema = schema.items[i];
          const itemResult = this.validate(value[i], itemSchema);
          if (!itemResult.valid) {
            errors.push(
              `数组索引 ${i} 验证失败: ${itemResult.errors.join(", ")}`
            );
          }
        }

        // 检查额外项
        if (
          value.length > schema.items.length &&
          schema.additionalItems === false
        ) {
          errors.push(`数组包含额外项，但不允许额外项`);
        } else if (
          value.length > schema.items.length &&
          typeof schema.additionalItems === "object"
        ) {
          for (let i = schema.items.length; i < value.length; i++) {
            const itemResult = this.validate(value[i], schema.additionalItems);
            if (!itemResult.valid) {
              errors.push(
                `额外数组项索引 ${i} 验证失败: ${itemResult.errors.join(", ")}`
              );
            }
          }
        }
      } else {
        // 单一schema验证所有项
        for (let i = 0; i < value.length; i++) {
          const itemResult = this.validate(value[i], schema.items);
          if (!itemResult.valid) {
            errors.push(
              `数组索引 ${i} 验证失败: ${itemResult.errors.join(", ")}`
            );
          }
        }
      }
    }
  }

  /**
   * 验证对象
   */
  private static validateObject(
    value: Record<string, any>,
    schema: SchemaDefinition,
    errors: string[]
  ): void {
    const valueKeys = Object.keys(value);

    // 验证必需属性
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          errors.push(`缺少必需属性: ${requiredProp}`);
        }
      }
    }

    // 验证属性数量
    if (
      schema.minProperties !== undefined &&
      valueKeys.length < schema.minProperties
    ) {
      errors.push(
        `对象属性数量 ${valueKeys.length} 小于最小数量 ${schema.minProperties}`
      );
    }

    if (
      schema.maxProperties !== undefined &&
      valueKeys.length > schema.maxProperties
    ) {
      errors.push(
        `对象属性数量 ${valueKeys.length} 大于最大数量 ${schema.maxProperties}`
      );
    }

    // 验证属性
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in value) {
          const propResult = this.validate(value[propName], propSchema);
          if (!propResult.valid) {
            errors.push(
              `属性 "${propName}" 验证失败: ${propResult.errors.join(", ")}`
            );
          }
        }
      }
    }

    // 验证额外属性
    if (schema.additionalProperties === false) {
      const definedProps = schema.properties
        ? Object.keys(schema.properties)
        : [];
      const extraProps = valueKeys.filter(key => !definedProps.includes(key));
      if (extraProps.length > 0) {
        errors.push(`对象包含额外属性: ${extraProps.join(", ")}`);
      }
    } else if (typeof schema.additionalProperties === "object") {
      const definedProps = schema.properties
        ? Object.keys(schema.properties)
        : [];
      const extraProps = valueKeys.filter(key => !definedProps.includes(key));
      for (const prop of extraProps) {
        const propResult = this.validate(
          value[prop],
          schema.additionalProperties
        );
        if (!propResult.valid) {
          errors.push(
            `额外属性 "${prop}" 验证失败: ${propResult.errors.join(", ")}`
          );
        }
      }
    }
  }

  /**
   * 验证日期
   */
  private static validateDate(
    value: any,
    schema: SchemaDefinition,
    errors: string[]
  ): void {
    // 确保值是有效的日期
    if (value instanceof Date) {
      // 如果是Date类型直接通过
      return;
    }

    // 处理字符串日期
    if (typeof value === "string") {
      try {
        const dateObj = new Date(value);
        // 检查是否是有效日期 (不是Invalid Date)
        if (!isNaN(dateObj.getTime())) {
          return;
        }
      } catch (e) {
        // 日期解析错误，继续到下面的错误处理
      }
    }

    // 其他类型尝试转换为日期
    if (typeof value !== "string" || isNaN(Date.parse(String(value)))) {
      errors.push(`值 ${value} 不是有效的日期`);
      return;
    }

    const dateValue = new Date(String(value));

    // 这里可以添加日期特定的验证，例如最小/最大日期
    if (schema.minimum !== undefined) {
      const minDate = new Date(schema.minimum);
      if (dateValue < minDate) {
        errors.push(`日期早于最小日期 ${minDate.toISOString()}`);
      }
    }

    if (schema.maximum !== undefined) {
      const maxDate = new Date(schema.maximum);
      if (dateValue > maxDate) {
        errors.push(`日期晚于最大日期 ${maxDate.toISOString()}`);
      }
    }
  }
}
