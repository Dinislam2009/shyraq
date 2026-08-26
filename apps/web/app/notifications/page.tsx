"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import {
  getNotificationPreferences,
  getNotifications,
  markNotificationRead,
  updateNotificationPreferences,
  type Notification,
  type NotificationPreferences,
} from "../../lib/api";

const preferenceLabels = [
  ["taskReminders", "Task reminders", "Due-date and task reminders"],
  ["habitReminders", "Habit reminders", "Daily habit reminders"],
  ["focusReminders", "Focus reminders", "Focus session reminders"],
  ["learningReminders", "Learning reminders", "Flashcard review reminders"],
] as const;

function NotificationsPageContent() {
  const session = useAuthSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!session) return;
    try {
      const [feed, prefs] = await Promise.all([
        getNotifications(session.access_token),
        getNotificationPreferences(session.access_token),
      ]);
      setNotifications(feed.notifications);
      setUnreadCount(feed.unreadCount);
      setPreferences(prefs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    }
  }

  useEffect(() => { load(); }, [session]);

  async function read(notification: Notification) {
    if (!session || notification.readAt) return;
    try {
      await markNotificationRead(notification.id, session.access_token);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark notification as read");
    }
  }

  async function toggle(key: keyof Pick<NotificationPreferences, "taskReminders" | "habitReminders" | "focusReminders" | "learningReminders">) {
    if (!session || !preferences) return;
    const next = !preferences[key];
    setPreferences({ ...preferences, [key]: next });
    try {
      const saved = await updateNotificationPreferences({ [key]: next }, session.access_token);
      setPreferences(saved);
    } catch (e) {
      setPreferences({ ...preferences, [key]: !next });
      setError(e instanceof Error ? e.message : "Failed to update preferences");
    }
  }

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
          <Link className="nav-item" href="/calendar">Calendar</Link>
          <Link className="nav-item" href="/habits">Habits</Link>
          <Link className="nav-item" href="/learning">Learning</Link>
          <Link className="nav-item" href="/analytics">Analytics</Link>
          <Link className="nav-item nav-item-active" href="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar"><div><p className="eyebrow">Phase 11</p><h1>Notifications</h1></div></header>
        {error && <p role="alert">{error}</p>}
        <div className="board-grid">
          <section className="card-panel">
            <h2>Inbox</h2>
            <p>{unreadCount} unread</p>
            {notifications.length === 0 && <p>No notifications yet.</p>}
            {notifications.map((notification) => (
              <button key={notification.id} className="list-row" onClick={() => read(notification)} aria-label={notification.readAt ? notification.title : `Mark ${notification.title} as read`}>
                <span><strong>{notification.title}</strong><br />{notification.message}<br /><small>{new Date(notification.createdAt).toLocaleString()}</small></span>
                {!notification.readAt && <strong>NEW</strong>}
              </button>
            ))}
          </section>

          <section className="card-panel">
            <h2>Reminder preferences</h2>
            {preferences && preferenceLabels.map(([key, title, description]) => (
              <label key={key} className="list-row">
                <span><strong>{title}</strong><br /><small>{description}</small></span>
                <input type="checkbox" checked={preferences[key]} onChange={() => toggle(key)} />
              </label>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

export default function NotificationsPage() { return <AuthGate><NotificationsPageContent /></AuthGate>; }
