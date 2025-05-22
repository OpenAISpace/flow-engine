# 贡献指南

感谢您对 Flow Engine 项目的兴趣！我们非常欢迎来自社区的贡献。

## 开发流程

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 开发环境设置

1. 克隆仓库
   ```bash
   git clone https://github.com/your-username/flow-engine.git
   cd flow-engine
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 运行开发环境
   ```bash
   npm run dev
   ```

4. 运行测试
   ```bash
   npm test
   ```

## 代码风格

- 我们使用 ESLint 和 Prettier 来保持代码质量和一致的代码风格
- 提交代码前，请确保运行 `npm run lint` 和 `npm run format` 来格式化代码
- 所有的代码提交应当通过所有测试和 lint 检查

## 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 不影响代码含义的更改（空格、格式化、缺少分号等）
- `refactor`: 既不修复错误也不添加功能的代码更改
- `perf`: 提高性能的代码更改
- `test`: 添加缺失的测试或更正现有测试
- `chore`: 构建过程或辅助工具的变动

例如：`feat: 添加断点继续功能`

## Pull Request 流程

1. 确保您的 PR 包含完整的测试和文档更新
2. 确保所有测试通过并且代码符合我们的风格指南
3. PR 将由至少一名团队成员审查
4. 一旦 PR 被批准，它将被合并到主分支

## 问题报告

如果您发现了一个 bug 或有功能请求，请打开一个 issue，并尽可能详细地描述问题或请求。

## 许可证

通过贡献您的代码，您同意您的贡献将在 MIT 许可下获得许可。 