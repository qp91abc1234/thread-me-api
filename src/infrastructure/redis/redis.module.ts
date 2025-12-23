import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { PROVIDE_KEY } from '../../common/constant/constant';
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
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('[RedisModule] Max reconnection attempts reached');
                // 返回 Error 对象让 redis 客户端停止重连（非抛出异常，不会被异常过滤器接收）
                return new Error('Max reconnection attempts reached');
              }
              const delay = Math.min(retries * 100, 3000);
              logger.warn(
                `[RedisModule] Reconnecting in ${delay}ms (attempt ${retries})`,
              );
              return delay;
            },
          },
          password: configService.get('REDIS_PASSWORD'),
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

        client.on('reconnecting', () => {
          logger.info('[RedisModule] Reconnecting to Redis...');
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
