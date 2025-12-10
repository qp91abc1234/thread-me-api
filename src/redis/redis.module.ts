import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { PROVIDE_KEY } from 'src/common/constant/constant';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: PROVIDE_KEY.REDIS_CLIENT,
      async useFactory(configService: ConfigService, logger: Logger) {
        const client = createClient({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: Number(configService.get('REDIS_PORT')),
          },
          database: configService.get('REDIS_DB')
            ? Number(configService.get('REDIS_DB'))
            : 0,
        });

        client.on('error', (err) => {
          // 使用注入进来的 logger
          logger.error(`[RedisModule] Client Error: ${err}`);
        });

        client.on('connect', () => {
          logger.info('[RedisModule] Connected successfully');
        });

        await client.connect();
        return client;
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
