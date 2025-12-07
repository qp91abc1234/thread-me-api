import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategy/local.strategy';
import { GithubStrategy } from './strategy/github.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthLogicService } from './auth-logic.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthLogicService,
    {
      provide: JwtStrategy,
      useFactory: (configService: ConfigService) => {
        return new JwtStrategy(configService);
      },
      inject: [ConfigService],
    },
    LocalStrategy,
    {
      provide: GithubStrategy,
      useFactory: (configService: ConfigService) => {
        return new GithubStrategy(configService);
      },
      inject: [ConfigService],
    },
  ],
})
export class AuthModule {}
