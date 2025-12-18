import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { BusinessExceptions } from 'src/common/utils/exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UserLogicService } from './user-logic.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userLogicService: UserLogicService,
  ) {}

  async findList(
    page: number,
    pageSize: number,
    options: { roles?: boolean; permissions?: boolean } = {},
  ) {
    const skip = (page - 1) * pageSize;
    const rolesConfig = this.userLogicService.getRolesConfig(options);

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        omit: this.userLogicService.omitFields,
        skip,
        take: pageSize,
        orderBy: {
          id: 'desc',
        },
        include: { roles: rolesConfig },
      }),
      this.prisma.user.count(),
    ]);

    return { list, total };
  }

  async findOne(
    idorname: number | string,
    options: { roles?: boolean; permissions?: boolean } = {},
  ) {
    const user = await this.userLogicService.findOne(idorname, options);
    if (!user) {
      throw BusinessExceptions.NO_USER();
    }
    return user;
  }

  async update(updateUserDto: UpdateUserDto) {
    await this.findOne(updateUserDto.id);

    await this.userLogicService.validateRoles(updateUserDto.roleIds);

    const data: Prisma.UserUpdateInput = {
      ...updateUserDto,
    };

    if (updateUserDto.password) {
      data.password = await this.userLogicService.hashPassword(
        updateUserDto.password,
      );
    }

    if (updateUserDto.roleIds) {
      data.roles = {
        set: updateUserDto.roleIds.map((id) => ({ id })),
      };
    }

    return this.prisma.user.update({
      where: { id: updateUserDto.id },
      data,
      omit: this.userLogicService.omitFields,
      include: { roles: { include: { permissions: true } } },
    });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (user.isSystem) {
      throw BusinessExceptions.NO_AUTH();
    }
    return this.prisma.user.delete({
      where: { id },
      omit: this.userLogicService.omitFields,
    });
  }
}
