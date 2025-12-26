/**
 * 模块控制器路由遍历钩子接口
 */
export interface NestModulesTraverseHooks {
  /**
   * 处理模块级别的逻辑
   * @param moduleClass 模块类
   * @returns 返回 false 将跳过该模块的所有控制器处理
   */
  onModule?: (moduleClass: any) => boolean | void;

  /**
   * 处理控制器级别的逻辑
   * @param moduleClass 模块类
   * @param controllerClass 控制器类
   * @returns 返回 false 将跳过该控制器的所有方法处理
   */
  onController?: (moduleClass: any, controllerClass: any) => boolean | void;

  /**
   * 处理路由方法级别的逻辑
   * @param moduleClass 模块类
   * @param controllerClass 控制器类
   * @param method 方法实例
   * @returns 返回 false 将跳过该方法的后续处理
   */
  onMethod?: (
    moduleClass: any,
    controllerClass: any,
    method: any,
  ) => boolean | void;
}
