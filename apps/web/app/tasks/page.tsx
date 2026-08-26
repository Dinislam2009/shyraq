"use client";

import { TaskBoard } from "../../components/task-board";
import { AuthGate, useAuthSession } from "../../components/auth-gate";

function TasksPageContent() {
  const session = useAuthSession();
  if (!session) return null;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          <a className="nav-item" href="/">Today</a>
          <a className="nav-item nav-item-active" href="/tasks">Tasks</a>
          <a className="nav-item" href="/calendar">Calendar</a>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Тапсырмалар</h1>
          </div>
          <div className="connection-status" aria-label="Connection status">
            <span className="status-dot" /> Online
          </div>
        </header>
        <TaskBoard accessToken={session.access_token} />
      </section>
    </main>
  );
}

export default function TasksPage() {
  return (
    <AuthGate>
      <TasksPageContent />
    </AuthGate>
  );
}
