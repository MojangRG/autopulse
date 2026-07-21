async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.code = payload?.code || "REQUEST_FAILED";
    throw error;
  }
  return payload;
}

export async function getPartsProviderStatus() {
  const response = await fetch("/api/parts-provider-status", {
    headers: { Accept: "application/json" },
  });
  return readJson(response);
}

/*
  Клиентский контракт будущего модуля:

  searchOriginalCatalog({ vehicleId, operationId })
  searchPartOffers({ article, brand, officeId })
  searchPartAnalogs({ article, brand })
  createPartsBasket({ vehicleId, items })

  UI не должен отправлять сырой payload Exist API.
  Все внешние структуры нормализуются на backend.
*/
