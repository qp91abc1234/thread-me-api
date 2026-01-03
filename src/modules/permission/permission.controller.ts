import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import {
  CreateMenuDto,
  UpdateMenuDto,
  MenuSortDto,
  CreateButtonPermissionDto,
  UpdateButtonPermissionDto,
} from './dto/permission.dto';

@ApiTags('permission')
@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // ========== Menu Endpoints ==========

  @Get('menu/tree')
  @ApiOperation({ summary: '获取菜单树' })
  async getMenuTree(
    @Query(
      'status',
      new DefaultValuePipe(undefined),
      new ParseIntPipe({ optional: true }),
    )
    status?: number,
    @Query('roleIds', new ParseArrayPipe({ optional: true, items: Number }))
    roleIds?: number[],
  ) {
    return await this.permissionService.getMenuTree(status, roleIds);
  }

  @Get('menu/:id')
  @ApiOperation({ summary: '获取菜单详情' })
  async getMenuDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.permissionService.getMenuDetail(id);
  }

  @Post('menu')
  @ApiOperation({ summary: '新增菜单' })
  async createMenu(@Body() createMenuDto: CreateMenuDto) {
    return await this.permissionService.createMenu(createMenuDto);
  }

  @Put('menu/sort')
  @ApiOperation({ summary: '更新菜单排序' })
  async updateMenuSort(@Body() sortDto: MenuSortDto) {
    return await this.permissionService.updateMenuSort(sortDto);
  }

  @Put('menu/:id')
  @ApiOperation({ summary: '更新菜单' })
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return await this.permissionService.updateMenu(id, updateMenuDto);
  }

  @Delete('menu/:id')
  @ApiOperation({ summary: '删除菜单' })
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return await this.permissionService.deleteMenu(id);
  }

  // ========== API Permission Endpoints ==========

  @Get('permission/list')
  @ApiOperation({ summary: '获取所有API权限列表' })
  async getAllApiPermissions() {
    return await this.permissionService.getAllApiPermissions();
  }

  // ========== Button Permission Endpoints ==========

  @Get('permission/button/menu/:menuId')
  @ApiOperation({ summary: '根据菜单ID获取按钮权限列表' })
  async getButtonPermissionsByMenuId(
    @Param('menuId', ParseIntPipe) menuId: number,
  ) {
    return await this.permissionService.getButtonPermissionsByMenuId(menuId);
  }

  @Post('permission/button')
  @ApiOperation({ summary: '创建按钮权限' })
  async createButtonPermission(@Body() createDto: CreateButtonPermissionDto) {
    return await this.permissionService.createButtonPermission(createDto);
  }

  @Put('permission/button/:id')
  @ApiOperation({ summary: '更新按钮权限' })
  async updateButtonPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateButtonPermissionDto,
  ) {
    return await this.permissionService.updateButtonPermission(id, updateDto);
  }

  @Delete('permission/button/:id')
  @ApiOperation({ summary: '删除按钮权限' })
  async deleteButtonPermission(@Param('id', ParseIntPipe) id: number) {
    return await this.permissionService.deleteButtonPermission(id);
  }
}
