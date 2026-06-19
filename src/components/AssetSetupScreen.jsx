import "../motrix-ui.css";

const OPTIONS = [
  { id: "vehicle", title: "Автомобиль", label: "Гараж", icon: "▣", text: "VIN, СТС, пробег, сервисная история, расходы, паспорт и AI-механик.", cta: "Добавить авто", tone: "blue" },
  { id: "home", title: "Дом", label: "Комнаты", icon: "⌂", text: "Счётчики, фильтры, протечки, техника, гарантии и будущий Sense Hub.", cta: "Добавить дом", tone: "green" },
  { id: "pet", title: "Питомец", label: "Pet Gate", icon: "◌", text: "Чип, ветпаспорт, прививки, корм, вес, визиты и умная pet-станция.", cta: "Добавить питомца", tone: "yellow" },
];

export default function AssetSetupScreen({ user, hasVehicle, compact = false, onAddVehicle, onAddHome, onAddPet, onSkip, onOpenApp }) {
  function pick(id) {
    if (id === "vehicle") return onAddVehicle?.();
    if (id === "home") return onAddHome?.();
    if (id === "pet") return onAddPet?.();
  }

  return (
    <main className={`mx-asset-setup ${compact ? "compact" : ""}`}>
      <section className="mx-asset-hero mx-enter-rise">
        <div className="mx-asset-hero-copy"><span>AI-ДОМ ИМУЩЕСТВА</span><h1>{user?.name ? `${user.name}, что добавим?` : "Что добавим в дом?"}</h1><p>Выберите первую комнату. Можно начать с авто, дома или питомца. Можно пропустить и зайти в пустой дом.</p></div>
        <div className="mx-asset-hero-meter"><b>{hasVehicle ? "1" : "0"}</b><small>объектов</small></div>
      </section>
      <section className="mx-asset-option-grid">
        {OPTIONS.map((item, index) => (
          <button key={item.id} className={`mx-asset-option ${item.tone}`} onClick={() => pick(item.id)} style={{ "--delay": `${index * 70}ms` }}>
            <span className="mx-asset-option-icon">{item.icon}</span><span className="mx-asset-option-label">{item.label}</span><strong>{item.title}</strong><small>{item.text}</small><em>{item.cta}</em>
          </button>
        ))}
      </section>
      <section className="mx-asset-skip-card"><div><b>Пока ничего не добавлять</b><span>Откроется пустой дом. Позже можно добавить гараж, дом, питомца или устройство через кнопку “Добавить”.</span></div><button onClick={onSkip || onOpenApp}>Пропустить</button></section>
    </main>
  );
}
