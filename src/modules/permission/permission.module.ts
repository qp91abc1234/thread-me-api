import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionLogicService } from './permission-logic.service';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionLogicService],
  exports: [PermissionLogicService],
})
export class PermissionModule {}
