import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessExceptions } from '../utils/exception/business.exception';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: { userId: number; roleIds: number[] };
      method: string;
      route: { path: string };
    }>();

    // 如果没有用户信息，跳过权限检查（由 JwtGuard 处理认证）
    if (!request.user) {
      return true;
    }

    const { method, route } = request;
    const { roleIds } = request.user;

    // 如果没有角色，拒绝访问
    if (!roleIds || roleIds.length === 0) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('用户未分配角色');
    }

    // 尝试从 Redis 获取权限，如果缓存不存在则从数据库查询
    const permissions = await this.getUserPermissions(roleIds);
    // 检查是否有匹配的权限
    const hasPermission = this.checkPermissionMatch(
      permissions,
      method,
      route.path,
    );

    if (!hasPermission) {
      throw BusinessExceptions.OPERATION_FORBIDDEN(
        `缺少访问 ${method}:${route.path} 的权限`,
      );
    }

    return true;
  }

  /**
   * 获取用户权限（优先从 Redis，不存在则从数据库查询）
   */
  private async getUserPermissions(roleIds: number[]): Promise<string[]> {
    const allPermissions = new Set<string>();

    // 验证角色是否存在（过滤已删除的角色）
    const existingRoles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      include: {
        apiPermissions: true,
      },
    });

    // 如果所有角色都被删除，返回空权限
    if (existingRoles.length === 0) {
      return [];
    }

    const existingRoleIds = existingRoles.map((role) => role.id);

    // 尝试从 Redis 获取每个角色的权限
    const cachePromises = existingRoleIds.map(async (roleId) => {
      const cached = await this.redisService.get<string[]>(
        `role:${roleId}:permissions`,
      );
      return { roleId, permissions: cached };
    });

    const cacheResults = await Promise.all(cachePromises);

    // 处理缓存命中和未命中的角色
    const rolesNeedingDbQuery: number[] = [];

    for (const result of cacheResults) {
      if (result.permissions) {
        // 缓存命中，直接使用
        result.permissions.forEach((perm) => allPermissions.add(perm));
      } else {
        // 缓存未命中，需要从数据库查询
        rolesNeedingDbQuery.push(result.roleId);
      }
    }

    // 如果部分角色缓存未命中，从数据库查询并更新缓存
    if (rolesNeedingDbQuery.length > 0) {
      const rolesFromDb = await this.prisma.role.findMany({
        where: { id: { in: rolesNeedingDbQuery } },
        include: {
          apiPermissions: true,
        },
      });

      for (const role of rolesFromDb) {
        const rolePermissions = role.apiPermissions.map(
          (perm) => `${perm.method}:${perm.path}:${perm.matchType}`,
        );

        // 添加到权限集合
        rolePermissions.forEach((perm) => allPermissions.add(perm));

        // 更新 Redis 缓存
        await this.redisService.set(
          `role:${role.id}:permissions`,
          rolePermissions,
        );
      }
    }

    return Array.from(allPermissions);
  }

  /**
   * 检查权限匹配
   * 权限格式：${method}:${path} 或 ${method}:${path}:${matchType}
   */
  private checkPermissionMatch(
    permissions: string[],
    requestMethod: string,
    requestPath: string,
  ): boolean {
    return permissions.some((perm) => {
      const firstColonIndex = perm.indexOf(':');
      const lastColonIndex = perm.lastIndexOf(':');
      const permMethod = perm.substring(0, firstColonIndex);
      const permPath = perm.substring(firstColonIndex + 1, lastColonIndex);
      const matchType = perm.substring(lastColonIndex + 1);

      // 方法必须匹配
      if (permMethod !== requestMethod) {
        return false;
      }

      // 根据 matchType 进行匹配
      if (matchType === 'exact') {
        // 精确匹配
        return permPath === requestPath;
      } else if (matchType === 'prefix') {
        // 前缀匹配：权限路径是请求路径的前缀
        // 例如：/user 可以匹配 /user/list, /user/1 等
        return (
          requestPath.startsWith(permPath + '/') || requestPath === permPath
        );
      }

      return false;
    });
  }
}
