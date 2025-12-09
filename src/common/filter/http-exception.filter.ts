import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const res: any = exception.getResponse();

    const resp: any = {};
    if (res.code) {
      resp.code = res.code;
      resp.message = res.msg;
    } else {
      resp.message = res.message || res;
    }

    this.logger.error(resp.message);
    response.json({
      status: exception.getStatus(),
      ...resp,
    });
  }
}
