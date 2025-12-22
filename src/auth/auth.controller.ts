import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import {
  LoginUserDto,
  LoginUserVo,
  RefreshTokenDto,
  RefreshTokenVo,
} from './dto/auth.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthLogicService, UserWithRelations } from './auth-logic.service';
import { GithubAuthGuard } from './guard/github.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authLogicService: AuthLogicService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 1分钟内最多5次登录尝试
  @UseGuards(AuthGuard('local'))
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Request() req: { user: UserWithRelations },
  ): Promise<LoginUserVo> {
    return await this.authLogicService.sign(req.user);
  }

  @Get('github-login')
  @UseGuards(GithubAuthGuard)
  // eslint-disable-next-line
  async githubLogin(@Query('state') _state: string) {}

  @Get('github-callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Request() req, @Res() res: Response) {
    const { token, refreshToken } = await this.authService.githubLogin(
      req.user,
    );
    res.redirect(
      `${req.query.state}/auth/callback#token=${token}&refreshToken=${refreshToken}`,
    );
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenVo> {
    return await this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
