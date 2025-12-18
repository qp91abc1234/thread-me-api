import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BusinessExceptions } from 'src/common/utils/exception';
import { UserLogicService } from 'src/user/user-logic.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly userLogicService: UserLogicService) {
    super();
  }

  async validate(username: string, password: string) {
    const user = await this.userLogicService.findOne(username, {
      permissions: true,
    });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw BusinessExceptions.PWD_ERR();
    }
    return user;
  }
}
