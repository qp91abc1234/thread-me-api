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
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthLogicService, UserWithRelations } from './auth-logic.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authLogicService: AuthLogicService,
  ) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(
    @Body() _loginUserDto: LoginUserDto,
    @Request() req: { user: UserWithRelations },
  ): Promise<LoginUserVo> {
    return await this.authLogicService.sign(req.user);
  }

  @Get('github-login')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {}

  @Get('github-callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(
    @Query('state') state: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const result = await this.authService.githubLogin(req.user);
    res.redirect(
      `${state}/auth/callback#token=${result.token}&refreshToken=${result.refreshToken}`,
    );
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenVo> {
    return await this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
