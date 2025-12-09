import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { httpExceptionMap } from 'src/common/utils/exception';
import { UserLogicService } from 'src/user/user-logic.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly userLogicService: UserLogicService) {
    super();
  }

  async validate(username: string, password: string) {
    const user = await this.userLogicService.findOneWithPermissions(username);
    if (user.password !== password) {
      throw httpExceptionMap.PWD_ERR();
    }
    return user;
  }
}
