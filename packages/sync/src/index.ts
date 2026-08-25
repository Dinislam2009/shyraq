export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface OutboxOperation {
  operationId: string;
  entityType: string;
  entityId: string;
  operation: SyncOperationType;
  baseVersion: bigint;
  payload: unknown;
  createdAt: string;
}
