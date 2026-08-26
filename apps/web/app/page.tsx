import Link from "next/link";
import { TaskBoard } from "../components/task-board";
import { AuthGate } from "../components/auth-gate";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
];

export default function HomePage() {
  return (
    <AuthGate>
      {(session) => (
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
                <p className="eyebrow">Wednesday, August 26</p>
                <h1>Бүгін</h1>
              </div>
              <div className="connection-status" aria-label="Connection status">
                <span className="status-dot" /> Online
              </div>
            </header>

            <TaskBoard accessToken={session.access_token} />
          </section>
        </main>
      )}
    </AuthGate>
  );
}
