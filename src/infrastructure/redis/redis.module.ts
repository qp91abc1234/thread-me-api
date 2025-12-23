import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { PROVIDE_KEY } from '../../common/constant/constant';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SystemExceptions } from '../../common/utils/exception/system.exception';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: PROVIDE_KEY.REDIS_CLIENT,
      async useFactory(configService: ConfigService, logger: Logger) {
        // 配置验证
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<string>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');

        if (!host) {
          throw SystemExceptions.REDIS_HOST_REQUIRED();
        }
        if (!port) {
          throw SystemExceptions.REDIS_PORT_REQUIRED();
        }

        if (!password) {
          throw SystemExceptions.REDIS_PASSWORD_REQUIRED();
        }

        const portNumber = Number(port);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
          throw SystemExceptions.REDIS_PORT_INVALID(port);
        }

        const client = createClient({
          socket: {
            host,
            port: portNumber,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('[RedisModule] Max reconnection attempts reached');
                // 返回 Error 对象让 redis 客户端停止重连（非抛出异常，不会被异常过滤器接收）
                return SystemExceptions.REDIS_MAX_RECONNECTION_ATTEMPTS_REACHED();
              }
              const delay = Math.min(retries * 100, 3000);
              logger.warn(
                `[RedisModule] Reconnecting in ${delay}ms (attempt ${retries})`,
              );
              return delay;
            },
          },
          password,
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

        // 连接错误处理
        try {
          await client.connect();
          logger.info('[RedisModule] Redis client initialized successfully');
        } catch (error) {
          logger.error(
            `[RedisModule] Failed to connect to Redis: ${error.message}`,
          );
          throw SystemExceptions.REDIS_CONNECTION_FAILED(error.message);
        }

        return client;
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
