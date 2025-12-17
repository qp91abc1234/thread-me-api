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
  async create(@Body() createRoleDto: CreateRoleDto): Promise<GetRoleVo> {
    const role = await this.roleService.create(createRoleDto);
    return role;
  }

  @Get()
  async findList(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
  ): Promise<GetRoleListVo> {
    const { list, total } = await this.roleService.findList(page, pageSize);
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
  ): Promise<GetRoleVo> {
    const parsed = parseInt(idorname, 10);
    const finalValue = isNaN(parsed) ? idorname : parsed;
    const role = await this.roleService.findOne(finalValue);
    return role;
  }

  @Patch()
  async update(@Body() updateRoleDto: UpdateRoleDto): Promise<GetRoleVo> {
    const role = await this.roleService.update(updateRoleDto);
    return role;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.remove(id);
  }
}
