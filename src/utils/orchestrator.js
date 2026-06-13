// AI Orchestrator — unified intelligence layer.
// All screens derive their state from here. No logic should be duplicated elsewhere.

import { logMatchesRule } from "./normalizer.js";
import { resolveMonthlyKm } from "./predictions.js";

// Estimated service costs, ₽ (Russian mid-range market)
export const COST_ESTIMATES = {
  engine_oil:       2500,
  oil_filter:        400,
  engine_service:   7000,
  cabin_filter:     1200,
  air_filter:        800,
  spark_plugs:      3500,
  cvt_fluid:        9000,
  diff_fluid:       2500,
  brake_fluid:      1800,
  front_pads:       5000,
  front_discs:     13000,
  rear_pads:        3500,
  rear_discs:       9000,
  fuel_cleaning:    5000,
  suspension_check: 2000,
  other:            3000,
};

// ── Schedule agent ────────────────────────────────────────────────────────────
function scheduleAgent(serviceRules, data) {
  return serviceRules
    .filter((r) => r.intervalKm)
    .map((rule) => {
      const matchedLogs = data.logs.filter((log) => logMatchesRule(log, rule.id));
      const lastMileage = matchedLogs.length
        ? Math.max(...matchedLogs.map((l) => Number(l.mileage || 0)))
        : 0;
      const nextMileage = lastMileage + Number(rule.intervalKm);
      const left = nextMileage - Number(data.mileage || 0);
      let status = "Норма";
      if (left <= 0) status = "Просрочено";
      else if (left <= Number(rule.warningBeforeKm || 2000)) status = "Скоро";
      return { ...rule, lastMileage, nextMileage, left, status };
    });
}

// ── Health agent ──────────────────────────────────────────────────────────────
function healthAgent(schedule) {
  if (!schedule.length) return 100;
  let score = 100;
  schedule.forEach((i) => {
    const sevW = i.severity === "high" ? 1.8 : i.severity === "medium" ? 1.0 : 0.5;
    if (i.status === "Просрочено") score -= 15 * sevW;
    else if (i.status === "Скоро") score -= 4 * sevW;
    else if (i.lastMileage === 0 && i.severity === "high") score -= 7;
    else if (i.lastMileage === 0 && i.severity === "medium") score -= 3;
  });
  return Math.max(18, Math.min(100, Math.round(score)));
}

// ── Cost agent ────────────────────────────────────────────────────────────────
function costAgent(schedule, monthlyKm) {
  if (!monthlyKm) return { nextMonth: 0, next6Months: 0, nextYear: 0 };
  let nextMonth = 0, next6Months = 0, nextYear = 0;
  for (const item of schedule) {
    const cost = COST_ESTIMATES[item.id] || COST_ESTIMATES.other;
    if (item.status === "Просрочено") {
      nextMonth += cost; next6Months += cost; nextYear += cost;
      continue;
    }
    if (item.left <= 0) continue;
    const months = item.left / monthlyKm;
    if (months <= 1) nextMonth += cost;
    if (months <= 6) next6Months += cost;
    if (months <= 12) nextYear += cost;
  }
  return { nextMonth, next6Months, nextYear };
}

// ── History agent ─────────────────────────────────────────────────────────────
function historyAgent(data) {
  if (!data?.logs?.length) return { lastService: null, totalSpent: 0, logCount: 0 };
  const sorted = [...data.logs].sort((a, b) => Number(b.mileage) - Number(a.mileage));
  const totalSpent = data.logs.reduce((s, l) => s + Number(l.cost || 0), 0);
  return { lastService: sorted[0], totalSpent, logCount: data.logs.length };
}

// ── Prediction agent ──────────────────────────────────────────────────────────
function predictionAgent(schedule, monthlyKm) {
  const result = [];
  const sorted = [...schedule].sort((a, b) => {
    const o = { Просрочено: 0, Скоро: 1, Норма: 2 };
    const s = (o[a.status] ?? 3) - (o[b.status] ?? 3);
    return s !== 0 ? s : (a.left || 0) - (b.left || 0);
  });

  for (const item of sorted) {
    if (result.length >= 5) break;

    if (item.lastMileage === 0 && (item.severity === "high" || item.severity === "medium")) {
      result.push({ id: `gap-${item.id}`, type: "unknown-history", severity: item.severity, text: `${item.name}: нет записей за всё время.`, itemId: item.id, itemName: item.name });
      continue;
    }
    if (item.status === "Просрочено") {
      result.push({ id: `overdue-${item.id}`, type: "overdue", severity: "high", text: `${item.name} — просрочено на ${Math.abs(item.left).toLocaleString("ru-RU")} км.`, itemId: item.id, itemName: item.name, kmLeft: item.left });
      continue;
    }
    if (item.status === "Скоро") {
      const mStr = monthlyKm > 0 ? ` (${approxM(item.left, monthlyKm)})` : "";
      result.push({ id: `soon-${item.id}`, type: "mileage", severity: item.severity === "high" ? "high" : "medium", text: `${item.name} — через ~${item.left.toLocaleString("ru-RU")} км${mStr}.`, itemId: item.id, itemName: item.name, kmLeft: item.left });
      continue;
    }
    if (item.status === "Норма" && monthlyKm > 0 && item.left > 0) {
      const months = Math.round(item.left / monthlyKm);
      if (months >= 1 && months <= 5) {
        result.push({ id: `upcoming-${item.id}`, type: "mileage", severity: "low", text: `${item.name} — через ${months} ${plM(months)}.`, itemId: item.id, itemName: item.name, kmLeft: item.left });
      }
    }
  }
  return result;
}

// ── Local briefing (instant, no API) ─────────────────────────────────────────
function briefingAgent({ vehicle, schedule, data, ownerProfile, analysis, monthlyKm }) {
  const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Автомобиль";
  const overdue = schedule.filter((s) => s.status === "Просрочено");
  const soon = schedule.filter((s) => s.status === "Скоро");
  const critUnknown = schedule.filter((s) => s.lastMileage === 0 && s.severity === "high");
  const costF = costAgent(schedule, monthlyKm);
  const parts = [];

  if (overdue.length > 0) {
    const top = [...overdue].sort((a, b) => (a.severity === "high" ? -1 : 1))[0];
    parts.push(`${name}: ${top.name.toLowerCase()} просрочено на ${Math.abs(top.left).toLocaleString("ru-RU")} км.`);
    if (overdue.length > 1) parts.push(`Ещё ${overdue.length - 1} просроченных позиций.`);
  } else if (critUnknown.length > 0) {
    parts.push(`${name} в целом в норме. Нет данных о: ${critUnknown.map((u) => u.name.toLowerCase()).join(", ")}.`);
  } else if (soon.length > 0) {
    const top = soon[0];
    parts.push(`${name} в порядке. Ближайшее: ${top.name.toLowerCase()} через ~${top.left.toLocaleString("ru-RU")} км.`);
  } else {
    parts.push(`${name} в хорошем состоянии — регламент соблюдён.`);
  }

  if (critUnknown.length > 0 && overdue.length === 0) {
    parts.push(`Рекомендуется добавить историю обслуживания или загрузить документы СТО.`);
  }

  if (costF.next6Months > 0) {
    parts.push(`Прогноз расходов на 6 месяцев: ~${costF.next6Months.toLocaleString("ru-RU")} ₽.`);
  }

  if (data?.logs?.length > 0) {
    const last = [...data.logs].sort((a, b) => Number(b.mileage) - Number(a.mileage))[0];
    if (last) parts.push(`Последняя запись: ${last.title} — ${Number(last.mileage).toLocaleString("ru-RU")} км.`);
  }

  if (analysis?.topPriorities?.length > 0) {
    const top = analysis.topPriorities[0];
    parts.push(`AI-анализ: ${top.title} — ${top.action}`);
  }

  return parts.join(" ");
}

// ── Quick questions for AI mechanic ──────────────────────────────────────────
function quickQuestionsAgent(schedule, ownerProfile) {
  const questions = [];
  const overdue = schedule.filter((s) => s.status === "Просрочено");
  const critUnknown = schedule.filter((s) => s.lastMileage === 0 && s.severity === "high");

  if (overdue.length > 0) questions.push(`Что делать с ${overdue[0].name.toLowerCase()}?`);
  if (critUnknown.length > 0) questions.push("Что неизвестно о машине?");
  questions.push("Что проверить перед дальней поездкой?");
  if (ownerProfile?.priority === "Экономия") questions.push("Что можно отложить без риска?");
  else if (ownerProfile?.priority === "Максимальная надёжность") questions.push("Что сделать для максимальной надёжности?");
  else questions.push("Сколько денег готовить на полгода?");
  questions.push("Что самое критичное прямо сейчас?");

  return questions.slice(0, 4);
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
export function computeOrchestratorState({ vehicle, profile, data, ownerProfile, analysis, defaultRules }) {
  const serviceRules = profile?.serviceItems?.length ? profile.serviceItems : defaultRules;
  const monthlyKm = resolveMonthlyKm(ownerProfile);

  const schedule    = scheduleAgent(serviceRules, data);
  const healthScore = healthAgent(schedule);
  const costForecast = costAgent(schedule, monthlyKm);
  const { lastService, totalSpent, logCount } = historyAgent(data);
  const predictions = predictionAgent(schedule, monthlyKm);
  const localBriefing = briefingAgent({ vehicle, schedule, data, ownerProfile, analysis, monthlyKm });
  const quickQuestions = quickQuestionsAgent(schedule, ownerProfile);

  const urgentActions = [...schedule]
    .filter((i) => i.status !== "Норма")
    .sort((a, b) => {
      const so = { Просрочено: 0, Скоро: 1 };
      const bySt = (so[a.status] ?? 2) - (so[b.status] ?? 2);
      if (bySt !== 0) return bySt;
      const sv = { high: 0, medium: 1, low: 2 };
      return (sv[a.severity] ?? 3) - (sv[b.severity] ?? 3);
    });

  const upcomingItems = monthlyKm > 0
    ? schedule
        .filter((i) => i.status === "Норма" && i.left > 0)
        .map((i) => ({ ...i, estimatedMonths: Math.round(i.left / monthlyKm) }))
        .filter((i) => i.estimatedMonths >= 1 && i.estimatedMonths <= 6)
        .sort((a, b) => a.estimatedMonths - b.estimatedMonths)
    : schedule.filter((i) => i.status === "Норма" && i.left > 0)
        .sort((a, b) => a.left - b.left)
        .slice(0, 3);

  const unknownAreas = schedule.filter((i) => i.lastMileage === 0);

  return {
    schedule,
    serviceRules,
    healthScore,
    costForecast,
    urgentActions,
    upcomingItems,
    unknownAreas,
    lastService,
    totalSpent,
    logCount,
    mileagePace: monthlyKm,
    predictions,
    localBriefing,
    quickQuestions,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function approxM(kmLeft, monthlyKm) {
  const months = Math.round(kmLeft / monthlyKm);
  if (months <= 0) return "в этом месяце";
  if (months === 1) return "~1 мес";
  if (months <= 4) return `~${months} мес`;
  return `~${months} мес`;
}

function plM(n) {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}
