import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { AuthLogicService } from './auth-logic.service';
import { UserLogicService } from 'src/user/user-logic.service';
import { Profile } from 'passport-github2';

@Injectable()
export class AuthService {
  @Inject(UserLogicService)
  private userLogicService: UserLogicService;
  @Inject(AuthLogicService)
  private authLogicService: AuthLogicService;
  @Inject(JwtService)
  private jwtService: JwtService;

  async login(user: User) {
    return this.authLogicService.sign(user);
  }

  async githubLogin(profile: Profile) {
    const user = await this.userLogicService.create(profile);
    return this.authLogicService.sign(user);
  }

  async refresh(refreshToken: string) {
    const data = this.jwtService.verify(refreshToken);
    const user = await this.userLogicService.findOneWithPermissions(
      data.userId,
    );
    return this.authLogicService.sign(user);
  }
}
