import CarVisual from "./CarVisual.jsx";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function healthColor(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function PrimaryActionCard({ action, mileage, onScan, isParsingDoc }) {
  if (!action) return null;

  const isOverdue = action.type === "overdue";
  const isUpcoming = action.type === "upcoming";
  const isScan = action.type === "scan";
  const color = isOverdue ? "high" : isUpcoming ? "medium" : "low";
  const tagLabel = isOverdue ? "Требует обслуживания" : isUpcoming ? "Скоро потребуется" : "Рекомендация";

  return (
    <div className={`primary-action-card sev-${color}`}>
      <div className="primary-action-tag">{tagLabel}</div>
      <div className="primary-action-title">{action.title}</div>

      {(isOverdue || isUpcoming) && action.why && (
        <div className="primary-action-why">
          {action.why.lastKm != null && (
            <div className="why-row">
              <span className="why-key">Последняя замена</span>
              <span className="why-val">{km(action.why.lastKm)}</span>
            </div>
          )}
          {action.why.currentKm > 0 && (
            <div className="why-row">
              <span className="why-key">Текущий пробег</span>
              <span className="why-val">{km(action.why.currentKm)}</span>
            </div>
          )}
          {action.why.drivenSince != null && action.why.drivenSince > 0 && (
            <div className="why-row">
              <span className="why-key">Пройдено с замены</span>
              <span className="why-val">{km(action.why.drivenSince)}</span>
            </div>
          )}
          {action.why.interval && (
            <div className="why-row">
              <span className="why-key">Интервал замены</span>
              <span className="why-val">{km(action.why.interval)}</span>
            </div>
          )}
          {action.why.overdueBy != null && (
            <div className="why-row overdue-row">
              <span className="why-key">Просрочено на</span>
              <span className="why-val why-overdue">{km(action.why.overdueBy)}</span>
            </div>
          )}
          {action.why.kmLeft != null && (
            <div className="why-row">
              <span className="why-key">До обслуживания</span>
              <span className="why-val">~{km(action.why.kmLeft)}</span>
            </div>
          )}
        </div>
      )}

      {isScan && action.why?.reason && (
        <div className="primary-action-reason">{action.why.reason}</div>
      )}

      {isScan && (
        <label className={`primary-action-scan-btn${isParsingDoc ? " loading" : ""}`}>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
          <input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} />
        </label>
      )}
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
  urgentActions,
  upcomingItems,
  costForecast,
  lastService,
  mileagePace,
  mileagePaceData,
  statusSentence,
  primaryAction,
  reminders,
  vehicleRender,
  isGeneratingRender,
  isParsingDoc,
  onScan,
  onManualAdd,
  onReminderDismiss,
  onReminderDone,
}) {
  const hc = healthColor(healthScore);
  const topReminder = reminders?.find((r) => r.status === "active");
  const moreUrgentCount = (urgentActions?.length || 0) - 1;

  return (
    <div className="home-screen">

      {/* Vehicle hero */}
      <div className={`hero-card ${vehicleRender?.imageUrl ? "has-render" : ""}`}>
        {vehicleRender?.imageUrl && (
          <img className="hero-render-image" src={vehicleRender.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} />
        )}
        <div className="hero-render-scrim" />
        <div className="hero-glow" />
        {!vehicleRender?.imageUrl && <CarVisual vehicle={vehicle} />}
        <div className="hero-content">
          {(isGeneratingRender || vehicleRender?.status === "loading") && (
            <div className="hero-render-badge loading">AI-рендер создаётся…</div>
          )}
          {!isGeneratingRender && vehicleRender?.status === "ready" && vehicleRender?.imageUrl && (
            <div className="hero-render-badge ready">AI render</div>
          )}
          {vehicleRender?.status === "error" && (
            <div className="hero-render-badge error" title={vehicleRender.error || ""}>
              Рендер не создан
              {vehicleRender.error && <span className="hero-render-error-text">{vehicleRender.error}</span>}
            </div>
          )}
          <div className="hero-brand">{vehicle.brand}</div>
          <div className="hero-model">{vehicle.model}</div>
          <div className="hero-chips">
            {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive, vehicle.color]
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
      </div>

      {/* AI status sentence */}
      {statusSentence && (
        <div className="status-sentence">{statusSentence}</div>
      )}

      {/* Reminder card */}
      {topReminder && (
        <div className={`reminder-card ${topReminder.priority}`}>
          <div className="reminder-title">{topReminder.title}</div>
          <div className="reminder-msg">{topReminder.message}</div>
          <div className="reminder-actions">
            <button className="reminder-btn-done" onClick={() => onReminderDone(topReminder.id)}>
              Выполнено
            </button>
            <button className="reminder-btn-dismiss" onClick={() => onReminderDismiss(topReminder.id)}>✕</button>
          </div>
        </div>
      )}

      {/* Single primary action with WHY */}
      <PrimaryActionCard
        action={primaryAction}
        mileage={mileage}
        onScan={onScan}
        isParsingDoc={isParsingDoc}
      />

      {/* Additional urgent items (compact) */}
      {urgentActions?.length > 1 && (
        <div className="urgent-secondary-list">
          <div className="urgent-secondary-label">Также требует внимания</div>
          {urgentActions.slice(1, 4).map((u) => (
            <div className="urgent-secondary-row" key={u.id || u.name}>
              <span className={`urgent-rest-dot sev-${u.severity}`} />
              <span className="urgent-secondary-name">{u.name}</span>
              <span className="urgent-secondary-km">
                {u.status === "Просрочено"
                  ? `Просрочено ${km(Math.abs(u.left))}`
                  : `Через ~${km(u.left)}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* All good state */}
      {!primaryAction && urgentActions?.length === 0 && (
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
              <span className="upcoming-km">~{km(item.left)}</span>
              {item.estimatedMonths > 0 && (
                <span className="upcoming-months">~{item.estimatedMonths} мес</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cost forecast */}
      {mileagePace > 0 && (costForecast?.next6Months > 0 || costForecast?.nextYear > 0) && (
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
          {mileagePaceData?.source === "history" && (
            <div className="pace-source">
              Темп {mileagePace.toLocaleString("ru-RU")} км/мес
              {mileagePaceData.confidence === "high" ? " · высокая точность" : mileagePaceData.confidence === "medium" ? " · средняя точность" : " · низкая точность"}
            </div>
          )}
        </div>
      )}

      {/* Last known event */}
      {lastService && (
        <div className="last-event-card">
          <div className="last-event-label">Последнее подтверждённое событие</div>
          <div className="last-event-title">{lastService.title}</div>
          <div className="last-event-km">{km(lastService.mileage)}</div>
        </div>
      )}

      {/* Actions */}
      <div className="home-actions">
        <label className={`scan-btn${isParsingDoc ? " loading" : ""}`}>
          <span className="scan-btn-icon">📷</span>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
          <input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} />
        </label>
        <button className="btn btn-gray" onClick={onManualAdd}>✏️ Добавить вручную</button>
      </div>

    </div>
  );
}
