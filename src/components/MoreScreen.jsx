import { useState } from "react";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }
const STATUS_LABEL = { "Просрочено": "overdue", "Скоро": "soon", "Норма": "ok", "Нет данных": "unknown" };

export default function MoreScreen({ serviceRules, schedule, data, totalSpent, onReset, vehicle, onChangeVehicle, onRegenerateRender, isGeneratingRender, onClearChat, chatCount }) {
  const [section, setSection] = useState("schedule");
  const sorted = schedule.slice().sort((a, b) => ({ "Просрочено": 0, "Скоро": 1, "Нет данных": 2, "Норма": 3 }[a.status] ?? 4) - ({ "Просрочено": 0, "Скоро": 1, "Нет данных": 2, "Норма": 3 }[b.status] ?? 4));

  return (
    <div className="mx-page more-screen">
      <div className="mx-page-head"><span>MOTRIX CONTROL</span><h2>Ещё</h2><p>{vehicle?.brand} {vehicle?.model} · настройки и регламент</p></div>
      <div className="segment mx-segment"><button className={section === "schedule" ? "active" : ""} onClick={() => setSection("schedule")}>Регламент</button><button className={section === "stats" ? "active" : ""} onClick={() => setSection("stats")}>Статистика</button><button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>Настройки</button></div>
      {section === "schedule" && <div className="mx-bank-list">{sorted.map((item) => <div className="mx-bank-row static" key={item.id || item.name}><span className={`mx-row-dot ${STATUS_LABEL[item.status] || "ok"}`} /><span><b>{item.name}</b><small>{item.intervalKm ? `Каждые ${km(item.intervalKm)}` : "По состоянию"}{item.intervalMonths ? ` · ${item.intervalMonths} мес.` : ""}</small></span><strong>{item.status === "Скоро" ? `${item.left.toLocaleString("ru-RU")} км` : item.status}</strong></div>)}</div>}
      {section === "stats" && <div className="mx-action-grid"><div className="mx-mini-card"><span>Потрачено</span><strong>{rub(totalSpent)}</strong><small>за историю</small></div><div className="mx-mini-card"><span>Записи</span><strong>{data.logs.length}</strong><small>в журнале</small></div><div className="mx-mini-card"><span>Пробег</span><strong>{km(data.mileage)}</strong><small>текущий</small></div><div className="mx-mini-card"><span>ТО</span><strong>{serviceRules.length}</strong><small>позиций</small></div></div>}
      {section === "settings" && <div className="mx-action-stack"><button className="mx-action" onClick={onRegenerateRender} disabled={isGeneratingRender}>{isGeneratingRender ? "Генерирую AI-рендер" : "Обновить AI-рендер"}</button><button className="mx-action" onClick={onChangeVehicle}>Сменить автомобиль</button>{chatCount > 0 && <button className="mx-action" onClick={onClearChat}>Очистить AI-чат ({chatCount})</button>}<button className="mx-action ghost" onClick={onReset}>Сбросить все данные</button></div>}
    </div>
  );
}
