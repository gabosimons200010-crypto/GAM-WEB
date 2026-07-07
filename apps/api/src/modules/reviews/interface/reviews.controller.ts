import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ReviewsRepository } from '../application/ports/reviews.repository';
import { CreateReviewUseCase } from '../application/use-cases/create-review.use-case';
import { CreateReviewDto } from './dto/review.dto';

/** Reseñas de producto (RF-MKT-005). Listar es público; reseñar exige compra verificada. */
@ApiTags('reseñas')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsRepository,
    private readonly createReview: CreateReviewUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Reseñas del producto, más recientes primero.' })
  list(@Param('productId') productId: string) {
    return this.reviews.listForProduct(productId);
  }

  /** ¿El usuario en sesión puede reseñar? (compró el producto). Para mostrar el formulario. */
  @Get('can-review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'true si el usuario compró el producto.' })
  async canReview(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    const canReview = await this.reviews.hasPurchasedProduct(user.sub, productId);
    return { canReview };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    await this.createReview.execute(user.sub, productId, dto.rating, dto.comment);
    return { ok: true };
  }
}
