export const KNOWN_BRANDS = [
  "Audi", "BMW", "Chery", "Chevrolet", "Citroen", "Datsun", "Exeed", "Ford", "Geely", "Genesis",
  "Haval", "Honda", "Hyundai", "Infiniti", "Kia", "Lada", "Lexus", "Mazda", "Mercedes-Benz", "Mitsubishi",
  "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Skoda", "Subaru", "Suzuki", "Toyota", "Volkswagen", "Volvo"
];

export const MODEL_HINTS = {
  Subaru: ["Forester", "Outback", "XV", "Impreza", "Legacy"],
  Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prado", "Highlander"],
  Kia: ["Rio", "Sportage", "Sorento", "Ceed", "K5", "Cerato"],
  Hyundai: ["Solaris", "Creta", "Tucson", "Santa Fe", "Elantra"],
  BMW: ["3 Series", "5 Series", "X1", "X3", "X5", "X6"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLA", "GLC", "GLE"],
  Volkswagen: ["Polo", "Tiguan", "Passat", "Touareg", "Jetta"],
  Skoda: ["Octavia", "Rapid", "Kodiaq", "Karoq", "Superb"],
  Renault: ["Logan", "Duster", "Sandero", "Kaptur", "Arkana"],
  Lada: ["Vesta", "Granta", "Niva", "Largus", "XRAY"],
  Haval: ["Jolion", "F7", "Dargo", "H9"],
  Geely: ["Coolray", "Atlas", "Monjaro", "Tugella"],
  Chery: ["Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo"],
  Exeed: ["LX", "TXL", "VX", "RX"],
};

const SAFE_TEXT = /^[0-9A-Za-zА-Яа-яЁё .,+\-/()]+$/;
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function titleCase(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s-])([a-zа-яё])/gi, (m) => m.toUpperCase());
}

export function sanitizeVehicleForm(form = {}) {
  return {
    ...form,
    vin: String(form.vin || "").trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17),
    brand: titleCase(form.brand).slice(0, 32),
    model: titleCase(form.model).slice(0, 48),
    generation: String(form.generation || "").trim().replace(/\s+/g, " ").slice(0, 24),
    year: String(form.year || "").replace(/[^0-9]/g, "").slice(0, 4),
    engine: String(form.engine || "").trim().replace(/\s+/g, " ").slice(0, 36),
    transmission: String(form.transmission || "").trim().replace(/\s+/g, " ").slice(0, 24),
    drive: String(form.drive || "").trim().replace(/\s+/g, " ").slice(0, 16),
    color: String(form.color || "").trim().replace(/\s+/g, " ").slice(0, 36),
    mileage: String(form.mileage || "").replace(/[^0-9]/g, "").slice(0, 7),
  };
}

export function validateVehicleForm(form = {}) {
  const v = sanitizeVehicleForm(form);
  const errors = [];
  const brandKnown = KNOWN_BRANDS.some((b) => b.toLowerCase() === v.brand.toLowerCase());
  const year = Number(v.year || 0);
  const mileage = Number(v.mileage || 0);

  if (v.vin && !VIN_RE.test(v.vin)) errors.push("VIN должен содержать 17 символов латиницы и цифр.");
  if (!v.brand) errors.push("Укажите марку автомобиля.");
  else if (!SAFE_TEXT.test(v.brand)) errors.push("Марка содержит лишние символы.");
  else if (!brandKnown) errors.push("Марка не найдена в базовом справочнике Motrix. Выберите из списка или добавьте через VIN/СТС.");
  if (!v.model) errors.push("Укажите модель автомобиля.");
  else if (!SAFE_TEXT.test(v.model)) errors.push("Модель содержит лишние символы.");
  if (!year || year < 1980 || year > new Date().getFullYear() + 1) errors.push("Укажите корректный год выпуска.");
  if (!mileage || mileage < 0 || mileage > 1500000) errors.push("Укажите корректный текущий пробег.");

  return { ok: errors.length === 0, errors, vehicleForm: v };
}

export function getModelHints(brand) {
  const key = KNOWN_BRANDS.find((b) => b.toLowerCase() === String(brand || "").trim().toLowerCase());
  return key ? MODEL_HINTS[key] || [] : [];
}
