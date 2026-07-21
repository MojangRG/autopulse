import { searchYandexOrganizations } from "./_providers/yandexOrganizations.js";

function sendError(res, error) {
  if (error?.code === "PROVIDER_NOT_CONFIGURED") {
    return res.status(503).json({
      error: "Поиск сервисов пока не настроен",
      code: error.code,
    });
  }

  return res.status(error?.status || 500).json({
    error: "Не удалось найти автосервисы",
    code: error?.code || "SERVICE_SEARCH_FAILED",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      query,
      vehicle,
      location,
      coordinates,
      results,
    } = req.body || {};

    const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");
    const text = String(
      query ||
      ["автосервис", vehicleName, location].filter(Boolean).join(" ")
    ).trim();

    if (!text) {
      return res.status(400).json({ error: "Поисковый запрос обязателен" });
    }

    const result = await searchYandexOrganizations({
      text,
      longitude: coordinates?.longitude,
      latitude: coordinates?.latitude,
      spanLongitude: coordinates?.spanLongitude,
      spanLatitude: coordinates?.spanLatitude,
      results,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("service-search", error);
    return sendError(res, error);
  }
}
