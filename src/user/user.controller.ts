import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  GetUserListVo,
  GetUserVo,
  UpdateUserDto,
} from './dto/user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 创建用户
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
  }

  @Get()
  async findList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ): Promise<GetUserListVo> {
    const [list, total] = await this.userService.findList(page, pageSize);
    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetUserVo> {
    return await this.userService.findOne(+id);
  }

  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto) {
    await this.userService.update(updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(+id);
  }
}
