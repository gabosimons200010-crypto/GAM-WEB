import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductStatus, RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { ArchiveProductUseCase } from '../application/use-cases/archive-product.use-case';
import { PauseProductUseCase } from '../application/use-cases/pause-product.use-case';
import { PublishProductUseCase } from '../application/use-cases/publish-product.use-case';
import { ListMyProductsUseCase } from '../application/use-cases/list-my-products.use-case';
import { AdjustInventoryUseCase } from '../application/use-cases/adjust-inventory.use-case';
import { RequestUploadUrlUseCase } from '../application/use-cases/request-upload-url.use-case';
import { ManageProductMediaUseCase } from '../application/use-cases/manage-product-media.use-case';
import {
  AddMediaDto,
  AdjustInventoryDto,
  CreateProductDto,
  UpdateProductDto,
  UploadUrlDto,
} from './dto/product.dto';

@ApiTags('seller · productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
@Controller('seller/stores/:storeId/products')
export class SellerProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly archiveProduct: ArchiveProductUseCase,
    private readonly pauseProduct: PauseProductUseCase,
    private readonly publishProduct: PublishProductUseCase,
    private readonly listMyProducts: ListMyProductsUseCase,
    private readonly adjustInventory: AdjustInventoryUseCase,
    private readonly requestUploadUrl: RequestUploadUrlUseCase,
    private readonly manageMedia: ManageProductMediaUseCase,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.createProduct.execute({ ownerUserId: user.sub, storeId, ...dto });
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Query('status') status?: ProductStatus,
    @Query('lowStock', new DefaultValuePipe(false), ParseBoolPipe) lowStock = false,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.listMyProducts.execute({
      userId: user.sub,
      storeId,
      status,
      lowStock,
      cursor,
      limit: Math.min(limit, 100),
    });
  }

  @Patch(':productId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.updateProduct.execute(user.sub, productId, dto);
  }

  @Post(':productId/archive')
  @HttpCode(200)
  archive(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.archiveProduct.archive(user.sub, productId).then(() => ({ archived: true }));
  }

  /** Pausa un producto activo/en revisión: lo oculta del catálogo (reversible). */
  @Post(':productId/pause')
  @HttpCode(200)
  pause(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.pauseProduct.execute(user.sub, productId);
  }

  /** Publica un borrador o reactiva un pausado: ACTIVE si la tienda está verificada, si no IN_REVIEW. */
  @Post(':productId/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.publishProduct.execute(user.sub, productId);
  }

  @Delete(':productId')
  @HttpCode(200)
  remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.archiveProduct.remove(user.sub, productId).then(() => ({ deleted: true }));
  }

  @Patch('variants/:variantId/inventory')
  inventory(
    @CurrentUser() user: AuthUser,
    @Param('variantId') variantId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.adjustInventory.execute({ userId: user.sub, variantId, available: dto.available });
  }

  @Post('upload-url')
  uploadUrl(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.requestUploadUrl.execute(user.sub, storeId, dto.contentType);
  }

  /** Agrega una foto (ya subida al storage) a un producto existente. */
  @Post(':productId/media')
  @HttpCode(201)
  addMedia(@CurrentUser() user: AuthUser, @Param('productId') productId: string, @Body() dto: AddMediaDto) {
    return this.manageMedia.add(user.sub, productId, dto.url).then(() => ({ ok: true }));
  }

  /** Quita una foto de un producto. */
  @Delete(':productId/media/:mediaId')
  @HttpCode(200)
  removeMedia(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.manageMedia.remove(user.sub, productId, mediaId).then(() => ({ ok: true }));
  }
}
