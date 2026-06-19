import "../motrix-ui.css";

export default function HomeAssetScreen({ estate, onOpenDevices, onOpenDocs, onOpenAi }) {
  const systems = estate?.home?.systems || [];
  const groups = estate?.home?.senseGroups || [];

  return (
    <div className="mx-page estate-room-page">
      <div className="mx-page-head">
        <span>ROOM / HOME</span>
        <h2>Дом</h2>
        <p>Инженерка, счётчики, техника, фильтры, гарантии и датчики. Пока это контур, дальше сюда зайдёт первый бытовой модуль.</p>
      </div>

      <section className="estate-room-hero home">
        <div>
          <span>Домовой контур</span>
          <h3>Сделаем дом предсказуемым</h3>
          <p>Задача комнаты — заранее видеть протечки, расходы, обслуживание техники, гарантийные сроки и бытовые поломки.</p>
        </div>
        <button onClick={onOpenDevices}>Подключить Sense</button>
      </section>

      <div className="estate-section-head">
        <span>Системы дома</span>
        <small>Будущие паспорта внутри комнаты</small>
      </div>

      <section className="estate-system-grid">
        {systems.map((system) => (
          <button key={system.id} className={`estate-system-card ${system.tone}`}>
            <span>{system.title}</span>
            <strong>{system.status}</strong>
            <small>{system.metric}</small>
          </button>
        ))}
      </section>

      <div className="estate-section-head">
        <span>Подключения</span>
        <small>Что может стать источником сигналов</small>
      </div>

      <section className="estate-device-list">
        {groups.map((group) => (
          <button key={group.id} className="estate-device-card" onClick={onOpenDevices}>
            <span>{group.productName}</span>
            <strong>{group.title}</strong>
            <small>{group.description}</small>
            <em>{group.userValue}</em>
          </button>
        ))}
      </section>

      <section className="estate-quick-actions">
        <button onClick={onOpenDocs}>Добавить гарантию</button>
        <button onClick={onOpenAi}>Что первым подключить?</button>
      </section>
    </div>
  );
}
