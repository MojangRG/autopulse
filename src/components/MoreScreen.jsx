import { useState } from "react";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function Sheet({ title, subtitle, children, onClose }) {
  return (
    <div className="mx-sheet-backdrop" onClick={onClose}>
      <div className="mx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mx-sheet-handle" />
        <div className="mx-sheet-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button className="mx-sheet-close" onClick={onClose}>×</button></div>
        {children}
      </div>
    </div>
  );
}

function historyLabel(ownerProfile) {
  if (ownerProfile?.historyMode === "used-unknown") return "б/у без истории";
  if (ownerProfile?.firstOwner === "yes") return "первый владелец";
  if (ownerProfile?.historyKnowledge === "partial") return "история частичная";
  if (ownerProfile?.historyKnowledge === "full") return "история известна";
  return "история не уточнена";
}

export default function MoreScreen({ serviceRules, schedule, data, totalSpent, onReset, vehicle, onChangeVehicle, onRegenerateRender, isGeneratingRender, onClearChat, chatCount, profile, analysis, ownerProfile }) {
  const [section, setSection] = useState("dossier");
  const [sheet, setSheet] = useState(null);
  const rules = serviceRules?.length ? serviceRules : profile?.serviceItems || [];
  const critical = rules.filter((r) => r.severity === "high").slice(0, 4);
  const known = schedule.filter((s) => s.lastSource === "journal" || s.lastSource === "questionnaire").length;

  return (
    <div className="mx-page more-screen">
      <div className="mx-page-head"><span>MOTRIX CONTROL</span><h2>Ещё</h2><p>{vehicle?.brand} {vehicle?.model} · управление профилем</p></div>
      <div className="segment mx-segment"><button className={section === "dossier" ? "active" : ""} onClick={() => setSection("dossier")}>Досье</button><button className={section === "stats" ? "active" : ""} onClick={() => setSection("stats")}>Статистика</button><button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>Настройки</button></div>

      {section === "dossier" && (
        <>
          <button className="mx-dossier-card large" onClick={() => setSheet("dossier")}>
            <span>Motrix AI document</span>
            <strong>{vehicle?.brand} {vehicle?.model}</strong>
            <small>{historyLabel(ownerProfile)} · {rules.length} регламентных позиций</small>
            <b>Открыть</b>
          </button>
          <div className="mx-action-grid">
            <button className="mx-mini-card" onClick={() => setSheet("service") }><span>Регламент</span><strong>{rules.length}</strong><small>позиций</small></button>
            <button className="mx-mini-card" onClick={() => setSheet("risks") }><span>Риски</span><strong>{critical.length}</strong><small>важных зон</small></button>
          </div>
        </>
      )}

      {section === "stats" && <div className="mx-action-grid"><div className="mx-mini-card"><span>Потрачено</span><strong>{rub(totalSpent)}</strong><small>за историю</small></div><div className="mx-mini-card"><span>Записи</span><strong>{data.logs.length}</strong><small>в журнале</small></div><div className="mx-mini-card"><span>Пробег</span><strong>{km(data.mileage)}</strong><small>текущий</small></div><div className="mx-mini-card"><span>Основание</span><strong>{known}</strong><small>журнал + анкета</small></div></div>}

      {section === "settings" && <div className="mx-action-stack"><button className="mx-action" onClick={onRegenerateRender} disabled={isGeneratingRender}>{isGeneratingRender ? "Генерирую AI-рендер" : "Обновить AI-рендер"}</button><button className="mx-action" onClick={onChangeVehicle}>Сменить автомобиль</button>{chatCount > 0 && <button className="mx-action" onClick={onClearChat}>Очистить AI-чат ({chatCount})</button>}<button className="mx-action ghost" onClick={onReset}>Сбросить все данные</button></div>}

      {sheet === "dossier" && (
        <Sheet title="AI-досье автомобиля" subtitle="Сводка вместо простыни регламента" onClose={() => setSheet(null)}>
          <div className="mx-dossier-text">
            <h4>{vehicle?.brand} {vehicle?.model} {vehicle?.year || ""}</h4>
            <p>Профиль построен по автомобилю, пробегу, анкете владельца и текущему сервисному регламенту. Это рабочий документ Motrix: он не заменяет заводской мануал, но помогает понять, что делать дальше.</p>
            <p><b>История:</b> {historyLabel(ownerProfile)}. <b>Пробег:</b> {km(data.mileage)}. <b>Записи:</b> {data.logs.length}.</p>
            {analysis?.topPriorities?.slice(0, 2).map((p, i) => <p key={i}><b>{p.title}.</b> {p.action || p.reason || "Проверить по регламенту."}</p>)}
          </div>
        </Sheet>
      )}

      {sheet === "service" && (
        <Sheet title="Сервисная карта" subtitle="Без дубляжа статусов, только смысл" onClose={() => setSheet(null)}>
          <div className="mx-bank-list">{rules.slice(0, 10).map((r) => <div className="mx-bank-row static" key={r.id}><span><b>{r.name}</b><small>{r.intervalKm ? `каждые ${km(r.intervalKm)}` : "по состоянию"}{r.intervalMonths ? ` · ${r.intervalMonths} мес.` : ""}</small></span><strong>{r.severity === "high" ? "важно" : "план"}</strong></div>)}</div>
        </Sheet>
      )}

      {sheet === "risks" && (
        <Sheet title="Важные зоны" subtitle="То, что сильнее всего влияет на стоимость владения" onClose={() => setSheet(null)}>
          <div className="mx-bank-list">{critical.map((r) => <div className="mx-bank-row static" key={r.id}><span><b>{r.name}</b><small>{r.notes || "контролировать по регламенту"}</small></span><strong>важно</strong></div>)}</div>
        </Sheet>
      )}
    </div>
  );
}
