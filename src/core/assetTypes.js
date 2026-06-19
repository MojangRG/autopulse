export const ESTATE_ZONES = [
  {
    id: "garage",
    route: "garage",
    title: "Гараж",
    icon: "▣",
    short: "Авто",
    promise: "ТО, расходы, документы, OBD и сигнализация",
    color: "blue",
    enabled: true,
  },
  {
    id: "home",
    route: "room-home",
    title: "Дом",
    icon: "⌂",
    short: "Быт",
    promise: "Счётчики, протечки, техника, фильтры и гарантии",
    color: "green",
    enabled: true,
  },
  {
    id: "pet",
    route: "pet",
    title: "Питомец",
    icon: "◌",
    short: "Уход",
    promise: "Чип, ветпаспорт, прививки, корм и Pet Gate",
    color: "yellow",
    enabled: true,
  },
  {
    id: "docs",
    route: "docs",
    title: "Документы",
    icon: "▤",
    short: "Vault",
    promise: "СТС, чеки, гарантии, страховки, договоры и инструкции",
    color: "violet",
    enabled: true,
  },
  {
    id: "devices",
    route: "devices",
    title: "Устройства",
    icon: "✺",
    short: "Sense",
    promise: "OBD, StarLine, счётчики, датчики, Pet Gate и ASU TP",
    color: "cyan",
    enabled: true,
  },
];

export function getEstateZone(id) {
  return ESTATE_ZONES.find((zone) => zone.id === id);
}
