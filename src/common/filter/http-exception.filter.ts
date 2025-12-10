import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorCode } from '../constant/constant';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();
    const request = ctx.getRequest<Request>();

    // 1. 构建响应数据
    const res = exceptionResponse as any; // 临时断言方便取值
    const errorBody = {
      status: exception.getStatus(),
      code: res?.code || ErrorCode.HTTP_ERROR, // 安全取值
      message: res?.message || res || '请求处理失败', // 优先取结构化消息，其次取本身，最后兜底
      timestamp: new Date().toISOString(),
    };

    // 2. 记录日志
    this.logger.error(
      `[${request.method}] ${request.url}: ${JSON.stringify(errorBody)}`,
    );

    // 3. 发送响应
    response.json(errorBody);
  }
}
