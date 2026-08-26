"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import { getAnalytics, type Analytics } from "../../lib/api";

function AnalyticsContent() {
  const session = useAuthSession();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setError(null);
    getAnalytics(days, session.access_token).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics"));
  }, [session, days]);

  const maxActivity = useMemo(() => Math.max(1, ...(data?.series.map((item) => item.tasksCompleted + item.habitsCompleted + item.reviews) ?? [1])), [data]);
  if (!session) return null;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          <Link className="nav-item" href="/">Today</Link>
          <Link className="nav-item" href="/tasks">Tasks</Link>
          <Link className="nav-item" href="/projects">Projects</Link>
          <Link className="nav-item" href="/habits">Habits</Link>
          <Link className="nav-item" href="/calendar">Calendar</Link>
          <Link className="nav-item" href="/learning">Learning</Link>
          <Link className="nav-item nav-item-active" href="/analytics">Analytics</Link>
        </nav>
      </aside>
      <section className="content-panel">
        <header className="topbar">
          <div><p className="eyebrow">Progress</p><h1>Analytics</h1></div>
          <div className="inline-form"><button onClick={() => setDays(7)} aria-pressed={days === 7}>7 days</button><button onClick={() => setDays(30)} aria-pressed={days === 30}>30 days</button></div>
        </header>
        {error && <p role="alert">{error}</p>}
        {data && <>
          <div className="board-grid">
            <section className="card-panel"><h2>Tasks</h2><strong>{data.totals.tasksCompleted}</strong><span>completed</span></section>
            <section className="card-panel"><h2>Habits</h2><strong>{data.totals.habitsCompleted}</strong><span>completions</span></section>
            <section className="card-panel"><h2>Focus</h2><strong>{data.totals.focusMinutes} min</strong><span>focused</span></section>
            <section className="card-panel"><h2>Learning</h2><strong>{data.totals.reviewAccuracy}%</strong><span>{data.totals.reviews} reviews</span></section>
          </div>
          <section className="card-panel">
            <h2>Daily activity</h2>
            <div className="analytics-chart" aria-label={`${days}-day activity chart`}>
              {data.series.map((item) => {
                const activity = item.tasksCompleted + item.habitsCompleted + item.reviews;
                const height = Math.max(6, Math.round((activity / maxActivity) * 100));
                return <div className="analytics-bar-wrap" key={item.date} title={`${item.date}: ${activity} activities`}><div className="analytics-bar" style={{ height: `${height}%` }} /><small>{item.date.slice(5)}</small></div>;
              })}
            </div>
          </section>
          <section className="card-panel"><h2>Active areas</h2><p>{data.totals.activeHabits} habits · {data.totals.activeDecks} learning decks</p><p>{data.totals.correctReviews}/{data.totals.reviews} reviews correct</p></section>
        </>}
      </section>
    </main>
  );
}

export default function AnalyticsPage() { return <AuthGate><AnalyticsContent /></AuthGate>; }
