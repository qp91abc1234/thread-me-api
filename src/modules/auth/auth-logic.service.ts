import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'prisma/generated/client';
import { RedisService } from '../../infrastructure/redis/redis.service';

export type RolePermission = {
  roleId: number;
  permissions: string[];
};

export type UserForAuth = Omit<User, 'roles' | 'password'> & {
  roleIds: number[];
  rolePermissions: RolePermission[];
};

@Injectable()
export class AuthLogicService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async sign(user: UserForAuth) {
    const accessTokenExpireTime =
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRE_TIME') || '30m';
    const refreshTokenExpireTime =
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRE_TIME') || '7d';

    // 将每个角色的API权限缓存到Redis
    if (user.rolePermissions && user.rolePermissions.length > 0) {
      await Promise.all(
        user.rolePermissions.map((rolePerm) =>
          this.redisService.set(
            `role:${rolePerm.roleId}:permissions`,
            rolePerm.permissions,
          ),
        ),
      );
    }

    // JWT payload 中只包含必要信息（不包含权限，从Redis读取）
    const jwtPayload = {
      userId: user.id,
      roleIds: user.roleIds,
    };

    const token = this.jwtService.sign(jwtPayload, {
      expiresIn: accessTokenExpireTime,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: refreshTokenExpireTime,
    });

    return {
      token,
      refreshToken,
    };
  }
}
