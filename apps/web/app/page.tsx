import Link from "next/link";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
];

export default function HomePage() {
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
            <p className="eyebrow">Wednesday, August 26</p>
            <h1>Бүгін</h1>
          </div>
          <div className="connection-status" aria-label="Connection status">
            <span className="status-dot" /> Online
          </div>
        </header>

        <section className="quick-add" aria-label="Quick add">
          <span className="plus-icon">+</span>
          <span>Жаңа тапсырма</span>
        </section>

        <section className="tasks-section" aria-labelledby="tasks-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Focus</p>
              <h2 id="tasks-heading">Тапсырмалар</h2>
            </div>
            <span className="task-count">3</span>
          </div>

          <div className="task-list">
            <article className="task-card">
              <span className="checkbox" aria-hidden="true" />
              <div>
                <h3>Математика</h3>
                <p>Бүгін, 18:00</p>
              </div>
            </article>
            <article className="task-card">
              <span className="checkbox" aria-hidden="true" />
              <div>
                <h3>English</h3>
                <p>Бүгін, 20:00</p>
              </div>
            </article>
            <article className="task-card">
              <span className="checkbox" aria-hidden="true" />
              <div>
                <h3>Shyraq project</h3>
                <p>Priority: High</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
