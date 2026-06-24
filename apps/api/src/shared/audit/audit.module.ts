import { Global, Module } from '@nestjs/common';
import { AuditLogger } from './audit-logger';
import { PrismaAuditLogger } from './prisma-audit-logger';

@Global()
@Module({
  providers: [{ provide: AuditLogger, useClass: PrismaAuditLogger }],
  exports: [AuditLogger],
})
export class AuditModule {}
