import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VisionJobQueue, VisionJob } from '../application/ports/vision-job-queue';
import { QUEUE_AI } from '../../../shared/queue/queue.constants';

@Injectable()
export class BullVisionJobQueue extends VisionJobQueue {
  constructor(@InjectQueue(QUEUE_AI) private readonly queue: Queue) {
    super();
  }

  async enqueue(job: VisionJob): Promise<void> {
    await this.queue.add('analyze-image', job, { jobId: `vision-${job.analysisId}` });
  }
}
