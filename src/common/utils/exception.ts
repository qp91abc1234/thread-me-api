import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constant/constant';

// 定义统一的错误响应接口
export interface BusinessError {
  code: ErrorCode;
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
        code: ErrorCode.UNSUPPORT_FILE_TYPE,
        message: '不支持的文件类型',
      },
      HttpStatus.BAD_REQUEST,
    ),

  // ========== 401 Unauthorized - 认证失败 ==========
  PWD_ERR: () =>
    createException(
      { code: ErrorCode.PWD_ERR, message: '密码错误' },
      HttpStatus.UNAUTHORIZED,
    ),

  UNLOGIN: () =>
    createException(
      { code: ErrorCode.UNLOGIN, message: '用户未登录或Token过期' },
      HttpStatus.UNAUTHORIZED,
    ),

  TOKEN_REUSED: () =>
    createException(
      {
        code: ErrorCode.TOKEN_REUSED,
        message: 'token 被重复使用',
      },
      HttpStatus.UNAUTHORIZED,
    ),

  // ========== 403 Forbidden - 权限不足 ==========
  NO_PERMISSION: (detail?: string) =>
    createException(
      {
        code: ErrorCode.NO_PERMISSION,
        message: detail || '没有对应的权限',
      },
      HttpStatus.FORBIDDEN,
    ),

  NO_AUTH: () =>
    createException(
      { code: ErrorCode.NO_AUTH, message: '没有操作权限' },
      HttpStatus.FORBIDDEN,
    ),

  // ========== 404 Not Found - 资源不存在 ==========
  NO_USER: () =>
    createException(
      { code: ErrorCode.NO_USER, message: '没有对应的用户' },
      HttpStatus.NOT_FOUND,
    ),

  NO_ROLE: () =>
    createException(
      { code: ErrorCode.NO_ROLE, message: '没有对应的角色' },
      HttpStatus.NOT_FOUND,
    ),

  // ========== 409 Conflict - 资源冲突 ==========
  EXIST: (name: string) =>
    createException(
      {
        code: ErrorCode.EXIST,
        message: `${name}已存在，无法创建`,
      },
      HttpStatus.CONFLICT,
    ),
};
