import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthLogicService } from './auth-logic.service';
import { UserLogicService } from 'src/user/user-logic.service';
import { Profile } from 'passport-github2';
import { RedisService } from 'src/redis/redis.service';
import { BusinessExceptions } from 'src/common/utils/exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userLogicService: UserLogicService,
    private readonly authLogicService: AuthLogicService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async githubLogin(profile: Profile) {
    const user = await this.userLogicService.create(
      {
        username: profile.username || '',
      },
      { skipThrow: true },
    );
    return this.authLogicService.sign(user);
  }

  async refresh(refreshToken: string) {
    const isUsed = await this.redisService.get(`used:${refreshToken}`);
    if (isUsed) {
      throw BusinessExceptions.TOKEN_REUSED();
    }

    const data = this.jwtService.verify(refreshToken);
    const user = await this.userLogicService.findOne(data.userId, {
      permissions: true,
    });
    const remainingSeconds = data.exp - Math.floor(Date.now() / 1000);

    await this.redisService.set(`used:${refreshToken}`, '1', remainingSeconds);
    return this.authLogicService.sign(user);
  }
}
