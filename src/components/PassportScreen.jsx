import { useMemo, useState } from "react";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

const SYSTEMS = [
  { id: "engine", name: "Двигатель", note: "масло · фильтры · свечи", ruleIds: ["engine_oil", "oil_filter", "air_filter", "spark_plugs"] },
  { id: "drivetrain", name: "Трансмиссия", note: "CVT · редукторы", ruleIds: ["cvt_fluid", "diff_fluid"] },
  { id: "brakes", name: "Тормоза", note: "жидкость · диски · колодки", ruleIds: ["brake_fluid", "front_pads", "front_discs", "rear_pads", "rear_discs"] },
  { id: "comfort", name: "Комфорт", note: "салон · воздух", ruleIds: ["cabin_filter"] },
];

function historyModeText(ownerProfile) {
  if (!ownerProfile) return "Анкета не заполнена";
  if (ownerProfile.historyMode === "used-unknown") return "Б/у без истории";
  if (ownerProfile.firstOwner === "yes") return "Первый владелец";
  if (ownerProfile.historyKnowledge === "partial") return "История частичная";
  if (ownerProfile.historyKnowledge === "full") return "История известна";
  return "Профиль владельца";
}

function sourceText(item) {
  if (item.lastSource === "journal") return `журнал · ${km(item.lastMileage)}`;
  if (item.lastSource === "questionnaire") return item.lastEvidenceLabel || `анкета · ${km(item.lastMileage)}`;
  return "не уточнено";
}

function systemState(ruleIds, schedule) {
  const items = schedule.filter((s) => ruleIds.includes(s.id));
  const overdue = items.filter((i) => i.status === "Просрочено");
  const soon = items.filter((i) => i.status === "Скоро");
  const known = items.filter((i) => i.lastSource === "journal" || i.lastSource === "questionnaire");
  if (overdue.length) return { tone: "bad", title: "Внимание", detail: overdue[0].name };
  if (soon.length) return { tone: "warn", title: "Скоро", detail: soon[0].name };
  if (known.length) return { tone: "good", title: "Учтено", detail: sourceText(known[0]) };
  return { tone: "neutral", title: "Уточнить", detail: "нет анкеты или документа" };
}

function Sheet({ title, subtitle, children, onClose }) {
  return (
    <div className="mx-sheet-backdrop" onClick={onClose}>
      <div className="mx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mx-sheet-handle" />
        <div className="mx-sheet-head">
          <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
          <button className="mx-sheet-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PassportScreen({
  vehicle,
  schedule,
  analysis,
  serviceRules,
  predictions,
  totalSpent,
  logCount,
  healthScore,
  costForecast,
  mileagePace,
  insights,
  ownerProfile,
}) {
  const [sheet, setSheet] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);

  const systems = useMemo(() => SYSTEMS.map((sys) => ({ ...sys, state: systemState(sys.ruleIds, schedule) })), [schedule]);
  const knownCount = schedule.filter((s) => s.lastSource === "journal" || s.lastSource === "questionnaire").length;
  const totalCount = schedule.length || 1;
  const coverage = Math.round((knownCount / totalCount) * 100);
  const nextSpend = costForecast?.next6Months || 0;
  const mainSummary = ownerProfile?.historyMode === "used-unknown"
    ? "История прошлого неизвестна. Паспорт строится от новой точки отсчёта."
    : ownerProfile?.completedAt
      ? "Анкета принята. Паспорт использует журнал и ответы владельца."
      : "Заполните быструю историю, чтобы паспорт стал точнее.";

  function openSystem(sys) {
    setSelectedSystem(sys);
    setSheet("system");
  }

  const selectedItems = selectedSystem ? schedule.filter((s) => selectedSystem.ruleIds.includes(s.id)) : [];

  return (
    <div className="mx-page mx-passport-page">
      <div className="mx-page-head">
        <span>MOTRIX PASSPORT</span>
        <h2>Паспорт</h2>
        <p>{vehicle.brand} {vehicle.model} · {historyModeText(ownerProfile)}</p>
      </div>

      <button className="mx-passport-hero" onClick={() => setSheet("identity")}>
        <span className="mx-passport-kicker">Vehicle card</span>
        <strong>{vehicle.brand} {vehicle.model}</strong>
        <small>{[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive].filter(Boolean).join(" · ")}</small>
        <em>{mainSummary}</em>
      </button>

      <div className="mx-action-grid three mx-passport-stats">
        <button className="mx-mini-card" onClick={() => setSheet("health")}><span>Индекс</span><strong>{healthScore}%</strong><small>состояние</small></button>
        <button className="mx-mini-card" onClick={() => setSheet("coverage")}><span>Покрытие</span><strong>{coverage}%</strong><small>журнал + анкета</small></button>
        <button className="mx-mini-card" onClick={() => setSheet("costs")}><span>Расходы</span><strong>{nextSpend ? rub(nextSpend) : "—"}</strong><small>6 месяцев</small></button>
      </div>

      <div className="mx-section-label">Системы</div>
      <div className="mx-system-grid">
        {systems.map((sys) => (
          <button key={sys.id} className={`mx-system-card ${sys.state.tone}`} onClick={() => openSystem(sys)}>
            <span>{sys.name}</span>
            <strong>{sys.state.title}</strong>
            <small>{sys.state.detail}</small>
          </button>
        ))}
      </div>

      <button className="mx-dossier-card" onClick={() => setSheet("dossier")}>
        <span>AI-досье</span>
        <strong>Сводка по автомобилю</strong>
        <small>регламент · риски · план владения</small>
        <b>›</b>
      </button>

      {sheet === "identity" && (
        <Sheet title="Карточка автомобиля" subtitle="Паспорт машины без текстовой свалки" onClose={() => setSheet(null)}>
          <div className="mx-bank-list">
            {[
              ["VIN", vehicle.vin || "не указан"],
              ["Год", vehicle.year || "—"],
              ["Двигатель", vehicle.engine || "—"],
              ["Коробка", vehicle.transmission || "—"],
              ["Привод", vehicle.drive || "—"],
              ["Цвет", vehicle.color || "—"],
              ["История", historyModeText(ownerProfile)],
            ].map(([k, v]) => <div className="mx-bank-row static" key={k}><span><b>{k}</b><small>{v}</small></span><strong>›</strong></div>)}
          </div>
        </Sheet>
      )}

      {sheet === "system" && selectedSystem && (
        <Sheet title={selectedSystem.name} subtitle={selectedSystem.note} onClose={() => setSheet(null)}>
          <div className="mx-bank-list">
            {selectedItems.map((item) => (
              <div className="mx-bank-row static" key={item.id}>
                <span><b>{item.name}</b><small>{sourceText(item)}{item.left > 0 ? ` · осталось ${km(item.left)}` : ""}</small></span>
                <strong>{item.status === "Норма" ? "OK" : item.status}</strong>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "coverage" && (
        <Sheet title="Покрытие истории" subtitle="Motrix различает документы, анкету и пустые зоны" onClose={() => setSheet(null)}>
          <div className="mx-coverage-big"><strong>{coverage}%</strong><span>{knownCount}/{schedule.length} позиций имеют основание</span></div>
          <div className="mx-bank-list">
            <div className="mx-bank-row static"><span><b>Журнал</b><small>{logCount} записей</small></span><strong>{logCount}</strong></div>
            <div className="mx-bank-row static"><span><b>Анкета</b><small>{ownerProfile?.completedAt ? "заполнена" : "не заполнена"}</small></span><strong>{ownerProfile?.completedAt ? "OK" : "—"}</strong></div>
          </div>
        </Sheet>
      )}

      {sheet === "health" && (
        <Sheet title="Индекс Motrix" subtitle="Сводный сигнал, а не диагноз" onClose={() => setSheet(null)}>
          <div className="mx-health-big">{healthScore}%</div>
          <p className="mx-detail-text">Индекс учитывает пробег, регламент, подтверждённые записи и ответы анкеты. Чем больше документов, тем точнее расчёт.</p>
        </Sheet>
      )}

      {sheet === "costs" && (
        <Sheet title="Прогноз расходов" subtitle="Строится по пробегу и регламенту" onClose={() => setSheet(null)}>
          <div className="mx-forecast-grid"><div><span>Месяц</span><b>{costForecast?.nextMonth ? rub(costForecast.nextMonth) : "—"}</b></div><div><span>6 месяцев</span><b>{costForecast?.next6Months ? rub(costForecast.next6Months) : "—"}</b></div><div><span>Год</span><b>{costForecast?.nextYear ? rub(costForecast.nextYear) : "—"}</b></div></div>
          <p className="mx-fineprint">Темп: {mileagePace ? km(mileagePace) + "/мес" : "не указан"}. После документов прогноз станет точнее.</p>
        </Sheet>
      )}

      {sheet === "dossier" && (
        <Sheet title="AI-досье" subtitle="Короткий документ по текущему профилю" onClose={() => setSheet(null)}>
          <div className="mx-dossier-text">
            <h4>{vehicle.brand} {vehicle.model}: сервисный профиль</h4>
            <p>Motrix видит {serviceRules?.length || schedule.length} регламентных позиций. Для текущего пробега главный смысл паспорта: не показывать пустые строки, а отделять подтверждённые данные от ответов владельца и неизвестных зон.</p>
            <p>{mainSummary}</p>
            {analysis?.topPriorities?.slice(0, 2).map((p, i) => <p key={i}><b>{p.title}.</b> {p.action || p.reason || "Проверьте в журнале и регламенте."}</p>)}
          </div>
        </Sheet>
      )}
    </div>
  );
}
