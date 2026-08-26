"use client";

import { useEffect, useMemo, useState } from "react";
import { getHabits, getTasks, type Habit, type Task } from "../lib/api";

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(date: string | null) {
  return date ? date.slice(0, 10) === todayKey() : false;
}

export function DashboardSummary({ accessToken }: { accessToken: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getTasks(accessToken), getHabits(accessToken)])
      .then(([nextTasks, nextHabits]) => {
        if (!active) return;
        setTasks(nextTasks);
        setHabits(nextHabits);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Dashboard деректерін жүктеу сәтсіз аяқталды");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [accessToken]);

  const todayTasks = useMemo(() => tasks.filter((task) => isToday(task.dueAt)), [tasks]);
  const completedTasks = todayTasks.filter((task) => task.status === "COMPLETED").length;
  const completedHabits = habits.filter((habit) => habit.completions?.some((completion) => isToday(completion.date))).length;
  const totalHabits = habits.length;
  const totalItems = todayTasks.length + totalHabits;
  const completedItems = completedTasks + completedHabits;
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) return <section className="dashboard-summary"><p className="empty-state">Бүгінгі прогресс жүктелуде...</p></section>;
  if (error) return <section className="dashboard-summary"><p role="alert" className="error-message">{error}</p></section>;

  return (
    <section className="dashboard-summary" aria-labelledby="progress-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="progress-heading">Бүгінгі прогресс</h2>
        </div>
        <span className="task-count">{progress}%</span>
      </div>

      <div className="dashboard-progress" aria-label={`Бүгінгі прогресс ${progress}%`}>
        <div className="dashboard-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="dashboard-stats">
        <article className="dashboard-stat">
          <span>Тапсырмалар</span>
          <strong>{completedTasks}/{todayTasks.length}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Әдеттер</span>
          <strong>{completedHabits}/{totalHabits}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Жалпы прогресс</span>
          <strong>{completedItems}/{totalItems}</strong>
        </article>
      </div>

      <div className="dashboard-lists">
        <div>
          <p className="eyebrow">Today</p>
          <h3>Бүгінгі тапсырмалар</h3>
          {todayTasks.length === 0 ? <p className="dashboard-muted">Бүгінге deadline қойылған тапсырма жоқ.</p> : (
            <div className="dashboard-mini-list">
              {todayTasks.slice(0, 5).map((task) => (
                <div className="dashboard-mini-item" key={task.id}>
                  <span className={`mini-dot ${task.status === "COMPLETED" ? "mini-dot-done" : ""}`} />
                  <span className={task.status === "COMPLETED" ? "task-completed" : ""}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">Routine</p>
          <h3>Бүгінгі әдеттер</h3>
          {habits.length === 0 ? <p className="dashboard-muted">Әзірге әдет жоқ.</p> : (
            <div className="dashboard-mini-list">
              {habits.slice(0, 5).map((habit) => {
                const done = habit.completions?.some((completion) => isToday(completion.date));
                return <div className="dashboard-mini-item" key={habit.id}>
                  <span className={`mini-dot ${done ? "mini-dot-done" : ""}`} />
                  <span className={done ? "task-completed" : ""}>{habit.title}</span>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
