import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { httpExceptionMap } from 'src/common/utils/execption';
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
        name: CreateRoleDto.name,
      },
    });
    if (role) {
      throw httpExceptionMap.EXIST(`角色 ${CreateRoleDto.name} `);
    }
    role = new Role(createRoleDto);
    if (createRoleDto.permissionIds) {
      role.permissions = await this.permissionLogicService.findByIds(
        createRoleDto.permissionIds,
      );
    }

    this.roleRepository.save(role);
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
      throw httpExceptionMap.NO_ROLE();
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

    this.roleRepository.save(role);
  }

  async remove(id: number) {
    await this.findOne(+id);
    this.roleRepository.delete(id);
  }
}
