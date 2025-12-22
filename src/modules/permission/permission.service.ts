import { Injectable } from '@nestjs/common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { BusinessExceptions } from '../../common/utils/exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = await this.findOne(createPermissionDto.name);
    if (permission) {
      throw BusinessExceptions.EXIST(`权限 ${createPermissionDto.name} `);
    }
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.permission.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.permission.count(),
    ]);
    return { list, total };
  }

  async findOne(idorname: number | string) {
    const permission = await this.prisma.permission.findUnique({
      where:
        typeof idorname === 'number' ? { id: idorname } : { name: idorname },
    });
    if (!permission) {
      throw BusinessExceptions.NO_PERMISSION();
    }
    return permission;
  }

  async update(updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(updatePermissionDto.id);
    return this.prisma.permission.update({
      where: { id: updatePermissionDto.id },
      data: updatePermissionDto,
    });
  }

  async remove(id: number) {
    const permission = await this.findOne(id);
    if (permission.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN();
    }
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
