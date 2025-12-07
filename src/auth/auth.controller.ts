import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
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
import { User } from 'src/user/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(
    @Body() _loginUserDto: LoginUserDto,
    @Request() req: { user: User },
  ): Promise<LoginUserVo> {
    return await this.authService.login(req.user);
  }

  @Get('github-login')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {}

  @Get('github-callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Request() req) {
    return await this.authService.githubLogin(req.user);
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenVo> {
    return await this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
