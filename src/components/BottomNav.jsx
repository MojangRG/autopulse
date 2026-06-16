const items = [
  ["home", "⌂", "Главная"],
  ["journal", "≋", "История"],
  ["passport", "◈", "Паспорт"],
  ["ai", "✦", "AI"],
  ["more", "☰", "Ещё"],
];

export default function BottomNav({ tab, setTab, reminderCount = 0 }) {
  return (
    <nav className="mx-bottom-nav bottom-nav">
      {items.map(([id, icon, label]) => (
        <button key={id} className={`mx-nav-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
          <span className="mx-nav-icon-wrap"><span className="mx-nav-icon">{icon}</span>{id === "home" && reminderCount > 0 && <span className="nav-badge">{reminderCount > 3 ? "3+" : reminderCount}</span>}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
