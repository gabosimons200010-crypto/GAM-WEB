import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AIBatchRepository } from '../application/ports/ai-batch.repository';
import { AIBatchStatus, AIBatchView, BatchCounts } from '../domain/ai';

@Injectable()
export class PrismaAIBatchRepository extends AIBatchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(storeId: string, total: number, source: string): Promise<AIBatchView> {
    const row = await this.prisma.aIBatch.create({
      data: { storeId, total, source, status: 'QUEUED' },
    });
    return this.toView(row);
  }

  async findById(id: string): Promise<AIBatchView | null> {
    const row = await this.prisma.aIBatch.findUnique({ where: { id } });
    return row ? this.toView(row) : null;
  }

  async setStatus(id: string, status: AIBatchStatus): Promise<void> {
    await this.prisma.aIBatch.update({ where: { id }, data: { status } });
  }

  async incrementProcessed(id: string): Promise<BatchCounts> {
    const row = await this.prisma.aIBatch.update({
      where: { id },
      data: { processed: { increment: 1 } },
      select: { total: true, processed: true, failed: true },
    });
    return row;
  }

  async incrementFailed(id: string): Promise<BatchCounts> {
    const row = await this.prisma.aIBatch.update({
      where: { id },
      data: { failed: { increment: 1 } },
      select: { total: true, processed: true, failed: true },
    });
    return row;
  }

  private toView(row: {
    id: string;
    storeId: string;
    status: AIBatchStatus;
    total: number;
    processed: number;
    failed: number;
    source: string;
    createdAt: Date;
  }): AIBatchView {
    return {
      id: row.id,
      storeId: row.storeId,
      status: row.status,
      total: row.total,
      processed: row.processed,
      failed: row.failed,
      source: row.source,
      createdAt: row.createdAt,
    };
  }
}
