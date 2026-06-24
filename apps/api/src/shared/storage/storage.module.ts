import { Global, Module } from '@nestjs/common';
import { StoragePort } from './storage.port';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  providers: [{ provide: StoragePort, useClass: S3StorageAdapter }],
  exports: [StoragePort],
})
export class StorageModule {}
