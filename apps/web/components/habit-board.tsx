"use client";

import { useEffect, useMemo, useState } from "react";
import { completeHabit, createHabit, deleteHabit, getHabits, type Habit, uncompleteHabit } from "../lib/habits-api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function completionsFor(habit: Habit) {
  return Array.isArray(habit.completions) ? habit.completions : [];
}

function streakFor(habit: Habit) {
  const dates = new Set(completionsFor(habit).map((item) => item.date.slice(0, 10)));
  let cursor = new Date(`${today()}T00:00:00.000Z`);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function HabitBoard({ accessToken }: { accessToken: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedToday = useMemo(
    () => habits.filter((habit) => completionsFor(habit).some((item) => item.date.slice(0, 10) === today())).length,
    [habits],
  );

  useEffect(() => {
    getHabits(accessToken).then(setHabits).catch((e) => setError(e instanceof Error ? e.message : "Failed to load habits")).finally(() => setLoading(false));
  }, [accessToken]);

  async function addHabit() {
    if (!title.trim() || saving) return;
    setSaving(true); setError(null);
    try {
      const habit = await createHabit({ title }, accessToken);
      setHabits((current) => [habit, ...current]);
      setTitle("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create habit"); }
    finally { setSaving(false); }
  }

  async function toggle(habit: Habit) {
    setError(null);
    const completions = completionsFor(habit);
    const done = completions.some((item) => item.date.slice(0, 10) === today());
    try {
      if (done) {
        await uncompleteHabit(habit.id, accessToken);
        setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, completions: completionsFor(item).filter((completion) => completion.date.slice(0, 10) !== today()) } : item));
      } else {
        const completion = await completeHabit(habit.id, today(), accessToken);
        setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, completions: [completion, ...completionsFor(item)] } : item));
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update habit"); }
  }

  async function remove(id: string) {
    setError(null);
    try { await deleteHabit(id, accessToken); setHabits((current) => current.filter((habit) => habit.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to delete habit"); }
  }

  return (
    <section className="habits-section">
      <div className="section-heading">
        <div><p className="eyebrow">Daily routine</p><h2>Әдеттер</h2></div>
        <span className="task-count">{completedToday}/{habits.length}</span>
      </div>
      <div className="habit-progress"><div className="habit-progress-bar" style={{ width: habits.length ? `${(completedToday / habits.length) * 100}%` : "0%" }} /></div>
      <form className="habit-add" onSubmit={(event) => { event.preventDefault(); void addHabit(); }}>
        <span className="plus-icon">+</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Жаңа әдет қосу..." aria-label="Жаңа әдет" />
        <button type="submit" disabled={!title.trim() || saving}>Қосу</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {loading ? <p className="empty-state">Жүктелуде...</p> : habits.length === 0 ? <p className="empty-state">Әзірге әдет жоқ. Бірінші әдетіңді қос.</p> : (
        <div className="habit-list">
          {habits.map((habit) => {
            const done = completionsFor(habit).some((item) => item.date.slice(0, 10) === today());
            return <article className={`habit-card ${done ? "habit-card-done" : ""}`} key={habit.id}>
              <button className={`checkbox ${done ? "checkbox-done" : ""}`} onClick={() => void toggle(habit)} aria-label={done ? "Әдетті орындалмаған деп белгілеу" : "Әдетті орындау"}>{done ? "✓" : ""}</button>
              <div className="habit-copy"><h3 className={done ? "task-completed" : ""}>{habit.title}</h3><p>{streakFor(habit)} күн қатарынан</p></div>
              <button className="task-delete" onClick={() => void remove(habit.id)} aria-label="Әдетті өшіру">×</button>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
