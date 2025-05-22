import {
  WorkflowEngine,
  WorkflowBuilder,
  StepHandlerRegistry,
  ExecutionContextRuntime,
} from '../index.js';

/**
 * 完整工作流执行示例
 */
async function main() {
  // 1. 创建工作流引擎
  const engine = new WorkflowEngine();

  // 2. 注册自定义处理器
  engine.registerHandler(
    'validator',
    async (input: Record<string, any>, context: ExecutionContextRuntime) => {
      console.log('执行验证处理器:', input);

      // 模拟验证逻辑
      const { data } = input;
      const errors: string[] = [];

      if (!data.name || data.name.length < 2) {
        errors.push('名称至少需要2个字符');
      }

      if (!data.email || !data.email.includes('@')) {
        errors.push('邮箱格式不正确');
      }

      if (data.age < 18) {
        errors.push('年龄必须大于18岁');
      }

      return {
        valid: errors.length === 0,
        errors,
        validatedData:
          errors.length === 0
            ? {
                name: data.name,
                email: data.email,
                age: data.age,
                validatedAt: new Date().toISOString(),
              }
            : null,
      };
    }
  );

  engine.registerHandler(
    'processor',
    async (input: Record<string, any>, context: ExecutionContextRuntime) => {
      console.log('执行处理器:', input);

      // 模拟数据处理逻辑
      const { data } = input;

      if (!data.valid) {
        throw new Error('验证失败，无法处理数据');
      }

      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        processedData: {
          id: `user_${Date.now()}`,
          ...data.validatedData,
          processed: true,
          processedAt: new Date().toISOString(),
        },
      };
    }
  );

  engine.registerHandler(
    'notifier',
    async (input: Record<string, any>, context: ExecutionContextRuntime) => {
      console.log('执行通知处理器:', input);

      // 模拟发送通知
      const { recipient, message, data } = input;

      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        notificationSent: true,
        recipient,
        timestamp: new Date().toISOString(),
        messagePreview: `${message.substring(0, 20)}...`,
      };
    }
  );

  // 3. 使用构建器创建工作流
  const workflow = new WorkflowBuilder()
    .setBasicInfo({
      name: '用户注册流程',
      description: '处理用户注册并发送欢迎通知',
    })
    .setGlobalConfig({
      timeout: 10000,
      retryPolicy: { maxRetries: 2, delay: 1000 },
    })
    .addStep({
      id: 'validate',
      name: '验证用户输入',
      type: 'task',
      handler: 'validator',
      inputMapping: {
        data: 'input',
      },
    })
    .addStep({
      id: 'process',
      name: '处理用户数据',
      type: 'task',
      handler: 'processor',
      dependsOn: ['validate'],
      inputMapping: {
        data: '$stepResults.validate.result',
      },
      retry: {
        maxRetries: 3,
        delay: 1000,
      },
    })
    .addStep({
      id: 'notify',
      name: '发送欢迎通知',
      type: 'task',
      handler: 'notifier',
      dependsOn: ['process'],
      condition: '$stepResults.process.result.success === true',
      inputMapping: {
        recipient: '$stepResults.process.result.processedData.email',
        message: {
          type: 'template',
          template: '欢迎 {{stepResults.process.result.processedData.name}} 加入我们的平台!',
        },
        data: '$stepResults.process.result.processedData',
      },
    })
    .build();

  // 4. 添加事件监听器
  engine.on('workflow.started', event => {
    console.log('\n工作流开始执行:', event.detail.workflow.name);
  });

  engine.on('step.started', event => {
    console.log(`\n开始执行步骤: ${event.detail.step.name} (${event.detail.step.id})`);
  });

  engine.on('step.completed', event => {
    console.log(`步骤执行完成: ${event.detail.step.name} (${event.detail.step.id})`);
    console.log('结果:', event.detail.result);
  });

  engine.on('workflow.completed', event => {
    console.log('\n工作流执行完成!');
    console.log(
      '总执行时间:',
      event.detail.context.endTime! - event.detail.context.startTime,
      'ms'
    );
  });

  // 5. 执行工作流
  const userData = {
    name: '张三',
    email: 'zhangsan@example.com',
    age: 30,
  };

  console.log('开始执行工作流，输入数据:', userData);

  try {
    const result = await engine.execute(workflow, userData);

    console.log('\n最终结果:');
    console.log('执行ID:', result.executionId);
    console.log('状态:', result.status);
    console.log('结果数据:', result.result);

    return result;
  } catch (error) {
    console.error('工作流执行失败:', error);
    throw error;
  }
}

// 运行示例
main().catch(console.error);
