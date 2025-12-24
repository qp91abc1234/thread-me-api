import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

/**
 * Throttler 存储服务
 * Redis 存储适配器，用于 Throttler 限流
 * 实现分布式限流计数，支持多实例共享计数
 */
@Injectable()
export class ThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 增加限流计数并返回限流状态
   * @see docs/technical-notes.md#throttler-限流存储
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    // eslint-disable-next-line
    throttlerName: string,
  ) {
    const now = Date.now();
    const ttlMs = ttl * 1000;
    let records: number[] = await this.redisService.get<number[]>(key);
    if (!records) {
      records = [];
    }

    // 过滤掉过期的记录（只保留时间窗口内的记录）
    const validRecords = records.filter((timestamp) => timestamp > now - ttlMs);

    // 计算总请求次数（当前请求 + 有效历史记录）
    const totalHits = validRecords.length + 1;
    const isBlocked = totalHits > limit;

    // 添加当前请求时间戳并保存到 Redis
    validRecords.push(now);
    // 直接传入数组，RedisService 会自动序列化
    await this.redisService.set(key, validRecords, {
      ttl: Math.ceil(ttl / 1000), // ttl 是毫秒，转换为秒
    });

    // 计算过期时间（基于最早的有效记录）
    const earliestRecord = validRecords[0] || now;
    const timeToExpire = Math.ceil((ttlMs - (now - earliestRecord)) / 1000);

    return {
      totalHits,
      isBlocked,
      timeToExpire,
      timeToBlockExpire: isBlocked ? Math.ceil(blockDuration / 1000) : 0,
    };
  }
}
