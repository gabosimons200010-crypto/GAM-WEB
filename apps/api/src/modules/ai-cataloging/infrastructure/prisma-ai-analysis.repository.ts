import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AIAnalysisRepository,
  ProcessedMedia,
} from '../application/ports/ai-analysis.repository';

@Injectable()
export class PrismaAIAnalysisRepository extends AIAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(batchId: string, storeId: string, imageKey: string): Promise<{ id: string }> {
    const row = await this.prisma.aIAnalysis.create({
      data: { batchId, storeId, imageUrl: imageKey, status: 'PENDING' },
      select: { id: true },
    });
    return row;
  }

  async markMediaDone(id: string, media: ProcessedMedia): Promise<void> {
    await this.prisma.aIAnalysis.update({
      where: { id },
      data: {
        noBgUrl: media.noBgUrl,
        optimizedUrl: media.optimizedUrl,
        imageHash: media.imageHash ?? undefined,
        mediaDone: true,
        error: null,
      },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.prisma.aIAnalysis.update({
      where: { id },
      data: { status: 'FAILED', error: error.slice(0, 500) },
    });
  }
}
