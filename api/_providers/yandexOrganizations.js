const DEFAULT_BASE_URL = "https://search-maps.yandex.ru/v1/";

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`${name} is missing`);
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  return value;
}

function normalizePhone(phone) {
  if (!phone) return null;
  if (typeof phone === "string") return phone;
  return phone.formatted || phone.value || phone.number || null;
}

function normalizeHours(hours) {
  if (!hours) return null;
  if (typeof hours === "string") return hours;
  return hours.text || hours.short_text || null;
}

function normalizeFeature(feature) {
  const properties = feature?.properties || {};
  const company = properties.CompanyMetaData || {};
  const geometry = feature?.geometry || {};
  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];

  const name = company.name || properties.name || "Автосервис";
  const address = company.address || properties.description || "";
  const phones = Array.isArray(company.Phones)
    ? company.Phones.map(normalizePhone).filter(Boolean)
    : [];

  const query = [name, address].filter(Boolean).join(", ");
  const mapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;

  return {
    provider: "yandex",
    providerId: company.id || feature?.id || null,
    name,
    address,
    coordinates: coordinates.length >= 2
      ? { longitude: Number(coordinates[0]), latitude: Number(coordinates[1]) }
      : null,
    phones,
    url: company.url || null,
    hours: normalizeHours(company.Hours),
    categories: Array.isArray(company.Categories)
      ? company.Categories.map((item) => item?.name).filter(Boolean)
      : [],
    mapsUrl,
    rawUri: properties.uri || null,
  };
}

export async function searchYandexOrganizations({
  text,
  longitude,
  latitude,
  spanLongitude,
  spanLatitude,
  results = 10,
}) {
  const apikey = requiredEnv("YANDEX_MAPS_API_KEY");
  const baseUrl = String(process.env.YANDEX_MAPS_SEARCH_URL || DEFAULT_BASE_URL).trim();

  const params = new URLSearchParams({
    apikey,
    text: String(text || "").trim(),
    type: "biz",
    lang: "ru_RU",
    results: String(Math.max(1, Math.min(20, Number(results || 10)))),
  });

  if (Number.isFinite(Number(longitude)) && Number.isFinite(Number(latitude))) {
    params.set("ll", `${Number(longitude)},${Number(latitude)}`);
  }

  if (Number.isFinite(Number(spanLongitude)) && Number.isFinite(Number(spanLatitude))) {
    params.set("spn", `${Number(spanLongitude)},${Number(spanLatitude)}`);
    params.set("rspn", "1");
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
      payload?.error?.message ||
      `Yandex organization search failed: HTTP ${response.status}`
    );
    error.code = "PROVIDER_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }

  const features = Array.isArray(payload?.features) ? payload.features : [];

  return {
    provider: "yandex",
    query: String(text || "").trim(),
    items: features.map(normalizeFeature),
  };
}
