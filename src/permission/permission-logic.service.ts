import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class PermissionLogicService {
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  async findByIds(ids: number[]) {
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(ids),
      },
    });
    return permissions;
  }
}
