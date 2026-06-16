import { useState } from "react";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function getSource(log) {
  const note = String(log.note || "").toLowerCase();
  if (log.source === "scanned") return "scanned";
  if (note.includes("документ") || note.includes("распознано") || note.includes("сканировано")) return "scanned";
  return "manual";
}

function showNote(log) {
  const n = String(log.note || "");
  if (!n) return false;
  return !["Добавлено из документа СТО", "Добавлено из документа", "Распознано из документа"].includes(n);
}

function Sheet({ log, onClose, onEdit, onDelete }) {
  if (!log) return null;
  const source = getSource(log);
  return (
    <div className="mx-sheet-backdrop" onClick={onClose}>
      <div className="mx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mx-sheet-handle" />
        <div className="mx-sheet-head"><h3>Запись истории</h3><button className="mx-sheet-close" onClick={onClose}>×</button></div>
        <div className="mx-detail-hero low"><span>{source === "scanned" ? "Документ" : "Вручную"}</span><h4>{log.title}</h4><p>{km(log.mileage)}</p></div>
        <div className="mx-detail-grid in-sheet">
          <span>Дата</span><b>{log.datePerformed || log.dateAdded || "—"}</b>
          <span>Стоимость</span><b>{Number(log.cost) > 0 ? rub(log.cost) : "—"}</b>
          <span>Источник</span><b>{source === "scanned" ? "Скан" : "Ручной ввод"}</b>
        </div>
        {showNote(log) && <p className="mx-fineprint">{log.note}</p>}
        <div className="mx-action-stack"><button className="mx-action primary" onClick={() => onEdit(log)}>Редактировать</button><button className="mx-action ghost" onClick={() => onDelete(log.id)}>Удалить</button></div>
      </div>
    </div>
  );
}

export default function JournalScreen({ logs, isParsingDoc, onScan, onManualAdd, onEdit, onDelete }) {
  const [selected, setSelected] = useState(null);
  const sorted = [...logs].sort((a, b) => Number(b.mileage) - Number(a.mileage));
  const total = sorted.reduce((s, l) => s + Number(l.cost || 0), 0);

  return (
    <div className="mx-page mx-journal-page">
      <div className="mx-page-head"><span>MOTRIX LOG</span><h2>История</h2><p>Все работы как операции по счёту: нажал, раскрыл, подтвердил.</p></div>
      <div className="mx-action-grid">
        <label className={`mx-mini-card mx-upload-card${isParsingDoc ? " loading" : ""}`}><input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} /><span>Документ</span><strong>{isParsingDoc ? "Читаю" : "Скан"}</strong><small>чек / заказ-наряд</small></label>
        <button className="mx-mini-card" onClick={onManualAdd}><span>Новая запись</span><strong>＋</strong><small>добавить работу</small></button>
      </div>
      <div className="mx-action-grid three"><div className="mx-quick-action"><span>≋</span><b>{sorted.length}</b><small>записей</small></div><div className="mx-quick-action"><span>₽</span><b>{total ? rub(total) : "—"}</b><small>затраты</small></div><div className="mx-quick-action"><span>⌁</span><b>{sorted[0] ? km(sorted[0].mileage) : "—"}</b><small>последняя</small></div></div>
      {sorted.length === 0 ? <div className="mx-empty-state">История пустая. Загрузите чек или добавьте первую работу вручную.</div> : (
        <div className="mx-bank-list">
          {sorted.map((log) => {
            const source = getSource(log);
            return <button className="mx-bank-row" key={log.id} onClick={() => setSelected(log)}><span className={`mx-row-dot ${source}`} /><span><b>{log.title}</b><small>{km(log.mileage)} · {log.datePerformed || log.dateAdded || "дата не указана"}</small></span><strong>{Number(log.cost) > 0 ? rub(log.cost) : "›"}</strong></button>;
          })}
        </div>
      )}
      <Sheet log={selected} onClose={() => setSelected(null)} onEdit={(log) => { setSelected(null); onEdit(log); }} onDelete={(id) => { setSelected(null); onDelete(id); }} />
    </div>
  );
}
