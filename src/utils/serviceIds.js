// Canonical service IDs shared by client-side logic and API handlers.
// This file is the contract between AI-generated profiles, scanned documents,
// manual journal entries, reminders, passport, and the orchestrator.

export const SERVICE_IDS = Object.freeze({
  ENGINE_SERVICE: "engine_service",
  ENGINE_OIL: "engine_oil",
  OIL_FILTER: "oil_filter",
  CABIN_FILTER: "cabin_filter",
  AIR_FILTER: "air_filter",
  SPARK_PLUGS: "spark_plugs",
  CVT_FLUID: "cvt_fluid",
  DIFF_FLUID: "diff_fluid",
  BRAKE_FLUID: "brake_fluid",
  FRONT_PADS: "front_pads",
  FRONT_DISCS: "front_discs",
  REAR_PADS: "rear_pads",
  REAR_DISCS: "rear_discs",
  FUEL_CLEANING: "fuel_cleaning",
  SUSPENSION_CHECK: "suspension_check",
  OTHER: "other",
});

export const CANONICAL_SERVICE_IDS = Object.freeze(Object.values(SERVICE_IDS));

export const SERVICE_ID_ALIASES = Object.freeze({
  oil: SERVICE_IDS.ENGINE_OIL,
  oil_change: SERVICE_IDS.ENGINE_OIL,
  engine_oil_change: SERVICE_IDS.ENGINE_OIL,
  motor_oil: SERVICE_IDS.ENGINE_OIL,
  motor_oil_change: SERVICE_IDS.ENGINE_OIL,
  engine_filter: SERVICE_IDS.OIL_FILTER,
  engine_oil_filter: SERVICE_IDS.OIL_FILTER,
  oil_filter_change: SERVICE_IDS.OIL_FILTER,
  cabin_air_filter: SERVICE_IDS.CABIN_FILTER,
  cabin_filter_change: SERVICE_IDS.CABIN_FILTER,
  ac_filter: SERVICE_IDS.CABIN_FILTER,
  air_filter_change: SERVICE_IDS.AIR_FILTER,
  engine_air_filter: SERVICE_IDS.AIR_FILTER,
  spark_plugs_change: SERVICE_IDS.SPARK_PLUGS,
  transmission_oil: SERVICE_IDS.CVT_FLUID,
  transmission_fluid: SERVICE_IDS.CVT_FLUID,
  gearbox_oil: SERVICE_IDS.CVT_FLUID,
  cvt_oil: SERVICE_IDS.CVT_FLUID,
  cvt_oil_change: SERVICE_IDS.CVT_FLUID,
  differential_oil: SERVICE_IDS.DIFF_FLUID,
  differential_fluid: SERVICE_IDS.DIFF_FLUID,
  brake_liquid: SERVICE_IDS.BRAKE_FLUID,
  brake_fluid_change: SERVICE_IDS.BRAKE_FLUID,
  brakes_fluid: SERVICE_IDS.BRAKE_FLUID,
  front_brake_pads: SERVICE_IDS.FRONT_PADS,
  front_brake_pads_change: SERVICE_IDS.FRONT_PADS,
  front_brake_discs: SERVICE_IDS.FRONT_DISCS,
  front_brake_rotors: SERVICE_IDS.FRONT_DISCS,
  rear_brake_pads: SERVICE_IDS.REAR_PADS,
  rear_brake_pads_change: SERVICE_IDS.REAR_PADS,
  rear_brake_discs: SERVICE_IDS.REAR_DISCS,
  rear_brake_rotors: SERVICE_IDS.REAR_DISCS,
  fuel_system_cleaning: SERVICE_IDS.FUEL_CLEANING,
  injector_cleaning: SERVICE_IDS.FUEL_CLEANING,
  suspension_diagnosis: SERVICE_IDS.SUSPENSION_CHECK,
  suspension_inspection: SERVICE_IDS.SUSPENSION_CHECK,
});

export function canonicalServiceId(id) {
  const raw = String(id || "").trim().toLowerCase();
  if (!raw) return "";
  if (CANONICAL_SERVICE_IDS.includes(raw)) return raw;
  return SERVICE_ID_ALIASES[raw] || raw;
}

export function isKnownServiceId(id) {
  return CANONICAL_SERVICE_IDS.includes(canonicalServiceId(id));
}
