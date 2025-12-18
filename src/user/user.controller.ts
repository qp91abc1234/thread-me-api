import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  GetUserListVo,
  GetUserVo,
  UpdateUserDto,
} from './dto/user.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserLogicService } from './user-logic.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userLogicService: UserLogicService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userLogicService.create(createUserDto);
  }

  @Get()
  async findList(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('roles', new ParseBoolPipe({ optional: true }))
    roles: boolean = false,
    @Query('permissions', new ParseBoolPipe({ optional: true }))
    permissions: boolean = false,
  ): Promise<GetUserListVo> {
    const { list, total } = await this.userService.findList(page, pageSize, {
      roles,
      permissions,
    });
    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  @Get(':idorname')
  async findOne(
    @Param('idorname')
    idorname: string,
    @Query('roles', new ParseBoolPipe({ optional: true }))
    roles: boolean = false,
    @Query('permissions', new ParseBoolPipe({ optional: true }))
    permissions: boolean = false,
  ): Promise<GetUserVo> {
    const parsed = parseInt(idorname, 10);
    const finalValue = isNaN(parsed) ? idorname : parsed;
    return await this.userLogicService.findOne(finalValue, {
      roles,
      permissions,
    });
  }

  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.remove(id);
  }
}
