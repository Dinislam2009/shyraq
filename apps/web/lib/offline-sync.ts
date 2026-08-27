import type { Task } from "./api";

type PendingOperation = {
  operationId: string;
  entityType: "TASK";
  entityId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  baseVersion: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

type SyncResponse = {
  cursor: string;
  nextCursor: string;
  hasMore: boolean;
  operations: Array<PendingOperation & { sequence: string; version: number }>;
};

const queueKey = (userId: string) => `shyraq:sync:queue:${userId}`;
const tasksKey = (userId: string) => `shyraq:sync:tasks:${userId}`;
const cursorKey = (userId: string) => `shyraq:sync:cursor:${userId}`;

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCachedTasks(userId: string): Task[] {
  return read<Task[]>(tasksKey(userId), []);
}

export function cacheTasks(userId: string, tasks: Task[]) {
  write(tasksKey(userId), tasks);
}

export function queueTaskOperation(userId: string, operation: Omit<PendingOperation, "operationId" | "createdAt">) {
  const pending = read<PendingOperation[]>(queueKey(userId), []);
  pending.push({ ...operation, operationId: crypto.randomUUID(), createdAt: new Date().toISOString() });
  write(queueKey(userId), pending);
}

export function getPendingTaskOperations(userId: string) {
  return read<PendingOperation[]>(queueKey(userId), []);
}

export async function flushSync(userId: string, accessToken: string, apiUrl: string) {
  if (!navigator.onLine) return false;
  const pending = getPendingTaskOperations(userId);
  if (pending.length > 0) {
    const response = await fetch(`${apiUrl}/api/v1/sync/push`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ operations: pending.slice(0, 100) }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await response.text());
    const result = (await response.json()) as { results: Array<{ operationId: string; status: string }> };
    const appliedIds = new Set(result.results.filter((item) => item.status !== "CONFLICT").map((item) => item.operationId));
    write(queueKey(userId), pending.filter((item) => !appliedIds.has(item.operationId)));
  }

  let cursor = read<string>(cursorKey(userId), "0");
  let hasMore = true;
  while (hasMore) {
    const response = await fetch(`${apiUrl}/api/v1/sync?cursor=${encodeURIComponent(cursor)}&limit=200`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await response.text());
    const data = (await response.json()) as SyncResponse;
    const tasks = getCachedTasks(userId);
    for (const operation of data.operations) {
      const index = tasks.findIndex((task) => task.id === operation.entityId);
      if (operation.operation === "DELETE") {
        if (index >= 0) tasks.splice(index, 1);
        continue;
      }
      const payload = operation.payload as Partial<Task>;
      const next: Task = {
        id: operation.entityId,
        title: payload.title ?? "Untitled",
        description: payload.description ?? null,
        status: payload.status ?? "TODO",
        priority: payload.priority ?? "NONE",
        dueAt: payload.dueAt ?? null,
        version: operation.version,
        projectId: payload.projectId ?? null,
        project: payload.project ?? null,
      };
      if (index >= 0) tasks[index] = next;
      else tasks.unshift(next);
    }
    cacheTasks(userId, tasks);
    cursor = data.nextCursor;
    hasMore = data.hasMore;
  }
  write(cursorKey(userId), cursor);
  return true;
}

export function setupSyncListeners(userId: string, accessToken: string, apiUrl: string, onSynced: () => void) {
  const sync = () => { void flushSync(userId, accessToken, apiUrl).then((changed) => { if (changed) onSynced(); }).catch(() => undefined); };
  window.addEventListener("online", sync);
  sync();
  return () => window.removeEventListener("online", sync);
}
