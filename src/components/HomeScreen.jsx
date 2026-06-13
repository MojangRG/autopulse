import CarVisual from "./CarVisual.jsx";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function healthColor(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function urgentIcon(item) {
  if (item.status === "Просрочено") return "●";
  if (item.severity === "high") return "◆";
  return "▲";
}

function urgentLabel(item) {
  if (item.status === "Просрочено") {
    return `Просрочено на ${Math.abs(item.left).toLocaleString("ru-RU")} км`;
  }
  return `Через ~${item.left.toLocaleString("ru-RU")} км`;
}

export default function HomeScreen({
  vehicle,
  mileage,
  newMileage,
  setNewMileage,
  saveMileage,
  healthScore,
  urgentActions,
  upcomingItems,
  costForecast,
  lastService,
  mileagePace,
  isParsingDoc,
  onScan,
  onManualAdd,
  onOpenManualForLog,
}) {
  const topUrgent = urgentActions?.[0];
  const moreUrgentCount = (urgentActions?.length || 0) - 1;
  const hc = healthColor(healthScore);

  return (
    <div className="home-screen">

      {/* Hero */}
      <div className="hero-card">
        <div className="hero-glow" />
        <CarVisual vehicle={vehicle} />
        <div className="hero-brand">{vehicle.brand}</div>
        <div className="hero-model">{vehicle.model}</div>
        <div className="hero-chips">
          {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive]
            .filter(Boolean)
            .map((v) => <span className="hero-chip" key={v}>{v}</span>)}
        </div>
        <div className="hero-status-row">
          <div className="mileage-inline">
            <input
              className="mileage-inline-input"
              type="number"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
            />
            <span className="mileage-inline-unit">км</span>
            {Number(newMileage) !== Number(mileage) && (
              <button className="mileage-save-inline" onClick={saveMileage}>✓</button>
            )}
          </div>
          <div className={`health-pill ${hc}`}>
            <span className="health-pill-bar">
              <span className="health-pill-fill" style={{ width: `${healthScore}%` }} />
            </span>
            <span className="health-pill-label">{healthScore}%</span>
          </div>
        </div>
      </div>

      {/* Urgent action */}
      {topUrgent ? (
        <div className={`urgent-card sev-${topUrgent.severity} ${topUrgent.status === "Просрочено" ? "overdue" : "soon"}`}>
          <div className="urgent-header">
            <span className="urgent-icon-dot" />
            <span className="urgent-heading">
              {topUrgent.status === "Просрочено" ? "Требует обслуживания" : "Скоро потребуется"}
            </span>
            {moreUrgentCount > 0 && (
              <span className="urgent-more">+{moreUrgentCount}</span>
            )}
          </div>
          <div className="urgent-name">{topUrgent.name}</div>
          <div className="urgent-detail">
            {topUrgent.lastMileage > 0
              ? `Последняя запись: ${km(topUrgent.lastMileage)}`
              : "Нет данных в истории"}
            {" · "}{urgentLabel(topUrgent)}
          </div>
          {moreUrgentCount > 0 && (
            <div className="urgent-rest">
              {urgentActions.slice(1).map((u) => (
                <div className="urgent-rest-item" key={u.id || u.name}>
                  <span className={`urgent-rest-dot sev-${u.severity}`} />
                  <span>{u.name}</span>
                  <span className="urgent-rest-km">{urgentLabel(u)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="status-ok-card">
          <span className="status-ok-dot" />
          <span className="status-ok-text">Всё в норме</span>
        </div>
      )}

      {/* Upcoming */}
      {upcomingItems?.length > 0 && (
        <div className="section-block">
          <div className="section-label">Скоро</div>
          {upcomingItems.slice(0, 3).map((item) => (
            <div className="upcoming-row" key={item.id || item.name}>
              <span className="upcoming-name">{item.name}</span>
              <span className="upcoming-km">~{item.left.toLocaleString("ru-RU")} км</span>
              {item.estimatedMonths && (
                <span className="upcoming-months">~{item.estimatedMonths} мес</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cost forecast */}
      {mileagePace > 0 && (
        <div className="section-block">
          <div className="section-label">Прогноз расходов</div>
          <div className="cost-grid">
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
        </div>
      )}

      {/* Last service */}
      {lastService && (
        <div className="last-service-row">
          <span className="last-service-label">Последнее</span>
          <span className="last-service-title">{lastService.title}</span>
          <span className="last-service-km">{km(lastService.mileage)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="home-actions">
        <label className={`scan-btn${isParsingDoc ? " loading" : ""}`}>
          <span className="scan-btn-icon">📷</span>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
          <input type="file" accept="image/*,.pdf" onChange={onScan} hidden disabled={isParsingDoc} />
        </label>
        <button className="btn btn-gray" onClick={onManualAdd}>✏️ Добавить вручную</button>
      </div>

    </div>
  );
}
