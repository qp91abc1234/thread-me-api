import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequirePermission } from './common/decorator/common.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RequirePermission('zcc1')
  getHello() {
    return this.appService.getHello();
  }
}
