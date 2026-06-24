import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { AiSharedModule } from './ai-shared.module';
import { CatalogModule } from '../catalog/catalog.module';

import { ProcessImageUseCase } from './application/use-cases/process-image.use-case';
import { AnalyzeImageUseCase } from './application/use-cases/analyze-image.use-case';
import { BackgroundRemover, ImageProcessor } from './application/ports/image-processing';
import { VisionJobQueue } from './application/ports/vision-job-queue';
import {
  VisionPort,
  VisionProvider,
  VISION_BULK,
  VISION_ESCALATION,
} from './application/ports/vision.port';

import { NoopBackgroundRemover } from './infrastructure/noop-background-remover';
import { SharpImageProcessor } from './infrastructure/sharp-image-processor';
import { MediaProcessor } from './infrastructure/media.processor';
import { BullVisionJobQueue } from './infrastructure/bull-vision-job-queue';
import { VisionProcessor } from './infrastructure/vision.processor';
import { VisionRouter } from './infrastructure/vision-router';
import { GeminiVisionProvider } from './infrastructure/gemini-vision.provider';
import { StubVisionProvider } from './infrastructure/stub-vision.provider';

import { QUEUE_MEDIA, QUEUE_AI } from '../../shared/queue/queue.constants';
import type { Env } from '../../config/env.validation';

const GENAI_CLIENT = Symbol('GENAI_CLIENT');

/** Construye el proveedor de visión: Gemini si hay API key, si no el stub. */
function visionProviderFactory(modelKey: 'GEMINI_MODEL_BULK' | 'GEMINI_MODEL_ESCALATION') {
  return (config: ConfigService<Env, true>, client: GoogleGenAI | null): VisionProvider => {
    if (config.get('AI_PROVIDER', { infer: true }) === 'gemini' && client) {
      return new GeminiVisionProvider(client, config.get(modelKey, { infer: true }));
    }
    return new StubVisionProvider();
  };
}

/**
 * Lado worker del contexto AI Cataloging (worker-media + worker-ai). Consume las
 * colas "media" (IA-004) y "ai" (IA-001/002), y crea borradores vía Catalog.
 * Se carga solo en el proceso worker.
 */
@Module({
  imports: [
    AiSharedModule,
    CatalogModule, // CreateProductDraftUseCase + CategoryRepository
    BullModule.registerQueue({ name: QUEUE_MEDIA }, { name: QUEUE_AI }),
  ],
  providers: [
    // worker-media (IA-004)
    ProcessImageUseCase,
    { provide: BackgroundRemover, useClass: NoopBackgroundRemover },
    { provide: ImageProcessor, useClass: SharpImageProcessor },
    { provide: VisionJobQueue, useClass: BullVisionJobQueue },
    MediaProcessor,
    // worker-ai (IA-001/002) — enrutamiento por costo/confianza (ADR-05)
    {
      provide: GENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): GoogleGenAI | null => {
        const key = config.get('GEMINI_API_KEY', { infer: true });
        return key ? new GoogleGenAI({ apiKey: key }) : null;
      },
    },
    {
      provide: VISION_BULK,
      inject: [ConfigService, GENAI_CLIENT],
      useFactory: visionProviderFactory('GEMINI_MODEL_BULK'),
    },
    {
      provide: VISION_ESCALATION,
      inject: [ConfigService, GENAI_CLIENT],
      useFactory: visionProviderFactory('GEMINI_MODEL_ESCALATION'),
    },
    { provide: VisionPort, useClass: VisionRouter },
    AnalyzeImageUseCase,
    VisionProcessor,
  ],
})
export class AiWorkerModule {}
