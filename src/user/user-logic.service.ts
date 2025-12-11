import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BusinessExceptions } from 'src/common/utils/exception';
import { Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { RoleLogicService } from 'src/role/role-logic.service';

@Injectable()
export class UserLogicService {
  @InjectRepository(User)
  private userRepository: Repository<User>;

  @Inject(RoleLogicService)
  private roleLogicService: RoleLogicService;

  constructor(private readonly configService: ConfigService) {}

  getVisiblePropertyNames() {
    const propertyNames = this.userRepository.metadata.columns
      .filter((column) => column.propertyName !== 'password')
      .map((column) => column.propertyName);

    return propertyNames;
  }

  async findOneWithPermissions(idorname: number | string): Promise<User> {
    let id, username;
    if (typeof idorname === 'number') {
      id = idorname;
    } else {
      username = idorname;
    }
    const user = await this.userRepository.findOne({
      where: { id, username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw BusinessExceptions.NO_USER();
    }

    return user;
  }

  async create(profile: Profile) {
    let user = await this.userRepository.findOne({
      where: {
        username: profile.username,
      },
    });
    if (user) {
      return user;
    }
    user = new User();
    user.username = profile.username;
    user.password = this.configService.get('OAUTH_DEFAULT_PASSWORD');

    const defaultRole = await this.roleLogicService.findByName('general_user');
    if (defaultRole) {
      user.roles = [defaultRole];
    }

    return await this.userRepository.save(user);
  }
}
