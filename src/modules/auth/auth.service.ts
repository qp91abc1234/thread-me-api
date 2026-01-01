import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthLogicService } from './auth-logic.service';
import { Profile } from 'passport-github2';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { BusinessExceptions } from '../../common/utils/exception/business.exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authLogicService: AuthLogicService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async githubLogin(profile: Profile) {
    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { username: profile.username || '' },
      include: {
        roles: {
          select: { id: true, apiPermissions: true },
        },
      },
    });

    if (!user) {
      // 创建新用户
      const defaultPassword = this.configService.get('OAUTH_DEFAULT_PASSWORD');
      const defaultRoleName = this.configService.get('OAUTH_DEFAULT_ROLE_NAME');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      user = await this.prisma.user.create({
        data: {
          username: profile.username || '',
          password: hashedPassword,
          realName: profile.displayName || profile.username || '',
          email: profile.emails?.[0]?.value || '',
          phone: '',
          roles: {
            connect: {
              name: defaultRoleName,
            },
          },
        },
        include: {
          roles: {
            select: { id: true },
            include: { apiPermissions: true },
          },
        },
      });
    }

    // 提取每个角色的权限信息
    const rolePermissions = user.roles.map((role) => ({
      roleId: role.id,
      apiPermissions: role.apiPermissions.map(
        (perm) => `${perm.method}:${perm.path}:${perm.matchType}`,
      ),
    }));

    const userForAuth = {
      ...user,
      password: undefined,
      roles: undefined,
      roleIds: user.roles.map((role) => role.id),
      rolePermissions,
    };

    return this.authLogicService.sign(userForAuth);
  }

  async refresh(refreshToken: string) {
    const isUsed = await this.redisService.get(`used:${refreshToken}`);
    if (isUsed) {
      throw BusinessExceptions.TOKEN_REUSED();
    }

    const data = this.jwtService.verify(refreshToken) as {
      exp: number;
      userId: number;
      roleIds: number[];
    };

    // 查询用户及其权限
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        roles: {
          select: { id: true, apiPermissions: true },
        },
      },
    });

    if (!user) {
      throw BusinessExceptions.NO_USER();
    }

    // 提取每个角色的权限信息
    const rolePermissions = user.roles.map((role) => ({
      roleId: role.id,
      apiPermissions: role.apiPermissions.map(
        (perm) => `${perm.method}:${perm.path}:${perm.matchType}`,
      ),
    }));

    const userForAuth = {
      ...user,
      password: undefined,
      roles: undefined,
      roleIds: user.roles.map((role) => role.id),
      rolePermissions,
    };

    // 将续签 token 标记为已使用
    const remainingSeconds = data.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`used:${refreshToken}`, '1', {
      ttl: remainingSeconds,
    });

    return this.authLogicService.sign(userForAuth);
  }
}
