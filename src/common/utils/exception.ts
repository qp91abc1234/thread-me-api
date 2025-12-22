import { HttpException, HttpStatus } from '@nestjs/common';

// 定义统一的错误响应接口
export interface BusinessError {
  code: string;
  message: string;
}

const createException = (
  error: BusinessError,
  status = HttpStatus.BAD_REQUEST,
) => {
  return new HttpException(error, status);
};

export const BusinessExceptions = {
  // ========== 400 Bad Request - 参数错误 ==========
  UNSUPPORT_FILE_TYPE: () =>
    createException(
      {
        code: 'UNSUPPORT_FILE_TYPE',
        message: '不支持的文件类型',
      },
      HttpStatus.BAD_REQUEST,
    ),

  // ========== 401 Unauthorized - 认证失败 ==========
  PWD_ERR: () =>
    createException(
      { code: 'PWD_ERR', message: '密码错误' },
      HttpStatus.UNAUTHORIZED,
    ),

  TOKEN_EXPIRED: () =>
    createException(
      { code: 'TOKEN_EXPIRED', message: 'Token已过期' },
      HttpStatus.UNAUTHORIZED,
    ),

  TOKEN_INVALID: () =>
    createException(
      { code: 'TOKEN_INVALID', message: 'Token无效' },
      HttpStatus.UNAUTHORIZED,
    ),

  TOKEN_REUSED: () =>
    createException(
      {
        code: 'TOKEN_REUSED',
        message: 'token 被重复使用',
      },
      HttpStatus.UNAUTHORIZED,
    ),

  // ========== 403 Forbidden - 权限不足 ==========

  OPERATION_FORBIDDEN: (detail?: string) =>
    createException(
      {
        code: 'OPERATION_FORBIDDEN',
        message: detail || '缺少操作权限',
      },
      HttpStatus.FORBIDDEN,
    ),

  // ========== 404 Not Found - 资源不存在 ==========
  NO_USER: () =>
    createException(
      { code: 'NO_USER', message: '没有对应的用户' },
      HttpStatus.NOT_FOUND,
    ),

  NO_ROLE: (detail?: string) =>
    createException(
      { code: 'NO_ROLE', message: detail || '没有对应的角色' },
      HttpStatus.NOT_FOUND,
    ),

  NO_PERMISSION: (detail?: string) =>
    createException(
      {
        code: 'NO_PERMISSION',
        message: detail || '没有对应的权限',
      },
      HttpStatus.NOT_FOUND,
    ),

  // ========== 409 Conflict - 资源冲突 ==========
  EXIST: (name: string) =>
    createException(
      {
        code: 'EXIST',
        message: `${name}已存在，无法创建`,
      },
      HttpStatus.CONFLICT,
    ),
};
