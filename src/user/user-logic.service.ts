import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleLogicService } from 'src/role/role-logic.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { BusinessExceptions } from 'src/common/utils/exception';

@Injectable()
export class UserLogicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly roleLogicService: RoleLogicService,
  ) {}

  readonly omitFields = {
    password: true,
  };

  async hashPassword(password: string): Promise<string> {
    if (!password) return password;

    // bcrypt hash 格式：$2[abxy]$[cost]$[22字符salt][31字符hash]，总长度60
    const bcryptRegex = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

    if (bcryptRegex.test(password)) {
      return password; // 已经是加密的
    }

    return await bcrypt.hash(password, 10);
  }

  async validateRoles(roleIds: number[]) {
    if (!roleIds || roleIds.length === 0) return;

    const roles = await this.roleLogicService.findMany(roleIds);

    if (roles.length !== roleIds.length) {
      const existIds = roles.map((p) => p.id);
      const notFoundIds = roleIds.filter((id) => !existIds.includes(id));
      throw BusinessExceptions.NO_PERMISSION(
        `角色ID不存在: ${notFoundIds.join(', ')}`,
      );
    }
  }

  getRolesConfig(options: { roles?: boolean; permissions?: boolean }) {
    return options.permissions || options.roles
      ? options.permissions
        ? { include: { permissions: true } }
        : true
      : undefined;
  }

  async create(
    data: {
      username: string;
      password?: string;
      roleIds?: number[];
    },
    options: { silent?: boolean } = {},
  ) {
    const user = await this.findOne(data.username, { silent: true });

    if (user) {
      if (options.silent) {
        return user;
      }
      throw BusinessExceptions.EXIST(`用户 ${user.username} `);
    }

    let rolesId: number[];
    if (data.roleIds && data.roleIds.length > 0) {
      rolesId = data.roleIds;
      await this.validateRoles(rolesId);
    } else {
      const roleName = this.configService.get('OAUTH_DEFAULT_ROLE_NAME');
      const defaultRole = await this.roleLogicService.findOne(roleName);
      rolesId = [defaultRole.id];
    }

    const password =
      data.password || this.configService.get('OAUTH_DEFAULT_PASSWORD');
    const hashedPassword = await this.hashPassword(password);

    return await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        roles: {
          connect: rolesId.map((id) => ({ id })),
        },
      },
      omit: this.omitFields,
      include: {
        roles: { include: { permissions: true } },
      },
    });
  }

  async findOne(
    idorname: number | string,
    options: {
      roles?: boolean;
      permissions?: boolean;
      silent?: boolean;
    } = {},
  ) {
    const rolesConfig = this.getRolesConfig(options);

    const user = await this.prisma.user.findUnique({
      where:
        typeof idorname === 'number'
          ? { id: idorname }
          : { username: idorname },
      omit: this.omitFields,
      include: {
        roles: rolesConfig,
      },
    });

    if (!user) {
      if (options.silent) {
        return null;
      }
      throw BusinessExceptions.NO_USER();
    }

    return user;
  }
}
