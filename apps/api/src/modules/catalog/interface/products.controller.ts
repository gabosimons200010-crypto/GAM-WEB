import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetProductUseCase } from '../application/use-cases/get-product.use-case';

/** Detalle público de producto (RF-CAT-003). Sin autenticación. */
@ApiTags('productos (público)')
@Controller('products')
export class ProductsController {
  constructor(private readonly getProduct: GetProductUseCase) {}

  @Get(':slug')
  @ApiOkResponse({ description: 'Detalle de un producto activo.' })
  detail(@Param('slug') slug: string) {
    return this.getProduct.execute(slug);
  }
}
