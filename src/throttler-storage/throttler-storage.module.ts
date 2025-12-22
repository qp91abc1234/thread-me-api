import { Module } from '@nestjs/common';
import { ThrottlerStorageService } from './throttler-storage.service';

/**
 * Throttler 存储模块
 * 提供限流存储服务，支持 Redis 分布式存储
 */
@Module({
  providers: [ThrottlerStorageService],
  exports: [ThrottlerStorageService],
})
export class ThrottlerStorageModule {}
