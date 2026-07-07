import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ReviewsController } from './interface/reviews.controller';
import { ReviewsRepository } from './application/ports/reviews.repository';
import { PrismaReviewsRepository } from './infrastructure/prisma-reviews.repository';

/** Bounded context REVIEWS: reseñas y calificación de productos. */
@Module({
  imports: [IdentityModule],
  controllers: [ReviewsController],
  providers: [{ provide: ReviewsRepository, useClass: PrismaReviewsRepository }],
})
export class ReviewsModule {}
