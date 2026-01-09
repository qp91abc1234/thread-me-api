import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireNoLogin } from './common/decorator/common.decorator';

@Controller()
@RequireNoLogin()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
