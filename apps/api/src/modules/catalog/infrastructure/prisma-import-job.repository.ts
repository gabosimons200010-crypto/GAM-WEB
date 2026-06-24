import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ImportJobRepository,
  ImportJobResult,
} from '../application/ports/import-job.repository';

@Injectable()
export class PrismaImportJobRepository extends ImportJobRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async record(
    storeId: string,
    fileRef: string | null,
    result: ImportJobResult,
  ): Promise<{ id: string }> {
    const row = await this.prisma.importJob.create({
      data: {
        storeId,
        fileUrl: fileRef ?? 'inline',
        status: result.rowsError === 0 ? 'DONE' : result.rowsOk === 0 ? 'FAILED' : 'DONE',
        rowsTotal: result.rowsTotal,
        rowsOk: result.rowsOk,
        rowsError: result.rowsError,
        errors: result.errors as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    return row;
  }
}
