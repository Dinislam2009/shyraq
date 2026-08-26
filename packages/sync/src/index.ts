export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";

export interface OutboxOperation {
  operationId: string;
  entityType: "task";
  entityId: string;
  operation: SyncOperationType;
  baseVersion: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SyncPullOperation extends OutboxOperation {
  sequence: string;
  version: number;
}

export interface SyncPullResponse {
  cursor: string;
  nextCursor: string;
  hasMore: boolean;
  operations: SyncPullOperation[];
}

export function isSyncOperationType(value: unknown): value is SyncOperationType {
  return value === "CREATE" || value === "UPDATE" || value === "DELETE";
}
