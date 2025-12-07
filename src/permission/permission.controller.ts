import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  GetPermissionVo,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    await this.permissionService.create(createPermissionDto);
  }

  @Get()
  async findAll(): Promise<GetPermissionVo[]> {
    return await this.permissionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetPermissionVo> {
    return await this.permissionService.findOne(+id);
  }

  @Patch()
  async update(@Body() updatePermissionDto: UpdatePermissionDto) {
    await this.permissionService.update(updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.permissionService.remove(+id);
  }
}
