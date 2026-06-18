import "../motrix-ui.css";

function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

function zoneClass(zone) {
  return ["estate-zone-card", zone.tone || "neutral", zone.enabled ? "enabled" : "locked"].join(" ");
}

function taskToneClass(task) {
  return `estate-task-card ${task.tone || "neutral"}`;
}

export default function HouseHubScreen({ estate, vehicle, vehicleBrain, reminders, onOpenGarage, onOpenDocs, onOpenAi, onOpenProfile, onManualAdd }) {
  const zones = estate?.zones || [];
  const tasks = estate?.tasks || [];
  const garage = estate?.garage || {};

  function openZone(zone) {
    if (zone.id === "garage" && onOpenGarage) return onOpenGarage();
    if (zone.id === "docs" && onOpenDocs) return onOpenDocs();
  }

  return (
    <div className="mx-page estate-hub-page">
      <section className={`estate-hero ${estate?.estateTone || "neutral"}`}>
        <div className="estate-hero-glow" />
        <div className="estate-hero-top">
          <span>AI-ДОМ ИМУЩЕСТВА</span>
          <b>{estate?.estateScore || 0}%</b>
        </div>
        <h1>{estate?.estateName || "Мой дом"}</h1>
        <p>{estate?.todaySummary || "Собираем состояние ваших важных объектов."}</p>
        <div className="estate-hero-actions">
          <button onClick={onOpenGarage}>Открыть гараж</button>
          <button onClick={onOpenDocs}>Документы</button>
          <button onClick={onOpenAi}>Спросить AI</button>
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
          <button key={zone.id} className={zoneClass(zone)} onClick={() => openZone(zone)} disabled={!zone.enabled}>
            <div className="estate-zone-icon">{zone.emoji}</div>
            <div className="estate-zone-main">
              <span>{zone.title}</span>
              <strong>{zone.status}</strong>
              <small>{zone.subtitle}</small>
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
          <button key={task.id} className={taskToneClass(task)} onClick={onOpenGarage}>
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
      </section>

      <section className="estate-sense-card">
        <div>
          <span>MOTRIX SENSE</span>
          <h3>Нервная система дома</h3>
          <p>Готовим слой подключений: ELM/OBD, StarLine, датчики протечки, счётчики, умные розетки, Pet Gate и ASU TP. Устройства будут не “гаджетами”, а источниками событий для AI-дома.</p>
        </div>
        <button onClick={onOpenDocs}>Смотреть концепт</button>
      </section>

      <section className="estate-quick-actions">
        <button onClick={onOpenProfile}>Быстрая история авто</button>
        <button onClick={onManualAdd}>Добавить событие</button>
        <button onClick={onOpenAi}>Что требует внимания?</button>
      </section>
    </div>
  );
}
