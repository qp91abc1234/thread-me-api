import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleLogicService } from './role-logic.service';
import { PermissionModule } from 'src/permission/permission.module';

@Module({
  imports: [PermissionModule],
  controllers: [RoleController],
  providers: [RoleService, RoleLogicService],
  exports: [RoleLogicService],
})
export class RoleModule {}
