import { createRxDatabase, type RxCollection, type RxDatabase } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import type { OutboxOperation, SyncOperationType } from "./index.js";

export interface TaskDocument {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OutboxDocument extends OutboxOperation {
  baseVersion: number;
}

const taskSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    userId: { type: "string", maxLength: 36 },
    title: { type: "string", maxLength: 500 },
    description: { type: ["string", "null"] },
    status: { type: "string", maxLength: 32 },
    priority: { type: "string", maxLength: 32 },
    dueAt: { type: ["string", "null"] },
    version: { type: "number", minimum: 1 },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    deletedAt: { type: ["string", "null"] }
  },
  required: ["id", "userId", "title", "description", "status", "priority", "dueAt", "version", "createdAt", "updatedAt", "deletedAt"]
} as const;

const outboxSchema = {
  version: 0,
  primaryKey: "operationId",
  type: "object",
  properties: {
    operationId: { type: "string", maxLength: 36 },
    entityType: { type: "string", maxLength: 32 },
    entityId: { type: "string", maxLength: 36 },
    operation: { type: "string", maxLength: 16 },
    baseVersion: { type: "number", minimum: 0 },
    payload: { type: "object" },
    createdAt: { type: "string" }
  },
  required: ["operationId", "entityType", "entityId", "operation", "baseVersion", "payload", "createdAt"]
} as const;

export interface ShyraqDatabase {
  tasks: RxCollection<TaskDocument>;
  outbox: RxCollection<OutboxDocument>;
}

let databasePromise: Promise<RxDatabase<ShyraqDatabase>> | undefined;

export function getShyraqDatabase(userId: string): Promise<RxDatabase<ShyraqDatabase>> {
  if (!databasePromise) {
    const safeName = `shyraq-${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    databasePromise = createRxDatabase<ShyraqDatabase>({
      name: safeName,
      storage: getRxStorageDexie(),
      multiInstance: true,
      eventReduce: true
    }).then(async (db) => {
      await db.addCollections({
        tasks: { schema: taskSchema },
        outbox: { schema: outboxSchema }
      });
      return db;
    });
  }

  return databasePromise;
}

export async function queueOperation(
  db: RxDatabase<ShyraqDatabase>,
  operation: Omit<OutboxOperation, "createdAt"> & { operation: SyncOperationType }
): Promise<void> {
  await db.outbox.insert({
    ...operation,
    createdAt: new Date().toISOString()
  });
}
