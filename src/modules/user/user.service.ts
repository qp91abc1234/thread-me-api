import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessExceptions } from '../../common/utils/exception/business.exception';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryParamsDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(params: UserQueryParamsDto) {
    const { username, status, currentPage, pageSize } = params;

    let paginationParams: { skip?: number; take?: number } = {};
    if (currentPage !== undefined && pageSize !== undefined) {
      paginationParams = { skip: (currentPage - 1) * pageSize, take: pageSize };
    }

    const where: any = {};
    if (username) {
      where.username = { contains: username };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...paginationParams,
        omit: {
          password: true,
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createTime: 'asc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 转换数据格式，将 roles 转换为 roleIds
    const formattedList = list.map((user) => {
      const { roles, ...userWithoutRoles } = user;
      return {
        ...userWithoutRoles,
        roleIds: roles.map((role) => role.id),
      };
    });

    return {
      list: formattedList,
      total,
    };
  }

  async getDetail(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw BusinessExceptions.NO_USER();
    }

    const { roles, ...userWithoutRoles } = user;
    return {
      ...userWithoutRoles,
      roleIds: roles.map((role) => role.id),
    };
  }

  async create(createUserDto: CreateUserDto) {
    const { password, roleIds, ...userData } = createUserDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw BusinessExceptions.EXIST('用户名');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        roles: roleIds
          ? {
              connect: roleIds.map((id) => ({ id })),
            }
          : undefined,
      },
      omit: {
        password: true,
      },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { roles, ...userWithoutRoles } = user;
    return {
      ...userWithoutRoles,
      roleIds: roles.map((role) => role.id),
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw BusinessExceptions.NO_USER();
    }

    if (existingUser.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('系统用户不能修改');
    }

    // 如果更新用户名，检查是否冲突
    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const conflictUser = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });

      if (conflictUser) {
        throw BusinessExceptions.EXIST('用户名');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const { roleIds, ...updateData } = updateUserDto;

    // 更新用户
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        roles:
          roleIds !== undefined
            ? {
                set: roleIds.map((roleId) => ({ id: roleId })),
              }
            : undefined,
      },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { roles, ...userWithoutRoles } = user;
    return {
      ...userWithoutRoles,
      roleIds: roles.map((role) => role.id),
    };
  }

  async delete(id: number) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw BusinessExceptions.NO_USER();
    }

    // 系统用户不能删除
    if (user.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('系统用户不能删除');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return true;
  }
}
