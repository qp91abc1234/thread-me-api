import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleLogicService {
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  async findByIds(ids: number[]) {
    const roles = await this.roleRepository.find({
      where: {
        id: In(ids),
      },
    });
    return roles;
  }

  async findByName(name: string) {
    return await this.roleRepository.findOne({
      where: {
        name,
      },
    });
  }
}
