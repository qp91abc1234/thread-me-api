import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BusinessExceptions } from '../../../common/utils/exception/business.exception';
import { UserLogicService } from '../../user/user-logic.service';
import * as bcrypt from 'bcrypt';

/**
 * Local 策略
 *
 * 通过授权守卫（Guard）调用，用于验证用户名和密码
 * 工作流程：
 * 1. 从请求体中提取 username 和 password
 * 2. 在 validate 方法中实现用户名和密码的验证
 * 3. 如果验证成功，将返回的用户信息添加到 req.user
 * 4. 如果验证失败，则抛出 BusinessExceptions.PWD_ERR() 异常
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
