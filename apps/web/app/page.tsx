"use client";

import Link from "next/link";
import { DashboardSummary } from "../components/dashboard-summary";
import { FocusTimer } from "../components/focus-timer";
import { TaskBoard } from "../components/task-board";
import { AuthGate, useAuthSession } from "../components/auth-gate";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/habits", label: "Habits" },
  { href: "/calendar", label: "Calendar" },
];

function Dashboard() {
  const session = useAuthSession();
  if (!session) return null;

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("kk-KZ", { weekday: "long", month: "long", day: "numeric" }).format(now);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          {navItems.map((item, index) => (
            <Link className={`nav-item ${index === 0 ? "nav-item-active" : ""}`} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{dateLabel}</p>
            <h1>Бүгін</h1>
          </div>
          <div className="connection-status" aria-label="Connection status">
            <span className="status-dot" /> Online
          </div>
        </header>

        <DashboardSummary accessToken={session.access_token} />
        <FocusTimer accessToken={session.access_token} />
        <TaskBoard accessToken={session.access_token} />
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
