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
   * @param key 限流键，ex.throttler:default:IP
   * @param ttl 时间窗口（毫秒）
   * @param limit 限制次数
   * @param blockDuration 阻塞时长（毫秒）：当请求超过限制时，额外阻塞的时间
   * @param throttlerName 限流规则名称，ex.default
   * @returns
   * {
   *   totalHits: number; // 时间窗口内的请求次数
   *   isBlocked: boolean; // 是否被阻塞（超过限制次数）
   *   timeToExpire: number; // 最早的有效记录过期时间（秒），过期后计数会减少
   *   timeToBlockExpire: number; // 阻塞剩余时间（秒），阻塞期间如有新请求，阻塞时间会重置
   * }
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    // eslint-disable-next-line
    throttlerName: string,
  ) {
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
