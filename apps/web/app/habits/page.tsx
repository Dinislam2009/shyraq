"use client";

import Link from "next/link";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import { HabitBoard } from "../../components/habit-board";

function HabitsPageContent() {
  const session = useAuthSession();
  if (!session) return null;
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          <Link className="nav-item" href="/">Today</Link>
          <Link className="nav-item" href="/tasks">Tasks</Link>
          <Link className="nav-item" href="/calendar">Calendar</Link>
          <Link className="nav-item nav-item-active" href="/habits">Habits</Link>
        </nav>
      </aside>
      <section className="content-panel">
        <header className="topbar">
          <div><p className="eyebrow">Wednesday, August 26</p><h1>Habits</h1></div>
          <div className="connection-status"><span className="status-dot" /> Online</div>
        </header>
        <HabitBoard accessToken={session.access_token} />
      </section>
    </main>
  );
}

export default function HabitsPage() {
  return <AuthGate><HabitsPageContent /></AuthGate>;
}
