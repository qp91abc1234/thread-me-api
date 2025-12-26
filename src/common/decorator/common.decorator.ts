import { applyDecorators, SetMetadata } from '@nestjs/common';
import { METADATA_KEY } from '../constant/constant';

export const RequireNoLogin = () =>
  SetMetadata(METADATA_KEY.REQUIRE_NO_LOGIN, true);

export const RequirePermission = (...permissions: string[]) =>
  applyDecorators(SetMetadata(METADATA_KEY.REQUIRE_PERMISSION, permissions));
