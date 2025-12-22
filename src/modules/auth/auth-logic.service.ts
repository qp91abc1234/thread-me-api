import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, Role, Permission } from '@prisma/client';

export type UserWithRelations = User & {
  roles?: (Role & { permissions?: Permission[] })[];
};

@Injectable()
export class AuthLogicService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  sign(user: UserWithRelations) {
    const permissions = [
      ...new Set(
        user.roles?.flatMap((role) =>
          role.permissions?.map((permission) => permission.name),
        ),
      ),
    ].filter(Boolean);

    const data = {
      userId: user.id,
      permissions,
    };

    const token = this.jwtService.sign(data, {
      expiresIn:
        this.configService.get('JWT_ACCESS_TOKEN_EXPIRE_TIME') || '30m',
    });

    const refreshToken = this.jwtService.sign(data, {
      expiresIn:
        this.configService.get('JWT_REFRESH_TOKEN_EXPIRE_TIME') || '7d',
    });

    return {
      token,
      refreshToken,
    };
  }
}
