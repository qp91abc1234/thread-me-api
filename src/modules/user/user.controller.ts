import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryParamsDto,
} from './dto/user.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('list')
  @ApiOperation({ summary: '获取用户列表' })
  async getList(@Body() params: UserQueryParamsDto) {
    return await this.userService.getList(params);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getDetail(id);
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.delete(id);
  }
}
