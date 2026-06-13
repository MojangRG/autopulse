// Local prediction engine — pure computation, no API calls

export function computePredictions({ schedule, data, ownerProfile, analysis }) {
  const result = [];
  const monthlyKm = resolveMonthlyKm(ownerProfile);

  const sorted = [...(schedule || [])].sort((a, b) => {
    const order = { Просрочено: 0, Скоро: 1, Норма: 2 };
    const byStatus = (order[a.status] ?? 3) - (order[b.status] ?? 3);
    if (byStatus !== 0) return byStatus;
    return (a.left || 0) - (b.left || 0);
  });

  for (const item of sorted) {
    if (result.length >= 5) break;

    if (item.lastMileage === 0) {
      if (item.severity === "high" || item.severity === "medium") {
        result.push({
          id: `gap-${item.id}`,
          type: "unknown-history",
          severity: item.severity,
          text: `Нет записей: ${item.name}. Стоит уточнить историю обслуживания.`,
          itemId: item.id,
          itemName: item.name,
        });
      }
      continue;
    }

    if (item.status === "Просрочено") {
      result.push({
        id: `overdue-${item.id}`,
        type: "overdue",
        severity: "high",
        text: `${item.name} — просрочено на ${Math.abs(item.left).toLocaleString("ru-RU")} км.`,
        itemId: item.id,
        itemName: item.name,
        kmLeft: item.left,
      });
      continue;
    }

    if (item.status === "Скоро") {
      const monthsStr = monthlyKm > 0 ? ` (${approxMonthsText(item.left, monthlyKm)})` : "";
      result.push({
        id: `soon-${item.id}`,
        type: "mileage",
        severity: item.severity === "high" ? "high" : "medium",
        text: `${item.name} — через ~${item.left.toLocaleString("ru-RU")} км${monthsStr}.`,
        itemId: item.id,
        itemName: item.name,
        kmLeft: item.left,
      });
      continue;
    }

    if (item.status === "Норма" && monthlyKm > 0 && item.left > 0) {
      const months = Math.round(item.left / monthlyKm);
      if (months >= 1 && months <= 5) {
        result.push({
          id: `upcoming-${item.id}`,
          type: "mileage",
          severity: "low",
          text: `${item.name} — примерно через ${months} ${pluralMonths(months)}.`,
          itemId: item.id,
          itemName: item.name,
          kmLeft: item.left,
        });
      }
    }
  }

  return result;
}

export function resolveMonthlyKm(ownerProfile) {
  const map = {
    "до 500 км": 400,
    "500-1500 км": 1000,
    "1500-3000 км": 2000,
    "более 3000 км": 3500,
  };
  return map[ownerProfile?.monthlyKm] || 0;
}

function approxMonthsText(kmLeft, monthlyKm) {
  const months = Math.round(kmLeft / monthlyKm);
  if (months <= 0) return "в этом месяце";
  if (months === 1) return "~1 месяц";
  if (months <= 4) return `~${months} месяца`;
  return `~${months} месяцев`;
}

function pluralMonths(n) {
  if (n === 1) return "месяц";
  if (n >= 2 && n <= 4) return "месяца";
  return "месяцев";
}
