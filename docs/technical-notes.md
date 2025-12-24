# 技术说明

## 环境变量加载机制

按顺序加载环境变量文件，后面的文件会覆盖前面文件中相同的变量。

如果文件不存在，不会报错，会跳过继续加载下一个文件。

优先级从高到低：
1. `.env.${NODE_ENV}.local` (本地覆盖，通常不提交到 Git)
2. `.env.${NODE_ENV}` (环境特定配置)
3. `.env` (默认配置，所有环境共享)

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

