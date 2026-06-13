import CarVisual from "./CarVisual.jsx";

export default function HomeScreen({
  vehicle,
  statusSentence,
  topPriority,
  isParsingDoc,
  isAnalyzing,
  onScan,
  onManualAdd,
  onAnalyze,
  mileage,
  newMileage,
  setNewMileage,
  saveMileage,
  predictions,
  reminder,
  onDismissReminder,
  onDoneReminder,
  onGoToMileage,
}) {
  return (
    <>
      <div className="car-hero">
        {/* Hero card */}
        <div className="car-hero-card">
          <div className="car-hero-glow" />
          <CarVisual vehicle={vehicle} />
          <div className="car-brand">{vehicle.brand}</div>
          <div className="car-model-name">{vehicle.model}</div>
          <div className="car-specs-row">
            {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive]
              .filter(Boolean)
              .map((v) => (
                <span className="car-spec-chip" key={v}>{v}</span>
              ))}
          </div>
        </div>

        {/* Human status */}
        <p className="status-sentence">{statusSentence}</p>

        {/* In-app reminder */}
        {reminder && (
          <div className={`reminder-card ${reminder.priority}`}>
            <div className="reminder-title">{reminder.title}</div>
            <div className="reminder-msg">{reminder.message}</div>
            <div className="reminder-actions">
              {reminder.type === "mileage" && (
                <button className="reminder-btn-action" onClick={onGoToMileage}>
                  Указать пробег
                </button>
              )}
              <button className="reminder-btn-done" onClick={() => onDoneReminder(reminder.id)}>
                Уже сделано
              </button>
              <button className="reminder-btn-dismiss" onClick={() => onDismissReminder(reminder.id)}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Primary scan action */}
        <label className={`scan-hero-label${isParsingDoc ? " loading" : ""}`}>
          <span className="scan-hero-icon">📷</span>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onScan}
            hidden
            disabled={isParsingDoc}
          />
        </label>

        <button className="btn btn-gray" onClick={onManualAdd}>
          ✏️ Добавить вручную
        </button>

        {/* Top priority card */}
        {topPriority ? (
          <div className={`priority-home ${topPriority.severity || "medium"}`}>
            <div className={`priority-tag ${topPriority.severity || "medium"}`}>
              {topPriority.severity === "high"
                ? "Важно сейчас"
                : topPriority.severity === "low"
                ? "Замечание"
                : "Обратите внимание"}
            </div>
            <div className="priority-name">{topPriority.title}</div>
            {topPriority.action && (
              <div className="priority-note">{topPriority.action}</div>
            )}
            {/* Marketplace placeholders — future integrations */}
            <div className="market-actions">
              <button className="market-btn coming-soon" disabled>
                Подобрать расходники
              </button>
              <button className="market-btn coming-soon" disabled>
                Записаться в сервис
              </button>
            </div>
          </div>
        ) : (
          !isAnalyzing && (
            <button className="analyse-cta" onClick={onAnalyze}>
              Получить AI-анализ автомобиля →
            </button>
          )
        )}

        {isAnalyzing && (
          <p className="muted">AI анализирует автомобиль...</p>
        )}

        {/* Predictions block */}
        {predictions && predictions.length > 0 && (
          <div className="prediction-block">
            <div className="prediction-block-title">Что вероятно дальше</div>
            {predictions.map((p) => (
              <div className="prediction-item" key={p.id}>
                <span className={`prediction-dot ${p.type}`} />
                <span className="prediction-text">{p.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mileage widget */}
        <div className="mileage-widget">
          <div className="mileage-widget-left">
            <div className="mileage-label">Текущий пробег</div>
            <input
              className="mileage-input-field"
              type="number"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
            />
          </div>
          <span className="mileage-unit">км</span>
          {Number(newMileage) !== Number(mileage) && (
            <button className="mileage-save-btn" onClick={saveMileage}>
              Сохранить
            </button>
          )}
        </div>
      </div>
    </>
  );
}
