import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { METADATA_KEY } from '../constant/constant';

export const RequireLogin = () =>
  applyDecorators(
    ApiBearerAuth(),
    SetMetadata(METADATA_KEY.REQUIRE_LOGIN, true),
  );

export const RequirePermission = (...permissions: string[]) =>
  applyDecorators(
    RequireLogin(),
    SetMetadata(METADATA_KEY.REQUIRE_PERMISSION, permissions),
  );
