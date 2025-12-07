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
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(exception.message);
    response.json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message,
    });
  }
}
