import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { setup } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  setup(app);

  await app.listen(3300, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
