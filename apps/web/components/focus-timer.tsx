"use client";

import { useEffect, useMemo, useState } from "react";
import { cancelFocus, completeFocus, getFocusSessions, getTasks, startFocus, type FocusSession, type Task } from "../lib/api";

function elapsedSeconds(session: FocusSession, now: number) {
  if (session.durationSeconds !== null) return session.durationSeconds;
  return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export function FocusTimer({ accessToken }: { accessToken: string }) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFocusSessions(accessToken), getTasks(accessToken)])
      .then(([sessions, nextTasks]) => {
        setSession(sessions.find((item) => item.status === "RUNNING") ?? null);
        setTasks(nextTasks);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Focus жүктелмеді"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const elapsed = useMemo(() => session ? elapsedSeconds(session, now) : 0, [session, now]);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      setSession(await startFocus(selectedTaskId || null, accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Focus басталмады");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await completeFocus(session.id, accessToken);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Focus аяқталмады");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await cancelFocus(session.id, accessToken);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Focus тоқтатылмады");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="focus-section" aria-labelledby="focus-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Focus mode</p>
          <h2 id="focus-heading">Фокус</h2>
        </div>
        <span className="task-count">{session ? "ON" : "OFF"}</span>
      </div>

      {error ? <p role="alert" className="error-message">{error}</p> : null}
      {loading ? <p className="empty-state">Жүктелуде...</p> : null}

      {!loading && !session ? (
        <div className="focus-idle">
          <div className="focus-time">25:00</div>
          <p>Бір тапсырманы таңдап, фокус сессиясын баста.</p>
          <div className="focus-controls">
            <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} aria-label="Focus тапсырмасы">
              <option value="">Тапсырмасыз фокус</option>
              {tasks.filter((task) => task.status !== "COMPLETED").map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            <button type="button" onClick={() => void begin()} disabled={busy}>Бастау</button>
          </div>
        </div>
      ) : null}

      {!loading && session ? (
        <div className="focus-active">
          <div className="focus-time">{formatDuration(elapsed)}</div>
          <p>{session.task?.title ?? "Тапсырмасыз фокус"}</p>
          <div className="focus-controls">
            <button type="button" onClick={() => void finish()} disabled={busy}>Аяқтау</button>
            <button type="button" onClick={() => void cancel()} disabled={busy}>Тоқтату</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
