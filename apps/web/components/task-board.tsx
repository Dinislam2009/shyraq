"use client";

import { useEffect, useState } from "react";
import { createTask, deleteTask, getTasks, updateTask, type Task } from "../lib/api";

export function TaskBoard({ accessToken }: { accessToken: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      setTasks(await getTasks(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырмаларды жүктеу сәтсіз аяқталды");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [accessToken]);

  async function addTask() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const task = await createTask({ title: trimmed }, accessToken);
      setTasks((current) => [task, ...current]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырма қосылмады");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    const status = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      const updated = await updateTask(task.id, { status }, accessToken);
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырма жаңартылмады");
    }
  }

  async function removeTask(task: Task) {
    try {
      await deleteTask(task.id, accessToken);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырма өшірілмеді");
    }
  }

  return (
    <section className="tasks-section" aria-labelledby="tasks-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Focus</p>
          <h2 id="tasks-heading">Тапсырмалар</h2>
        </div>
        <span className="task-count">{tasks.length}</span>
      </div>

      <form className="quick-add" onSubmit={(event) => { event.preventDefault(); void addTask(); }}>
        <span className="plus-icon">+</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Жаңа тапсырма" aria-label="Жаңа тапсырма" />
        <button type="submit" disabled={saving || !title.trim()}>{saving ? "..." : "Қосу"}</button>
      </form>

      {error ? <p role="alert" className="error-message">{error}</p> : null}
      {loading ? <p className="empty-state">Жүктелуде...</p> : null}
      {!loading && tasks.length === 0 ? <p className="empty-state">Әзірге тапсырма жоқ.</p> : null}

      <div className="task-list">
        {tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <button className={`checkbox ${task.status === "COMPLETED" ? "checkbox-done" : ""}`} onClick={() => void toggleTask(task)} aria-label={task.status === "COMPLETED" ? "Қайта ашу" : "Аяқтау"} />
            <div className="task-copy">
              <h3 className={task.status === "COMPLETED" ? "task-completed" : ""}>{task.title}</h3>
              <p>{task.priority !== "NONE" ? `Priority: ${task.priority}` : task.status}</p>
            </div>
            <button className="task-delete" onClick={() => void removeTask(task)} aria-label={`${task.title} өшіру`}>×</button>
          </article>
        ))}
      </div>
    </section>
  );
}
