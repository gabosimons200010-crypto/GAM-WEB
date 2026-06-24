import { AnalyzeImageUseCase } from './analyze-image.use-case';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { AIAnalysisRepository, AnalysisRecord, VisionSave } from '../ports/ai-analysis.repository';
import { VisionPort, VisionInput, VisionResult } from '../ports/vision.port';
import { StoragePort } from '../../../../shared/storage/storage.port';
import { OutboxPublisher, DomainEvent } from '../../../../shared/events/outbox';
import { CategoryRepository } from '../../../catalog/application/ports/category.repository';
import { CreateProductDraftUseCase } from '../../../catalog/application/use-cases/create-product-draft.use-case';
import { BatchCounts } from '../../domain/ai';

const ANALYSIS: AnalysisRecord = {
  id: 'a1',
  storeId: 's1',
  imageKey: 'stores/s1/uploads/x.webp',
  optimizedUrl: 'https://cdn/opt.webp',
  noBgUrl: 'https://cdn/nobg.png',
};

const VISION: VisionResult = {
  attributes: { garmentType: 'polo', gender: 'HOMBRE', colors: ['negro'], seoTags: ['polo'] },
  categoryId: 'c1',
  name: 'Polo negro',
  description: 'desc',
  tags: ['polo'],
  confidence: 0.9,
  provider: 'stub',
  model: 'stub',
  costUsd: 0,
};

class FakeBatches extends AIBatchRepository {
  public finalStatus?: string;
  create(): never {
    throw new Error('n/a');
  }
  findById(): never {
    throw new Error('n/a');
  }
  async setStatus(_id: string, status: string) {
    this.finalStatus = status;
  }
  async incrementProcessed(): Promise<BatchCounts> {
    return { total: 1, processed: 1, failed: 0 };
  }
  async incrementFailed(): Promise<BatchCounts> {
    return { total: 1, processed: 0, failed: 1 };
  }
}

class FakeAnalyses extends AIAnalysisRepository {
  public saved?: VisionSave;
  public failedWith?: string;
  async create() {
    return { id: 'a1' };
  }
  async get() {
    return ANALYSIS;
  }
  async markMediaDone() {}
  async saveVision(_id: string, data: VisionSave) {
    this.saved = data;
  }
  async markFailed(_id: string, error: string) {
    this.failedWith = error;
  }
  async getImageHash() {
    return null;
  }
  async findHashedProducts() {
    return [];
  }
  async setDuplicateOf() {}
  async listDuplicateSuggestions() {
    return [];
  }
  async clearDuplicate() {}
  async getSuggestion() {
    return null;
  }
}

class FakeVision extends VisionPort {
  constructor(private readonly result: VisionResult | Error) {
    super();
  }
  async analyze(_input: VisionInput): Promise<VisionResult> {
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

class FakeStorage extends StoragePort {
  async getBytes() {
    return Buffer.from('img');
  }
  createUploadUrl(): never {
    throw new Error('n/a');
  }
  putBytes(): never {
    throw new Error('n/a');
  }
  publicUrl(key: string) {
    return `https://cdn/${key}`;
  }
}

class FakeCategories extends CategoryRepository {
  async flat() {
    return [{ id: 'c1', name: 'Polos' }];
  }
  tree(): never {
    throw new Error('n/a');
  }
  exists(): never {
    throw new Error('n/a');
  }
  idBySlug(): never {
    throw new Error('n/a');
  }
}

class FakeDraft {
  public created?: { storeId: string; name: string };
  async execute(input: { storeId: string; name: string }) {
    this.created = { storeId: input.storeId, name: input.name };
    return { id: 'p1' } as never;
  }
}

class FakeOutbox extends OutboxPublisher {
  public events: DomainEvent[] = [];
  async publish(e: DomainEvent) {
    this.events.push(e);
  }
}

function build(vision: VisionResult | Error) {
  const batches = new FakeBatches();
  const analyses = new FakeAnalyses();
  const draft = new FakeDraft();
  const outbox = new FakeOutbox();
  const useCase = new AnalyzeImageUseCase(
    batches,
    analyses,
    new FakeVision(vision),
    new FakeStorage(),
    new FakeCategories(),
    draft as unknown as CreateProductDraftUseCase,
    outbox,
  );
  return { useCase, batches, analyses, draft, outbox };
}

describe('AnalyzeImageUseCase', () => {
  it('analiza, crea borrador, guarda visión, emite AIDraftReady y cierra el lote', async () => {
    const { useCase, batches, analyses, draft, outbox } = build(VISION);

    await useCase.execute({ analysisId: 'a1', batchId: 'b1', storeId: 's1' });

    expect(draft.created).toEqual({ storeId: 's1', name: 'Polo negro' });
    expect(analyses.saved?.productId).toBe('p1');
    expect(analyses.saved?.lowConfidence).toBe(false);
    expect(outbox.events[0].type).toBe('AIDraftReady');
    expect(outbox.events[0].payload).toMatchObject({ productId: 'p1', storeId: 's1' });
    expect(batches.finalStatus).toBe('DONE');
  });

  it('ante fallo de visión marca el análisis como fallido sin tumbar el lote', async () => {
    const { useCase, analyses, batches } = build(new Error('429 cuota'));

    await useCase.execute({ analysisId: 'a1', batchId: 'b1', storeId: 's1' });

    expect(analyses.failedWith).toContain('429');
    expect(batches.finalStatus).toBe('FAILED');
  });
});
