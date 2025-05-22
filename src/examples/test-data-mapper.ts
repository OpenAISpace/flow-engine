import { DataMapper } from "../data/DataMapper.js";
import { ExecutionContext } from "../core/ExecutionContext.js";

// 模拟执行上下文
const context = new ExecutionContext("test_workflow", {});

// 创建测试数据
const testData = {
  name: "张三",
  age: 25,
  isActive: true,
  scores: [80, 90, 95],
  details: {
    address: "北京市",
    phone: "12345678901",
  },
};

// 测试不同类型的映射
const mappings = {
  stringValue: "$input.name",
  numberValue: "$input.age",
  booleanValue: "$input.isActive",
  arrayValue: "$input.scores",
  objectValue: "$input.details",
  nestedValue: "$input.details.address",
  nonExistentValue: "$input.nonExistent",
};

console.log("===== 测试 DataMapper 类型保留 =====");
console.log("源数据:", testData);
console.log("\n输入映射定义:", mappings);

// 执行映射
const result = DataMapper.mapInput(testData, mappings, context);

// 分析结果
console.log("\n映射结果:");
for (const [key, value] of Object.entries(result)) {
  console.log(`${key}: ${value} (${typeof value})`);

  // 检查数组和对象类型
  if (Array.isArray(value)) {
    console.log(`  - 是数组，长度为 ${value.length}`);
  } else if (value && typeof value === "object") {
    console.log(`  - 是对象，包含属性: ${Object.keys(value).join(", ")}`);
  }
}

// 测试复杂表达式
const complexMappings = {
  template: {
    type: "template",
    template: "用户 {{input.name}} 的年龄是 {{input.age}}",
  },
  concat: {
    type: "concat",
    values: ["$input.name", "-", "$input.age"],
    separator: "",
  },
  function: {
    type: "function",
    name: "sum",
    args: ["$input.scores"],
  },
};

console.log("\n测试复杂表达式:");
const complexResult = DataMapper.mapInput(testData, complexMappings, context);
for (const [key, value] of Object.entries(complexResult)) {
  console.log(`${key}: ${value} (${typeof value})`);
}
