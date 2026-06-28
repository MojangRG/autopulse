export class VinProviderUnavailableError extends Error {}

export async function lookupVin(vin) {
  const response = await fetch("/api/vin-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vin }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 503 && body.code === "VIN_PROVIDER_NOT_CONFIGURED") {
    throw new VinProviderUnavailableError("VIN-поиск подключается. Заполните автомобиль вручную.");
  }
  if (!response.ok) throw new Error(body.error || "Не удалось проверить VIN");
  return body.vehicle;
}
