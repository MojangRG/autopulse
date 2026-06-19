export const ASSET_ROOMS = [
  {
    id: "garage",
    tab: "garage",
    title: "Гараж",
    kicker: "Motrix Garage",
    icon: "▣",
    gradient: "blue",
    enabled: true,
    description: "Авто, ТО, расходы, документы, OBD и сигнализации.",
    emptyAction: "Добавить автомобиль",
  },
  {
    id: "home",
    tab: "house",
    title: "Дом",
    kicker: "Motrix Home",
    icon: "⌂",
    gradient: "violet",
    enabled: true,
    description: "Счётчики, протечки, техника, фильтры, гарантии и умный дом.",
    emptyAction: "Собрать дом",
  },
  {
    id: "pet",
    tab: "pet",
    title: "Питомец",
    kicker: "Motrix Pet",
    icon: "◌",
    gradient: "amber",
    enabled: true,
    description: "Чип, ветпаспорт, прививки, корм, вес и Pet Gate.",
    emptyAction: "Добавить питомца",
  },
  {
    id: "docs",
    tab: "docs",
    title: "Документы",
    kicker: "Motrix Vault",
    icon: "▤",
    gradient: "slate",
    enabled: true,
    description: "СТС, чеки, договоры, гарантии, страховки и AI-досье.",
    emptyAction: "Загрузить документ",
  },
  {
    id: "devices",
    tab: "sense",
    title: "Устройства",
    kicker: "Motrix Sense",
    icon: "✺",
    gradient: "green",
    enabled: true,
    description: "OBD, StarLine, датчики дома, счётчики, Pet Gate и ASU TP.",
    emptyAction: "Подключить устройство",
  },
];

export function getRoomById(id) {
  return ASSET_ROOMS.find((room) => room.id === id) || ASSET_ROOMS[0];
}

export function getTabForRoom(id) {
  return getRoomById(id).tab || "home";
}
