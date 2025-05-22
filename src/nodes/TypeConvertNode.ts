import { ExecutionContextRuntime } from "../types/index.js";
import { TypeConverter } from "../utils/TypeConverter.js";
import { SchemaValidator, ValidationResult } from "../utils/SchemaValidator.js";
import { BaseNode, NodeHandler, NodeMetadata } from "./BaseNode.js";

/**
 * 类型转换节点
 * 将输入数据转换为指定的类型并验证
 */
export class TypeConvertNode extends BaseNode {
  readonly name: string = "typeConvert";

  readonly handler: NodeHandler = async (
    input: Record<string, any>,
    context: ExecutionContextRuntime
  ): Promise<any> => {
    const {
      value,
      targetSchema,
      validateAfterConversion = true,
      throwOnError = false,
    } = input;

    if (!targetSchema) {
      throw new Error("缺少必需参数: targetSchema");
    }

    // 执行类型转换
    const conversionResult = TypeConverter.convert(value, targetSchema);

    // 如果转换失败并且设置了抛出错误
    if (!conversionResult.success && throwOnError) {
      throw new Error(`类型转换失败: ${conversionResult.errors.join("; ")}`);
    }

    // 如果需要验证转换后的值
    let validationResult: ValidationResult = { valid: true, errors: [] };
    if (validateAfterConversion && conversionResult.success) {
      validationResult = SchemaValidator.validate(
        conversionResult.value,
        targetSchema
      );

      // 如果验证失败并且设置了抛出错误
      if (!validationResult.valid && throwOnError) {
        throw new Error(`类型验证失败: ${validationResult.errors.join("; ")}`);
      }
    }

    return {
      originalValue: value,
      convertedValue: conversionResult.value,
      conversionSuccess: conversionResult.success,
      conversionErrors: conversionResult.errors,
      validationSuccess: validationResult.valid,
      validationErrors: validationResult.errors,
      isValid: conversionResult.success && validationResult.valid,
    };
  };

  readonly metadata: NodeMetadata = {
    name: this.name,
    description: "将数据转换为指定的类型并验证",
    category: "数据处理",
    displayName: "类型转换",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          description: "要转换的值",
          type: ["string", "number", "boolean", "object", "array", "null"],
        },
        targetSchema: {
          type: "object",
          description: "目标Schema定义",
        },
        validateAfterConversion: {
          type: "boolean",
          description: "是否在转换后验证",
          default: true,
        },
        throwOnError: {
          type: "boolean",
          description: "转换或验证失败时是否抛出错误",
          default: false,
        },
      },
      required: ["value", "targetSchema"],
    },
    outputSchema: {
      type: "object",
      properties: {
        originalValue: {
          description: "原始值",
          type: ["string", "number", "boolean", "object", "array", "null"],
        },
        convertedValue: {
          description: "转换后的值",
          type: ["string", "number", "boolean", "object", "array", "null"],
        },
        conversionSuccess: {
          type: "boolean",
          description: "转换是否成功",
        },
        conversionErrors: {
          type: "array",
          items: { type: "string" },
          description: "转换错误列表",
        },
        validationSuccess: {
          type: "boolean",
          description: "验证是否成功",
        },
        validationErrors: {
          type: "array",
          items: { type: "string" },
          description: "验证错误列表",
        },
        isValid: {
          type: "boolean",
          description: "转换和验证是否都成功",
        },
      },
    },
    examples: [
      {
        name: "将字符串转换为数字",
        input: {
          value: "123",
          targetSchema: { type: "number" },
        },
      },
      {
        name: "将字符串转换为日期",
        input: {
          value: "2023-01-01",
          targetSchema: { type: "date" },
        },
      },
    ],
  };
}
