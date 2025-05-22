import { describe, it, expect } from "vitest";
import { TypeConverter } from "../utils/TypeConverter.js";
import { SchemaDefinition } from "../types/index.js";

describe("TypeConverter", () => {
  describe("convert", () => {
    it("应正确转换字符串类型", () => {
      const schema: SchemaDefinition = { type: "string" };

      // 字符串到字符串 - 无变化
      expect(TypeConverter.convert("test", schema).success).toBe(true);
      expect(TypeConverter.convert("test", schema).value).toBe("test");

      // 数字到字符串 - 转换为字符串
      expect(TypeConverter.convert(123, schema).success).toBe(true);
      expect(TypeConverter.convert(123, schema).value).toBe("123");

      // 布尔值到字符串 - 转换为字符串
      expect(TypeConverter.convert(true, schema).success).toBe(true);
      expect(TypeConverter.convert(true, schema).value).toBe("true");

      // 对象到字符串 - 转换为JSON字符串
      const obj = { key: "value" };
      expect(TypeConverter.convert(obj, schema).success).toBe(true);
      expect(TypeConverter.convert(obj, schema).value).toBe('{"key":"value"}');
    });

    it("应正确转换数字类型", () => {
      const schema: SchemaDefinition = { type: "number" };

      // 数字到数字 - 无变化
      expect(TypeConverter.convert(123, schema).success).toBe(true);
      expect(TypeConverter.convert(123, schema).value).toBe(123);

      // 字符串到数字 - 解析为数字
      expect(TypeConverter.convert("123", schema).success).toBe(true);
      expect(TypeConverter.convert("123", schema).value).toBe(123);

      // 有效字符串到数字
      expect(TypeConverter.convert("123.45", schema).success).toBe(true);
      expect(TypeConverter.convert("123.45", schema).value).toBe(123.45);

      // 无效字符串到数字 - 失败
      expect(TypeConverter.convert("abc", schema).success).toBe(false);

      // 布尔值到数字
      expect(TypeConverter.convert(true, schema).success).toBe(true);
      expect(TypeConverter.convert(true, schema).value).toBe(1);
      expect(TypeConverter.convert(false, schema).success).toBe(true);
      expect(TypeConverter.convert(false, schema).value).toBe(0);
    });

    it("应正确转换整数类型", () => {
      const schema: SchemaDefinition = { type: "integer" };

      // 整数到整数 - 无变化
      expect(TypeConverter.convert(123, schema).success).toBe(true);
      expect(TypeConverter.convert(123, schema).value).toBe(123);

      // 浮点数到整数 - 截断
      expect(TypeConverter.convert(123.45, schema).success).toBe(true);
      expect(TypeConverter.convert(123.45, schema).value).toBe(123);

      // 字符串到整数 - 解析为整数
      expect(TypeConverter.convert("123", schema).success).toBe(true);
      expect(TypeConverter.convert("123", schema).value).toBe(123);

      // 带小数的字符串到整数 - 截断
      expect(TypeConverter.convert("123.45", schema).success).toBe(true);
      expect(TypeConverter.convert("123.45", schema).value).toBe(123);
    });

    it("应正确转换布尔类型", () => {
      const schema: SchemaDefinition = { type: "boolean" };

      // 布尔值到布尔值 - 无变化
      expect(TypeConverter.convert(true, schema).success).toBe(true);
      expect(TypeConverter.convert(true, schema).value).toBe(true);
      expect(TypeConverter.convert(false, schema).success).toBe(true);
      expect(TypeConverter.convert(false, schema).value).toBe(false);

      // 数字到布尔值
      expect(TypeConverter.convert(1, schema).success).toBe(true);
      expect(TypeConverter.convert(1, schema).value).toBe(true);
      expect(TypeConverter.convert(0, schema).success).toBe(true);
      expect(TypeConverter.convert(0, schema).value).toBe(false);

      // 字符串到布尔值
      expect(TypeConverter.convert("true", schema).success).toBe(true);
      expect(TypeConverter.convert("true", schema).value).toBe(true);
      expect(TypeConverter.convert("false", schema).success).toBe(true);
      expect(TypeConverter.convert("false", schema).value).toBe(false);
      expect(TypeConverter.convert("yes", schema).success).toBe(true);
      expect(TypeConverter.convert("yes", schema).value).toBe(true);
      expect(TypeConverter.convert("no", schema).success).toBe(true);
      expect(TypeConverter.convert("no", schema).value).toBe(false);
    });

    it("应正确转换日期类型", () => {
      const schema: SchemaDefinition = { type: "date" };
      const testDate = new Date("2023-01-01");

      // Date到Date - 无变化
      expect(TypeConverter.convert(testDate, schema).success).toBe(true);
      expect(
        TypeConverter.convert(testDate, schema).value instanceof Date
      ).toBe(true);
      expect(TypeConverter.convert(testDate, schema).value.toISOString()).toBe(
        testDate.toISOString()
      );

      // 字符串到日期
      expect(TypeConverter.convert("2023-01-01", schema).success).toBe(true);
      expect(
        TypeConverter.convert("2023-01-01", schema).value instanceof Date
      ).toBe(true);

      // 时间戳到日期
      const timestamp = testDate.getTime();
      expect(TypeConverter.convert(timestamp, schema).success).toBe(true);
      expect(
        TypeConverter.convert(timestamp, schema).value instanceof Date
      ).toBe(true);
      expect(TypeConverter.convert(timestamp, schema).value.getTime()).toBe(
        timestamp
      );

      // 无效字符串到日期
      expect(TypeConverter.convert("invalid-date", schema).success).toBe(false);
    });

    it("应正确处理null值", () => {
      // 空类型 - 接受null
      expect(TypeConverter.convert(null, { type: "null" }).success).toBe(true);
      expect(TypeConverter.convert(null, { type: "null" }).value).toBeNull();

      // 联合类型 - 包含null
      expect(
        TypeConverter.convert(null, { type: ["string", "null"] }).success
      ).toBe(true);
      expect(
        TypeConverter.convert(null, { type: ["string", "null"] }).value
      ).toBeNull();

      // 不接受null的类型
      expect(TypeConverter.convert(null, { type: "string" }).success).toBe(
        false
      );
    });

    it("应正确处理默认值", () => {
      const schema: SchemaDefinition = {
        type: "string",
        default: "default value",
      };

      expect(TypeConverter.convert(undefined, schema).success).toBe(true);
      expect(TypeConverter.convert(undefined, schema).value).toBe(
        "default value"
      );
    });
  });
});
