import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GitHub 授权守卫
 *
 * 仅在 /auth/github-login 路由中使用，用于动态添加授权选项（如 state 参数）
 * 该选项会与 GithubStrategy 中的静态选项合并，用于生成 GitHub 授权 URL
 */
@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const state = request.query.state;

    return {
      state, // 横跨整个登录流程：在 github 回调 URL 中通过 query 参数原样返回
    };
  }
}
