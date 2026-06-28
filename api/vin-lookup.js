const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

function mapProviderResponse(payload, vin) {
  const source = payload?.vehicle || payload?.data || payload?.result || payload || {};
  return {
    vin,
    brand: source.brand || source.make || source.mark || "",
    model: source.model || "",
    year: Number(source.year || source.modelYear || 0) || "",
    engine: source.engine || source.engineCode || source.motor || "",
    transmission: source.transmission || source.gearbox || "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const vin = String(req.body?.vin || "").trim().toUpperCase();
  if (!VIN_PATTERN.test(vin)) return res.status(400).json({ error: "Некорректный VIN" });
  if (!process.env.VIN_API_URL) {
    return res.status(503).json({ code: "VIN_PROVIDER_NOT_CONFIGURED", error: "VIN-провайдер пока не подключён" });
  }
  try {
    const method = String(process.env.VIN_API_METHOD || "GET").toUpperCase();
    const endpoint = process.env.VIN_API_URL.includes("{vin}")
      ? process.env.VIN_API_URL.replace("{vin}", encodeURIComponent(vin))
      : `${process.env.VIN_API_URL}${process.env.VIN_API_URL.includes("?") ? "&" : "?"}vin=${encodeURIComponent(vin)}`;
    const headers = { Accept: "application/json" };
    if (process.env.VIN_API_TOKEN) headers.Authorization = `Bearer ${process.env.VIN_API_TOKEN}`;
    if (process.env.VIN_API_KEY_HEADER && process.env.VIN_API_TOKEN) headers[process.env.VIN_API_KEY_HEADER] = process.env.VIN_API_TOKEN;
    const response = await fetch(endpoint, { method, headers, ...(method === "POST" ? { headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ vin }) } : {}) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ error: "VIN-провайдер не вернул данные" });
    const vehicle = mapProviderResponse(payload, vin);
    if (!vehicle.brand || !vehicle.model) return res.status(422).json({ error: "В ответе VIN-провайдера не найдены марка и модель" });
    return res.status(200).json({ vehicle });
  } catch (error) {
    console.error("vin-lookup", error);
    return res.status(502).json({ error: "VIN-провайдер временно недоступен" });
  }
}
