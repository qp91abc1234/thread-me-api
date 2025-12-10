import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
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

  async login(user: User) {
    return this.authLogicService.sign(user);
  }

  async githubLogin(profile: Profile) {
    const user = await this.userLogicService.create(profile);
    return this.authLogicService.sign(user);
  }

  async refresh(refreshToken: string) {
    const data = this.jwtService.verify(refreshToken);
    // 检查 token 是否已被使用
    const isUsed = await this.redisService.get(`used:${refreshToken}`);
    if (isUsed) {
      throw BusinessExceptions.TOKEN_REUSED(); // token 被重复使用，可能被盗
    }

    const user = await this.userLogicService.findOneWithPermissions(
      data.userId,
    );

    // JWT 的 exp 是 Unix 时间戳（秒）
    const remainingSeconds = data.exp - Math.floor(Date.now() / 1000);

    // 标记为已使用（7天过期）
    await this.redisService.set(`used:${refreshToken}`, '1', remainingSeconds);
    return this.authLogicService.sign(user);
  }
}
