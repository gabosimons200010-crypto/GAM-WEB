import { MediaJob } from '../../domain/ai';

/** Productor de jobs de procesamiento de imagen (cola "media"). */
export abstract class MediaJobQueue {
  abstract enqueue(job: MediaJob): Promise<void>;
}
