export interface RowError {
  row: number; // 1-based
  message: string;
}

export interface ImportJobResult {
  rowsTotal: number;
  rowsOk: number;
  rowsError: number;
  errors: RowError[];
}

export abstract class ImportJobRepository {
  abstract record(
    storeId: string,
    fileRef: string | null,
    result: ImportJobResult,
  ): Promise<{ id: string }>;
}
