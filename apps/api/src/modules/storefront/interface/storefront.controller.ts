import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SearchProductsUseCase } from '../application/use-cases/search-products.use-case';
import { GetStorePageUseCase } from '../application/use-cases/get-store-page.use-case';
import { SearchQueryDto, StorePageQueryDto } from './dto/search.dto';

/**
 * Vitrina pública del marketplace (RF-MKT-001/002). Sin autenticación:
 * cualquier visitante navega, busca y filtra el catálogo de tiendas APPROVED.
 * El detalle de un producto vive en GET /products/:slug (módulo catalog).
 */
@ApiTags('vitrina (público)')
@Controller('storefront')
export class StorefrontController {
  constructor(
    private readonly searchProducts: SearchProductsUseCase,
    private readonly getStorePage: GetStorePageUseCase,
  ) {}

  @Get('products')
  @ApiOkResponse({ description: 'Catálogo público paginado con filtros y orden.' })
  search(@Query() query: SearchQueryDto) {
    return this.searchProducts.execute({
      query: query.q,
      categorySlug: query.category,
      gender: query.gender,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('stores/:slug')
  @ApiOkResponse({ description: 'Cabecera de la tienda y su catálogo activo.' })
  store(@Param('slug') slug: string, @Query() query: StorePageQueryDto) {
    return this.getStorePage.execute({
      slug,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
