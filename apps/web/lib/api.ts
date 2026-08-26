export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  version: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getTasks(accessToken?: string): Promise<Task[]> {
  const response = await fetch(`${API_URL}/api/v1/tasks`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load tasks (${response.status})`);
  }

  return response.json() as Promise<Task[]>;
}
