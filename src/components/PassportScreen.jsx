function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

const SYSTEMS = [
  { id: "engine",     name: "Двигатель",        icon: "⚙️",  ruleIds: ["engine_oil", "oil_filter", "air_filter", "spark_plugs"] },
  { id: "drivetrain", name: "Трансмиссия",       icon: "🔄",  ruleIds: ["cvt_fluid", "diff_fluid"] },
  { id: "brakes",     name: "Тормоза",           icon: "🔴",  ruleIds: ["brake_fluid", "front_pads", "front_discs", "rear_pads", "rear_discs"] },
  { id: "fuel",       name: "Топливная система", icon: "⛽",  ruleIds: ["fuel_cleaning"] },
  { id: "suspension", name: "Подвеска",          icon: "🔩",  ruleIds: ["suspension_check"] },
];

function systemHealth(ruleIds, schedule) {
  const items = schedule.filter((s) => ruleIds.includes(s.id));
  if (!items.length) return { status: "unknown", label: "Нет данных", detail: "Не в регламенте" };
  const overdue = items.filter((i) => i.status === "Просрочено");
  const soon = items.filter((i) => i.status === "Скоро");
  const withHistory = items.filter((i) => i.lastMileage > 0);
  if (overdue.length) return { status: "due", label: "Просрочено", detail: `${overdue[0].name}` };
  if (soon.length) {
    const n = soon.sort((a, b) => a.left - b.left)[0];
    return { status: "watch", label: "Скоро", detail: `${n.name} — ${n.left.toLocaleString("ru-RU")} км` };
  }
  if (withHistory.length) {
    const last = withHistory.sort((a, b) => b.lastMileage - a.lastMileage)[0];
    return { status: "good", label: "В норме", detail: `Обслужено ${km(last.lastMileage)}` };
  }
  return { status: "unknown", label: "Нет данных", detail: "Нет записей в журнале" };
}

function coveragePercent(schedule) {
  if (!schedule.length) return 0;
  const known = schedule.filter((s) => s.lastMileage > 0).length;
  return Math.round((known / schedule.length) * 100);
}

export default function PassportScreen({
  vehicle,
  schedule,
  analysis,
  serviceRules,
  predictions,
  totalSpent,
  logCount,
  healthScore,
  costForecast,
  mileagePace,
}) {
  const coverage = coveragePercent(schedule);
  const gaps = schedule.filter((i) => i.lastMileage === 0);
  const overdue = schedule.filter((i) => i.status === "Просрочено");
  const soon = schedule.filter((i) => i.status === "Скоро");

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

        {/* Identity */}
        <div className="passport-id-card">
          <div className="passport-id-glow" />
          <div className="passport-label-tag">AutoPulse · Vehicle Passport</div>
          {vehicle.vin && <div className="passport-vin">VIN: {vehicle.vin}</div>}
          <div className="passport-car-name">{vehicle.brand} {vehicle.model}</div>
          <div className="passport-car-spec">
            {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive].filter(Boolean).join(" · ")}
          </div>
          <div className="passport-chips">
            <span className="passport-chip neutral">{coverage}% истории</span>
            {overdue.length > 0 && <span className="passport-chip overdue">{overdue.length} просрочено</span>}
            {soon.length > 0 && <span className="passport-chip soon">{soon.length} скоро</span>}
          </div>
        </div>

        {/* Overview stats */}
        <div className="passport-stats-row">
          <div className="passport-stat">
            <div className="passport-stat-value">{healthScore}%</div>
            <div className="passport-stat-label">Состояние</div>
          </div>
          <div className="passport-stat">
            <div className="passport-stat-value">{logCount}</div>
            <div className="passport-stat-label">Записей</div>
          </div>
          <div className="passport-stat">
            <div className="passport-stat-value" style={{ color: "#10b981" }}>{totalSpent > 0 ? rub(totalSpent) : "—"}</div>
            <div className="passport-stat-label">Потрачено</div>
          </div>
        </div>

        {/* Cost forecast (if pace known) */}
        {mileagePace > 0 && (costForecast.next6Months > 0 || costForecast.nextYear > 0) && (
          <>
            <div className="passport-section-title">Прогноз расходов</div>
            <div className="cost-grid" style={{ marginBottom: 16 }}>
              <div className="cost-col">
                <div className="cost-period">Месяц</div>
                <div className="cost-value">{costForecast.nextMonth > 0 ? rub(costForecast.nextMonth) : "—"}</div>
              </div>
              <div className="cost-col">
                <div className="cost-period">6 месяцев</div>
                <div className="cost-value">{costForecast.next6Months > 0 ? rub(costForecast.next6Months) : "—"}</div>
              </div>
              <div className="cost-col">
                <div className="cost-period">Год</div>
                <div className="cost-value">{costForecast.nextYear > 0 ? rub(costForecast.nextYear) : "—"}</div>
              </div>
            </div>
          </>
        )}

        {/* System health */}
        <div className="passport-section-title">Состояние систем</div>
        <div className="system-list">
          {SYSTEMS.map((sys) => {
            const h = systemHealth(sys.ruleIds, schedule);
            return (
              <div className="system-row" key={sys.id}>
                <span className="system-icon">{sys.icon}</span>
                <div className="system-info">
                  <div className="system-name">{sys.name}</div>
                  <div className="system-detail">{h.detail}</div>
                </div>
                <span className={`system-badge ${h.status}`}>{h.label}</span>
              </div>
            );
          })}
        </div>

        {/* AI recommendations */}
        {analysis?.topPriorities?.length > 0 && (
          <>
            <div className="passport-section-title">Рекомендации AI</div>
            <div className="ai-priority-list">
              {analysis.topPriorities.map((p, i) => (
                <div className="ai-priority-row" key={i}>
                  <div className="ai-priority-row-header">
                    <div className="ai-priority-row-title">{p.title}</div>
                    <span className={`rule-badge ${p.severity}`}>
                      {p.severity === "high" ? "Важно" : p.severity === "low" ? "Низкий" : "Средний"}
                    </span>
                  </div>
                  <div className="ai-priority-row-action">{p.action}</div>
                  {p.dataStatus && (
                    <div className="ai-data-status">
                      {p.dataStatus === "confirmed" && "✓ подтверждено записями"}
                      {p.dataStatus === "no-data" && "? нет данных"}
                      {p.dataStatus === "predicted" && "~ прогноз"}
                      {p.dataStatus === "overdue" && "● просрочено"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Predictions */}
        {predictions?.length > 0 && (
          <>
            <div className="passport-section-title">Прогноз</div>
            <div className="passport-prediction-list">
              {predictions.map((p) => (
                <div className="passport-pred-item" key={p.id}>
                  <span className={`passport-pred-dot ${p.type}`} />
                  <span className="passport-pred-text">{p.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Unknown areas */}
        {gaps.length > 0 && (
          <>
            <div className="passport-section-title">Неизвестные зоны</div>
            <div className="gap-list">
              {gaps.map((item) => (
                <div className="gap-row" key={item.id}>
                  <span className="gap-circle" />
                  <span className="gap-text">{item.name}</span>
                  <span className="gap-badge">{item.severity === "high" ? "критично" : "нет данных"}</span>
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
