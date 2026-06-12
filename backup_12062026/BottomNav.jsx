export default function BottomNav({ tab, setTab }) {
  const items = [
    ["home", "🏠"],
    ["journal", "📖"],
    ["add", "➕"],
    ["ai", "🤖"],
    ["settings", "⚙️"],
  ];

  return (
    <div className="bottom-nav">
      {items.map(([id, icon]) => (
        <button
          key={id}
          className={tab === id ? "nav-active" : ""}
          onClick={() => setTab(id)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}