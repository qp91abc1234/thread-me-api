import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BusinessExceptions } from '../../../common/utils/exception/business.exception';
import { UserLogicService } from '../../user/user-logic.service';
import * as bcrypt from 'bcrypt';

/**
 * Local 策略
 * @see docs/auth-strategies.md#local-策略
 */
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
