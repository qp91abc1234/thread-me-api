import { Injectable } from '@nestjs/common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { BusinessExceptions } from 'src/common/utils/exception';

@Injectable()
export class PermissionService {
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionRepository.findOne({
      where: {
        name: createPermissionDto.name,
      },
    });
    if (permission) {
      throw BusinessExceptions.EXIST(`权限 ${createPermissionDto.name} `);
    }
    return this.permissionRepository.save(createPermissionDto);
  }

  findList(page: number, pageSize: number) {
    return this.permissionRepository.findAndCount({
      skip: (page - 1) * pageSize, // 计算跳过的偏移量
      take: pageSize, // 取多少条
      order: {
        id: 'DESC', // 通常分页都要配合排序，否则顺序可能不稳定
      },
    });
  }

  async findOne(id: number) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw BusinessExceptions.NO_PERMISSION();
    }
    return permission;
  }

  async update(updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findOne(updatePermissionDto.id);
    return this.permissionRepository.save({
      ...permission,
      ...updatePermissionDto,
    });
  }

  async remove(id: number) {
    const permission = await this.findOne(+id);
    if (permission.isSystem) {
      throw BusinessExceptions.NO_AUTH();
    }
    return this.permissionRepository.delete(id);
  }
}
