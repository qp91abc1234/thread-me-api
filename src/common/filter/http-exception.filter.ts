import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catchThrottlerException(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const httpStatus = exception.getStatus();

    const errorBody = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后重试',
      timestamp: new Date().toISOString(),
    };

    // 记录警告日志
    this.logger.warn(
      `[${request.method}] ${request.url} [${httpStatus}]: 限流触发 - IP: ${request.ip}`,
    );

    response.status(httpStatus).json(errorBody);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ThrottlerException) {
      return this.catchThrottlerException(exception, host);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();
    const request = ctx.getRequest<Request>();

    const httpStatus = exception.getStatus();
    const message = '请求处理失败，请稍后重试';

    const res = exceptionResponse as any; // 临时断言方便取值
    const errorBody = {
      code: res?.code || 'HTTP_ERROR',
      message: res?.message || res || message, // 优先取结构化消息，其次取本身，最后兜底
      timestamp: new Date().toISOString(),
    };

    // 2. 记录日志
    this.logger.error(
      `[${request.method}] ${request.url} [${httpStatus}]: ${JSON.stringify(errorBody)}`,
    );

    // 3. 发送响应（HTTP 状态码在响应头中）
    const isDev = process.env.NODE_ENV === 'development';
    errorBody.message = isDev ? errorBody.message : res?.message || message;
    response.status(httpStatus).json(errorBody);
  }
}
