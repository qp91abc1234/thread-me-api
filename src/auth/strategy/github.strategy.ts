import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

/**
 * GitHub OAuth 策略
 *
 * 通过授权守卫（Guard）调用，该策略在 github 登录流程中会被调用两次：
 * 1. 第一次：在 /auth/github-login 路由中，根据授权选项构建 GitHub 授权 URL 并重定向
 * 2. 第二次：在 /auth/github-callback 路由中，使用回调 URL 中的 code 换取用户信息，
 *    获取用户信息后调用 validate 方法，返回值会被添加到 req.user 中
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
