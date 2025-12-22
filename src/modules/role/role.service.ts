import { Injectable } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { BusinessExceptions } from '../../common/utils/exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RoleLogicService } from './role-logic.service';
import { PermissionLogicService } from '../permission/permission-logic.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleLogicService: RoleLogicService,
    private readonly permissionLogicService: PermissionLogicService,
  ) {}

  private async validatePermissions(permissionIds: number[]) {
    if (!permissionIds || permissionIds.length === 0) return;

    const permissions =
      await this.permissionLogicService.findMany(permissionIds);

    if (permissions.length !== permissionIds.length) {
      const existIds = permissions.map((p) => p.id);
      const notFoundIds = permissionIds.filter((id) => !existIds.includes(id));
      throw BusinessExceptions.NO_PERMISSION(
        `没有对应的权限: ${notFoundIds.join(', ')}`,
      );
    }
  }

  async create(createRoleDto: CreateRoleDto) {
    const existRole = await this.roleLogicService.findOne(createRoleDto.name);
    if (existRole) {
      throw BusinessExceptions.EXIST(`角色 ${createRoleDto.name} `);
    }

    // 校验权限是否存在
    await this.validatePermissions(createRoleDto.permissionIds);

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

  async findList(
    page: number,
    pageSize: number,
    options: { permissions?: boolean } = {},
  ) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: options.permissions ? { permissions: true } : undefined,
      }),
      this.prisma.role.count(),
    ]);
    return { list, total };
  }

  async update(updateRoleDto: UpdateRoleDto) {
    await this.roleLogicService.findOne(updateRoleDto.id);

    // 校验权限是否存在
    await this.validatePermissions(updateRoleDto.permissionIds);

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
    const role = await this.roleLogicService.findOne(id);
    if (role.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN();
    }
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
