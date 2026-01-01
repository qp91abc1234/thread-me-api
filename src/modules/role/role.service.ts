import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessExceptions } from '../../common/utils/exception/business.exception';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryParamsDto,
  RolePermissionDto,
} from './dto/role.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getList(params: RoleQueryParamsDto) {
    const { name, status, currentPage, pageSize } = params;

    let paginationParams: { skip?: number; take?: number } = {};
    if (currentPage !== undefined && pageSize !== undefined) {
      paginationParams = { skip: (currentPage - 1) * pageSize, take: pageSize };
    }

    const where: any = {};
    if (name) {
      where.name = { contains: name };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        ...paginationParams,
        orderBy: {
          createTime: 'desc',
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      list,
      total,
    };
  }

  async getDetail(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    // 检查角色名是否已存在
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw BusinessExceptions.EXIST('角色名');
    }

    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        status: createRoleDto.status,
      },
    });

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw BusinessExceptions.NO_ROLE();
    }

    // 如果更新角色名，检查是否冲突
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const conflictRole = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (conflictRole) {
        throw BusinessExceptions.EXIST('角色名');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    return role;
  }

  async delete(id: number) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }

    // 系统角色不能删除
    if (role.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('系统角色不能删除');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    await this.redisService.del(`role:${id}:permissions`);

    return true;
  }

  async getPermissions(id: number) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        menus: {
          select: {
            id: true,
          },
        },
        apiPermissions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }

    return {
      menuIds: role.menus.map((menu) => menu.id),
      apiPermissionIds: role.apiPermissions.map((api) => api.id),
    };
  }

  async assignPermissions(id: number, permissions: RolePermissionDto) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }

    // 验证菜单是否存在
    if (permissions.menuIds.length > 0) {
      const menuCount = await this.prisma.menu.count({
        where: {
          id: { in: permissions.menuIds },
        },
      });

      if (menuCount !== permissions.menuIds.length) {
        throw BusinessExceptions.NO_PERMISSION('部分菜单不存在');
      }
    }

    // 验证API权限是否存在
    if (permissions.apiPermissionIds.length > 0) {
      const apiCount = await this.prisma.apiPermission.count({
        where: {
          id: { in: permissions.apiPermissionIds },
        },
      });

      if (apiCount !== permissions.apiPermissionIds.length) {
        throw BusinessExceptions.NO_PERMISSION('部分API权限不存在');
      }
    }

    // 更新角色权限
    await this.prisma.role.update({
      where: { id },
      data: {
        menus: {
          set: permissions.menuIds.map((menuId) => ({ id: menuId })),
        },
        apiPermissions: {
          set: permissions.apiPermissionIds.map((apiId) => ({ id: apiId })),
        },
      },
    });

    // 清除该角色的权限缓存，强制下次登录时重新加载
    await this.redisService.del(`role:${id}:permissions`);

    return true;
  }
}
