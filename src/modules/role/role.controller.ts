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
import { RoleLogicService } from './role-logic.service';

@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly roleLogicService: RoleLogicService,
  ) {}

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

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('permissions', new ParseBoolPipe({ optional: true }))
    permissions: boolean = false,
  ): Promise<GetRoleVo> {
    return await this.roleLogicService.findOne(id, { permissions });
  }

  @Patch()
  async update(@Body() updateRoleDto: UpdateRoleDto): Promise<GetRoleVo> {
    return await this.roleService.update(updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.remove(id);
  }
}
