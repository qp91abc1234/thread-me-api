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
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryParamsDto,
  RolePermissionDto,
} from './dto/role.dto';

@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('list')
  @ApiOperation({ summary: '获取角色列表' })
  async getList(@Body() params: RoleQueryParamsDto) {
    return await this.roleService.getList(params);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.getDetail(id);
  }

  @Post()
  @ApiOperation({ summary: '新增角色' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.create(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.delete(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限' })
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.getPermissions(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '分配角色权限' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() permissions: RolePermissionDto,
  ) {
    return await this.roleService.assignPermissions(id, permissions);
  }
}
