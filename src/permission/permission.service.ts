import { Injectable } from '@nestjs/common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { httpExceptionMap } from 'src/common/utils/exception';

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
      throw httpExceptionMap.EXIST(`权限 ${createPermissionDto.name} `);
    }
    return this.permissionRepository.save(createPermissionDto);
  }

  findAll() {
    return this.permissionRepository.find();
  }

  async findOne(id: number) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw httpExceptionMap.NO_PERMISSION();
    }
    return permission;
  }

  async update(updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findOne(updatePermissionDto.id);
    await this.permissionRepository.save({
      ...permission,
      ...updatePermissionDto,
    });
  }

  async remove(id: number) {
    await this.findOne(+id);
    this.permissionRepository.delete(id);
  }
}
