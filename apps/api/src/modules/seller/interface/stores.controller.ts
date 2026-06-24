import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetStoreProfileUseCase } from '../application/use-cases/get-store-profile.use-case';

/** Perfil público de tienda (RF-CAT-006). Sin autenticación. */
@ApiTags('tiendas (público)')
@Controller('stores')
export class StoresController {
  constructor(private readonly getProfile: GetStoreProfileUseCase) {}

  @Get(':slug')
  @ApiOkResponse({ description: 'Perfil público de una tienda aprobada.' })
  profile(@Param('slug') slug: string) {
    return this.getProfile.execute(slug);
  }
}
