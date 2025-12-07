import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { PROVIDE_KEY } from 'src/common/constant/constant';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: PROVIDE_KEY.REDIS_CLIENT,
      async useFactory(configService: ConfigService) {
        const client = createClient({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: Number(configService.get('REDIS_PORT')),
          },
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
