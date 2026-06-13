export default function BottomNav({ tab, setTab }) {
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
          <span className="nav-btn-icon">{icon}</span>
          <span className="nav-btn-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
