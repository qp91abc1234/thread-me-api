import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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

  findOne(idorname: number | string, options: { permissions?: boolean } = {}) {
    const permissionsConfig = options.permissions
      ? { permissions: true }
      : undefined;
    return this.prisma.role.findUnique({
      where:
        typeof idorname === 'number' ? { id: idorname } : { name: idorname },
      include: permissionsConfig,
    });
  }
}
