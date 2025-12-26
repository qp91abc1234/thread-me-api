import { INestApplication, RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { NestModulesTraverseHooks } from './traverse.d';

/**
 * 存储所有注册的钩子
 */
const registeredHooks: NestModulesTraverseHooks[] = [];

/**
 * 注册遍历钩子
 * 可以注册多个钩子，它们会按注册顺序依次执行
 */
export function registerHook(hooks: NestModulesTraverseHooks): void {
  registeredHooks.push(hooks);
}

/**
 * 清除所有注册的钩子
 */
export function clearHooks(): void {
  registeredHooks.length = 0;
}

/**
 * 遍历所有模块、控制器和路由方法
 * 这是一个纯粹的遍历函数，不包含任何业务逻辑，所有逻辑通过注册的钩子方法处理
 */
export function traverse(app: INestApplication): void {
  // 获取模块容器
  const modulesContainer = app.get(ModulesContainer);

  // 遍历所有模块
  modulesContainer.forEach((module) => {
    // 依次调用所有注册的模块级别钩子
    for (const hooks of registeredHooks) {
      if (hooks.onModule) {
        const shouldContinue = hooks.onModule(module.metatype);
        // 如果某个钩子返回 false，跳过该模块的所有控制器处理
        if (shouldContinue === false) {
          return;
        }
      }
    }

    // 获取模块的控制器
    const controllers = module.controllers;

    controllers.forEach((controllerWrapper) => {
      const controllerClass = controllerWrapper.metatype;

      // 依次调用所有注册的控制器级别钩子
      for (const hooks of registeredHooks) {
        if (hooks.onController) {
          const shouldContinue = hooks.onController(
            module.metatype,
            controllerClass,
          );
          // 如果某个钩子返回 false，跳过该控制器的所有方法处理
          if (shouldContinue === false) {
            return;
          }
        }
      }

      // 检查控制器方法
      const prototype = controllerClass.prototype;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) =>
          name !== 'constructor' && typeof prototype[name] === 'function',
      );

      methodNames.forEach((methodName) => {
        const method = prototype[methodName];

        const requestMethodValue = Reflect.getMetadata('method', method);
        const httpMethod = RequestMethod[requestMethodValue]?.toLowerCase();
        if (!httpMethod) {
          return;
        }

        // 依次调用所有注册的路由方法级别钩子
        for (const hooks of registeredHooks) {
          if (hooks.onMethod) {
            const shouldContinue = hooks.onMethod(
              module.metatype,
              controllerClass,
              method,
            );
            // 如果某个钩子返回 false，跳过该方法的后续处理
            if (shouldContinue === false) {
              return;
            }
          }
        }
      });
    });
  });
}
