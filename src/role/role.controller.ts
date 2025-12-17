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
    return await this.roleService.create(createRoleDto);
  }

  @Get()
  async findList(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('permissions', new ParseBoolPipe({ optional: true }))
    permissions: boolean = false,
  ): Promise<GetRoleListVo> {
    const { list, total } = await this.roleService.findList(page, pageSize, {
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
    @Query('permissions', new ParseBoolPipe({ optional: true }))
    permissions: boolean = false,
  ): Promise<GetRoleVo> {
    const parsed = parseInt(idorname, 10);
    const finalValue = isNaN(parsed) ? idorname : parsed;
    return await this.roleService.findOne(finalValue, { permissions });
  }

  @Patch()
  async update(@Body() updateRoleDto: UpdateRoleDto): Promise<GetRoleVo> {
    return await this.roleService.update(updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.remove(id);
  }
}
