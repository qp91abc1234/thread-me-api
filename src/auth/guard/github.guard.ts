import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  // 获取授权选项：用于生成 GitHub 授权 URL，该选项会与 GithubStrategy 中的静态选项合并
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const state = request.query.state;

    return {
      state, // 横跨整个登录流程：在 github 回调 URL 中通过 query 参数原样返回
    };
  }
}
