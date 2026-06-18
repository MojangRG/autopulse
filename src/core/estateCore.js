const RUB = new Intl.NumberFormat("ru-RU");

function rub(value) {
  const n = Number(value || 0);
  return n > 0 ? `${RUB.format(n)} ₽` : "—";
}

function km(value) {
  const n = Number(value || 0);
  return n > 0 ? `${RUB.format(n)} км` : "—";
}

function zoneTone(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function safeVehicleTitle(vehicle) {
  return [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Автомобиль";
}

function getGarageTasks(vehicleBrain = {}, reminders = []) {
  const tasks = [];

  if (vehicleBrain.primaryAction?.title) {
    tasks.push({
      id: "garage-primary",
      zone: "garage",
      title: vehicleBrain.primaryAction.title,
      subtitle: vehicleBrain.statusSentence || vehicleBrain.primaryAction?.why?.reason || "Открыть гараж и проверить рекомендацию",
      tone: vehicleBrain.primaryAction.severity === "high" ? "bad" : "warn",
      cta: "Открыть гараж",
    });
  }

  for (const r of (reminders || []).slice(0, 2)) {
    tasks.push({
      id: `reminder-${r.id}`,
      zone: "garage",
      title: r.title,
      subtitle: r.message,
      tone: r.priority === "high" ? "bad" : "warn",
      cta: "Посмотреть",
    });
  }

  const next = vehicleBrain.upcomingItems?.[0];
  if (next && tasks.length < 3) {
    tasks.push({
      id: "garage-next",
      zone: "garage",
      title: next.name,
      subtitle: next.left > 0 ? `Через ${km(next.left)}` : "Ближайшая работа по регламенту",
      tone: next.severity === "high" ? "warn" : "neutral",
      cta: "План",
    });
  }

  return tasks;
}

export function buildEstateCoreState({ vehicle, vehicleBrain, reminders, data, ownerProfile, analysis }) {
  const garageScore = Number(vehicleBrain?.healthScore || 0) || 0;
  const garageTasks = getGarageTasks(vehicleBrain, reminders);
  const docsCount = (data?.logs?.length || 0) + (vehicle ? 1 : 0) + (ownerProfile?.completedAt ? 1 : 0) + (analysis ? 1 : 0);
  const activeTasks = [...garageTasks];
  const next6 = Number(vehicleBrain?.costForecast?.next6Months || 0);
  const hasGarage = Boolean(vehicle?.brand && vehicle?.model);

  const zones = [
    {
      id: "garage",
      title: "Гараж",
      emoji: "▣",
      status: hasGarage ? `${safeVehicleTitle(vehicle)} · ${garageScore}%` : "Добавьте автомобиль",
      subtitle: hasGarage ? (vehicleBrain?.statusSentence || "Авто под контролем") : "AI-паспорт авто, ТО, расходы, OBD и сигнализация",
      score: hasGarage ? garageScore : 0,
      tone: hasGarage ? zoneTone(garageScore) : "neutral",
      enabled: true,
      primaryMetric: next6 > 0 ? rub(next6) : "ТО и расходы",
      metricLabel: next6 > 0 ? "прогноз 6 мес" : "ожидают данных",
    },
    {
      id: "home",
      title: "Дом",
      emoji: "⌂",
      status: "Скоро",
      subtitle: "Счётчики, протечки, техника, фильтры, гарантии и умный дом",
      score: 0,
      tone: "neutral",
      enabled: false,
      primaryMetric: "Sense Hub",
      metricLabel: "датчики и счётчики",
    },
    {
      id: "pet",
      title: "Питомец",
      emoji: "◌",
      status: "Скоро",
      subtitle: "Чип, ветпаспорт, прививки, корм, вес и Pet Station",
      score: 0,
      tone: "neutral",
      enabled: false,
      primaryMetric: "Pet Gate",
      metricLabel: "чип и уход",
    },
    {
      id: "docs",
      title: "Документы",
      emoji: "▤",
      status: docsCount > 0 ? `${docsCount} в базе` : "Пусто",
      subtitle: "СТС, чеки, заказ-наряды, гарантии, страховки и AI-досье",
      score: docsCount > 0 ? Math.min(95, 55 + docsCount * 8) : 35,
      tone: docsCount > 0 ? "good" : "warn",
      enabled: true,
      primaryMetric: `${docsCount}`,
      metricLabel: "записей и документов",
    },
    {
      id: "devices",
      title: "Устройства",
      emoji: "✺",
      status: "Концепт",
      subtitle: "ELM/OBD, StarLine, датчики дома, счётчики, ASU TP и white-label железо",
      score: 0,
      tone: "neutral",
      enabled: false,
      primaryMetric: "Motrix Sense",
      metricLabel: "нервная система",
    },
  ];

  const estateScore = hasGarage
    ? Math.round((garageScore * 0.65) + ((docsCount > 0 ? 75 : 45) * 0.35))
    : 42;

  const todaySummary = activeTasks.length
    ? `${activeTasks.length} ${activeTasks.length === 1 ? "задача" : "задачи"} требуют внимания`
    : "Сегодня всё спокойно. Дом имущества под контролем.";

  return {
    estateName: "Мой дом",
    concept: "AI-дом имущества",
    estateScore,
    estateTone: zoneTone(estateScore),
    todaySummary,
    zones,
    tasks: activeTasks.slice(0, 5),
    docsCount,
    money: {
      nextMonth: vehicleBrain?.costForecast?.nextMonth || 0,
      next6Months: vehicleBrain?.costForecast?.next6Months || 0,
      nextYear: vehicleBrain?.costForecast?.nextYear || 0,
    },
    garage: {
      vehicleTitle: safeVehicleTitle(vehicle),
      mileage: data?.mileage || 0,
      healthScore: garageScore,
      nextAction: vehicleBrain?.primaryAction,
      statusSentence: vehicleBrain?.statusSentence,
    },
    roadmap: [
      "Гараж: текущий Motrix становится первой живой комнатой",
      "Дом: счётчики, фильтры, протечки, техника и гарантии",
      "Питомец: чип, ветпаспорт, прививки, корм и Pet Station",
      "Устройства: OBD, StarLine, умный дом, счётчики и ASU TP",
    ],
  };
}
