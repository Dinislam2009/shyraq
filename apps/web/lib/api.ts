export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  version: number;
};

type TaskInput = {
  title: string;
  description?: string | null;
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
};

type TaskUpdateInput = Partial<TaskInput> & {
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

export type HabitCompletion = {
  id: string;
  date: string;
};

export type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY";
  completions: HabitCompletion[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getTasks(accessToken?: string) {
  return request<Task[]>("/api/v1/tasks", {}, accessToken);
}

export function createTask(input: TaskInput, accessToken?: string) {
  return request<Task>("/api/v1/tasks", { method: "POST", body: JSON.stringify(input) }, accessToken);
}

export function updateTask(id: string, input: TaskUpdateInput, accessToken?: string) {
  return request<Task>(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }, accessToken);
}

export function deleteTask(id: string, accessToken?: string) {
  return request<void>(`/api/v1/tasks/${id}`, { method: "DELETE" }, accessToken);
}

export function getHabits(accessToken?: string) {
  return request<Habit[]>("/api/v1/habits", {}, accessToken);
}

export function createHabit(title: string, accessToken?: string) {
  return request<Habit>("/api/v1/habits", {
    method: "POST",
    body: JSON.stringify({ title }),
  }, accessToken);
}

export function completeHabit(id: string, accessToken?: string) {
  return request<HabitCompletion>(`/api/v1/habits/${id}/completions`, {
    method: "POST",
    body: JSON.stringify({}),
  }, accessToken);
}

export function uncompleteHabit(id: string, accessToken?: string) {
  return request<void>(`/api/v1/habits/${id}/completions/today`, {
    method: "DELETE",
  }, accessToken);
}

export function deleteHabit(id: string, accessToken?: string) {
  return request<void>(`/api/v1/habits/${id}`, { method: "DELETE" }, accessToken);
}
