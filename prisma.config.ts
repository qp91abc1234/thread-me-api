// Prisma CLI 配置文件：Prisma CLI 命令运行时依赖的配置文件
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// 加载开发环境配置文件
// - 开发环境：.env.development.local 文件存在，会加载其中的环境变量（如 DATABASE_URL）
// - 生产环境：.env.development.local 文件不存在，dotenv 会忽略（不报错），使用容器中已设置的环境变量
config({ path: '.env.development.local' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
