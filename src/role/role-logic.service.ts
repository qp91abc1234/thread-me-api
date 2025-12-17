import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleLogicService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(ids: number[]) {
    return this.prisma.role.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  findOne(idorname: number | string, includes: { permissions?: boolean } = {}) {
    const permissionsConfig = includes.permissions
      ? { permissions: true }
      : undefined;
    return this.prisma.role.findUnique({
      where:
        typeof idorname === 'number' ? { id: idorname } : { name: idorname },
      include: permissionsConfig,
    });
  }
}
