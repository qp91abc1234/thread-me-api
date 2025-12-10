import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { PROVIDE_KEY } from '../common/constant/constant';

@Injectable()
export class RedisService implements OnModuleDestroy {
  @Inject(PROVIDE_KEY.REDIS_CLIENT)
  private redisClient: RedisClientType;

  // 优雅关闭
  async onModuleDestroy() {
    if (this.redisClient.isOpen) {
      await this.redisClient.disconnect();
    }
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  // 优化：利用 SET 命令的原生参数实现原子性操作
  async set(key: string, value: string | number, ttl?: number) {
    if (ttl) {
      await this.redisClient.set(key, value, { EX: ttl });
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }
}
