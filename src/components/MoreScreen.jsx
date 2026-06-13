import { useState } from "react";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

const STATUS_LABEL = { "Просрочено": "overdue", "Скоро": "soon", "Норма": "ok" };

export default function MoreScreen({ serviceRules, schedule, data, totalSpent, onReset, vehicle, onChangeVehicle }) {
  const [section, setSection] = useState("schedule");

  return (
    <div className="more-screen">
      <h2 className="screen-title">Ещё</h2>

      <div className="segment">
        <button className={section === "schedule" ? "active" : ""} onClick={() => setSection("schedule")}>Регламент</button>
        <button className={section === "stats" ? "active" : ""} onClick={() => setSection("stats")}>Статистика</button>
        <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>Настройки</button>
      </div>

      {section === "schedule" && (
        <>
          {schedule.length === 0 && (
            <p className="muted">Регламент появится после добавления автомобиля.</p>
          )}
          {schedule
            .slice()
            .sort((a, b) => {
              const order = { "Просрочено": 0, "Скоро": 1, "Норма": 2 };
              return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            })
            .map((item) => (
              <div className="rule-item" key={item.id || item.name}>
                <div className="rule-header">
                  <span className="rule-name">{item.name}</span>
                  <span className={`rule-badge ${item.severity || "medium"}`}>
                    {item.severity === "high" ? "Важно" : item.severity === "low" ? "Низкий" : "Средний"}
                  </span>
                </div>
                <div className="rule-detail">
                  {item.intervalKm ? `Каждые ${km(item.intervalKm)}` : "По состоянию"}
                  {item.intervalMonths ? ` или ${item.intervalMonths} мес.` : ""}
                  {item.notes ? ` · ${item.notes}` : ""}
                </div>
                <div className="rule-status">
                  <span className={`rule-status-dot ${STATUS_LABEL[item.status] || "ok"}`} />
                  <span className="rule-status-text">
                    {item.status === "Просрочено" && "Просрочено"}
                    {item.status === "Скоро" && `Через ${item.left.toLocaleString("ru-RU")} км`}
                    {item.status === "Норма" && item.lastMileage > 0 && `Обслужено: ${km(item.lastMileage)}`}
                    {item.status === "Норма" && item.lastMileage === 0 && "Нет записей"}
                  </span>
                </div>
              </div>
            ))}
        </>
      )}

      {section === "stats" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{rub(totalSpent)}</div>
              <div className="stat-label">Потрачено</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.logs.length}</div>
              <div className="stat-label">Записей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{km(data.mileage)}</div>
              <div className="stat-label">Пробег</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{serviceRules.length}</div>
              <div className="stat-label">Позиций ТО</div>
            </div>
          </div>
        </>
      )}

      {section === "settings" && (
        <>
          <button className="btn btn-gray" onClick={onChangeVehicle} style={{ marginBottom: "10px" }}>
            Сменить автомобиль
          </button>
          <button className="btn btn-red" onClick={onReset}>
            Сбросить все данные
          </button>
        </>
      )}
    </div>
  );
}
