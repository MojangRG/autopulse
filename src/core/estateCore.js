import { ESTATE_ZONES } from "./assetTypes.js";
import { SENSE_DEVICE_GROUPS, senseGroupsByZone } from "./senseCatalog.js";

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
      route: "garage",
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
      route: "garage",
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
      route: "garage",
    });
  }

  return tasks;
}

function buildRoomCards({ vehicle, vehicleBrain, data, ownerProfile, analysis, docsCount }) {
  const garageScore = Number(vehicleBrain?.healthScore || 0) || 0;
  const next6 = Number(vehicleBrain?.costForecast?.next6Months || 0);
  const hasGarage = Boolean(vehicle?.brand && vehicle?.model);

  const roomState = {
    garage: {
      score: hasGarage ? garageScore : 0,
      tone: hasGarage ? zoneTone(garageScore) : "neutral",
      status: hasGarage ? `${safeVehicleTitle(vehicle)} · ${garageScore}%` : "Добавьте автомобиль",
      subtitle: hasGarage ? (vehicleBrain?.statusSentence || "Авто под контролем") : "AI-паспорт авто, ТО, расходы, OBD и сигнализация",
      primaryMetric: next6 > 0 ? rub(next6) : "ТО и расходы",
      metricLabel: next6 > 0 ? "прогноз 6 мес" : "ожидают данных",
      liveSignals: hasGarage ? ["пробег", "регламент", "расходы"] : ["VIN", "СТС", "анкета"],
    },
    home: {
      score: 58,
      tone: "warn",
      status: "Контур готов",
      subtitle: "Добавьте счётчики, технику, фильтры и датчики протечки",
      primaryMetric: "0",
      metricLabel: "датчиков",
      liveSignals: ["счётчики", "протечки", "гарантии"],
    },
    pet: {
      score: 52,
      tone: "warn",
      status: "Паспорт скоро",
      subtitle: "Чип, ветпаспорт, прививки, корм и Pet Gate",
      primaryMetric: "Pet Gate",
      metricLabel: "идентификация",
      liveSignals: ["чип", "прививки", "корм"],
    },
    docs: {
      score: docsCount > 0 ? Math.min(95, 55 + docsCount * 8) : 35,
      tone: docsCount > 0 ? "good" : "warn",
      status: docsCount > 0 ? `${docsCount} в базе` : "Пусто",
      subtitle: "СТС, чеки, заказ-наряды, гарантии, страховки и AI-досье",
      primaryMetric: `${docsCount}`,
      metricLabel: "записей и документов",
      liveSignals: ["фото", "чеки", "гарантии"],
    },
    devices: {
      score: 50,
      tone: "warn",
      status: "Каталог Sense",
      subtitle: "OBD, StarLine, датчики, счётчики, Pet Gate и ASU TP",
      primaryMetric: `${SENSE_DEVICE_GROUPS.length}`,
      metricLabel: "типов устройств",
      liveSignals: ["BLE", "API", "IoT"],
    },
  };

  return ESTATE_ZONES.map((zone) => ({
    ...zone,
    emoji: zone.icon,
    ...(roomState[zone.id] || {}),
  }));
}

export function buildEstateCoreState({ vehicle, vehicleBrain, reminders, data, ownerProfile, analysis }) {
  const garageScore = Number(vehicleBrain?.healthScore || 0) || 0;
  const garageTasks = getGarageTasks(vehicleBrain, reminders);
  const docsCount = (data?.logs?.length || 0) + (vehicle ? 1 : 0) + (ownerProfile?.completedAt ? 1 : 0) + (analysis ? 1 : 0);
  const hasGarage = Boolean(vehicle?.brand && vehicle?.model);

  const rooms = buildRoomCards({ vehicle, vehicleBrain, data, ownerProfile, analysis, docsCount });
  const setupTasks = [
    {
      id: "setup-home-meter",
      zone: "home",
      title: "Подготовить Дом",
      subtitle: "Счётчики, фильтры, техника и протечки станут следующей комнатой AI-дома.",
      tone: "neutral",
      cta: "Открыть Дом",
      route: "room-home",
    },
    {
      id: "setup-sense",
      zone: "devices",
      title: "Подключить устройства",
      subtitle: "OBD, StarLine, счётчики и Pet Gate будут давать живые сигналы.",
      tone: "neutral",
      cta: "Motrix Sense",
      route: "devices",
    },
  ];

  const activeTasks = [...garageTasks];
  const estateScore = hasGarage
    ? Math.min(98, Math.round((garageScore * 0.55) + ((docsCount > 0 ? 75 : 45) * 0.25) + 12))
    : 42;

  const todaySummary = activeTasks.length
    ? `${activeTasks.length} ${activeTasks.length === 1 ? "задача" : "задачи"} требуют внимания`
    : "Сегодня всё спокойно. Дом имущества под контролем.";

  return {
    estateName: "Мой дом",
    concept: "AI-тамагочи имущества",
    estateScore,
    estateTone: zoneTone(estateScore),
    todaySummary,
    zones: rooms,
    tasks: activeTasks.slice(0, 5),
    setupTasks,
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
    home: {
      systems: [
        { id: "water", title: "Вода", status: "счётчики и протечки", tone: "warn", metric: "0 датчиков" },
        { id: "climate", title: "Климат", status: "фильтры, влажность, кондиционер", tone: "neutral", metric: "сезон" },
        { id: "power", title: "Электрика", status: "нагрузка и умные розетки", tone: "neutral", metric: "энергия" },
        { id: "warranty", title: "Гарантии", status: "техника, ремонт, договоры", tone: docsCount > 0 ? "good" : "warn", metric: "Vault" },
      ],
      senseGroups: senseGroupsByZone("home"),
    },
    pet: {
      profileStatus: "готовим паспорт питомца",
      senseGroups: senseGroupsByZone("pet"),
      cards: [
        { id: "chip", title: "Чип", status: "ID питомца", detail: "LF RFID 134,2 кГц через Pet Gate/считыватель" },
        { id: "vet", title: "Ветпаспорт", status: "прививки и визиты", detail: "фото паспорта → события ухода" },
        { id: "food", title: "Корм", status: "режим и вес", detail: "кормушка/весы фиксируют повседневный уход" },
      ],
    },
    devices: {
      groups: SENSE_DEVICE_GROUPS,
      readyCount: SENSE_DEVICE_GROUPS.filter((g) => g.status === "MVP-ready").length,
    },
    roadmap: [
      "Гараж: текущий Motrix остаётся первой живой комнатой",
      "Дом: счётчики, фильтры, протечки, техника и гарантии",
      "Питомец: чип, ветпаспорт, прививки, корм и Pet Gate",
      "Устройства: OBD, StarLine, умный дом, счётчики и ASU TP",
    ],
  };
}
