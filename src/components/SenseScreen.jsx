import "../motrix-ui.css";

function statusText(status) {
  if (status === "MVP-ready") return "можно пилотировать";
  if (status === "white-label") return "white-label";
  if (status === "integration") return "интеграция";
  if (status === "partner-api") return "API/партнёрство";
  if (status === "concept") return "концепт";
  return "позже";
}

export default function SenseScreen({ estate, onOpenGarage, onOpenHome, onOpenPet, onOpenAi }) {
  const groups = estate?.devices?.groups || [];

  function openZone(zone) {
    if (zone === "garage") return onOpenGarage?.();
    if (zone === "home") return onOpenHome?.();
    if (zone === "pet") return onOpenPet?.();
  }

  return (
    <div className="mx-page estate-room-page">
      <div className="mx-page-head">
        <span>MOTRIX SENSE</span>
        <h2>Устройства</h2>
        <p>Нервная система AI-дома: внешние датчики и интеграции, которые превращают имущество из статичной карточки в живой источник сигналов.</p>
      </div>

      <section className="estate-room-hero sense">
        <div>
          <span>Device layer</span>
          <h3>Не гаджеты, а органы чувств</h3>
          <p>OBD видит машину, счётчики видят расходы, датчики видят аварии, Pet Gate узнаёт питомца, ASU TP открывает B2B-контур.</p>
        </div>
        <button onClick={onOpenAi}>Собрать MVP-приоритет</button>
      </section>

      <div className="estate-section-head">
        <span>Каталог подключений</span>
        <small>{groups.length} направлений Sense</small>
      </div>

      <section className="estate-device-list">
        {groups.map((group) => (
          <button key={group.id} className={`estate-device-card zone-${group.zone}`} onClick={() => openZone(group.zone)}>
            <span>{group.productName} · {statusText(group.status)}</span>
            <strong>{group.title}</strong>
            <small>{group.description}</small>
            <div className="estate-signal-chips">
              {group.signals.map((signal) => <em key={signal}>{signal}</em>)}
            </div>
            <p>{group.userValue}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
