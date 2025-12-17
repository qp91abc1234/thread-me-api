import { Injectable } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { BusinessExceptions } from 'src/common/utils/exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleLogicService } from './role-logic.service';
import { PermissionLogicService } from 'src/permission/permission-logic.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleLogicService: RoleLogicService,
    private readonly permissionLogicService: PermissionLogicService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const existRole = await this.roleLogicService.findOne(createRoleDto.name);
    if (existRole) {
      throw BusinessExceptions.EXIST(`角色 ${createRoleDto.name} `);
    }

    // 校验权限是否存在
    if (createRoleDto.permissionIds?.length > 0) {
      const permissions = await this.permissionLogicService.findMany(
        createRoleDto.permissionIds,
      );

      if (permissions.length !== createRoleDto.permissionIds.length) {
        const existIds = permissions.map((p) => p.id);
        const notFoundIds = createRoleDto.permissionIds.filter(
          (id) => !existIds.includes(id),
        );
        throw BusinessExceptions.NO_PERMISSION(
          `权限ID不存在: ${notFoundIds.join(', ')}`,
        );
      }
    }

    return this.prisma.role.create({
      data: {
        ...createRoleDto,
        permissions: createRoleDto.permissionIds
          ? { connect: createRoleDto.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });
  }

  async findList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.role.count(),
    ]);
    return { list, total };
  }

  async findOne(idorname: number | string) {
    const role = await this.roleLogicService.findOne(idorname);
    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }
    return role;
  }

  async update(updateRoleDto: UpdateRoleDto) {
    await this.findOne(updateRoleDto.id);

    // 校验权限是否存在
    if (updateRoleDto.permissionIds?.length > 0) {
      const permissions = await this.permissionLogicService.findMany(
        updateRoleDto.permissionIds,
      );

      if (permissions.length !== updateRoleDto.permissionIds.length) {
        const existIds = permissions.map((p) => p.id);
        const notFoundIds = updateRoleDto.permissionIds.filter(
          (id) => !existIds.includes(id),
        );
        throw BusinessExceptions.NO_PERMISSION(
          `权限ID不存在: ${notFoundIds.join(', ')}`,
        );
      }
    }

    return this.prisma.role.update({
      where: { id: updateRoleDto.id },
      data: {
        ...updateRoleDto,
        permissions: updateRoleDto.permissionIds
          ? { set: updateRoleDto.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw BusinessExceptions.NO_AUTH();
    }
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
