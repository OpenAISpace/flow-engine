import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../utils/SchemaValidator.js";
import { SchemaDefinition } from "../types/index.js";

describe("SchemaValidator", () => {
  describe("validate", () => {
    it("应验证字符串类型", () => {
      const schema: SchemaDefinition = {
        type: "string",
        minLength: 3,
        maxLength: 10,
      };

      expect(SchemaValidator.validate("abc", schema).valid).toBe(true);
      expect(SchemaValidator.validate("abcdefghijk", schema).valid).toBe(false);
      expect(SchemaValidator.validate("ab", schema).valid).toBe(false);
      expect(SchemaValidator.validate(123, schema).valid).toBe(false);
    });

    it("应验证数字类型", () => {
      const schema: SchemaDefinition = {
        type: "number",
        minimum: 0,
        maximum: 100,
      };

      expect(SchemaValidator.validate(50, schema).valid).toBe(true);
      expect(SchemaValidator.validate(0, schema).valid).toBe(true);
      expect(SchemaValidator.validate(100, schema).valid).toBe(true);
      expect(SchemaValidator.validate(-1, schema).valid).toBe(false);
      expect(SchemaValidator.validate(101, schema).valid).toBe(false);
      expect(SchemaValidator.validate("50", schema).valid).toBe(false);
    });

    it("应验证整数类型", () => {
      const schema: SchemaDefinition = {
        type: "integer",
        minimum: 1,
        maximum: 10,
      };

      expect(SchemaValidator.validate(5, schema).valid).toBe(true);
      expect(SchemaValidator.validate(5.5, schema).valid).toBe(false);
      expect(SchemaValidator.validate(0, schema).valid).toBe(false);
    });

    it("应验证布尔类型", () => {
      const schema: SchemaDefinition = {
        type: "boolean",
      };

      expect(SchemaValidator.validate(true, schema).valid).toBe(true);
      expect(SchemaValidator.validate(false, schema).valid).toBe(true);
      expect(SchemaValidator.validate(1, schema).valid).toBe(false);
      expect(SchemaValidator.validate("true", schema).valid).toBe(false);
    });

    it("应验证数组类型", () => {
      const schema: SchemaDefinition = {
        type: "array",
        items: {
          type: "number",
        },
        minItems: 2,
        maxItems: 4,
      };

      expect(SchemaValidator.validate([1, 2, 3], schema).valid).toBe(true);
      expect(SchemaValidator.validate([1], schema).valid).toBe(false);
      expect(SchemaValidator.validate([1, 2, 3, 4, 5], schema).valid).toBe(
        false
      );
      expect(SchemaValidator.validate([1, "2", 3], schema).valid).toBe(false);
    });

    it("应验证对象类型", () => {
      const schema: SchemaDefinition = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer", minimum: 0 },
          email: { type: "string", format: "email" },
        },
        required: ["name", "age"],
      };

      expect(
        SchemaValidator.validate(
          {
            name: "张三",
            age: 30,
            email: "zhangsan@example.com",
          },
          schema
        ).valid
      ).toBe(true);

      expect(
        SchemaValidator.validate(
          {
            name: "张三",
            age: 30,
          },
          schema
        ).valid
      ).toBe(true);

      expect(
        SchemaValidator.validate(
          {
            name: "张三",
          },
          schema
        ).valid
      ).toBe(false);

      expect(
        SchemaValidator.validate(
          {
            name: "张三",
            age: -5,
          },
          schema
        ).valid
      ).toBe(false);

      expect(
        SchemaValidator.validate(
          {
            name: "张三",
            age: 30,
            email: "invalid-email",
          },
          schema
        ).valid
      ).toBe(false);
    });

    it("应支持联合类型", () => {
      const schema: SchemaDefinition = {
        type: ["string", "number", "null"],
      };

      expect(SchemaValidator.validate("abc", schema).valid).toBe(true);
      expect(SchemaValidator.validate(123, schema).valid).toBe(true);
      expect(SchemaValidator.validate(null, schema).valid).toBe(true);
      expect(SchemaValidator.validate(false, schema).valid).toBe(false);
      expect(SchemaValidator.validate({}, schema).valid).toBe(false);
    });

    it("应验证日期类型", () => {
      const schema: SchemaDefinition = {
        type: "date",
      };

      expect(SchemaValidator.validate(new Date(), schema).valid).toBe(true);
      expect(SchemaValidator.validate("2023-01-01", schema).valid).toBe(true);
      expect(SchemaValidator.validate("invalid-date", schema).valid).toBe(
        false
      );
    });

    it("应验证枚举值", () => {
      const schema: SchemaDefinition = {
        type: "string",
        enum: ["red", "green", "blue"],
      };

      expect(SchemaValidator.validate("red", schema).valid).toBe(true);
      expect(SchemaValidator.validate("yellow", schema).valid).toBe(false);
    });
  });
});
