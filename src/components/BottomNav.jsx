export default function BottomNav({ tab, setTab, reminderCount = 0 }) {
  const items = [
    ["home",     "🏠", "Главная"],
    ["journal",  "📋", "История"],
    ["passport", "📄", "Паспорт"],
    ["ai",       "🤖", "AI"],
    ["more",     "⚙️", "Ещё"],
  ];

  return (
    <nav className="bottom-nav">
      {items.map(([id, icon, label]) => (
        <button
          key={id}
          className={`nav-btn${tab === id ? " active" : ""}`}
          onClick={() => setTab(id)}
        >
          <span className="nav-btn-icon-wrap">
            <span className="nav-btn-icon">{icon}</span>
            {id === "home" && reminderCount > 0 && (
              <span className="nav-badge">{reminderCount > 9 ? "9+" : reminderCount}</span>
            )}
          </span>
          <span className="nav-btn-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
