// AI Orchestrator — unified intelligence layer.
// All screens derive their state from here. No logic should be duplicated elsewhere.

import { logMatchesRule } from "./normalizer.js";
import { resolveMonthlyKm } from "./predictions.js";

export const COST_ESTIMATES = {
  engine_oil:        2500,
  oil_filter:         400,
  engine_service:    7000,
  cabin_filter:      1200,
  air_filter:         800,
  spark_plugs:       3500,
  cvt_fluid:         9000,
  diff_fluid:        2500,
  brake_fluid:       1800,
  front_pads:        5000,
  front_discs:      13000,
  rear_pads:         3500,
  rear_discs:        9000,
  fuel_cleaning:     5000,
  suspension_check:  2000,
  other:             3000,
};

// ── Mileage learning from history ─────────────────────────────────────────────
function learnMileagePace(data, declaredMonthlyKm) {
  const logs = (data?.logs || []).filter((l) => l.datePerformed && l.mileage && Number(l.mileage) > 0);
  if (logs.length < 2) {
    return { monthlyKm: declaredMonthlyKm, confidence: "low", source: "declared" };
  }
  const sorted = [...logs].sort((a, b) => new Date(a.datePerformed) - new Date(b.datePerformed));
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  const daySpan = (new Date(newest.datePerformed) - new Date(oldest.datePerformed)) / 86400000;
  const kmSpan = Number(newest.mileage) - Number(oldest.mileage);
  if (daySpan < 30 || kmSpan <= 0) {
    return { monthlyKm: declaredMonthlyKm, confidence: "low", source: "declared" };
  }
  const learnedMonthlyKm = Math.round((kmSpan / daySpan) * 30);
  const confidence = daySpan >= 180 ? "high" : daySpan >= 60 ? "medium" : "low";
  // Use learned if we have medium/high confidence, otherwise blend with declared
  const finalMonthlyKm = confidence !== "low"
    ? learnedMonthlyKm
    : (declaredMonthlyKm > 0 ? Math.round((learnedMonthlyKm + declaredMonthlyKm) / 2) : learnedMonthlyKm);
  return { monthlyKm: finalMonthlyKm > 0 ? finalMonthlyKm : declaredMonthlyKm, confidence, source: "history", learnedMonthlyKm, declaredMonthlyKm, daySpan: Math.round(daySpan) };
}

// ── Schedule agent ─────────────────────────────────────────────────────────────
function scheduleAgent(serviceRules, data) {
  const currentMileage = Number(data?.mileage || 0);
  return serviceRules
    .filter((r) => r.intervalKm)
    .map((rule) => {
      const matchedLogs = (data?.logs || []).filter((log) => logMatchesRule(log, rule.id));
      const lastMileage = matchedLogs.length
        ? Math.max(...matchedLogs.map((l) => Number(l.mileage || 0)))
        : 0;
      const nextMileage = lastMileage + Number(rule.intervalKm);
      const left = nextMileage - currentMileage;
      let status = "Норма";
      if (left <= 0) status = "Просрочено";
      else if (left <= Number(rule.warningBeforeKm || 2000)) status = "Скоро";
      // Time-based override: if intervalMonths defined and we have a date, compute deadline
      let timeStatus = null;
      if (rule.intervalMonths && matchedLogs.length > 0) {
        const lastLog = matchedLogs.reduce((a, b) => (new Date(b.datePerformed || b.dateAdded || 0) > new Date(a.datePerformed || a.dateAdded || 0) ? b : a));
        const lastDate = new Date(lastLog.datePerformed || lastLog.dateAdded || 0);
        if (lastDate.getTime() > 0) {
          const nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + rule.intervalMonths);
          const msLeft = nextDate - Date.now();
          const monthsLeft = Math.round(msLeft / (30 * 86400000));
          if (msLeft <= 0) timeStatus = "Просрочено";
          else if (monthsLeft <= 2) timeStatus = "Скоро";
        }
      }
      // If time-based is more urgent than km-based, escalate
      const finalStatus = (timeStatus === "Просрочено" && status !== "Просрочено") ? "Просрочено"
        : (timeStatus === "Скоро" && status === "Норма") ? "Скоро"
        : status;
      return { ...rule, lastMileage, nextMileage, left, status: finalStatus };
    });
}

// ── Health agent ───────────────────────────────────────────────────────────────
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

// ── Cost agent ─────────────────────────────────────────────────────────────────
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

// ── History agent ──────────────────────────────────────────────────────────────
function historyAgent(data) {
  if (!data?.logs?.length) return { lastService: null, totalSpent: 0, logCount: 0 };
  const sorted = [...data.logs].sort((a, b) => Number(b.mileage) - Number(a.mileage));
  const totalSpent = data.logs.reduce((s, l) => s + Number(l.cost || 0), 0);
  return { lastService: sorted[0], totalSpent, logCount: data.logs.length };
}

// ── Prediction agent ───────────────────────────────────────────────────────────
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

// ── AI status sentence (instant, no API) ──────────────────────────────────────
function generateStatusSentence(vehicle, schedule, data, monthlyKm) {
  const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Автомобиль";
  const overdue = schedule.filter((s) => s.status === "Просрочено");
  const soon = schedule.filter((s) => s.status === "Скоро");
  const critUnknown = schedule.filter((s) => s.lastMileage === 0 && s.severity === "high");
  const highOverdue = overdue.filter((s) => s.severity === "high");

  if (highOverdue.length > 0) {
    return `${name} требует внимания. ${highOverdue[0].name} — просрочено.`;
  }
  if (overdue.length > 1) {
    return `Обнаружено ${overdue.length} просроченных позиций. Требуется обслуживание.`;
  }
  if (overdue.length === 1) {
    return `${name}: одна позиция просрочена. Рекомендуется обслуживание.`;
  }
  if (!data?.logs?.length) {
    return "История обслуживания не добавлена. Загрузите документы, чтобы AutoPulse начал следить за состоянием.";
  }
  if (critUnknown.length > 0 && soon.length === 0) {
    return `${name} в целом в порядке. Нет данных по ${critUnknown.length === 1 ? critUnknown[0].name.toLowerCase() : `${critUnknown.length} важным узлам`}.`;
  }
  if (soon.length > 0) {
    return `${name} в порядке. ${soon[0].name} потребует обслуживания в ближайшее время.`;
  }
  return `${name} в хорошем состоянии. Регламент соблюдён.`;
}

// ── Primary action (single most important thing) ──────────────────────────────
function primaryActionAgent(schedule, urgentActions, unknownAreas, data, mileage) {
  const currentMileage = Number(mileage || 0);

  // 1. High-severity overdue
  const highOverdue = urgentActions.filter((i) => i.status === "Просрочено" && i.severity === "high");
  if (highOverdue.length > 0) {
    const item = highOverdue[0];
    return {
      type: "overdue",
      severity: "high",
      title: item.name,
      why: {
        lastKm: item.lastMileage > 0 ? item.lastMileage : null,
        currentKm: currentMileage,
        drivenSince: item.lastMileage > 0 ? currentMileage - item.lastMileage : null,
        interval: item.intervalKm,
        overdueBy: Math.abs(item.left),
      },
    };
  }

  // 2. Any overdue
  const anyOverdue = urgentActions.find((i) => i.status === "Просрочено");
  if (anyOverdue) {
    return {
      type: "overdue",
      severity: anyOverdue.severity || "medium",
      title: anyOverdue.name,
      why: {
        lastKm: anyOverdue.lastMileage > 0 ? anyOverdue.lastMileage : null,
        currentKm: currentMileage,
        drivenSince: anyOverdue.lastMileage > 0 ? currentMileage - anyOverdue.lastMileage : null,
        interval: anyOverdue.intervalKm,
        overdueBy: Math.abs(anyOverdue.left),
      },
    };
  }

  // 3. No history at all
  if (!data?.logs?.length) {
    return {
      type: "scan",
      severity: "medium",
      title: "Добавьте историю обслуживания",
      why: { reason: "AutoPulse не может отслеживать состояние без записей. Отсканируйте документы СТО или добавьте записи вручную." },
    };
  }

  // 4. Critical unknowns
  const critGap = unknownAreas.find((i) => i.severity === "high");
  if (critGap) {
    return {
      type: "scan",
      severity: "medium",
      title: "Загрузите документы СТО",
      why: { reason: `Нет данных о ${critGap.name.toLowerCase()} — критически важный узел. Загрузите чеки или добавьте вручную.` },
    };
  }

  // 5. Coming soon (high severity)
  const soonHigh = urgentActions.find((i) => i.status === "Скоро" && i.severity === "high");
  if (soonHigh) {
    return {
      type: "upcoming",
      severity: "medium",
      title: soonHigh.name,
      why: {
        lastKm: soonHigh.lastMileage,
        currentKm: currentMileage,
        interval: soonHigh.intervalKm,
        kmLeft: soonHigh.left,
      },
    };
  }

  // 6. Any soon
  const soonAny = urgentActions.find((i) => i.status === "Скоро");
  if (soonAny) {
    return {
      type: "upcoming",
      severity: "low",
      title: soonAny.name,
      why: {
        lastKm: soonAny.lastMileage,
        currentKm: currentMileage,
        interval: soonAny.intervalKm,
        kmLeft: soonAny.left,
      },
    };
  }

  return null;
}

// ── Local briefing (instant, no API) ──────────────────────────────────────────
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
    parts.push("Рекомендуется добавить историю обслуживания или загрузить документы СТО.");
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

// ── Quick questions for AI mechanic ───────────────────────────────────────────
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

// ── Ownership insights ─────────────────────────────────────────────────────────
function ownershipInsights(schedule, data, totalSpent, vehicle) {
  const insights = [];

  // No-evidence checks
  const noEvidence = schedule.filter((i) => i.lastMileage === 0 && i.severity === "high");
  for (const item of noEvidence.slice(0, 3)) {
    insights.push({ type: "gap", text: `Нет записей о замене: ${item.name.toLowerCase()}` });
  }

  // Most expensive system
  const systemCosts = {
    "Двигатель": ["engine_oil", "oil_filter", "cabin_filter", "air_filter", "spark_plugs"],
    "Трансмиссия": ["cvt_fluid", "diff_fluid"],
    "Тормоза": ["brake_fluid", "front_pads", "front_discs", "rear_pads", "rear_discs"],
    "Топливная система": ["fuel_cleaning"],
    "Подвеска": ["suspension_check"],
  };

  let maxCost = 0;
  let maxSystem = null;
  for (const [sysName, ids] of Object.entries(systemCosts)) {
    const sysCost = data?.logs
      ?.filter((l) => ids.some((id) => l.normalizedId === id || id === l.normalizedId))
      .reduce((s, l) => s + Number(l.cost || 0), 0) || 0;
    if (sysCost > maxCost) { maxCost = sysCost; maxSystem = sysName; }
  }
  if (maxSystem && maxCost > 0) {
    insights.push({ type: "stat", text: `Самая затратная система: ${maxSystem} (${maxCost.toLocaleString("ru-RU")} ₽)` });
  }

  // Coverage
  const covered = schedule.filter((i) => i.lastMileage > 0).length;
  const total = schedule.length;
  if (total > 0) {
    insights.push({ type: "coverage", text: `История покрывает ${Math.round((covered / total) * 100)}% регламентного обслуживания` });
  }

  return insights;
}

// ── Main orchestrator ──────────────────────────────────────────────────────────
export function computeOrchestratorState({ vehicle, profile, data, ownerProfile, analysis, defaultRules }) {
  const serviceRules = profile?.serviceItems?.length ? profile.serviceItems : defaultRules;
  const declaredMonthlyKm = resolveMonthlyKm(ownerProfile);
  const mileagePaceData = learnMileagePace(data, declaredMonthlyKm);
  const monthlyKm = mileagePaceData.monthlyKm;

  const schedule     = scheduleAgent(serviceRules, data);
  const healthScore  = healthAgent(schedule);
  const costForecast = costAgent(schedule, monthlyKm);
  const { lastService, totalSpent, logCount } = historyAgent(data);
  const predictions  = predictionAgent(schedule, monthlyKm);
  const localBriefing = briefingAgent({ vehicle, schedule, data, ownerProfile, analysis, monthlyKm });
  const quickQuestions = quickQuestionsAgent(schedule, ownerProfile);
  const statusSentence = generateStatusSentence(vehicle, schedule, data, monthlyKm);

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
  const primaryAction = primaryActionAgent(schedule, urgentActions, unknownAreas, data, data?.mileage);
  const insights = ownershipInsights(schedule, data, totalSpent, vehicle);

  // vehicleBrain — single source of truth consumed by all screens
  const vehicleBrain = {
    vehicle,
    ownerProfile,
    schedule,
    healthScore,
    costForecast,
    urgentActions,
    upcomingItems,
    unknownAreas,
    lastService,
    totalSpent,
    logCount,
    mileagePace: monthlyKm,
    mileagePaceData,
    predictions,
    localBriefing,
    quickQuestions,
    statusSentence,
    primaryAction,
    insights,
    serviceRules,
  };

  return vehicleBrain;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function approxM(kmLeft, monthlyKm) {
  const months = Math.round(kmLeft / monthlyKm);
  if (months <= 0) return "в этом месяце";
  return `~${months} ${plM(months)}`;
}

function plM(n) {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}
