import "../motrix-ui.css";

function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

function zoneClass(zone, index) {
  return ["plata-room-card", zone.gradient || "slate", zone.tone || "neutral", zone.enabled ? "enabled" : "locked"].join(" ");
}

function taskToneClass(task) {
  return `plata-task-row ${task.tone || "neutral"}`;
}

function zoneLabel(zone) {
  if (zone.id === "garage") return "Гараж";
  if (zone.id === "home") return "Дом";
  if (zone.id === "pet") return "Питомец";
  if (zone.id === "devices") return "Sense";
  return "Vault";
}

export default function HouseHubScreen({
  estate,
  vehicle,
  vehicleBrain,
  reminders,
  onOpenGarage,
  onOpenDocs,
  onOpenAi,
  onOpenProfile,
  onManualAdd,
  onOpenZone,
}) {
  const zones = estate?.zones || [];
  const tasks = estate?.tasks || [];
  const garage = estate?.garage || {};

  function openZone(zone) {
    if (onOpenZone) return onOpenZone(zone.id);
    if (zone.id === "garage" && onOpenGarage) return onOpenGarage();
    if (zone.id === "docs" && onOpenDocs) return onOpenDocs();
  }

  return (
    <div className="mx-page plata-hub-page">
      <section className={`plata-home-hero ${estate?.estateTone || "neutral"}`}>
        <div className="plata-orb orb-one" />
        <div className="plata-orb orb-two" />
        <div className="plata-hero-nav">
          <span>{estate?.concept || "AI-дом имущества"}</span>
          <button onClick={onOpenAi}>AI</button>
        </div>

        <div className="plata-hero-copy">
          <span className="plata-kicker">Добро пожаловать домой</span>
          <h1>{estate?.estateName || "Мой дом"}</h1>
          <p>{estate?.todaySummary || "Собираем состояние важных объектов."}</p>
        </div>

        <button className="plata-score-card" onClick={onOpenGarage}>
          <span>Под контролем</span>
          <strong>{estate?.estateScore || 0}%</strong>
          <small>{garage.vehicleTitle || "первый объект"}</small>
        </button>
      </section>

      <section className="plata-search-action" onClick={onOpenAi}>
        <span>⌕</span>
        <b>Что требует внимания?</b>
        <small>Спросить AI по дому, гаражу, документам и устройствам</small>
      </section>

      <section className="plata-action-grid">
        <button className="plata-action-tile" onClick={onOpenGarage}>
          <span>▣</span>
          <b>Гараж</b>
          <small>{garage.mileage ? km(garage.mileage) : "пробег не указан"}</small>
        </button>
        <button className="plata-action-tile" onClick={onOpenDocs}>
          <span>▤</span>
          <b>Vault</b>
          <small>{estate?.docsCount || 0} документов</small>
        </button>
        <button className="plata-action-tile" onClick={() => onOpenZone?.("devices")}>
          <span>✺</span>
          <b>Sense</b>
          <small>{estate?.senseCatalog?.length || 0} коннекторов</small>
        </button>
      </section>

      <div className="plata-section-head">
        <div>
          <span>Комнаты</span>
          <b>Живой дом имущества</b>
        </div>
        <small>Нажмите комнату</small>
      </div>

      <section className="plata-room-grid">
        {zones.map((zone, index) => (
          <button
            key={zone.id}
            className={zoneClass(zone, index)}
            style={{ "--delay": `${index * 55}ms` }}
            onClick={() => openZone(zone)}
          >
            <div className="plata-room-top">
              <span className="plata-room-icon">{zone.icon || zone.emoji}</span>
              <em>{zone.kicker || zoneLabel(zone)}</em>
            </div>
            <strong>{zone.title}</strong>
            <small>{zone.subtitle}</small>
            <div className="plata-room-bottom">
              <b>{zone.primaryMetric}</b>
              <i>{zone.metricLabel}</i>
            </div>
          </button>
        ))}
      </section>

      <div className="plata-section-head">
        <div>
          <span>Сегодня</span>
          <b>Сигналы и следующие действия</b>
        </div>
        <small>{tasks.length} карточек</small>
      </div>

      <section className="plata-task-stack">
        {tasks.length ? tasks.map((task, index) => (
          <button
            key={task.id}
            className={taskToneClass(task)}
            style={{ "--delay": `${index * 45}ms` }}
            onClick={() => onOpenZone?.(task.zone === "devices" ? "devices" : task.zone)}
          >
            <span>{zoneLabel({ id: task.zone })}</span>
            <strong>{task.title}</strong>
            <small>{task.subtitle}</small>
            <em>{task.cta}</em>
          </button>
        )) : (
          <div className="estate-empty-card">
            <b>Дом спокоен</b>
            <span>Сейчас нет срочных сигналов. Добавляйте документы и устройства, Motrix будет держать порядок.</span>
          </div>
        )}
      </section>

      <section className="plata-sense-banner" onClick={() => onOpenZone?.("devices")}>
        <div>
          <span>Motrix Sense</span>
          <h3>Вещи сами докладывают о состоянии</h3>
          <p>OBD, StarLine, датчики протечки, счётчики, умные розетки и Pet Gate станут нервной системой AI-дома.</p>
        </div>
        <button>Открыть</button>
      </section>

      <section className="plata-quick-strip">
        <button onClick={onOpenProfile}>История авто</button>
        <button onClick={onManualAdd}>Событие</button>
        <button onClick={onOpenAi}>AI-вопрос</button>
      </section>
    </div>
  );
}
