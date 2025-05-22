import { describe, it, expect, beforeEach, vi } from "vitest";
import { DataMapper } from "../data/DataMapper.js";
import { ExecutionContext } from "../core/ExecutionContext.js";

describe("DataMapper", () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = new ExecutionContext("test_workflow", {});
    // 避免测试中的console输出
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("mapInput", () => {
    it("应保留基础数据类型", () => {
      const testData = {
        stringValue: "张三",
        numberValue: 42,
        integerValue: 100,
        booleanValue: true,
        nullValue: null,
      };

      const mapping = {
        string: "$input.stringValue",
        number: "$input.numberValue",
        integer: "$input.integerValue",
        boolean: "$input.booleanValue",
        null: "$input.nullValue",
      };

      const result = DataMapper.mapInput(testData, mapping, context);

      expect(typeof result.string).toBe("string");
      expect(typeof result.number).toBe("number");
      expect(typeof result.integer).toBe("number");
      expect(Number.isInteger(result.integer)).toBe(true);
      expect(typeof result.boolean).toBe("boolean");
      expect(result.null).toBeNull();

      expect(result.string).toBe("张三");
      expect(result.number).toBe(42);
      expect(result.integer).toBe(100);
      expect(result.boolean).toBe(true);
    });

    it("应保留复合数据类型", () => {
      const testData = {
        arrayValue: [1, 2, 3],
        objectValue: { key1: "value1", key2: "value2" },
      };

      const mapping = {
        array: "$input.arrayValue",
        object: "$input.objectValue",
      };

      const result = DataMapper.mapInput(testData, mapping, context);

      expect(Array.isArray(result.array)).toBe(true);
      expect(result.array).toEqual([1, 2, 3]);

      expect(typeof result.object).toBe("object");
      expect(result.object).toEqual({ key1: "value1", key2: "value2" });
    });

    it("应正确处理嵌套属性", () => {
      const testData = {
        user: {
          profile: {
            name: "李四",
            age: 30,
            contact: {
              email: "lisi@example.com",
            },
          },
        },
      };

      const mapping = {
        name: "$input.user.profile.name",
        age: "$input.user.profile.age",
        email: "$input.user.profile.contact.email",
      };

      const result = DataMapper.mapInput(testData, mapping, context);

      expect(typeof result.name).toBe("string");
      expect(typeof result.age).toBe("number");
      expect(typeof result.email).toBe("string");

      expect(result.name).toBe("李四");
      expect(result.age).toBe(30);
      expect(result.email).toBe("lisi@example.com");
    });

    it("应在路径不存在时返回undefined", () => {
      const testData = { existing: "value" };
      const mapping = { missing: "$input.nonExistent" };

      const result = DataMapper.mapInput(testData, mapping, context);

      expect(result.missing).toBeUndefined();
    });
  });

  describe("evaluateComplexExpression", () => {
    it("应正确处理模板表达式", () => {
      const scope = {
        input: { name: "王五", age: 25 },
      };

      const expr = {
        type: "template",
        template: "用户 {{input.name}} 的年龄是 {{input.age}}",
      };

      const result = DataMapper.evaluateComplexExpression(expr, scope);

      expect(typeof result).toBe("string");
      expect(result).toBe("用户 王五 的年龄是 25");
    });

    it("应正确处理拼接表达式", () => {
      const scope = {
        input: { firstName: "张", lastName: "三" },
      };

      const expr = {
        type: "concat",
        values: ["$input.lastName", "$input.firstName"],
        separator: "",
      };

      const result = DataMapper.evaluateComplexExpression(expr, scope);

      expect(typeof result).toBe("string");
      expect(result).toBe("三张");
    });

    it("应正确处理函数表达式", () => {
      const scope = {
        input: { scores: [80, 90, 95] },
      };

      const expr = {
        type: "function",
        name: "sum",
        args: ["$input.scores"],
      };

      const result = DataMapper.evaluateComplexExpression(expr, scope);

      expect(typeof result).toBe("number");
      expect(result).toBe(265);
    });
  });
});
