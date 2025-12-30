import { Controller } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
}
