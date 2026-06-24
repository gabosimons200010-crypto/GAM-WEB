import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AIAnalysisRepository,
  ProcessedMedia,
  AnalysisRecord,
  VisionSave,
  HashedProduct,
  DuplicateSuggestion,
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

  async getImageHash(analysisId: string): Promise<string | null> {
    const row = await this.prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
      select: { imageHash: true },
    });
    return row?.imageHash ?? null;
  }

  async findHashedProducts(storeId: string, excludeProductId: string): Promise<HashedProduct[]> {
    const rows = await this.prisma.aIAnalysis.findMany({
      where: {
        storeId,
        imageHash: { not: null },
        productId: { not: null, notIn: [excludeProductId] },
      },
      select: { productId: true, imageHash: true },
      take: 2000,
    });
    return rows
      .filter((r): r is { productId: string; imageHash: string } => !!r.productId && !!r.imageHash)
      .map((r) => ({ productId: r.productId, imageHash: r.imageHash }));
  }

  async setDuplicateOf(analysisId: string, productId: string): Promise<void> {
    await this.prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: { duplicateOfProductId: productId },
    });
  }

  async listDuplicateSuggestions(storeId: string): Promise<DuplicateSuggestion[]> {
    const rows = await this.prisma.aIAnalysis.findMany({
      where: { storeId, duplicateOfProductId: { not: null }, productId: { not: null } },
      select: { id: true, productId: true, duplicateOfProductId: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows
      .filter((r) => r.productId && r.duplicateOfProductId)
      .map((r) => ({
        analysisId: r.id,
        productId: r.productId as string,
        duplicateOfProductId: r.duplicateOfProductId as string,
      }));
  }

  async clearDuplicate(analysisId: string): Promise<void> {
    await this.prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: { duplicateOfProductId: null },
    });
  }

  async getSuggestion(analysisId: string): Promise<DuplicateSuggestion | null> {
    const row = await this.prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
      select: { id: true, storeId: true, productId: true, duplicateOfProductId: true },
    });
    if (!row || !row.productId || !row.duplicateOfProductId) return null;
    return {
      analysisId: row.id,
      productId: row.productId,
      duplicateOfProductId: row.duplicateOfProductId,
    };
  }
}
