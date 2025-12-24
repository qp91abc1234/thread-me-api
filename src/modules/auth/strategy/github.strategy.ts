import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

/**
 * GitHub OAuth 策略
 * @see docs/auth-strategies.md#github-oauth-策略
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_SECRET'),
      // 此处路径需要与 GitHub → Settings → Developer settings → OAuth Apps 中路径一致
      callbackURL: configService.get('APP_URL') + '/auth/github-callback',
      // 请求访问用户公开资料
      scope: ['read:user'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    return profile;
  }
}
