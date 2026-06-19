import "../motrix-ui.css";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
function pct(v) { return Math.max(0, Math.min(100, Math.round(Number(v || 0)))); }
function tone(score) { if (score >= 80) return "good"; if (score >= 55) return "warn"; return "bad"; }

function ActionBlock({ title, subtitle, onClick, accent, inputProps }) {
  if (inputProps) {
    return (
      <label className={`tg-action-block ${accent || ""}`}>
        <span>{title}</span>
        <small>{subtitle}</small>
        <input {...inputProps} hidden />
      </label>
    );
  }
  return (
    <button className={`tg-action-block ${accent || ""}`} onClick={onClick}>
      <span>{title}</span>
      <small>{subtitle}</small>
    </button>
  );
}

function StateBlock({ title, value, subtitle, accent }) {
  return (
    <div className={`tg-state-block ${accent || ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  );
}

export default function HomeScreen({
  vehicle,
  mileage,
  newMileage,
  setNewMileage,
  saveMileage,
  healthScore,
  urgentActions = [],
  upcomingItems = [],
  costForecast = {},
  statusSentence,
  reminders = [],
  isParsingDoc,
  onScan,
  onManualAdd,
  onOpenPassport,
  onOpenDevices,
  onOpenAi,
}) {
  const score = pct(healthScore || 0);
  const title = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Автомобиль";
  const primary = urgentActions?.[0] || upcomingItems?.[0];

  return (
    <div className="mx-page tg-page tg-room-page">
      <section className={`tg-room-hero garage ${tone(score)}`}>
        <div className="tg-room-hero-copy">
          <span>Гараж</span>
          <h1>{title}</h1>
          <p>{statusSentence || "Автомобиль под наблюдением. События, устройства, AI-механик и паспорт живут здесь."}</p>
        </div>
        <div className="tg-room-score">
          <b>{score}%</b>
          <small>состояние</small>
        </div>
      </section>

      <section className="tg-mileage-line">
        <div>
          <span>Пробег</span>
          <b>{km(mileage)}</b>
        </div>
        <div className="tg-mileage-edit">
          <input value={newMileage} onChange={(e) => setNewMileage(e.target.value)} inputMode="numeric" />
          <button onClick={saveMileage}>OK</button>
        </div>
      </section>

      <section className="tg-room-states">
        <StateBlock title="Ближайшее" value={primary?.name || primary?.title || "нет срочного"} subtitle={primary?.left ? `Осталось ${km(Math.abs(primary.left))}` : "Motrix не видит критичных событий"} accent="garage" />
        <StateBlock title="Расходы" value={costForecast?.next6Months ? rub(costForecast.next6Months) : "—"} subtitle="ориентир на 6 месяцев" accent="money" />
        <StateBlock title="Сигналы" value={reminders?.length || 0} subtitle="активных напоминаний" accent="signal" />
      </section>

      <section className="tg-action-grid-simple">
        <ActionBlock title="Добавить событие" subtitle="работа, чек или запись вручную" onClick={onManualAdd} accent="primary" />
        <ActionBlock title={isParsingDoc ? "Читаю документ" : "Сканировать чек"} subtitle="фото заказ-наряда → журнал" accent="soft" inputProps={{ type: "file", accept: "image/*", onChange: onScan, disabled: isParsingDoc }} />
        <ActionBlock title="Устройства" subtitle="OBD, StarLine, датчики гаража" onClick={onOpenDevices} accent="soft" />
        <ActionBlock title="AI-механик" subtitle="спросить по состоянию авто" onClick={onOpenAi} accent="ai" />
        <ActionBlock title="Паспорт" subtitle="VIN, регламент, прогноз, история" onClick={onOpenPassport} accent="passport" />
      </section>
    </div>
  );
}
