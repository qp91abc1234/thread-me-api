/**
 * 初始化异常类
 * 用于非 HTTP 请求过程中的异常（如模块初始化、配置验证等）
 * 此类异常不会进入异常过滤器，会导致应用启动失败
 */
export class InitializationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitializationException';
  }
}

export const InitializationExceptions = {
  // ========== Redis 模块 ==========
  REDIS_HOST_REQUIRED: () =>
    new InitializationException('[RedisModule] REDIS_HOST is required'),

  REDIS_PORT_REQUIRED: () =>
    new InitializationException('[RedisModule] REDIS_PORT is required'),

  REDIS_PORT_INVALID: (port: string) =>
    new InitializationException(
      `[RedisModule] REDIS_PORT must be a valid port number (1-65535), got: ${port}`,
    ),

  REDIS_CONNECTION_FAILED: (message: string) =>
    new InitializationException(
      `[RedisModule] Redis connection failed: ${message}`,
    ),
};
