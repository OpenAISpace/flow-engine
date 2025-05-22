import { WorkflowDSL, StepDefinition, ExecutionContext, DataMapper } from '../index.js';

// 简单工作流演示
async function main() {
  // 1. 创建步骤
  const validateStep = new StepDefinition({
    id: 'validate',
    name: '验证输入',
    type: 'task',
    handler: 'validator',
    inputMapping: {
      data: 'input',
    },
  });

  const processStep = new StepDefinition({
    id: 'process',
    name: '处理数据',
    type: 'task',
    handler: 'processor',
    dependsOn: ['validate'],
    inputMapping: {
      data: '$stepResults.validate.result',
    },
  });

  // 2. 定义工作流
  const workflow = WorkflowDSL.createWorkflow({
    name: '简单示例工作流',
    description: '包含验证和处理两个步骤的简单工作流',
    steps: [validateStep, processStep],
  });

  // 3. 创建执行上下文
  const initialData = {
    name: '张三',
    age: 30,
    email: 'zhangsan@example.com',
  };

  const context = new ExecutionContext(workflow.id, initialData);

  // 4. 模拟执行步骤
  console.log('工作流开始执行...');
  console.log('初始数据:', initialData);

  // 模拟验证步骤
  console.log('\n执行步骤:', validateStep.name);
  const validateInput = DataMapper.mapInput(initialData, validateStep.inputMapping, context);
  console.log('验证输入:', validateInput);

  // 模拟验证结果
  const validateResult = {
    valid: true,
    validatedData: {
      name: validateInput.data.name,
      age: validateInput.data.age,
      email: validateInput.data.email,
      validatedAt: new Date().toISOString(),
    },
  };
  console.log('验证结果:', validateResult);

  // 存储验证步骤结果
  context.setStepResult('validate', validateResult);
  context.completedSteps.add('validate');

  // 模拟处理步骤
  console.log('\n执行步骤:', processStep.name);
  const processInput = DataMapper.mapInput(initialData, processStep.inputMapping, context);
  console.log('处理输入:', processInput);

  // 模拟处理结果
  const processResult = {
    success: true,
    processedData: {
      id: `user_${Date.now()}`,
      ...processInput.data.validatedData,
      processedAt: new Date().toISOString(),
    },
  };
  console.log('处理结果:', processResult);

  // 存储处理步骤结果
  context.setStepResult('process', processResult);
  context.completedSteps.add('process');

  // 5. 完成工作流
  context.status = 'completed';
  context.endTime = Date.now();

  console.log('\n工作流执行完成!');
  console.log('执行上下文:', context.serialize());

  return context.serialize();
}

// 执行示例
main().catch(console.error);
