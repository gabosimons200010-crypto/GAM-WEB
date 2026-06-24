import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AIAnalysisRepository,
  ProcessedMedia,
  AnalysisRecord,
  VisionSave,
} from '../application/ports/ai-analysis.repository';

@Injectable()
export class PrismaAIAnalysisRepository extends AIAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(batchId: string, storeId: string, imageKey: string): Promise<{ id: string }> {
    return this.prisma.aIAnalysis.create({
      data: { batchId, storeId, imageUrl: imageKey, status: 'PENDING' },
      select: { id: true },
    });
  }

  async get(id: string): Promise<AnalysisRecord | null> {
    const row = await this.prisma.aIAnalysis.findUnique({
      where: { id },
      select: { id: true, storeId: true, imageUrl: true, optimizedUrl: true, noBgUrl: true },
    });
    return row
      ? {
          id: row.id,
          storeId: row.storeId,
          imageKey: row.imageUrl,
          optimizedUrl: row.optimizedUrl,
          noBgUrl: row.noBgUrl,
        }
      : null;
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

  async saveVision(id: string, data: VisionSave): Promise<void> {
    await this.prisma.aIAnalysis.update({
      where: { id },
      data: {
        provider: data.provider,
        model: data.model,
        confidence: data.confidence,
        result: data.result as Prisma.InputJsonValue,
        costUsd: data.costUsd,
        productId: data.productId,
        status: data.lowConfidence ? 'LOW_CONFIDENCE' : 'DONE',
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
