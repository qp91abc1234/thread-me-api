import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BusinessExceptions } from 'src/common/utils/exception';
import { RoleLogicService } from 'src/role/role-logic.service';
import { UserLogicService } from './user-logic.service';

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>;
  @Inject(RoleLogicService)
  private roleLogicService: RoleLogicService;

  private propertyNames;

  constructor(private readonly userLogicService: UserLogicService) {
    this.propertyNames = this.userLogicService.getVisiblePropertyNames();
  }

  async create(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOne({
      where: {
        username: createUserDto.username,
      },
    });
    if (user) {
      throw BusinessExceptions.EXIST(`用户 ${createUserDto.username} `);
    }
    user = new User(createUserDto);
    if (createUserDto.roleIds) {
      user.roles = await this.roleLogicService.findByIds(createUserDto.roleIds);
    }

    return this.userRepository.save(user);
  }

  findList(page: number, pageSize: number) {
    return this.userRepository.findAndCount({
      select: this.propertyNames,
      skip: (page - 1) * pageSize, // 计算跳过的偏移量
      take: pageSize, // 取多少条
      order: {
        id: 'DESC', // 通常分页都要配合排序，否则顺序可能不稳定
      },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      select: this.propertyNames,
      where: {
        id,
      },
    });
    if (!user) {
      throw BusinessExceptions.NO_USER();
    }
    return user;
  }

  async update(updateUserDto: UpdateUserDto) {
    const oriUser = await this.findOne(updateUserDto.id);
    const user = {
      ...oriUser,
      ...updateUserDto,
    };
    if (updateUserDto.roleIds) {
      user.roles = await this.roleLogicService.findByIds(updateUserDto.roleIds);
    }

    return this.userRepository.save(user);
  }

  async remove(id: number) {
    await this.findOne(+id);
    return this.userRepository.delete(id);
  }
}
