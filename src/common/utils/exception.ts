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
  EXIST: (name: string) =>
    createException({
      code: ErrorCode.EXIST,
      message: `${name}已存在，无法创建`,
    }),

  NO_USER: () =>
    createException({ code: ErrorCode.NO_USER, message: '没有对应的用户' }),

  NO_ROLE: () =>
    createException({ code: ErrorCode.NO_ROLE, message: '没有对应的角色' }),

  NO_PERMISSION: (detail?: string) =>
    createException({
      code: ErrorCode.NO_PERMISSION,
      message: detail || '没有对应的权限',
    }),

  PWD_ERR: () =>
    createException({ code: ErrorCode.PWD_ERR, message: '密码错误' }),

  NO_AUTH: () =>
    createException(
      { code: ErrorCode.NO_AUTH, message: '没有操作权限' },
      HttpStatus.FORBIDDEN,
    ),

  UNSUPPORT_FILE_TYPE: () =>
    createException({
      code: ErrorCode.UNSUPPORT_FILE_TYPE,
      message: '不支持的文件类型',
    }),

  // 401 Unauthorized
  UNLOGIN: () =>
    createException(
      { code: ErrorCode.UNLOGIN, message: '用户未登录或Token过期' },
      HttpStatus.UNAUTHORIZED,
    ),

  TOKEN_REUSED: () =>
    createException({
      code: ErrorCode.TOKEN_REUSED,
      message: 'token 被重复使用',
    }),
};
