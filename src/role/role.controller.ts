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
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  GetRoleListVo,
  GetRoleVo,
  UpdateRoleDto,
} from './dto/role.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    await this.roleService.create(createRoleDto);
  }

  @Get()
  async findList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ): Promise<GetRoleListVo> {
    const [list, total] = await this.roleService.findList(page, pageSize);
    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetRoleVo> {
    return await this.roleService.findOne(+id);
  }

  @Patch()
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    await this.roleService.update(updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.roleService.remove(+id);
  }
}
