# TypeScript 路径解析机制

## 问题背景

在 TypeScript 项目中，我们使用 `tsconfig.json` 中的路径配置来简化导入路径，主要有两种方式：

### 1. baseUrl 路径解析

通过 `baseUrl` 配置，可以使用以 baseUrl 为基准的路径进行导入：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./"
  }
}
```

使用示例：
```typescript
import { PrismaClient } from 'prisma/generated/client';
import { env } from 'prisma/config';
```

### 2. 路径别名（paths）

通过 `paths` 配置，可以创建路径别名映射：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

使用示例：
```typescript
import { AppModule } from '@/app.module';
```

**问题**：TypeScript 编译器（`tsc`）会进行类型检查、路径检查（验证模块是否存在）和语法转换，但**不会进行路径解析**。这意味着编译后的 JavaScript 代码仍然包含这些原始路径（如 `prisma/generated/client`、`@/app.module`），而 Node.js 的原生模块解析器无法理解这些路径，导致运行时错误。

## 解决方案

### 1. 独立脚本运行（`ts-node`）

使用 `ts-node` 直接运行 TypeScript 脚本时（如种子脚本、工具脚本）：

**问题**：
- `ts-node` 是一个即时编译器（JIT），它在内存中编译 TypeScript 代码。
- 不进行路径解析，编译后的代码仍然包含以 baseUrl 为基准的路径（如 `prisma/generated/client`）和路径别名（如 `@/`）。
- Node.js 的原生模块解析器无法理解这些路径，会报错：`Cannot find module 'prisma/generated/client'` 或 `Cannot find module '@/app.module'`。

**解决方案**：使用 `tsconfig-paths/register`

```typescript
// 必须在文件最顶部引入
import 'tsconfig-paths/register';

// 之后才能使用以 baseUrl 为基准的路径和路径别名
import { PrismaClient } from 'prisma/generated/client';
import { AppModule } from '@/app.module';
```

**工作原理**：
- `tsconfig-paths/register` 是一个**运行时补丁**。
- 它 Hook（拦截）了 Node.js 的模块解析逻辑。
- 当 Node.js 尝试加载模块时，它会读取 `tsconfig.json` 中的 `baseUrl` 和 `paths` 配置。
- 动态将以 baseUrl 为基准的路径和别名映射到真实的物理路径，让 Node.js 能够找到文件。

### 2. NestJS 应用运行（`nest start` / `nest build`）

Nest CLI 内部集成了路径解析机制，无论是在开发模式 (`nest start`) 还是生产构建 (`nest build`)，Nest CLI 都会在编译过程中**重写路径**，将以 baseUrl 为基准的路径和别名转换为相对路径。

**示例**：
```typescript
// 源代码 (src/main.ts)
import { AppModule } from '@/app.module';
import { PrismaClient } from 'prisma/generated/client';

// 编译后 (dist/src/main.js)
const app_module_1 = require("./app.module");
const client_1 = require("../../../prisma/generated/client");
```

**相关代码位置：** `scripts/prisma-seed.ts`, `scripts/collect-api-permissions.ts`