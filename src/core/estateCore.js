import { ASSET_ROOMS } from "./assetTypes.js";
import { SENSE_CATALOG, getSenseByRoom } from "./senseCatalog.js";

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

function buildRoomState(room, context) {
  const { vehicle, vehicleBrain, reminders, data, ownerProfile, analysis, docsCount, garageScore, next6 } = context;
  const hasGarage = Boolean(vehicle?.brand && vehicle?.model);
  const senseItems = getSenseByRoom(room.id);

  if (room.id === "garage") {
    return {
      ...room,
      status: hasGarage ? `${safeVehicleTitle(vehicle)} · ${garageScore}%` : "Добавьте автомобиль",
      subtitle: hasGarage ? (vehicleBrain?.statusSentence || "Авто под контролем") : room.description,
      score: hasGarage ? garageScore : 0,
      tone: hasGarage ? zoneTone(garageScore) : "neutral",
      primaryMetric: next6 > 0 ? rub(next6) : "ТО и расходы",
      metricLabel: next6 > 0 ? "прогноз 6 мес" : "ожидают данных",
      signalCount: (reminders || []).length + senseItems.length,
      senseItems,
    };
  }

  if (room.id === "docs") {
    return {
      ...room,
      status: docsCount > 0 ? `${docsCount} в базе` : "Пусто",
      subtitle: "Единая память: документы, чеки, договоры, гарантии и AI-досье.",
      score: docsCount > 0 ? Math.min(95, 55 + docsCount * 8) : 35,
      tone: docsCount > 0 ? "good" : "warn",
      primaryMetric: `${docsCount}`,
      metricLabel: "элементов",
      signalCount: docsCount,
      senseItems,
    };
  }

  if (room.id === "home") {
    return {
      ...room,
      status: "Черновик дома",
      subtitle: "Добавьте счётчики, датчики, фильтры, технику и гарантии.",
      score: 48,
      tone: "warn",
      primaryMetric: "4 зоны",
      metricLabel: "вода · свет · климат",
      signalCount: senseItems.length,
      senseItems,
    };
  }

  if (room.id === "pet") {
    return {
      ...room,
      status: "Паспорт питомца",
      subtitle: "Чип, прививки, кормление, вес и визиты к ветеринару.",
      score: 44,
      tone: "warn",
      primaryMetric: "Pet Gate",
      metricLabel: "чип и уход",
      signalCount: senseItems.length,
      senseItems,
    };
  }

  return {
    ...room,
    status: "Каталог Sense",
    subtitle: "Устройства дают AI-дому живые сигналы вместо ручного ввода.",
    score: 52,
    tone: "warn",
    primaryMetric: `${SENSE_CATALOG.length}`,
    metricLabel: "коннекторов",
    signalCount: SENSE_CATALOG.length,
    senseItems,
  };
}

export function buildEstateCoreState({ vehicle, vehicleBrain, reminders, data, ownerProfile, analysis }) {
  const garageScore = Number(vehicleBrain?.healthScore || 0) || 0;
  const garageTasks = getGarageTasks(vehicleBrain, reminders);
  const docsCount = (data?.logs?.length || 0) + (vehicle ? 1 : 0) + (ownerProfile?.completedAt ? 1 : 0) + (analysis ? 1 : 0);
  const next6 = Number(vehicleBrain?.costForecast?.next6Months || 0);
  const hasGarage = Boolean(vehicle?.brand && vehicle?.model);

  const context = { vehicle, vehicleBrain, reminders, data, ownerProfile, analysis, docsCount, garageScore, next6 };
  const zones = ASSET_ROOMS.map((room) => buildRoomState(room, context));

  const seedTasks = [
    {
      id: "home-seed",
      zone: "home",
      title: "Собрать паспорт дома",
      subtitle: "Начните с протечки, счётчиков, фильтров и гарантий техники.",
      tone: "neutral",
      cta: "Открыть дом",
    },
    {
      id: "pet-seed",
      zone: "pet",
      title: "Подготовить паспорт питомца",
      subtitle: "Чип, прививки, кормление и ветпаспорт будут жить в одной комнате.",
      tone: "neutral",
      cta: "Открыть питомца",
    },
    {
      id: "sense-seed",
      zone: "devices",
      title: "Motrix Sense",
      subtitle: "OBD, StarLine, датчики, счётчики и Pet Gate станут нервной системой дома.",
      tone: "warn",
      cta: "Устройства",
    },
  ];

  const activeTasks = [...garageTasks, ...seedTasks].slice(0, 7);
  const docsScore = docsCount > 0 ? 75 : 45;
  const estateScore = hasGarage
    ? Math.round((garageScore * 0.52) + (docsScore * 0.22) + (48 * 0.16) + (44 * 0.10))
    : 42;

  const todaySummary = garageTasks.length
    ? `${garageTasks.length} ${garageTasks.length === 1 ? "сигнал" : "сигнала"} от гаража и ${seedTasks.length} комнаты готовы к настройке`
    : "Дом имущества собран. Подключите комнаты и датчики, чтобы он стал живым.";

  return {
    estateName: "Мой дом",
    concept: "AI-дом имущества",
    estateScore,
    estateTone: zoneTone(estateScore),
    todaySummary,
    zones,
    tasks: activeTasks,
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
    senseCatalog: SENSE_CATALOG,
    roadmap: [
      "Гараж: текущий Motrix становится первой живой комнатой",
      "Дом: счётчики, фильтры, протечки, техника и гарантии",
      "Питомец: чип, ветпаспорт, прививки, корм и Pet Station",
      "Устройства: OBD, StarLine, умный дом, счётчики и ASU TP",
    ],
  };
}
