import { HttpException, HttpStatus } from '@nestjs/common';

const createHttpExceptionFunc = (resp, status = HttpStatus.BAD_REQUEST) => {
  return () => new HttpException(resp, status);
};

export const httpExceptionMap = {
  EXIST: (name) => {
    const exceptionFunc = createHttpExceptionFunc({
      code: 'EXIST',
      msg: `${name}已存在，无法创建`,
    });
    return exceptionFunc();
  },
  NO_USER: createHttpExceptionFunc({
    code: 'NO_USER',
    msg: '没有对应的用户',
  }),
  NO_ROLE: createHttpExceptionFunc({
    code: 'NO_ROLE',
    msg: '没有对应的角色',
  }),
  NO_PERMISSION: createHttpExceptionFunc({
    code: 'NO_PERMISSION',
    msg: '没有对应的权限',
  }),
  PWD_ERR: createHttpExceptionFunc({
    code: 'PWD_ERR',
    msg: '密码错误',
  }),
  NO_AUTH: createHttpExceptionFunc({
    code: 'NO_AUTH',
    msg: '没有权限',
  }),
  UNSUPPORT_FILE_TYPE: createHttpExceptionFunc({
    code: 'UNSUPPORT_FILE_TYPE',
    msg: '不支持的文件类型',
  }),
  UNLOGIN: createHttpExceptionFunc({
    code: 'UNLOGIN',
    msg: '用户未登录',
  }),
};
