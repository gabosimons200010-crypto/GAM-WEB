import { Module } from '@nestjs/common';
import { AIBatchRepository } from './application/ports/ai-batch.repository';
import { AIAnalysisRepository } from './application/ports/ai-analysis.repository';
import { PrismaAIBatchRepository } from './infrastructure/prisma-ai-batch.repository';
import { PrismaAIAnalysisRepository } from './infrastructure/prisma-ai-analysis.repository';

/**
 * Providers compartidos entre el productor (API) y el consumidor (worker):
 * repositorios de lote y análisis. Evita duplicar su registro.
 */
@Module({
  providers: [
    { provide: AIBatchRepository, useClass: PrismaAIBatchRepository },
    { provide: AIAnalysisRepository, useClass: PrismaAIAnalysisRepository },
  ],
  exports: [AIBatchRepository, AIAnalysisRepository],
})
export class AiSharedModule {}
