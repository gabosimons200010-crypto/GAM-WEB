import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { AddressesRepository } from '../application/ports/addresses.repository';
import { CreateAddressDto } from './dto/address.dto';

/** Libreta de direcciones del comprador (RF-MKT-004). Requiere sesión. */
@ApiTags('direcciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesRepository) {}

  @Get()
  @ApiOkResponse({ description: 'Mis direcciones (la predeterminada primero).' })
  list(@CurrentUser() user: AuthUser) {
    return this.addresses.listForUser(user.sub);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.sub, dto);
  }

  @Post(':id/default')
  @HttpCode(200)
  setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addresses.setDefault(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.addresses.remove(user.sub, id);
    return { ok: true };
  }
}
