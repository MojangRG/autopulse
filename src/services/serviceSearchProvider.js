async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.code = payload?.code || "REQUEST_FAILED";
    throw error;
  }
  return payload;
}

export async function searchServiceCenters({
  query,
  vehicle,
  location,
  coordinates,
  results = 10,
}) {
  const response = await fetch("/api/service-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      vehicle,
      location,
      coordinates,
      results,
    }),
  });

  return readJson(response);
}

export function buildYandexMapsFallback({ query, vehicle, location }) {
  const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");
  const text = [
    query || "автосервис",
    vehicleName,
    location,
  ].filter(Boolean).join(" ");

  return `https://yandex.ru/maps/?text=${encodeURIComponent(text)}`;
}
