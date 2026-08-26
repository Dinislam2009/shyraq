"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import { getTasks, updateTask, type Task } from "../../lib/api";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek(date: Date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + mondayOffset);
  return value;
}

function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dateKey(date: Date) {
  const value = startOfDay(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarPageContent() {
  const session = useAuthSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<"week" | "day">("week");
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = () => {
    if (!session) return;
    setLoading(true);
    void getTasks(session.access_token)
      .then(setTasks)
      .catch((err) => setError(err instanceof Error ? err.message : "Күнтізбені жүктеу сәтсіз аяқталды"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(
    () => (view === "day" ? [cursor] : Array.from({ length: 7 }, (_, index) => new Date(weekStart.getTime() + index * DAY_MS))),
    [cursor, view, weekStart],
  );

  const datedTasks = useMemo(() => tasks.filter((task) => task.dueAt), [tasks]);
  const taskMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of datedTasks) {
      const key = dateKey(new Date(task.dueAt!));
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    }
    for (const value of map.values()) value.sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
    return map;
  }, [datedTasks]);

  const rangeLabel = view === "day"
    ? new Intl.DateTimeFormat("kk-KZ", { dateStyle: "long" }).format(cursor)
    : `${new Intl.DateTimeFormat("kk-KZ", { day: "numeric", month: "short" }).format(days[0])} — ${new Intl.DateTimeFormat("kk-KZ", { day: "numeric", month: "short", year: "numeric" }).format(days[6])}`;

  const move = (direction: number) => {
    setCursor((current) => new Date(current.getTime() + direction * (view === "day" ? DAY_MS : DAY_MS * 7)));
  };

  const reschedule = async (task: Task, value: string) => {
    if (!session || !value) return;
    setSavingTaskId(task.id);
    setError(null);
    try {
      const updated = await updateTask(task.id, { dueAt: new Date(value).toISOString() }, session.access_token);
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тапсырманы қайта жоспарлау сәтсіз аяқталды");
    } finally {
      setSavingTaskId(null);
    }
  };

  if (!session) return null;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          <a className="nav-item" href="/">Today</a>
          <a className="nav-item" href="/tasks">Tasks</a>
          <a className="nav-item nav-item-active" href="/calendar">Calendar</a>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Schedule</p>
            <h1>Күнтізбе</h1>
          </div>
          <div className="connection-status" aria-label="Connection status"><span className="status-dot" /> Online</div>
        </header>

        <section className="calendar-section" aria-labelledby="calendar-heading">
          <div className="calendar-toolbar">
            <div>
              <p className="eyebrow">Planning</p>
              <h2 id="calendar-heading">{rangeLabel}</h2>
            </div>
            <div className="calendar-actions">
              <button type="button" className="calendar-button" onClick={() => setCursor(startOfDay(new Date()))}>Бүгін</button>
              <button type="button" className="calendar-button" onClick={() => move(-1)} aria-label="Алдыңғы кезең">←</button>
              <button type="button" className="calendar-button" onClick={() => move(1)} aria-label="Келесі кезең">→</button>
              <button type="button" className={`calendar-button ${view === "week" ? "calendar-button-active" : ""}`} onClick={() => setView("week")}>Апта</button>
              <button type="button" className={`calendar-button ${view === "day" ? "calendar-button-active" : ""}`} onClick={() => setView("day")}>Күн</button>
            </div>
          </div>

          {loading ? <p className="empty-state">Жүктелуде...</p> : null}
          {error ? <p role="alert" className="error-message">{error}</p> : null}

          {!loading && !error ? (
            <div className={`calendar-grid calendar-grid-${view}`}>
              {days.map((day) => {
                const dayTasks = taskMap.get(dateKey(day)) ?? [];
                const isToday = sameDay(day, new Date());
                return (
                  <section className={`calendar-day ${isToday ? "calendar-day-today" : ""}`} key={dateKey(day)}>
                    <header className="calendar-day-header">
                      <div>
                        <span>{new Intl.DateTimeFormat("kk-KZ", { weekday: "short" }).format(day)}</span>
                        <strong>{day.getDate()}</strong>
                      </div>
                      <span>{dayTasks.length}</span>
                    </header>
                    <div className="calendar-day-tasks">
                      {dayTasks.length === 0 ? <p className="calendar-day-empty">Бос</p> : null}
                      {dayTasks.map((task) => (
                        <article className="calendar-task" key={task.id}>
                          <div className="calendar-task-time">{new Intl.DateTimeFormat("kk-KZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(task.dueAt!))}</div>
                          <h3>{task.title}</h3>
                          <p>{task.status}</p>
                          <label className="calendar-reschedule">
                            <span>Уақытын өзгерту</span>
                            <input
                              type="datetime-local"
                              value={new Date(new Date(task.dueAt!).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                              disabled={savingTaskId === task.id}
                              onChange={(event) => void reschedule(task, event.target.value)}
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}

          {!loading && !error && datedTasks.length === 0 ? <p className="empty-state">Мерзімі қойылған тапсырмалар әзірге жоқ. Алдымен Tasks бөлімінен due date қой.</p> : null}
        </section>
      </section>
    </main>
  );
}

export default function CalendarPage() {
  return <AuthGate><CalendarPageContent /></AuthGate>;
}
