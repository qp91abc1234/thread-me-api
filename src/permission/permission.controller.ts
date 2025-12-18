import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  GetPermissionListVo,
  GetPermissionVo,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<GetPermissionVo> {
    return await this.permissionService.create(createPermissionDto);
  }

  @Get()
  async findList(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
  ): Promise<GetPermissionListVo> {
    const { list, total } = await this.permissionService.findList(
      page,
      pageSize,
    );
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
  ): Promise<GetPermissionVo> {
    return await this.permissionService.findOne(id);
  }

  @Patch()
  async update(
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<GetPermissionVo> {
    return await this.permissionService.update(updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.permissionService.remove(id);
  }
}
