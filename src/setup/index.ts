import { INestApplication } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { traverse } from './traverse/traverse';
import { setupSwagger } from './swagger';

export function setup(app: INestApplication) {
  // swagger 文档
  setupSwagger(app);
  // 跨域
  app.enableCors();
  // 日志
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 执行遍历
  traverse(app);
}
