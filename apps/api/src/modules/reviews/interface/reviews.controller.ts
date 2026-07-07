import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ReviewsRepository } from '../application/ports/reviews.repository';
import { CreateReviewDto } from './dto/review.dto';

/** Reseñas de producto (RF-MKT-005). Listar es público; reseñar requiere sesión. */
@ApiTags('reseñas')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsRepository) {}

  @Get()
  @ApiOkResponse({ description: 'Reseñas del producto, más recientes primero.' })
  list(@Param('productId') productId: string) {
    return this.reviews.listForProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    await this.reviews.upsert(user.sub, productId, dto.rating, dto.comment);
    return { ok: true };
  }
}
