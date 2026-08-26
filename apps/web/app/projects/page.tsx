"use client";

import Link from "next/link";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import { ProjectBoard } from "../../components/project-board";

function ProjectsPageContent() {
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
          <Link className="nav-item" href="/habits">Habits</Link>
          <Link className="nav-item" href="/calendar">Calendar</Link>
          <Link className="nav-item nav-item-active" href="/projects">Projects</Link>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Phase 4</p>
            <h1>Projects</h1>
          </div>
        </header>
        <ProjectBoard accessToken={session.access_token} />
      </section>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGate>
      <ProjectsPageContent />
    </AuthGate>
  );
}
