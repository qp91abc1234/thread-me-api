import { Injectable } from '@nestjs/common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { BusinessExceptions } from 'src/common/utils/exception';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: {
        name: createPermissionDto.name,
      },
    });
    if (permission) {
      throw BusinessExceptions.EXIST(`权限 ${createPermissionDto.name} `);
    }
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  findList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return Promise.all([
      this.prisma.permission.findMany({
        skip,
        take: pageSize,
        orderBy: {
          id: 'desc',
        },
      }),
      this.prisma.permission.count(),
    ]);
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
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
      throw BusinessExceptions.NO_AUTH();
    }
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
