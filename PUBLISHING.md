# 发布指南

本文档提供了将 Flow Engine 库发布到 NPM 的步骤。

## 准备工作

1. 确保你有一个 NPM 账户并已登录：

```bash
npm login
```

2. 确保 `package.json` 文件中的版本号正确。版本号遵循语义化版本规范 (SemVer)：
   - 主版本号: 不兼容的 API 变更
   - 次版本号: 向下兼容的功能性新增
   - 修订号: 向下兼容的问题修正

## 发布流程

### 1. 构建项目

确保项目可以成功构建：

```bash
npm run build
```

### 2. 测试构建结果

运行测试确保一切正常：

```bash
npm test
```

### 3. 检查包内容

检查将要发布的包内容：

```bash
npm pack
```

这将创建一个 `.tgz` 文件，你可以解压查看包含的文件，确保它只包含必要的文件。

### 4. 发布

准备就绪后，执行以下命令发布：

```bash
npm publish
```

### 发布测试版本

如果你想发布测试版本或预发布版本：

```bash
# 更新版本号为预发布版本
npm version prerelease --preid=beta

# 发布到beta标签
npm publish --tag beta
```

用户可以通过以下方式安装测试版本：

```bash
npm install flow-engine@beta
```

### 版本更新

当需要发布新版本时，使用以下命令更新版本号：

```bash
# 更新修订号 (1.0.0 -> 1.0.1)
npm version patch

# 更新次版本号 (1.0.0 -> 1.1.0)
npm version minor

# 更新主版本号 (1.0.0 -> 2.0.0)
npm version major
```

## 注意事项

1. 发布前请确保所有测试通过
2. 更新文档以反映任何变更
3. 确保 `README.md` 文件包含最新的示例和使用说明
4. 维护变更日志，记录各版本的变更
