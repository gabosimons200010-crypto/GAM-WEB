import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AddressesController } from './interface/addresses.controller';
import { AddressesRepository } from './application/ports/addresses.repository';
import { PrismaAddressesRepository } from './infrastructure/prisma-addresses.repository';

/** Bounded context ADDRESSES: libreta de direcciones del comprador. */
@Module({
  imports: [IdentityModule],
  controllers: [AddressesController],
  providers: [{ provide: AddressesRepository, useClass: PrismaAddressesRepository }],
})
export class AddressesModule {}
