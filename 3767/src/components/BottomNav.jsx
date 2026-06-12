export default function BottomNav({ tab, setTab }) {
  const items = [
    ["home", "🏠", "Главная"],
    ["journal", "📋", "Журнал"],
    ["ai", "🤖", "AI"],
    ["more", "☰", "Ещё"],
  ];

  return (
    <div className="bottom-nav">
      {items.map(([id, icon, label]) => (
        <button
          key={id}
          className={tab === id ? "nav-active" : ""}
          onClick={() => setTab(id)}
        >
          <span>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </div>
  );
}
