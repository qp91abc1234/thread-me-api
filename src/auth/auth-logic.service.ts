import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthLogicService {
  @Inject(JwtService)
  private jwtService: JwtService;
  @Inject(ConfigService)
  private configService: ConfigService;

  sign(user: User) {
    const permissionsMap = {};
    if (user.roles) {
      user.roles.forEach((role) => {
        if (!role.permissions) return;
        role.permissions.forEach((permission) => {
          permissionsMap[permission.name] = true;
        });
      });
    }

    const permissions = Object.keys(permissionsMap);
    const data = {
      userId: user.id,
      permissions,
    };
    const token = this.jwtService.sign(data, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRE_TIME') || '30m',
    });

    const refreshToken = this.jwtService.sign(data, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRE_TIME') || '7d',
    });

    return {
      token,
      refreshToken,
    };
  }
}
