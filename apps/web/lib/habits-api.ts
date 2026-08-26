export type HabitCompletion = {
  id: string;
  date: string;
};

export type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  completions: HabitCompletion[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getHabits(accessToken?: string) {
  return request<Habit[]>("/api/v1/habits", {}, accessToken);
}

export function createHabit(input: { title: string; description?: string | null }, accessToken?: string) {
  return request<Habit>("/api/v1/habits", { method: "POST", body: JSON.stringify(input) }, accessToken);
}

export function deleteHabit(id: string, accessToken?: string) {
  return request<void>(`/api/v1/habits/${id}`, { method: "DELETE" }, accessToken);
}

export function completeHabit(id: string, date?: string, accessToken?: string) {
  return request<HabitCompletion>(`/api/v1/habits/${id}/completions`, {
    method: "POST",
    body: JSON.stringify(date ? { date } : {}),
  }, accessToken);
}

export function uncompleteHabit(id: string, accessToken?: string) {
  return request<void>(`/api/v1/habits/${id}/completions/today`, { method: "DELETE" }, accessToken);
}
