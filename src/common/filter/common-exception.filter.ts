import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class CommonExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      `[${request.method}] ${request.url}: ${exception.message}`,
    );

    // 生产环境返回通用信息，开发环境返回详细信息
    const isDev = process.env.NODE_ENV === 'development';

    response.json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isDev ? exception.message : '服务器内部错误，请稍后重试',
      timestamp: new Date().toISOString(),
    });
  }
}
