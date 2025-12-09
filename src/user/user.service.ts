import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { httpExceptionMap } from 'src/common/utils/exception';
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
      throw httpExceptionMap.EXIST(`用户 ${createUserDto.username} `);
    }
    user = new User(createUserDto);
    if (createUserDto.roleIds) {
      user.roles = await this.roleLogicService.findByIds(createUserDto.roleIds);
    }

    this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find({
      select: this.propertyNames,
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
      throw httpExceptionMap.NO_USER();
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
      user.roles = await await this.roleLogicService.findByIds(
        updateUserDto.roleIds,
      );
    }

    this.userRepository.save(user);
  }

  async remove(id: number) {
    await this.findOne(+id);
    this.userRepository.delete(id);
  }
}
