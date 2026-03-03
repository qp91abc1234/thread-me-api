import { createHash } from 'crypto';
import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import { RequireNoLogin } from './common/decorator/common.decorator';

@Controller()
@RequireNoLogin()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * 协商缓存：
   * - 客户端 ETag 与当前一致：返回 304（无响应体）
   * - 不一致：返回 200 + 最新内容，并携带新的 ETag
   */
  @Get('conditional-cache')
  getConditionalCache(@Req() req: Request, @Res() res: Response) {
    const data = this.appService.getHello();

    // 用响应内容（updatedAt + id + version 组合）生成一个稳定版本号（ETag）
    const etag = `"${createHash('sha1').update(String(data)).digest('hex')}"`;

    // 告诉客户端这是可协商缓存
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('ETag', etag);

    // 客户端带来的版本
    const ifNoneMatchHeader = req.headers['if-none-match'];
    const ifNoneMatch = Array.isArray(ifNoneMatchHeader)
      ? ifNoneMatchHeader[0]
      : ifNoneMatchHeader;
    const normalizedIfNoneMatch = ifNoneMatch?.replace(/^W\//, '');

    // 版本一致：返回 304，不返回 body
    if (normalizedIfNoneMatch === etag) {
      return res.status(304).end();
    }

    // 版本不一致：返回最新内容
    return res.status(200).send(data);
  }
}
