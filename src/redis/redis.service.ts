import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { PROVIDE_KEY } from 'src/common/constant/constant';

@Injectable()
export class RedisService {
  @Inject(PROVIDE_KEY.REDIS_CLIENT)
  private redisClient: RedisClientType;

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string | number, ttl?: number) {
    await this.redisClient.set(key, value);

    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }
}
