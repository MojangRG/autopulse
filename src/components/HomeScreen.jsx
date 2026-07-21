import { useMemo, useState } from "react";
import CarVisual from "./CarVisual.jsx";
import "../motrix-ui.css";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
function rub(v) { return Number(v || 0).toLocaleString("ru-RU") + " ₽"; }

function healthColor(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function severityLabel(severity) {
  if (severity === "high") return "Срочно";
  if (severity === "medium") return "Важно";
  return "Планово";
}

function statusWord(problem) {
  if (problem?.type === "history_questionnaire") return "Анкета";
  if (problem?.type === "used_unknown") return "Б/у";
  if (problem?.status === "Просрочено") return "Просрочено";
  if (problem?.status === "Скоро") return "Скоро";
  if (problem?.status === "Нет данных" || problem?.type === "scan") return "Нет данных";
  return "Рекомендация";
}

function problemName(problem) {
  return problem?.name || problem?.title || problem?.itemName || "Рекомендация";
}

function problemTone(problem) {
  if (problem?.status === "Просрочено" || problem?.severity === "high") return "high";
  if (problem?.status === "Скоро" || problem?.severity === "medium") return "medium";
  return "low";
}

function problemShort(problem) {
  if (!problem) return "";
  if (problem.type === "history_questionnaire") return "3–5 быстрых вопросов";
  if (problem.type === "used_unknown") return "Нужна новая точка отсчёта";
  if (problem.status === "Просрочено") return `Перепробег ${km(Math.abs(problem.left || 0))}`;
  if (problem.status === "Скоро") return `Осталось ~${km(problem.left || 0)}`;
  if (problem.type === "scan" || problem.status === "Нет данных") return "Нужно добавить историю";
  if (problem.estimatedMonths > 0) return `~${problem.estimatedMonths} мес`;
  if (problem.left > 0) return `~${km(problem.left)}`;
  return "Откройте детали";
}

function riskText(problem) {
  if (problem?.type === "history_questionnaire") return "Сейчас Motrix не знает, что вы реально знаете об автомобиле. Анкета помогает не путать отсутствие чека с отсутствием обслуживания.";
  if (problem?.type === "used_unknown") return "Для б/у автомобиля без истории главный риск не конкретная одна замена, а неопределённость прошлого обслуживания. Лучше создать новую точку отсчёта: диагностика, базовые жидкости и журнал с этого момента.";
  const name = problemName(problem).toLowerCase();
  if (problem?.type === "scan" || problem?.status === "Нет данных") return "Motrix не видит подтверждённых записей. Риск в том, что реальное состояние узла неизвестно.";
  if (name.includes("масло")) return "Если игнорировать, растёт износ двигателя и стоимость будущего ремонта.";
  if (name.includes("cvt") || name.includes("вариатор")) return "Вариатор чувствителен к обслуживанию. Лучше не затягивать с диагностикой и заменой жидкости.";
  if (name.includes("тормоз")) return "Тормозная система влияет на безопасность. Рекомендацию лучше подтвердить на СТО.";
  if (name.includes("фильтр")) return "Фильтр влияет на ресурс узла, комфорт и качество обслуживания.";
  return "Рекомендация основана на пробеге, истории обслуживания и регламенте.";
}

function buildShoppingQueries(problem, vehicle) {
  const name = problemName(problem).toLowerCase();
  const car = [vehicle?.brand, vehicle?.model, vehicle?.generation, vehicle?.engine, vehicle?.year]
    .filter(Boolean)
    .join(" ");

  if (problem?.id === "engine_oil" || name.includes("масло двигателя")) {
    return [
      `масло 5W-30 ${car}`,
      `масляный фильтр ${car}`,
      `комплект ТО ${car}`,
    ];
  }
  if (problem?.id === "oil_filter" || name.includes("масляный фильтр")) return [`масляный фильтр ${car}`];
  if (problem?.id === "cabin_filter" || name.includes("салон")) return [`салонный фильтр ${car}`];
  if (problem?.id === "air_filter" || name.includes("воздуш")) return [`воздушный фильтр ${car}`];
  if (problem?.id === "brake_fluid" || name.includes("тормозная жидкость")) return [`тормозная жидкость DOT 4 ${car}`];
  if (problem?.id === "spark_plugs" || name.includes("свеч")) return [`свечи зажигания ${car}`];
  if (problem?.id === "cvt_fluid" || name.includes("cvt") || name.includes("вариатор")) return [`масло CVT ${car}`];
  if (name.includes("колод")) return [`тормозные колодки ${car}`];
  if (name.includes("диск")) return [`тормозные диски ${car}`];

  return [`${problemName(problem)} ${car}`];
}

function marketplaceUrl(platform, query) {
  const q = encodeURIComponent(query);
  // TODO: replace direct search URLs with backend redirect URLs containing affiliate ids.
  if (platform === "wb") return `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`;
  if (platform === "ozon") return `https://www.ozon.ru/search/?text=${q}`;
  return `https://market.yandex.ru/search?text=${q}`;
}

function mapsUrl(problem, vehicle) {
  const query = [problemName(problem), vehicle?.brand, vehicle?.model, "СТО рядом"]
    .filter(Boolean)
    .join(" ");
  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

function openUrl(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function GlassSheet({ title, subtitle, children, onClose }) {
  return (
    <div className="mx-sheet-backdrop" onClick={onClose}>
      <div className="mx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mx-sheet-handle" />
        <div className="mx-sheet-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="mx-sheet-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProblemRow({ problem, onClick }) {
  const tone = problemTone(problem);
  return (
    <button className={`mx-problem-row ${tone}`} onClick={onClick}>
      <span className="mx-problem-dot" />
      <span className="mx-problem-copy">
        <b>{problemName(problem)}</b>
        <small>{problemShort(problem)}</small>
      </span>
      <span className="mx-problem-status">{statusWord(problem)}</span>
      <span className="mx-chevron">›</span>
    </button>
  );
}

function DetailMetric({ label, value, tone }) {
  if (value == null || value === "") return null;
  return (
    <div className={`mx-metric ${tone || ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function MarketplaceBlock({ problem, vehicle }) {
  const queries = buildShoppingQueries(problem, vehicle);
  const mainQuery = queries[0];

  return (
    <div className="mx-commerce-block">
      <div className="mx-block-title">Подобрать расходники</div>
      <div className="mx-query-chip">{mainQuery}</div>
      <div className="mx-commerce-grid">
        <button onClick={() => openUrl(marketplaceUrl("wb", mainQuery))}>Wildberries</button>
        <button onClick={() => openUrl(marketplaceUrl("ozon", mainQuery))}>Ozon</button>
        <button onClick={() => openUrl(marketplaceUrl("ym", mainQuery))}>Яндекс Маркет</button>
      </div>
      {queries.length > 1 && (
        <div className="mx-alt-queries">
          {queries.slice(1).map((q) => <span key={q}>{q}</span>)}
        </div>
      )}
    </div>
  );
}

function ServiceBookingBlock({ problem, vehicle }) {
  return (
    <div className="mx-commerce-block service">
      <div className="mx-block-title">Записаться на СТО</div>
      <p>Откроем Яндекс Карты с поиском сервиса под эту задачу.</p>
      <button className="mx-service-cta" onClick={() => openUrl(mapsUrl(problem, vehicle))}>Открыть сервисы рядом</button>
    </div>
  );
}

function ProblemDetail({ problem, vehicle, onManualAdd, onScan, onOpenProfile }) {
  const tone = problemTone(problem);
  const isUnknown = problem?.type === "scan" || problem?.type === "history_questionnaire" || problem?.type === "used_unknown" || problem?.status === "Нет данных";
  const drivenSince = problem?.lastMileage > 0 ? Number(vehicle?.mileage || 0) - Number(problem.lastMileage) : null;

  return (
    <div className="mx-problem-detail">
      <div className={`mx-detail-hero ${tone}`}>
        <span>{severityLabel(problem?.severity)}</span>
        <h4>{problemName(problem)}</h4>
        <p>{problemShort(problem)}</p>
      </div>

      <div className="mx-detail-block">
        <div className="mx-detail-label">Почему Motrix это показал</div>
        <div className="mx-metric-grid">
          <DetailMetric label="Последняя запись" value={problem?.lastMileage > 0 ? km(problem.lastMileage) : null} />
          <DetailMetric label="Интервал" value={problem?.intervalKm > 0 ? km(problem.intervalKm) : null} />
          <DetailMetric label="Осталось" value={problem?.status === "Скоро" ? km(problem.left) : null} />
          <DetailMetric label="Перепробег" value={problem?.status === "Просрочено" ? km(Math.abs(problem.left || 0)) : null} tone="bad" />
          <DetailMetric label="С замены" value={drivenSince > 0 ? km(drivenSince) : null} />
        </div>
      </div>

      <div className="mx-detail-block">
        <div className="mx-detail-label">Риск</div>
        <p className="mx-detail-text">{riskText(problem)}</p>
      </div>

      {isUnknown ? (
        <div className="mx-commerce-block service">
          <div className="mx-block-title">Добавить данные</div>
          <p>{problem?.type === "used_unknown" ? "Если история б/у автомобиля неизвестна, Motrix не будет гадать. Сначала зафиксируем режим: базовая диагностика, нулевое ТО и журнал с текущего момента." : "Заполните короткую анкету, загрузите чек, заказ-наряд или добавьте обслуживание вручную. Так Motrix перестанет гадать и начнёт считать точнее."}</p>
          <div className="mx-dual-actions">
            {onOpenProfile && <button onClick={onOpenProfile}>Быстрая анкета</button>}
            <label>
              Загрузить документ
              <input type="file" accept="image/*" onChange={onScan} hidden />
            </label>
            <button onClick={onManualAdd}>Добавить вручную</button>
          </div>
        </div>
      ) : (
        <>
          <MarketplaceBlock problem={problem} vehicle={vehicle} />
          <ServiceBookingBlock problem={problem} vehicle={vehicle} />
          <button className="mx-wide-ghost" onClick={onManualAdd}>Отметить как выполнено</button>
        </>
      )}

      <p className="mx-fineprint">Motrix не заменяет диагностику. Перед покупкой детали проверьте применимость по VIN, артикулу и параметрам автомобиля.</p>
    </div>
  );
}

function ForecastSheet({ costForecast, mileagePace, mileagePaceData, problems, onOpenProblem }) {
  return (
    <div>
      <div className="mx-forecast-grid">
        <div><span>Месяц</span><b>{costForecast?.nextMonth > 0 ? rub(costForecast.nextMonth) : "—"}</b></div>
        <div><span>6 месяцев</span><b>{costForecast?.next6Months > 0 ? rub(costForecast.next6Months) : "—"}</b></div>
        <div><span>Год</span><b>{costForecast?.nextYear > 0 ? rub(costForecast.nextYear) : "—"}</b></div>
      </div>
      {problems?.length > 0 && (
        <div className="mx-subsection">
          <div className="mx-block-title">Из чего складывается</div>
          {problems.slice(0, 5).map((problem) => (
            <ProblemRow key={problem.id || problem.name} problem={problem} onClick={() => onOpenProblem(problem)} />
          ))}
        </div>
      )}
      {mileagePace > 0 && (
        <p className="mx-fineprint">Темп: {mileagePace.toLocaleString("ru-RU")} км/мес. Точность: {mileagePaceData?.confidence || "низкая"}.</p>
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
  onOpenProfile,
  onReminderDismiss,
  onReminderDone,
}) {
  const [sheet, setSheet] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const hc = healthColor(healthScore);
  const topReminder = reminders?.find((r) => r.status === "active");

  const problems = useMemo(() => {
    const confirmed = (urgentActions || []).filter((item) => item.lastMileage > 0 || item.status !== "Нет данных");
    const items = [...confirmed];
    if (items.length === 0 && ["scan", "history_questionnaire", "used_unknown"].includes(primaryAction?.type)) {
      items.push({
        id: primaryAction.type === "used_unknown" ? "used-unknown-baseline" : "history-questionnaire",
        name: primaryAction.title,
        title: primaryAction.title,
        type: primaryAction.type,
        severity: primaryAction.severity || "medium",
        status: primaryAction.type === "used_unknown" ? "История неизвестна" : "Нужна анкета",
        left: 0,
        why: primaryAction.why,
      });
    }
    return items.slice(0, 5);
  }, [urgentActions, primaryAction]);

  const highCount = problems.filter((p) => problemTone(p) === "high").length;
  const mediumCount = problems.filter((p) => problemTone(p) === "medium").length;
  const nextItem = upcomingItems?.[0];
  const isSetupPrompt = problems.length === 1 && ["history_questionnaire", "used_unknown"].includes(problems[0]?.type);
  const priorityTitle = isSetupPrompt
    ? problemName(problems[0])
    : (problems.length ? `${problems.length} ${problems.length === 1 ? "проблема" : "проблемы"}` : "Всё спокойно");
  const prioritySubtitle = isSetupPrompt
    ? problemShort(problems[0])
    : (problems.length ? `${highCount} срочно · ${mediumCount} важно` : statusSentence || "Регламент выглядит нормально");
  const vehicleWithMileage = { ...vehicle, mileage };

  function openProblem(problem) {
    setSelectedProblem(problem);
    setSheet("problem");
  }

  function closeSheet() {
    setSheet(null);
  }

  return (
    <div className="home-screen mx-home">
      <div className={`mx-hero hero-card ${vehicleRender?.imageUrl ? "has-render" : ""}`}>
        {vehicleRender?.imageUrl && <img className="hero-render-image mx-hero-img" src={vehicleRender.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} />}
        <div className="hero-render-scrim mx-hero-scrim" />
        <div className="hero-glow mx-blue-glow" />
        {!vehicleRender?.imageUrl && <CarVisual vehicle={vehicle} />}

        <div className="mx-hero-content">
          <div className="mx-hero-topline">
            {(isGeneratingRender || vehicleRender?.status === "loading") && <span className="mx-glass-pill pulse">Рендер создаётся</span>}
            {!isGeneratingRender && vehicleRender?.status === "ready" && vehicleRender?.imageUrl && <span className="mx-glass-pill">AI render</span>}
            {vehicleRender?.status === "error" && <span className="mx-glass-pill danger">Рендер не создан</span>}
          </div>

          <div className="mx-hero-bottom">
            <div>
              <div className="mx-brand">MOTRIX</div>
              <div className="mx-car-title">{vehicle.brand} {vehicle.model}</div>
              <div className="mx-car-specs">
                {[vehicle.year, vehicle.engine, vehicle.transmission, vehicle.drive, vehicle.color].filter(Boolean).slice(0, 4).map((v) => <span key={v}>{v}</span>)}
              </div>
            </div>
            <button className={`mx-score ${hc}`} onClick={() => setSheet("health")}>{healthScore}%</button>
          </div>
        </div>
      </div>

      <button className="mx-mileage-card" onClick={() => setSheet("mileage")}> 
        <span>Пробег</span>
        <div className="mx-mileage-edit" onClick={(e) => e.stopPropagation()}>
          <input
            className="mileage-inline-input mx-mileage-input"
            type="number"
            value={newMileage}
            onChange={(e) => setNewMileage(e.target.value)}
          />
          <b>км</b>
          {Number(newMileage) !== Number(mileage) && <button className="mx-save" onClick={saveMileage}>✓</button>}
        </div>
      </button>

      <button className={`mx-priority-tile ${problems.length ? "attention" : "calm"}`} onClick={() => setSheet("problems")}>
        <span className="mx-priority-kicker">AI-приоритеты</span>
        <strong>{priorityTitle}</strong>
        <small>{prioritySubtitle}</small>
        <span className="mx-chevron">›</span>
      </button>

      {topReminder && (
        <button className={`mx-reminder ${topReminder.priority}`} onClick={() => setSheet("reminder")}>
          <div>
            <b>{topReminder.title}</b>
            <span>{topReminder.message}</span>
          </div>
          <span className="mx-chevron">›</span>
        </button>
      )}

      <div className="mx-action-grid">
        <button className="mx-mini-card" onClick={() => setSheet("forecast")}>
          <span>Расходы</span>
          <strong>{costForecast?.next6Months > 0 ? rub(costForecast.next6Months) : "—"}</strong>
          <small>на 6 месяцев</small>
        </button>
        <button className="mx-mini-card" onClick={() => setSheet("upcoming")}>
          <span>Следующее</span>
          <strong>{nextItem?.name || "Нет"}</strong>
          <small>{nextItem?.left ? `~${km(nextItem.left)}` : "план чист"}</small>
        </button>
      </div>

      <div className="mx-action-grid three">
        <label className={`mx-quick-action ${isParsingDoc ? "loading" : ""}`}>
          <span>📷</span>
          <b>{isParsingDoc ? "Читаю" : "СТС/чек"}</b>
          <input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} />
        </label>
        <button className="mx-quick-action" onClick={onManualAdd}><span>＋</span><b>Работа</b></button>
        <button className="mx-quick-action" onClick={() => setSheet("last")}><span>⌁</span><b>История</b></button>
      </div>

      {sheet === "problems" && (
        <GlassSheet title="AI-приоритеты" subtitle="Каждая строка открывает детали и действия" onClose={closeSheet}>
          {problems.length ? (
            <div className="mx-problem-list">
              {problems.map((problem) => (
                <ProblemRow key={problem.id || problem.name} problem={problem} onClick={() => openProblem(problem)} />
              ))}
            </div>
          ) : (
            <div className="mx-empty-state">Критичных проблем не видно. Продолжайте вести журнал обслуживания.</div>
          )}
        </GlassSheet>
      )}

      {sheet === "problem" && selectedProblem && (
        <GlassSheet title="Подробности" subtitle="Причина, риск, покупка и запись" onClose={closeSheet}>
          <ProblemDetail problem={selectedProblem} vehicle={vehicleWithMileage} onManualAdd={onManualAdd} onScan={onScan} onOpenProfile={onOpenProfile} />
        </GlassSheet>
      )}

      {sheet === "forecast" && (
        <GlassSheet title="Прогноз расходов" subtitle="Нажмите на строку, чтобы открыть работу" onClose={closeSheet}>
          <ForecastSheet
            costForecast={costForecast}
            mileagePace={mileagePace}
            mileagePaceData={mileagePaceData}
            problems={[...(urgentActions || []), ...(upcomingItems || [])]}
            onOpenProblem={openProblem}
          />
        </GlassSheet>
      )}

      {sheet === "upcoming" && (
        <GlassSheet title="Ближайшее обслуживание" subtitle="Работы, которые появятся в горизонте" onClose={closeSheet}>
          {(upcomingItems || []).slice(0, 5).map((item) => <ProblemRow key={item.id || item.name} problem={item} onClick={() => openProblem(item)} />)}
          {(!upcomingItems || upcomingItems.length === 0) && <div className="mx-empty-state">На ближайшие месяцы явных работ не найдено.</div>}
        </GlassSheet>
      )}

      {sheet === "last" && (
        <GlassSheet title="История" subtitle="Последнее подтверждённое обслуживание" onClose={closeSheet}>
          {lastService ? (
            <button className="mx-last-sheet" onClick={onManualAdd}>
              <span>Последняя запись</span>
              <strong>{lastService.title}</strong>
              <small>{km(lastService.mileage)}</small>
            </button>
          ) : <div className="mx-empty-state">История обслуживания пока пустая.</div>}
        </GlassSheet>
      )}

      {sheet === "mileage" && (
        <GlassSheet title="Пробег" subtitle="Пробег влияет на прогноз и приоритеты" onClose={closeSheet}>
          <div className="mx-detail-block">
            <div className="mx-detail-label">Текущий пробег</div>
            <div className="mx-mileage-sheet-row">
              <input type="number" value={newMileage} onChange={(e) => setNewMileage(e.target.value)} />
              <button className="mx-service-cta" onClick={saveMileage}>Сохранить</button>
            </div>
          </div>
        </GlassSheet>
      )}

      {sheet === "health" && (
        <GlassSheet title="Индекс Motrix" subtitle="Сводный риск по регламенту и истории" onClose={closeSheet}>
          <div className={`mx-health-big ${hc}`}>{healthScore}%</div>
          <p className="mx-detail-text">{statusSentence || "Индекс рассчитывается по истории обслуживания, пробегу и регламентным интервалам."}</p>
        </GlassSheet>
      )}

      {sheet === "reminder" && topReminder && (
        <GlassSheet title="Напоминание" subtitle="Можно закрыть или отложить" onClose={closeSheet}>
          <div className={`mx-detail-hero ${topReminder.priority || "medium"}`}>
            <span>Напоминание</span>
            <h4>{topReminder.title}</h4>
            <p>{topReminder.message}</p>
          </div>
          <div className="mx-dual-actions">
            <button onClick={() => { onReminderDone(topReminder.id); closeSheet(); }}>Выполнено</button>
            <button onClick={() => { onReminderDismiss(topReminder.id); closeSheet(); }}>Скрыть</button>
          </div>
        </GlassSheet>
      )}
    </div>
  );
}
