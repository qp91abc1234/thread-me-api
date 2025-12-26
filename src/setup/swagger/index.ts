import { INestApplication, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { registerHook } from '../traverse/traverse';
import { Reflector } from '@nestjs/core';
import { METADATA_KEY } from 'src/common/constant/constant';
import { buildFullPath, getControllerPath } from './utils';

export function setupSwagger(app: INestApplication) {
  const document = init(app);
  registerTraverseHook(app, document);
}

function init(app: INestApplication) {
  const docConfig = new DocumentBuilder()
    .setTitle('proj doc')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 jwt 的认证',
    })
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);

  SwaggerModule.setup('api', app, document);
  return document;
}

function registerTraverseHook(app: INestApplication, document: any): void {
  const reflector = app.get(Reflector);
  const controllerPathCache = new WeakMap<any, string>();
  const controllerNoLoginCache = new WeakMap<any, boolean>();

  registerHook({
    onController: (_, controllerClass) => {
      const controllerPath = getControllerPath(controllerClass);
      controllerPathCache.set(controllerClass, controllerPath);

      const controllerNoLogin = reflector.getAllAndOverride(
        METADATA_KEY.REQUIRE_NO_LOGIN,
        [controllerClass],
      );
      controllerNoLoginCache.set(controllerClass, controllerNoLogin ?? false);
    },
    onMethod: (_, controllerClass, method) => {
      const controllerPath = controllerPathCache.get(controllerClass);
      const requestMethodValue = Reflect.getMetadata('method', method);
      const methodPath = Reflect.getMetadata('path', method);
      const httpMethod = RequestMethod[requestMethodValue]?.toLowerCase();

      // 构建完整路径
      const fullPath = buildFullPath(controllerPath, methodPath);

      // 转换为 Swagger 路径格式（:id -> {id}）
      const swaggerPath = fullPath.replace(/:([^/]+)/g, '{$1}');

      // 在 Swagger 文档中查找对应的操作
      const pathItem = document.paths[swaggerPath];
      if (pathItem) {
        const operation = pathItem[httpMethod.toLowerCase()];
        if (operation && typeof operation === 'object') {
          // 从缓存中获取控制器级别的 RequireNoLogin 状态
          const controllerNoLogin = controllerNoLoginCache.get(controllerClass);

          // 检查方法是否有 RequireNoLogin 装饰器
          const methodNoLogin = reflector.getAllAndOverride<boolean>(
            METADATA_KEY.REQUIRE_NO_LOGIN,
            [method],
          );

          if (controllerNoLogin || methodNoLogin) {
            operation.security = [];
          } else {
            operation.security = [{ bearer: [] }];
          }
        }
      }
    },
  });
}
