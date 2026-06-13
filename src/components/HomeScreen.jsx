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
}) {
  return (
    <>
      <div className="car-hero">
        {/* Car identity */}
        <div className="car-hero-card">
          <div className="car-hero-glow" />
          <div className="car-brand">{vehicle.brand}</div>
          <div className="car-model-name">{vehicle.model}</div>
          <div className="car-specs-row">
            {vehicle.year && <span className="car-spec-chip">{vehicle.year}</span>}
            {vehicle.engine && <span className="car-spec-chip">{vehicle.engine}</span>}
            {vehicle.transmission && <span className="car-spec-chip">{vehicle.transmission}</span>}
            {vehicle.drive && <span className="car-spec-chip">{vehicle.drive}</span>}
          </div>
        </div>

        {/* Human status sentence */}
        <p className="status-sentence">{statusSentence}</p>

        {/* Primary scan action */}
        <label className={`scan-hero-label${isParsingDoc ? " loading" : ""}`}>
          <span className="scan-hero-icon">📷</span>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
          <input type="file" accept="image/*,.pdf" onChange={onScan} hidden disabled={isParsingDoc} />
        </label>

        <button className="btn btn-gray" onClick={onManualAdd}>
          ✏️ Добавить вручную
        </button>

        {/* Top priority */}
        {topPriority ? (
          <div className={`priority-home ${topPriority.severity || "medium"}`}>
            <div className={`priority-tag ${topPriority.severity || "medium"}`}>
              {topPriority.severity === "high" ? "Важно сейчас"
                : topPriority.severity === "low" ? "Замечание"
                : "Обратите внимание"}
            </div>
            <div className="priority-name">{topPriority.title}</div>
            {topPriority.action && (
              <div className="priority-note">{topPriority.action}</div>
            )}
          </div>
        ) : (
          !isAnalyzing && (
            <button className="analyse-cta" onClick={onAnalyze}>
              Получить AI-анализ автомобиля →
            </button>
          )
        )}

        {isAnalyzing && (
          <p className="muted">AI анализирует ваш автомобиль...</p>
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
