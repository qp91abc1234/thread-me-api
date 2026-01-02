/**
 * 路径解析支持（baseUrl 和 paths 配置）
 * @see docs/typescript-path-resolution.md#解决方案
 */
import 'tsconfig-paths/register';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { PrismaClient } from 'prisma/generated/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import { env } from 'prisma/config';

// 加载开发环境配置文件
config({ path: '.env.development.local' });

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(env('DATABASE_URL')),
});

interface ApiRoute {
  path: string;
  method: string;
  description?: string;
  matchType?: 'exact' | 'prefix';
}

/**
 * 将 Swagger 路径格式转换为实际路径格式
 * 例如: /api/users/{id} -> /api/users/:id
 */
function convertSwaggerPathToActualPath(swaggerPath: string): string {
  return swaggerPath.replace(/\{([^}]+)\}/g, ':$1');
}

/**
 * 判断路径是否应该使用 prefix 匹配
 * 如果路径以通配符结尾（如 /api/users/*），使用 prefix
 * 否则使用 exact
 */
function determineMatchType(path: string): 'exact' | 'prefix' {
  // 可以根据实际需求调整逻辑
  // 例如：如果路径以 * 结尾，使用 prefix
  if (path.endsWith('*') || path.endsWith('/*')) {
    return 'prefix';
  }
  return 'exact';
}

/**
 * 从 Swagger 文档中提取 API 路由信息
 */
function extractRoutesFromSwagger(document: any): ApiRoute[] {
  const routes: ApiRoute[] = [];

  for (const [swaggerPath, pathItem] of Object.entries(document.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    // 遍历 HTTP 方法
    for (const [method, operation] of Object.entries(pathItem)) {
      const lowerMethod = method.toLowerCase();

      // 只处理标准的 HTTP 方法
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(lowerMethod)) {
        continue;
      }

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      // 将 Swagger 路径格式转换回实际路径格式
      const actualPath = convertSwaggerPathToActualPath(swaggerPath);

      // 提取描述信息
      const description =
        operation.summary ||
        operation.description ||
        `${method.toUpperCase()} ${actualPath}`;

      // 判断匹配类型
      const matchType = determineMatchType(actualPath);

      routes.push({
        path: actualPath,
        method: method.toUpperCase(),
        description,
        matchType,
      });
    }
  }

  return routes;
}

/**
 * 同步 API 权限到数据库
 */
async function syncApiPermissions(routes: ApiRoute[]): Promise<void> {
  console.log(`📋 Found ${routes.length} API routes`);

  for (const route of routes) {
    const desc = route.description || `${route.method} ${route.path}`;

    try {
      await prisma.apiPermission.upsert({
        where: { desc },
        update: {
          path: route.path,
          method: route.method,
          matchType: route.matchType || 'exact',
        },
        create: {
          path: route.path,
          method: route.method,
          matchType: route.matchType || 'exact',
          desc,
        },
      });
      console.log(`✅ Synced: ${route.method} ${route.path}`);
    } catch (error) {
      console.error(`❌ Error syncing ${route.method} ${route.path}:`, error);
    }
  }

  console.log(`\n🎉 Synced ${routes.length} API permissions`);
}

/**
 * 主函数：收集 API 权限
 */
async function collectApiPermissions() {
  console.log('🚀 Starting API permission collection...\n');

  // 1. 创建应用上下文（不启动 HTTP 服务）
  const app = await NestFactory.create(AppModule, {
    logger: false, // 禁用日志，避免干扰输出
  });

  // 2. 生成 Swagger 文档
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().build(),
  );

  // 3. 从 Swagger 文档中提取路由
  const routes = extractRoutesFromSwagger(document);

  if (routes.length === 0) {
    console.log('⚠️  No API routes found in Swagger document');
    return app;
  }

  // 4. 同步到数据库
  await syncApiPermissions(routes);

  console.log('\n🎉 API permission collection completed successfully!');

  return app;
}

/**
 * 给 admin 角色绑定所有 API 权限
 */
async function bindApiPermissionsToAdmin(): Promise<void> {
  console.log('\n🔗 Binding api permissions to admin role...\n');

  // 1. 查找 admin 角色
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    console.error('❌ Admin role not found. Please create admin role first.');
    throw new Error('Admin role not found');
  }

  console.log(`✅ Found admin role: ${adminRole.name} (ID: ${adminRole.id})`);

  // 2. 获取所有 API 权限
  const allApiPermissions = await prisma.apiPermission.findMany({
    select: { id: true },
  });

  console.log(`📋 Found ${allApiPermissions.length} API permissions`);

  // 3. 绑定所有权限到 admin 角色
  try {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        apiPermissions: {
          set: allApiPermissions.map((perm) => ({ id: perm.id })),
        },
      },
    });

    console.log(
      `\n✅ Successfully bound ${allApiPermissions.length} API permissions to admin role`,
    );
  } catch (error) {
    console.error('❌ Error binding permissions to admin role:', error);
    throw error;
  }
}

// 执行收集
async function main() {
  let hasError = false;
  let app;
  try {
    app = await collectApiPermissions();
    await bindApiPermissionsToAdmin();
  } catch (error) {
    console.error('❌ Error during API permission collection:', error);
    hasError = true;
  } finally {
    if (app) {
      await app.close();
    }
    await prisma.$disconnect();
    process.exit(hasError ? 1 : 0);
  }
}

main();
