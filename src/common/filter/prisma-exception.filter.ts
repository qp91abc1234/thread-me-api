import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. 定义默认响应
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误，请稍后重试';

    // 2. 处理常见特定错误
    switch (exception.code) {
      case 'P2002':
        httpStatus = HttpStatus.CONFLICT;
        message = '数据已存在，请勿重复提交';
        break;
      case 'P2025':
        httpStatus = HttpStatus.NOT_FOUND;
        message = '请求的记录不存在';
        break;
      // 可以继续补充其他常见错误...
    }

    // 3. 构建响应数据
    const errorBody = {
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };

    // 4. 记录完整错误日志（包含请求信息）
    this.logger.error(
      `[${request.method}] ${request.url} [${httpStatus}]: ${JSON.stringify(errorBody)}`,
    );

    // 5. 发送响应
    const isDev = process.env.NODE_ENV === 'development';
    errorBody.message = isDev ? errorBody.message : message;
    response.status(httpStatus).json(errorBody);
  }
}
