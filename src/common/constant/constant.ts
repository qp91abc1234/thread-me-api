export const PROVIDE_KEY = {
  REDIS_CLIENT: 'REDIS_CLIENT',
};

export const METADATA_KEY = {
  REQUIRE_LOGIN: 'require-login',
  REQUIRE_PERMISSION: 'require-permission',
};

export enum ErrorCode {
  // ========== 通用错误 ==========
  HTTP_ERROR = 'HTTP_ERROR',

  // ========== 400 Bad Request - 参数错误 ==========
  UNSUPPORT_FILE_TYPE = 'UNSUPPORT_FILE_TYPE',

  // ========== 401 Unauthorized - 认证失败 ==========
  PWD_ERR = 'PWD_ERR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REUSED = 'TOKEN_REUSED',

  // ========== 403 Forbidden - 权限不足 ==========
  OPERATION_FORBIDDEN = 'OPERATION_FORBIDDEN',

  // ========== 404 Not Found - 资源不存在 ==========
  NO_USER = 'NO_USER',
  NO_ROLE = 'NO_ROLE',
  NO_PERMISSION = 'NO_PERMISSION',

  // ========== 409 Conflict - 资源冲突 ==========
  EXIST = 'EXIST',

  // ========== 500 Internal Server Error - 服务器错误 ==========
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}
