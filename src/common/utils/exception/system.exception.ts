/**
 * 系统异常类
 * 用于非业务范畴的异常（如模块初始化、配置验证、基础设施运行时异常等）
 * 此类异常不会进入异常过滤器，会导致应用启动失败或系统级错误
 */
export class SystemException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemException';
  }
}

export const SystemExceptions = {
  // ========== Redis 模块 ==========
  // 初始化相关
  REDIS_HOST_REQUIRED: () =>
    new SystemException('[RedisModule] REDIS_HOST is required'),

  REDIS_PORT_REQUIRED: () =>
    new SystemException('[RedisModule] REDIS_PORT is required'),

  REDIS_PORT_INVALID: (port: string) =>
    new SystemException(
      `[RedisModule] REDIS_PORT must be a valid port number (1-65535), got: ${port}`,
    ),

  REDIS_PASSWORD_REQUIRED: () =>
    new SystemException('[RedisModule] REDIS_PASSWORD is required'),

  REDIS_CONNECTION_FAILED: (message: string) =>
    new SystemException(`[RedisModule] Redis connection failed: ${message}`),

  // 运行时相关
  REDIS_MAX_RECONNECTION_ATTEMPTS_REACHED: () =>
    new SystemException('[RedisModule] Max reconnection attempts reached'),
};
