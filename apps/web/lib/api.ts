export type Project = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  version: number;
  projectId?: string | null;
  project?: Project | null;
};

type TaskInput = {
  title: string;
  description?: string | null;
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
  projectId?: string | null;
};

type TaskUpdateInput = Partial<TaskInput> & {
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

export type HabitCompletion = { id: string; date: string };
export type Habit = { id: string; title: string; description: string | null; frequency: "DAILY"; completions: HabitCompletion[] };
export type FocusSession = { id: string; taskId: string | null; status: "RUNNING" | "COMPLETED" | "CANCELLED"; startedAt: string; endedAt: string | null; durationSeconds: number | null; task?: Task | null };
export type FlashcardDeck = { id: string; name: string; description: string | null; archivedAt: string | null; createdAt: string; updatedAt: string; _count?: { cards: number } };
export type Flashcard = { id: string; deckId: string; front: string; back: string; position: number; createdAt: string; updatedAt: string };
export type FlashcardProgress = { cardCount: number; reviewCount: number; correctCount: number; reviewedCardCount: number; completionPercent: number };

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

export function getProjects(accessToken?: string) { return request<Project[]>("/api/v1/projects", {}, accessToken); }
export function createProject(input: { name: string; description?: string | null }, accessToken?: string) { return request<Project>("/api/v1/projects", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function updateProject(id: string, input: { name?: string; description?: string | null; archived?: boolean }, accessToken?: string) { return request<Project>(`/api/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }, accessToken); }
export function deleteProject(id: string, accessToken?: string) { return request<void>(`/api/v1/projects/${id}`, { method: "DELETE" }, accessToken); }
export function getTasks(accessToken?: string) { return request<Task[]>("/api/v1/tasks", {}, accessToken); }
export function createTask(input: TaskInput, accessToken?: string) { return request<Task>("/api/v1/tasks", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function updateTask(id: string, input: TaskUpdateInput, accessToken?: string) { return request<Task>(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }, accessToken); }
export function deleteTask(id: string, accessToken?: string) { return request<void>(`/api/v1/tasks/${id}`, { method: "DELETE" }, accessToken); }
export function getHabits(accessToken?: string) { return request<Habit[]>("/api/v1/habits", {}, accessToken); }
export function createHabit(title: string, accessToken?: string) { return request<Habit>("/api/v1/habits", { method: "POST", body: JSON.stringify({ title }) }, accessToken); }
export function completeHabit(id: string, accessToken?: string) { return request<HabitCompletion>(`/api/v1/habits/${id}/completions`, { method: "POST", body: JSON.stringify({}) }, accessToken); }
export function uncompleteHabit(id: string, accessToken?: string) { return request<void>(`/api/v1/habits/${id}/completions/today`, { method: "DELETE" }, accessToken); }
export function deleteHabit(id: string, accessToken?: string) { return request<void>(`/api/v1/habits/${id}`, { method: "DELETE" }, accessToken); }
export function getFocusSessions(accessToken?: string) { return request<FocusSession[]>("/api/v1/focus", {}, accessToken); }
export function startFocus(taskId?: string | null, accessToken?: string) { return request<FocusSession>("/api/v1/focus", { method: "POST", body: JSON.stringify({ taskId: taskId ?? null }) }, accessToken); }
export function completeFocus(id: string, accessToken?: string) { return request<FocusSession>(`/api/v1/focus/${id}/complete`, { method: "POST" }, accessToken); }
export function cancelFocus(id: string, accessToken?: string) { return request<FocusSession>(`/api/v1/focus/${id}/cancel`, { method: "POST" }, accessToken); }
export function getFlashcardDecks(accessToken?: string) { return request<FlashcardDeck[]>("/api/v1/learning/decks", {}, accessToken); }
export function createFlashcardDeck(input: { name: string; description?: string | null }, accessToken?: string) { return request<FlashcardDeck>("/api/v1/learning/decks", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function getFlashcards(deckId: string, accessToken?: string) { return request<Flashcard[]>(`/api/v1/learning/decks/${deckId}/cards`, {}, accessToken); }
export function createFlashcard(deckId: string, input: { front: string; back: string; position?: number }, accessToken?: string) { return request<Flashcard>(`/api/v1/learning/decks/${deckId}/cards`, { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function updateFlashcard(deckId: string, cardId: string, input: Partial<{ front: string; back: string; position: number }>, accessToken?: string) { return request<Flashcard>(`/api/v1/learning/decks/${deckId}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(input) }, accessToken); }
export function deleteFlashcard(deckId: string, cardId: string, accessToken?: string) { return request<void>(`/api/v1/learning/decks/${deckId}/cards/${cardId}`, { method: "DELETE" }, accessToken); }
export function archiveFlashcardDeck(deckId: string, accessToken?: string) { return request<FlashcardDeck>(`/api/v1/learning/decks/${deckId}`, { method: "PATCH", body: JSON.stringify({ archived: true }) }, accessToken); }
export function reviewFlashcard(deckId: string, cardId: string, correct: boolean, accessToken?: string) { return request<{ id: string; correct: boolean }>(`/api/v1/learning/decks/${deckId}/cards/${cardId}/reviews`, { method: "POST", body: JSON.stringify({ correct }) }, accessToken); }
export function getFlashcardProgress(deckId: string, accessToken?: string) { return request<FlashcardProgress>(`/api/v1/learning/decks/${deckId}/progress`, {}, accessToken); }
