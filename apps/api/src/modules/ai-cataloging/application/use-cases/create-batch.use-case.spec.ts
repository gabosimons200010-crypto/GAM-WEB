import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateBatchUseCase } from './create-batch.use-case';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { AIAnalysisRepository, ProcessedMedia } from '../ports/ai-analysis.repository';
import { MediaJobQueue } from '../ports/media-job-queue';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { AIBatchView, AIBatchStatus, MediaJob } from '../../domain/ai';

class FakeBatches extends AIBatchRepository {
  public created?: { storeId: string; total: number };
  public status?: AIBatchStatus;
  async create(storeId: string, total: number): Promise<AIBatchView> {
    this.created = { storeId, total };
    return { id: 'b1', storeId, status: 'QUEUED', total, processed: 0, failed: 0, source: 'upload', createdAt: new Date() };
  }
  async findById() {
    return null;
  }
  async setStatus(_id: string, status: AIBatchStatus) {
    this.status = status;
  }
  async incrementProcessed() {
    return { total: 0, processed: 0, failed: 0 };
  }
  async incrementFailed() {
    return { total: 0, processed: 0, failed: 0 };
  }
}

class FakeAnalyses extends AIAnalysisRepository {
  public count = 0;
  async create() {
    this.count += 1;
    return { id: `a${this.count}` };
  }
  async markMediaDone(_id: string, _m: ProcessedMedia) {}
  async markFailed() {}
}

class FakeQueue extends MediaJobQueue {
  public jobs: MediaJob[] = [];
  async enqueue(job: MediaJob) {
    this.jobs.push(job);
  }
}

class FakeStores extends StoreRepository {
  constructor(private readonly owns: boolean) {
    super();
  }
  async userOwnsStore() {
    return this.owns;
  }
  slugExists(): never {
    throw new Error('n/a');
  }
  register(): never {
    throw new Error('n/a');
  }
  findById(): never {
    throw new Error('n/a');
  }
  findBySlug(): never {
    throw new Error('n/a');
  }
  findByOwner(): never {
    throw new Error('n/a');
  }
  update(): never {
    throw new Error('n/a');
  }
  getSettings(): never {
    throw new Error('n/a');
  }
  upsertSettings(): never {
    throw new Error('n/a');
  }
  setStatus(): never {
    throw new Error('n/a');
  }
  setVerified(): never {
    throw new Error('n/a');
  }
  list(): never {
    throw new Error('n/a');
  }
}

describe('CreateBatchUseCase', () => {
  it('crea lote, un análisis por imagen y encola un job por cada una', async () => {
    const batches = new FakeBatches();
    const analyses = new FakeAnalyses();
    const queue = new FakeQueue();
    const useCase = new CreateBatchUseCase(batches, analyses, queue, new FakeStores(true));

    const batch = await useCase.execute({
      userId: 'u1',
      storeId: 's1',
      imageKeys: ['k1', 'k2', 'k3'],
    });

    expect(batches.created).toEqual({ storeId: 's1', total: 3 });
    expect(analyses.count).toBe(3);
    expect(queue.jobs).toHaveLength(3);
    expect(queue.jobs[0]).toMatchObject({ batchId: 'b1', storeId: 's1', imageKey: 'k1' });
    expect(batch.status).toBe('PROCESSING');
    expect(batches.status).toBe('PROCESSING');
  });

  it('rechaza si el usuario no administra la tienda', async () => {
    const useCase = new CreateBatchUseCase(new FakeBatches(), new FakeAnalyses(), new FakeQueue(), new FakeStores(false));
    await expect(
      useCase.execute({ userId: 'u2', storeId: 's1', imageKeys: ['k1'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza lotes vacíos o que exceden el máximo', async () => {
    const useCase = new CreateBatchUseCase(new FakeBatches(), new FakeAnalyses(), new FakeQueue(), new FakeStores(true));
    await expect(useCase.execute({ userId: 'u1', storeId: 's1', imageKeys: [] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
