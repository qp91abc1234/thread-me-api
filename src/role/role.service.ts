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

  findAll() {
    return this.roleRepository.find();
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
    await this.findOne(+id);
    return this.roleRepository.delete(id);
  }
}
