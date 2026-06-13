// Service history normalizer.
// Maps any log entry (normalizedId + title + note) to internal service event IDs.

const ID_MAP = {
  engine_service:   ["engine_oil", "oil_filter", "cabin_filter"],
  engine_oil:       ["engine_oil"],
  oil_filter:       ["oil_filter"],
  cabin_filter:     ["cabin_filter"],
  air_filter:       ["air_filter"],
  spark_plugs:      ["spark_plugs"],
  cvt_fluid:        ["cvt_fluid"],
  diff_fluid:       ["diff_fluid"],
  brake_fluid:      ["brake_fluid"],
  front_pads:       ["front_pads"],
  front_discs:      ["front_discs", "front_pads"],
  rear_pads:        ["rear_pads"],
  rear_discs:       ["rear_discs", "rear_pads"],
  fuel_cleaning:    ["fuel_cleaning"],
  suspension_check: ["suspension_check"],
};

const TEXT_PATTERNS = [
  { re: /масл.*двигател|моторн.*масл|замена масла(?!.*cvt|.*вариатор|.*редуктор)/i, ids: ["engine_oil"] },
  { re: /масл.*фильтр|масляный фильтр/i,              ids: ["oil_filter"] },
  { re: /салонн.*фильтр|кабин.*фильтр/i,              ids: ["cabin_filter"] },
  { re: /воздуш.*фильтр/i,                             ids: ["air_filter"] },
  { re: /свеч/i,                                       ids: ["spark_plugs"] },
  { re: /cvt|вариатор.*масл|масл.*вариатор/i,         ids: ["cvt_fluid"] },
  { re: /редуктор/i,                                   ids: ["diff_fluid"] },
  { re: /тормозн.*жидкост|brake fluid/i,               ids: ["brake_fluid"] },
  { re: /передн.*колодк|колодк.*передн/i,              ids: ["front_pads"] },
  { re: /передн.*диск|диск.*передн/i,                  ids: ["front_discs", "front_pads"] },
  { re: /задн.*колодк|колодк.*задн/i,                  ids: ["rear_pads"] },
  { re: /задн.*диск|диск.*задн/i,                      ids: ["rear_discs", "rear_pads"] },
  { re: /тормозн.*диск(?!.*жидкост)/i,                 ids: ["front_discs", "rear_discs"] },
  { re: /тормозн.*колодк/i,                            ids: ["front_pads", "rear_pads"] },
  { re: /топлив|инжектор|форсунк/i,                    ids: ["fuel_cleaning"] },
  { re: /подвеск|ходов.*часть/i,                       ids: ["suspension_check"] },
  { re: /\bто\b|планов.*то|техническое обслуж|full service/i, ids: ["engine_oil", "oil_filter"] },
];

function matchText(text, events) {
  for (const { re, ids } of TEXT_PATTERNS) {
    if (re.test(text)) ids.forEach((e) => events.add(e));
  }
}

export function normalizeLogToEvents(log) {
  const events = new Set();

  // 1. Direct ID map
  const fromId = ID_MAP[log.normalizedId];
  if (fromId) fromId.forEach((e) => events.add(e));

  // 2. Title pattern match
  const title = String(log.title || "");
  matchText(title, events);

  // 3. Note-based compound expansion
  // Parse notes like "Масло, масляный фильтр, салонный фильтр, тормозная жидкость"
  const note = String(log.note || "");
  if (note) matchText(note, events);

  return Array.from(events);
}

export function logMatchesRule(log, ruleId) {
  if (log.normalizedId === ruleId) return true;
  return normalizeLogToEvents(log).includes(ruleId);
}
