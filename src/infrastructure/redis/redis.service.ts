import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { PROVIDE_KEY } from '../../common/constant/constant';

export interface CacheOptions {
  /** 过期时间（秒） */
  ttl?: number;
  /** 缓存键前缀 */
  prefix?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(PROVIDE_KEY.REDIS_CLIENT) private redisClient: RedisClientType,
  ) {}

  // 优雅关闭
  onModuleDestroy() {
    this.redisClient.disconnect().catch(() => {
      // 忽略断开连接时的错误（可能已经断开）
    });
  }

  /**
   * 获取缓存值（自动反序列化）
   * @param key 缓存键
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    // key 不存在时，redisClient.get() 返回 null
    if (value === null) {
      return null;
    }

    // 特殊处理：undefined 存储为字符串 "undefined"，需要还原
    if (value === 'undefined') {
      return undefined as T;
    }

    // 统一使用 JSON 反序列化，保证类型恢复（布尔、数字、对象、数组等）
    try {
      return JSON.parse(value) as T;
    } catch {
      // 兼容不规范的遗留数据: 如果不是有效的 JSON，返回原始字符串值
      return value as T;
    }
  }

  /**
   * 设置缓存值（自动序列化）
   * 优化：利用 SET 命令的原生参数实现原子性操作
   * @param key 缓存键
   * @param value 缓存值
   * @param options 选项
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    /**
     * 序列化处理说明：
     * node-redis 的 get/set 操作针对字符串数据，set 方法会使用 String() 函数对传入的 value 进行类型转换。
     * 这种转换方式会导致数据丢失和类型丢失：
     * - 对象 { id: 1 } → String() → "[object Object]" ❌ 数据丢失
     * - 数组 [1, 2, 3] → String() → "1,2,3" ⚠️ 无法区分字符串和数组
     *
     * 因此统一使用 JSON 序列化：
     * - 所有类型都使用 JSON.stringify()，保证类型恢复：get() 时能正确还原原始类型
     * - 特殊情况：undefined
     *   - JSON.stringify(undefined) 返回 undefined（不是字符串）
     *   - 会由 node-redis 底层 String() 处理，存储为 "undefined" 字符串
     *   - 获取值时需要在 get() 方法中特殊处理，将 "undefined" 还原为 undefined
     */
    const serializedValue = JSON.stringify(value);

    const finalKey = options?.prefix ? `${options.prefix}${key}` : key;
    if (options?.ttl) {
      await this.redisClient.set(finalKey, serializedValue, {
        EX: options.ttl,
      });
    } else {
      await this.redisClient.set(finalKey, serializedValue);
    }
  }

  /**
   * 删除缓存（支持前缀）
   * @param key 缓存键
   * @param prefix 键前缀
   */
  async del(key: string, prefix?: string): Promise<void> {
    const finalKey = prefix ? `${prefix}${key}` : key;
    await this.redisClient.del(finalKey);
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @param prefix 键前缀
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    const finalKey = prefix ? `${prefix}${key}` : key;
    const value = await this.redisClient.get(finalKey);
    return value !== null;
  }

  /**
   * 设置缓存并返回旧值
   * @param key 缓存键
   * @param value 新值
   * @param options 选项
   */
  async getSet<T = any>(
    key: string,
    value: any,
    options?: CacheOptions,
  ): Promise<T | null> {
    const oldValue = await this.get<T>(key);
    await this.set(key, value, options);
    return oldValue;
  }

  /**
   * 增加缓存值（原子操作）
   * @param key 缓存键
   * @param increment 增量，默认为 1
   * @param options 选项
   */
  async increment(
    key: string,
    increment: number = 1,
    options?: CacheOptions,
  ): Promise<number> {
    const finalKey = options?.prefix ? `${options.prefix}${key}` : key;

    // 使用 Redis 的 INCRBY 命令（原子操作）
    const newValue = await this.redisClient.incrBy(finalKey, increment);

    // 如果设置了 TTL，需要更新过期时间
    if (options?.ttl) {
      await this.redisClient.expire(finalKey, options.ttl);
    }

    return newValue;
  }

  /**
   * 减少缓存值（原子操作）
   * @param key 缓存键
   * @param decrement 减量，默认为 1
   * @param options 选项
   */
  async decrement(
    key: string,
    decrement: number = 1,
    options?: CacheOptions,
  ): Promise<number> {
    return this.increment(key, -decrement, options);
  }
}
