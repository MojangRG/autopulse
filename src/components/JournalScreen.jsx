function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function getSource(log) {
  const note = String(log.note || "").toLowerCase();
  if (log.source === "scanned") return "scanned";
  if (note.includes("документ") || note.includes("распознано") || note.includes("сканировано")) return "scanned";
  return "manual";
}

function getChangeTags(log) {
  const tags = [];
  if (log.mileageUpdated) tags.push("Пробег обновлён");
  if (log.scheduleReset) tags.push("Интервал сброшен");
  return tags;
}

function showNote(log) {
  const n = String(log.note || "");
  if (!n) return false;
  if (n === "Добавлено из документа СТО" || n === "Добавлено из документа" || n === "Распознано из документа") return false;
  return true;
}

export default function JournalScreen({ logs, isParsingDoc, onScan, onManualAdd, onEdit, onDelete }) {
  const sorted = [...logs].sort((a, b) => Number(b.mileage) - Number(a.mileage));

  return (
    <>
      <h2 className="screen-title">История</h2>

      <div style={{ padding: "0 16px 14px" }}>
        <label className={`upload-label primary${isParsingDoc ? " loading" : ""}`}>
          <input type="file" accept="image/*,.pdf" onChange={onScan} hidden disabled={isParsingDoc} />
          <span>📷</span>
          {isParsingDoc ? "Читаю документ..." : "Отсканировать документ"}
        </label>
        <button className="btn btn-gray" onClick={onManualAdd}>
          ✏️ Добавить вручную
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="timeline-empty">
          <div className="timeline-empty-icon">📋</div>
          <div className="timeline-empty-text">
            История пуста.<br />
            Отсканируйте заказ-наряд, чек или квитанцию — AutoPulse разберётся сам.
          </div>
        </div>
      ) : (
        <div className="timeline">
          {sorted.map((log, index) => {
            const source = getSource(log);
            const changeTags = getChangeTags(log);
            return (
              <div className="tl-item" key={log.id}>
                <div className="tl-left">
                  <div className={`tl-dot${source === "scanned" ? " scanned" : ""}`} />
                  {index < sorted.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <div className="tl-meta">
                    <span className="tl-mileage">{km(log.mileage)}</span>
                    <span className="tl-date">{log.datePerformed || log.dateAdded || "—"}</span>
                  </div>
                  <div className="tl-title">{log.title}</div>
                  {showNote(log) && (
                    <div className="tl-note">{log.note}</div>
                  )}
                  {changeTags.length > 0 && (
                    <div className="tl-changes">
                      {changeTags.map((t) => (
                        <span className="tl-change-tag" key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="tl-footer">
                    <div className="tl-footer-left">
                      {Number(log.cost) > 0 && (
                        <span className="tl-cost">{rub(log.cost)}</span>
                      )}
                      <span className={`tl-source-badge ${source}`}>
                        {source === "scanned" ? "📷 сканировано" : "✏️ вручную"}
                      </span>
                    </div>
                    <div className="tl-actions">
                      <button className="tl-btn" onClick={() => onEdit(log)}>✏️</button>
                      <button className="tl-btn" onClick={() => onDelete(log.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
