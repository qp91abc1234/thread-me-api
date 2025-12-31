import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserLogicService } from './user-logic.service';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [UserService, UserLogicService],
  exports: [UserLogicService],
})
export class UserModule {}
