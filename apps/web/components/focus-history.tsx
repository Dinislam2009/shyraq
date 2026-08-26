"use client";

import { useEffect, useMemo, useState } from "react";
import { getFocusSessions, type FocusSession } from "../lib/api";

function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} сағ ${remainder} мин` : `${hours} сағ`;
}

function sameDay(date: string, target: Date) {
  const value = new Date(date);
  return value.getFullYear() === target.getFullYear()
    && value.getMonth() === target.getMonth()
    && value.getDate() === target.getDate();
}

export function FocusHistory({ accessToken }: { accessToken: string }) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getFocusSessions(accessToken)
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Focus тарихы жүктелмеді"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const stats = useMemo(() => {
    const today = new Date();
    const completedToday = sessions.filter((session) => session.status === "COMPLETED" && sameDay(session.startedAt, today));
    const secondsToday = completedToday.reduce((total, session) => total + (session.durationSeconds ?? 0), 0);
    return { count: completedToday.length, seconds: secondsToday };
  }, [sessions]);

  const recent = sessions
    .filter((session) => session.status === "COMPLETED")
    .slice(0, 5);

  return (
    <section className="focus-history" aria-labelledby="focus-history-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Focus history</p>
          <h2 id="focus-history-heading">Фокус нәтижесі</h2>
        </div>
      </div>

      {error ? <p role="alert" className="error-message">{error}</p> : null}
      {loading ? <p className="empty-state">Жүктелуде...</p> : null}

      {!loading ? (
        <>
          <div className="focus-stats">
            <div className="focus-stat-card">
              <span>Бүгін</span>
              <strong>{formatMinutes(stats.seconds)}</strong>
            </div>
            <div className="focus-stat-card">
              <span>Сессия</span>
              <strong>{stats.count}</strong>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="empty-state">Әзірге аяқталған Focus сессиясы жоқ.</p>
          ) : (
            <div className="focus-history-list">
              {recent.map((session) => (
                <article className="focus-history-item" key={session.id}>
                  <div>
                    <strong>{session.task?.title ?? "Тапсырмасыз фокус"}</strong>
                    <span>{new Intl.DateTimeFormat("kk-KZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.startedAt))}</span>
                  </div>
                  <strong>{formatMinutes(session.durationSeconds ?? 0)}</strong>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
