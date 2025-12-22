import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { UserLogicService } from './user-logic.service';

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [UserService, UserLogicService],
  exports: [UserLogicService],
})
export class UserModule {}
