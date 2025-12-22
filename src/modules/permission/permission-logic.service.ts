import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PermissionLogicService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(ids: number[]) {
    return this.prisma.permission.findMany({
      where: {
        id: { in: ids },
      },
    });
  }
}
