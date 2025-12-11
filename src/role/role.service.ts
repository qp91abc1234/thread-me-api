import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessExceptions } from 'src/common/utils/exception';
import { PermissionLogicService } from 'src/permission/permission-logic.service';

@Injectable()
export class RoleService {
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @Inject(PermissionLogicService)
  private permissionLogicService: PermissionLogicService;

  async create(createRoleDto: CreateRoleDto) {
    let role = await this.roleRepository.findOne({
      where: {
        name: createRoleDto.name,
      },
    });
    if (role) {
      throw BusinessExceptions.EXIST(`角色 ${createRoleDto.name} `);
    }
    role = new Role(createRoleDto);
    if (createRoleDto.permissionIds) {
      role.permissions = await this.permissionLogicService.findByIds(
        createRoleDto.permissionIds,
      );
    }

    return this.roleRepository.save(role);
  }

  findList(page: number, pageSize: number) {
    return this.roleRepository.findAndCount({
      skip: (page - 1) * pageSize, // 计算跳过的偏移量
      take: pageSize, // 取多少条
      order: {
        id: 'DESC', // 通常分页都要配合排序，否则顺序可能不稳定
      },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: {
        id,
      },
    });
    if (!role) {
      throw BusinessExceptions.NO_ROLE();
    }
    return role;
  }

  async update(updateRoleDto: UpdateRoleDto) {
    const oriRole = await this.findOne(updateRoleDto.id);
    const role = {
      ...oriRole,
      ...updateRoleDto,
    };
    if (updateRoleDto.permissionIds) {
      role.permissions = await this.permissionLogicService.findByIds(
        updateRoleDto.permissionIds,
      );
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(+id);
    if (role.isSystem) {
      throw BusinessExceptions.NO_AUTH(); // 复用无权限错误，或者自定义错误
    }
    return this.roleRepository.delete(id);
  }
}
