import { Module } from '@nestjs/common';
import { ThrottlerStorageService } from './throttler-storage.service';

@Module({
  providers: [ThrottlerStorageService],
  exports: [ThrottlerStorageService],
})
export class ThrottlerStorageModule {}
