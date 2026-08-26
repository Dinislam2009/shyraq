"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import { getTasks, type Task } from "../../lib/api";

function CalendarPageContent() {
  const session = useAuthSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void getTasks(session.access_token)
      .then(setTasks)
      .catch((err) => setError(err instanceof Error ? err.message : "Күнтізбені жүктеу сәтсіз аяқталды"))
      .finally(() => setLoading(false));
  }, [session]);

  const datedTasks = useMemo(
    () => tasks.filter((task) => task.dueAt).sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()),
    [tasks],
  );

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
          <div className="connection-status" aria-label="Connection status">
            <span className="status-dot" /> Online
          </div>
        </header>

        <section className="calendar-section" aria-labelledby="calendar-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Upcoming</p>
              <h2 id="calendar-heading">Жоспарланған тапсырмалар</h2>
            </div>
            <span className="task-count">{datedTasks.length}</span>
          </div>

          {loading ? <p className="empty-state">Жүктелуде...</p> : null}
          {error ? <p role="alert" className="error-message">{error}</p> : null}
          {!loading && !error && datedTasks.length === 0 ? (
            <p className="empty-state">Мерзімі қойылған тапсырмалар әзірге жоқ.</p>
          ) : null}

          <div className="calendar-list">
            {datedTasks.map((task) => (
              <article className="calendar-card" key={task.id}>
                <time dateTime={task.dueAt!}>
                  {new Intl.DateTimeFormat("kk-KZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(task.dueAt!))}
                </time>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.status}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function CalendarPage() {
  return (
    <AuthGate>
      <CalendarPageContent />
    </AuthGate>
  );
}
