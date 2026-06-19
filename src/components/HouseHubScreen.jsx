import "../motrix-ui.css";

function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

function zoneClass(zone) {
  return ["estate-zone-card", zone.tone || "neutral", zone.enabled ? "enabled" : "locked", zone.color || ""].join(" ");
}

function taskToneClass(task) {
  return `estate-task-card ${task.tone || "neutral"}`;
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
  onOpenHome,
  onOpenPet,
  onOpenDevices,
}) {
  const zones = estate?.zones || [];
  const tasks = estate?.tasks || [];
  const setupTasks = estate?.setupTasks || [];
  const garage = estate?.garage || {};

  function openZone(zone) {
    if (zone.id === "garage" && onOpenGarage) return onOpenGarage();
    if (zone.id === "docs" && onOpenDocs) return onOpenDocs();
    if (zone.id === "home" && onOpenHome) return onOpenHome();
    if (zone.id === "pet" && onOpenPet) return onOpenPet();
    if (zone.id === "devices" && onOpenDevices) return onOpenDevices();
  }

  function openTask(task) {
    if (task.route === "garage") return onOpenGarage?.();
    if (task.route === "docs") return onOpenDocs?.();
    if (task.route === "room-home") return onOpenHome?.();
    if (task.route === "pet") return onOpenPet?.();
    if (task.route === "devices") return onOpenDevices?.();
  }

  return (
    <div className="mx-page estate-hub-page">
      <section className={`estate-hero estate-tamagotchi ${estate?.estateTone || "neutral"}`}>
        <div className="estate-hero-glow" />
        <div className="estate-hero-top">
          <span>{estate?.concept || "AI-дом имущества"}</span>
          <b>{estate?.estateScore || 0}%</b>
        </div>
        <h1>{estate?.estateName || "Мой дом"}</h1>
        <p>{estate?.todaySummary || "Собираем состояние ваших важных объектов."}</p>

        <div className="estate-house-map" aria-label="Карта AI-дома">
          {zones.map((zone) => (
            <button key={zone.id} className={`estate-room-dot ${zone.id} ${zone.tone || "neutral"}`} onClick={() => openZone(zone)}>
              <span>{zone.emoji}</span>
              <b>{zone.title}</b>
            </button>
          ))}
        </div>

        <div className="estate-hero-actions">
          <button onClick={onOpenGarage}>Гараж</button>
          <button onClick={onOpenHome}>Дом</button>
          <button onClick={onOpenDevices}>Sense</button>
        </div>
      </section>

      <section className="estate-today-strip">
        <div>
          <span>Гараж</span>
          <b>{garage.vehicleTitle || "Авто"}</b>
          <small>{garage.mileage ? km(garage.mileage) : "пробег не указан"}</small>
        </div>
        <div>
          <span>Расходы</span>
          <b>{estate?.money?.next6Months ? rub(estate.money.next6Months) : "—"}</b>
          <small>6 месяцев</small>
        </div>
        <div>
          <span>Сигналы</span>
          <b>{reminders?.length || 0}</b>
          <small>активно</small>
        </div>
      </section>

      <div className="estate-section-head">
        <span>Комнаты</span>
        <small>Каждая зона — отдельный AI-паспорт</small>
      </div>

      <section className="estate-zone-grid">
        {zones.map((zone) => (
          <button key={zone.id} className={zoneClass(zone)} onClick={() => openZone(zone)}>
            <div className="estate-zone-icon">{zone.emoji}</div>
            <div className="estate-zone-main">
              <span>{zone.title}</span>
              <strong>{zone.status}</strong>
              <small>{zone.subtitle}</small>
              <div className="estate-zone-signal-row">
                {(zone.liveSignals || []).slice(0, 3).map((signal) => <em key={signal}>{signal}</em>)}
              </div>
            </div>
            <div className="estate-zone-metric">
              <b>{zone.primaryMetric}</b>
              <em>{zone.metricLabel}</em>
            </div>
          </button>
        ))}
      </section>

      <div className="estate-section-head">
        <span>Сегодня</span>
        <small>Что важно, чтобы не попасть на деньги</small>
      </div>

      <section className="estate-task-list">
        {tasks.length ? tasks.map((task) => (
          <button key={task.id} className={taskToneClass(task)} onClick={() => openTask(task)}>
            <span>{task.zone === "garage" ? "Гараж" : "Дом"}</span>
            <strong>{task.title}</strong>
            <small>{task.subtitle}</small>
            <em>{task.cta}</em>
          </button>
        )) : (
          <div className="estate-empty-card">
            <b>Дом спокоен</b>
            <span>Сейчас нет срочных сигналов. Добавляйте документы и события, Motrix будет держать порядок.</span>
          </div>
        )}

        {setupTasks.map((task) => (
          <button key={task.id} className={taskToneClass(task)} onClick={() => openTask(task)}>
            <span>Следующий слой</span>
            <strong>{task.title}</strong>
            <small>{task.subtitle}</small>
            <em>{task.cta}</em>
          </button>
        ))}
      </section>

      <section className="estate-sense-card">
        <div>
          <span>MOTRIX SENSE</span>
          <h3>Нервная система дома</h3>
          <p>Гараж, дом и питомец смогут получать живые сигналы от OBD, сигнализаций, счётчиков, датчиков, Pet Gate и промышленных контроллеров.</p>
        </div>
        <button onClick={onOpenDevices}>Открыть Sense</button>
      </section>

      <section className="estate-quick-actions">
        <button onClick={onOpenProfile}>Быстрая история авто</button>
        <button onClick={onManualAdd}>Добавить событие</button>
        <button onClick={onOpenAi}>Что требует внимания?</button>
      </section>
    </div>
  );
}
