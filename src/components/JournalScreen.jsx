function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
function isScannedLog(log) {
  const note = String(log.note || "").toLowerCase();
  return note.includes("документ") || note.includes("распознано") || note.includes("сканировано");
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
            const scanned = isScannedLog(log);
            const showNote = log.note
              && log.note !== "Добавлено из документа СТО"
              && log.note !== "Добавлено из документа";
            return (
              <div className="tl-item" key={log.id}>
                <div className="tl-left">
                  <div className={`tl-dot${scanned ? " scanned" : ""}`} />
                  {index < sorted.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <div className="tl-meta">
                    <span className="tl-mileage">{km(log.mileage)}</span>
                    <span className="tl-date">{log.datePerformed || log.dateAdded || "—"}</span>
                  </div>
                  <div className="tl-title">{log.title}</div>
                  {showNote && <div className="tl-note">{log.note}</div>}
                  <div className="tl-footer">
                    <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" }}>
                      {Number(log.cost) > 0 && (
                        <span className="tl-cost">{rub(log.cost)}</span>
                      )}
                      {scanned && <span className="tl-source">📷 сканировано</span>}
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
