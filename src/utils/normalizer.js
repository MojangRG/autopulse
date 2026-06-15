// Service history normalizer.
// Maps any log entry (normalizedId + title + note + source text) to canonical service event IDs.

import { SERVICE_IDS, canonicalServiceId, isKnownServiceId } from "./serviceIds.js";

const ID_MAP = {
  [SERVICE_IDS.ENGINE_SERVICE]:   [SERVICE_IDS.ENGINE_OIL, SERVICE_IDS.OIL_FILTER, SERVICE_IDS.CABIN_FILTER],
  [SERVICE_IDS.ENGINE_OIL]:       [SERVICE_IDS.ENGINE_OIL],
  [SERVICE_IDS.OIL_FILTER]:       [SERVICE_IDS.OIL_FILTER],
  [SERVICE_IDS.CABIN_FILTER]:     [SERVICE_IDS.CABIN_FILTER],
  [SERVICE_IDS.AIR_FILTER]:       [SERVICE_IDS.AIR_FILTER],
  [SERVICE_IDS.SPARK_PLUGS]:      [SERVICE_IDS.SPARK_PLUGS],
  [SERVICE_IDS.CVT_FLUID]:        [SERVICE_IDS.CVT_FLUID],
  [SERVICE_IDS.DIFF_FLUID]:       [SERVICE_IDS.DIFF_FLUID],
  [SERVICE_IDS.BRAKE_FLUID]:      [SERVICE_IDS.BRAKE_FLUID],
  [SERVICE_IDS.FRONT_PADS]:       [SERVICE_IDS.FRONT_PADS],
  [SERVICE_IDS.FRONT_DISCS]:      [SERVICE_IDS.FRONT_DISCS, SERVICE_IDS.FRONT_PADS],
  [SERVICE_IDS.REAR_PADS]:        [SERVICE_IDS.REAR_PADS],
  [SERVICE_IDS.REAR_DISCS]:       [SERVICE_IDS.REAR_DISCS, SERVICE_IDS.REAR_PADS],
  [SERVICE_IDS.FUEL_CLEANING]:    [SERVICE_IDS.FUEL_CLEANING],
  [SERVICE_IDS.SUSPENSION_CHECK]: [SERVICE_IDS.SUSPENSION_CHECK],
};

const TEXT_PATTERNS = [
  { re: /масл.*двигател|моторн.*масл|замена масла(?!.*cvt|.*вариатор|.*редуктор)|engine oil|motor oil/i, ids: [SERVICE_IDS.ENGINE_OIL] },
  { re: /масл.*фильтр|масляный фильтр|oil filter/i, ids: [SERVICE_IDS.OIL_FILTER] },
  { re: /салонн.*фильтр|кабин.*фильтр|cabin filter|ac filter/i, ids: [SERVICE_IDS.CABIN_FILTER] },
  { re: /воздуш.*фильтр|air filter/i, ids: [SERVICE_IDS.AIR_FILTER] },
  { re: /свеч|spark plug/i, ids: [SERVICE_IDS.SPARK_PLUGS] },
  { re: /cvt|вариатор.*масл|масл.*вариатор|transmission fluid|transmission oil/i, ids: [SERVICE_IDS.CVT_FLUID] },
  { re: /редуктор|дифференциал|differential/i, ids: [SERVICE_IDS.DIFF_FLUID] },
  { re: /тормозн.*жидкост|brake fluid/i, ids: [SERVICE_IDS.BRAKE_FLUID] },
  { re: /передн.*колодк|колодк.*передн|front.*brake.*pad|front.*pad/i, ids: [SERVICE_IDS.FRONT_PADS] },
  { re: /передн.*диск|диск.*передн|front.*brake.*disc|front.*rotor/i, ids: [SERVICE_IDS.FRONT_DISCS, SERVICE_IDS.FRONT_PADS] },
  { re: /задн.*колодк|колодк.*задн|rear.*brake.*pad|rear.*pad/i, ids: [SERVICE_IDS.REAR_PADS] },
  { re: /задн.*диск|диск.*задн|rear.*brake.*disc|rear.*rotor/i, ids: [SERVICE_IDS.REAR_DISCS, SERVICE_IDS.REAR_PADS] },
  { re: /тормозн.*диск(?!.*жидкост)|brake disc|brake rotor/i, ids: [SERVICE_IDS.FRONT_DISCS, SERVICE_IDS.REAR_DISCS] },
  { re: /тормозн.*колодк|brake pad/i, ids: [SERVICE_IDS.FRONT_PADS, SERVICE_IDS.REAR_PADS] },
  { re: /топлив|инжектор|форсунк|fuel system|injector/i, ids: [SERVICE_IDS.FUEL_CLEANING] },
  { re: /подвеск|ходов.*часть|suspension/i, ids: [SERVICE_IDS.SUSPENSION_CHECK] },
  { re: /\bто\b|планов.*то|техническое обслуж|full service|service maintenance/i, ids: [SERVICE_IDS.ENGINE_OIL, SERVICE_IDS.OIL_FILTER] },
];

function matchText(text, events) {
  for (const { re, ids } of TEXT_PATTERNS) {
    if (re.test(text)) ids.forEach((e) => events.add(e));
  }
}

export function inferEventsFromText(text) {
  const events = new Set();
  matchText(String(text || ""), events);
  return Array.from(events);
}

export function normalizeLogToEvents(log = {}) {
  const events = new Set();

  const normalizedId = canonicalServiceId(log.normalizedId);
  const fromId = ID_MAP[normalizedId];
  if (fromId) fromId.forEach((e) => events.add(e));
  else if (isKnownServiceId(normalizedId)) events.add(normalizedId);

  [log.title, log.note, log.sourceText].forEach((value) => {
    const text = String(value || "");
    if (text) matchText(text, events);
  });

  return Array.from(events);
}

export function normalizeRuleId(rule = {}) {
  const direct = canonicalServiceId(rule.canonicalId || rule.id);
  if (isKnownServiceId(direct)) return direct;

  const inferred = inferEventsFromText(`${rule.name || ""} ${rule.notes || ""}`);
  return inferred[0] || direct || SERVICE_IDS.OTHER;
}

export function logMatchesRule(log, ruleId) {
  const target = canonicalServiceId(ruleId);
  if (canonicalServiceId(log?.normalizedId) === target) return true;
  return normalizeLogToEvents(log).includes(target);
}
