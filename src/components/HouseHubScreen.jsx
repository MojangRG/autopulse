import "../motrix-ui.css";

function rub(v) { const n = Number(v || 0); return n > 0 ? `${n.toLocaleString("ru-RU")} ₽` : "—"; }
function km(v) { const n = Number(v || 0); return n > 0 ? `${n.toLocaleString("ru-RU")} км` : "пробег не указан"; }
function zoneClass(zone) { return ["estate-zone-card", "mx-plata-card", zone.tone || "neutral", "enabled"].join(" "); }
function taskToneClass(task) { return `estate-task-card mx-plata-card ${task.tone || "neutral"}`; }

export default function HouseHubScreen({ estate, user, reminders, onOpenGarage, onOpenDocs, onOpenAi, onOpenHome, onOpenPet, onOpenDevices, onOpenPassport, onOpenAssetSetup, onOpenProfile, onManualAdd, onOpenZone }) {
  const zones = estate?.zones || [];
  const tasks = estate?.tasks || [];
  const garage = estate?.garage || {};

  function openZone(zone) {
    if (onOpenZone) return onOpenZone(zone.id);
    if (zone.id === "garage") return onOpenGarage?.();
    if (zone.id === "docs") return onOpenDocs?.();
    if (zone.id === "home") return onOpenHome?.();
    if (zone.id === "pet") return onOpenPet?.();
    if (zone.id === "devices") return onOpenDevices?.();
  }

  return (
    <div className="mx-page estate-hub-page mx-plata-page">
      <section className={`estate-hero mx-plata-hero ${estate?.estateTone || "neutral"}`}>
        <div className="mx-orbital one" /><div className="mx-orbital two" />
        <div className="estate-hero-top"><span>AI-ДОМ ИМУЩЕСТВА</span><b>{estate?.estateScore || 0}%</b></div>
        <h1>{user?.name ? `Дом ${user.name}` : estate?.estateName || "Мой дом"}</h1>
        <p>{estate?.todaySummary || "Добавьте первый объект, и Motrix начнёт держать порядок."}</p>
        <div className="mx-plata-actions"><button onClick={onOpenAssetSetup}><span>＋</span><b>Добавить</b></button><button onClick={onOpenGarage}><span>▣</span><b>Гараж</b></button><button onClick={onOpenDocs}><span>▤</span><b>Vault</b></button><button onClick={onOpenAi}><span>✦</span><b>AI</b></button></div>
      </section>
      <section className="estate-today-strip mx-plata-strip"><div><span>Гараж</span><b>{garage.vehicleTitle || "пусто"}</b><small>{garage.mileage ? km(garage.mileage) : "добавьте авто"}</small></div><div><span>Расходы</span><b>{estate?.money?.next6Months ? rub(estate.money.next6Months) : "—"}</b><small>6 месяцев</small></div><div><span>Сигналы</span><b>{reminders?.length || 0}</b><small>активно</small></div></section>
      <div className="estate-section-head mx-section-soft"><span>Комнаты</span><small>Гараж, дом, питомец, документы и устройства</small></div>
      <section className="estate-zone-grid mx-stagger-list">{zones.map((zone, index) => (<button key={zone.id} className={zoneClass(zone)} onClick={() => openZone(zone)} style={{ "--delay": `${index * 70}ms` }}><div className="estate-zone-icon">{zone.emoji}</div><div className="estate-zone-main"><span>{zone.title}</span><strong>{zone.status}</strong><small>{zone.subtitle}</small></div><div className="estate-zone-metric"><b>{zone.primaryMetric}</b><em>{zone.metricLabel}</em></div></button>))}</section>
      <div className="estate-section-head mx-section-soft"><span>Сегодня</span><small>Что важно, чтобы не попасть на деньги</small></div>
      <section className="estate-task-list mx-stagger-list">{tasks.length ? tasks.map((task, index) => (<button key={task.id} className={taskToneClass(task)} onClick={task.zone === "garage" ? onOpenGarage : onOpenHome} style={{ "--delay": `${index * 55}ms` }}><span>{task.zone === "garage" ? "Гараж" : "Дом"}</span><strong>{task.title}</strong><small>{task.subtitle}</small><em>{task.cta}</em></button>)) : (<div className="estate-empty-card mx-plata-card"><b>Дом спокоен</b><span>Сейчас нет срочных сигналов. Добавьте объект или устройство, и Motrix будет следить за ним.</span></div>)}</section>
      <section className="estate-sense-card mx-plata-card"><div><span>MOTRIX SENSE</span><h3>Нервная система дома</h3><p>OBD, StarLine, датчики протечки, счётчики, Pet Gate и ASU TP станут источниками событий для AI-дома.</p></div><button onClick={onOpenDevices}>Устройства</button></section>
      <section className="estate-quick-actions mx-plata-quickline"><button onClick={onOpenPassport}>Паспорт авто</button><button onClick={onOpenProfile}>Быстрая история</button><button onClick={onManualAdd}>Добавить событие</button></section>
    </div>
  );
}
