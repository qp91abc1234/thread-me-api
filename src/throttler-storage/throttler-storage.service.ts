import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  isBlocked: boolean;
  timeToExpire: number;
  timeToBlockExpire: number;
}

/**
 * Throttler 存储服务
 * Redis 存储适配器，用于 Throttler 限流
 * 实现分布式限流计数，支持多实例共享计数
 */
@Injectable()
export class ThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 从 Redis 获取限流记录
   * @param key 限流键（通常基于 IP 或用户 ID）
   * @returns 时间戳数组，表示每次请求的时间
   */
  private async getRecord(key: string): Promise<number[]> {
    const value = await this.redisService.get(key);
    return value ? JSON.parse(value) : [];
  }

  /**
   * 增加限流计数并返回限流状态
   * @param key 限流键
   * @param ttl 时间窗口（毫秒）
   * @param limit 限制次数
   * @param blockDuration 阻塞时长（毫秒）
   * @param throttlerName 限流规则名称
   * @returns 限流记录，包含总次数、是否被阻塞等信息
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    // eslint-disable-next-line
    throttlerName: string, // 限流规则名称
  ): Promise<ThrottlerStorageRecord> {
    const records = await this.getRecord(key);
    const now = Date.now();
    const ttlMs = ttl * 1000;

    // 过滤掉过期的记录（只保留时间窗口内的记录）
    const validRecords = records.filter((timestamp) => timestamp > now - ttlMs);

    // 计算总请求次数（当前请求 + 有效历史记录）
    const totalHits = validRecords.length + 1;
    const isBlocked = totalHits > limit;

    // 添加当前请求时间戳并保存到 Redis
    validRecords.push(now);
    await this.redisService.set(key, JSON.stringify(validRecords), ttl);

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
