# 技术说明

## 环境变量加载机制

按顺序加载环境变量文件，后面的文件会覆盖前面文件中相同的变量。

如果文件不存在，不会报错，会跳过继续加载下一个文件。

优先级从高到低：
1. `.env.${NODE_ENV}.local` (本地覆盖，通常不提交到 Git)
2. `.env.${NODE_ENV}` (环境特定配置)
3. `.env` (默认配置，所有环境共享)

**相关代码位置：** `src/app.module.ts`

## 全局数据验证管道配置

配置说明：
- `transform: true`: 自动将普通 JavaScript 对象转换为 DTO 类实例。
- `whitelist: true`: 自动剔除 DTO 中未定义的属性（过滤多余字段），防止恶意注入无关数据。

**相关代码位置：** `src/app.module.ts`

## Redis 序列化处理

序列化处理说明：

node-redis 的 get/set 操作针对字符串数据，set 方法会使用 String() 函数对传入的 value 进行类型转换。

这种转换方式会导致数据丢失和类型丢失：
- 对象 `{ id: 1 }` → String() → `"[object Object]"` ❌ 数据丢失
- 数组 `[1, 2, 3]` → String() → `"1,2,3"` ⚠️ 无法区分字符串和数组

因此统一使用 JSON 序列化：
- 所有类型都使用 `JSON.stringify()`，保证类型恢复：get() 时能正确还原原始类型
- 特殊情况：undefined
  - `JSON.stringify(undefined)` 返回 undefined（不是字符串）
  - 会由 node-redis 底层 String() 处理，存储为 `"undefined"` 字符串
  - 获取值时需要在 get() 方法中特殊处理，将 `"undefined"` 还原为 undefined

**相关代码位置：** `src/infrastructure/redis/redis.service.ts`

## Throttler 限流存储

Throttler 存储服务是 Redis 存储适配器，用于 Throttler 限流，实现分布式限流计数，支持多实例共享计数。

### increment 方法说明

`increment` 方法用于增加限流计数并返回限流状态。

**参数：**
- `key` (string): 限流键，例如 `throttler:default:IP`
- `ttl` (number): 时间窗口（毫秒）
- `limit` (number): 限制次数
- `blockDuration` (number): 阻塞时长（毫秒），当请求超过限制时，额外阻塞的时间
- `throttlerName` (string): 限流规则名称，例如 `default`

**返回值：**
```typescript
{
  totalHits: number;        // 时间窗口内的请求次数
  isBlocked: boolean;        // 是否被阻塞（超过限制次数）
  timeToExpire: number;     // 最早的有效记录过期时间（秒），过期后计数会减少
  timeToBlockExpire: number; // 阻塞剩余时间（秒），阻塞期间如有新请求，阻塞时间会重置
}
```

**相关代码位置：** `src/infrastructure/throttler-storage/throttler-storage.service.ts`


