import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MediaJobQueue } from '../application/ports/media-job-queue';
import { MediaJob } from '../domain/ai';
import { QUEUE_MEDIA } from '../../../shared/queue/queue.constants';

@Injectable()
export class BullMediaJobQueue extends MediaJobQueue {
  constructor(@InjectQueue(QUEUE_MEDIA) private readonly queue: Queue) {
    super();
  }

  async enqueue(job: MediaJob): Promise<void> {
    // jobId por análisis → idempotencia (reintentos no duplican el procesamiento).
    await this.queue.add('process-image', job, { jobId: job.analysisId });
  }
}
