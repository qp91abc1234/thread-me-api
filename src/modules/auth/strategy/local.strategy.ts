import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BusinessExceptions } from '../../../common/utils/exception/business.exception';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

/**
 * Local 策略
 * @see docs/auth-strategies.md#local-策略
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async validate(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          select: { id: true },
          include: { apiPermissions: true },
        },
      },
    });

    if (!user) {
      throw BusinessExceptions.NO_USER();
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw BusinessExceptions.PWD_ERR();
    }

    // 提取每个角色的API权限信息（用于缓存）
    const rolePermissions = user.roles.map((role) => ({
      roleId: role.id,
      permissions: role.apiPermissions.map(
        (perm) => `${perm.method}:${perm.path}`,
      ),
    }));

    return {
      ...user,
      password: undefined,
      roles: undefined,
      roleIds: user.roles.map((role) => role.id),
      rolePermissions, // 每个角色的权限信息
    };
  }
}
