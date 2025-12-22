import { Injectable } from '@nestjs/common';
import { BusinessExceptions } from '../../common/utils/exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class RoleLogicService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(ids: number[], options: { permissions?: boolean } = {}) {
    const permissionsConfig = options.permissions
      ? { permissions: true }
      : undefined;
    return this.prisma.role.findMany({
      where: {
        id: { in: ids },
      },
      include: permissionsConfig,
    });
  }

  async findOne(
    idorname: number | string,
    options: { permissions?: boolean } = {},
  ) {
    const permissionsConfig = options.permissions
      ? { permissions: true }
      : undefined;
    const role = await this.prisma.role.findUnique({
      where:
        typeof idorname === 'number' ? { id: idorname } : { name: idorname },
      include: permissionsConfig,
    });

    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }

    return role;
  }
}
