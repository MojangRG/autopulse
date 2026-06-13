function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

const SYSTEMS = [
  { id: "engine",     name: "Двигатель",         icon: "⚙️",  ruleIds: ["engine_oil", "oil_filter", "air_filter", "spark_plugs"] },
  { id: "drivetrain", name: "Трансмиссия",        icon: "🔄",  ruleIds: ["cvt_fluid", "diff_fluid"] },
  { id: "brakes",     name: "Тормоза",            icon: "🔴",  ruleIds: ["brake_fluid", "front_pads", "front_discs", "rear_pads", "rear_discs"] },
  { id: "fuel",       name: "Топливная система",  icon: "⛽",  ruleIds: ["fuel_cleaning"] },
  { id: "suspension", name: "Подвеска",           icon: "🔩",  ruleIds: ["suspension_check"] },
];

function getSystemHealth(ruleIds, schedule) {
  const items = schedule.filter((s) => ruleIds.includes(s.id));
  if (!items.length) return { status: "unknown", detail: "Нет данных в регламенте", label: "Нет данных" };

  const overdue = items.filter((i) => i.status === "Просрочено");
  const soon = items.filter((i) => i.status === "Скоро");
  const withHistory = items.filter((i) => i.lastMileage > 0);

  if (overdue.length > 0) {
    return { status: "due", detail: `${overdue[0].name} — просрочено`, label: "Просрочено" };
  }
  if (soon.length > 0) {
    const nearest = soon.slice().sort((a, b) => a.left - b.left)[0];
    return { status: "watch", detail: `${nearest.name} — через ${nearest.left.toLocaleString("ru-RU")} км`, label: "Скоро" };
  }
  if (withHistory.length > 0) {
    const latest = withHistory.slice().sort((a, b) => b.lastMileage - a.lastMileage)[0];
    return { status: "good", detail: `Обслужено: ${km(latest.lastMileage)}`, label: "В норме" };
  }
  return { status: "unknown", detail: "Нет записей в журнале", label: "Нет данных" };
}

export default function PassportScreen({ vehicle, schedule, analysis, serviceRules }) {
  const gaps = schedule.filter((item) => item.lastMileage === 0);

  const vehicleFields = [
    ["Марка", vehicle.brand],
    ["Модель", vehicle.model],
    ["Поколение", vehicle.generation],
    ["Год", vehicle.year],
    ["Двигатель", vehicle.engine],
    ["Коробка", vehicle.transmission],
    ["Привод", vehicle.drive],
    ["Рынок", vehicle.market],
  ].filter(([, v]) => v);

  return (
    <>
      <h2 className="screen-title">Паспорт</h2>
      <div className="passport">

        {/* Identity card */}
        <div className="passport-id-card">
          <div className="passport-id-glow" />
          <div className="passport-label-tag">AutoPulse · Vehicle Passport</div>
          {vehicle.vin && (
            <div className="passport-vin">VIN: {vehicle.vin}</div>
          )}
          <div className="passport-car-name">{vehicle.brand} {vehicle.model}</div>
          <div className="passport-car-spec">
            {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        {/* Health by system */}
        <div className="passport-section-title">Состояние систем</div>
        <div className="system-list">
          {SYSTEMS.map((sys) => {
            const health = getSystemHealth(sys.ruleIds, schedule);
            return (
              <div className="system-row" key={sys.id}>
                <span className="system-icon">{sys.icon}</span>
                <div className="system-info">
                  <div className="system-name">{sys.name}</div>
                  <div className="system-detail">{health.detail}</div>
                </div>
                <span className={`system-badge ${health.status}`}>{health.label}</span>
              </div>
            );
          })}
        </div>

        {/* AI priorities */}
        {analysis?.topPriorities?.length > 0 && (
          <>
            <div className="passport-section-title">Рекомендации AI</div>
            <div className="ai-priority-list">
              {analysis.topPriorities.map((p, i) => (
                <div className="ai-priority-row" key={i}>
                  <div className="ai-priority-row-title">{p.title}</div>
                  <div className="ai-priority-row-action">{p.action}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Gaps — never-serviced items */}
        {gaps.length > 0 && (
          <>
            <div className="passport-section-title">Нет записей</div>
            <div className="gap-list">
              {gaps.map((item) => (
                <div className="gap-row" key={item.id}>
                  <span className="gap-circle" />
                  <span className="gap-text">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vehicle details */}
        <div className="passport-section-title">Характеристики</div>
        <div className="detail-list">
          {vehicleFields.map(([key, val]) => (
            <div className="detail-row" key={key}>
              <span className="detail-key">{key}</span>
              <span className="detail-val">{String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
