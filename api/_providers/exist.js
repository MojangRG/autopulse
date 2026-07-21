export const EXIST_CAPABILITIES = Object.freeze({
  authentication: "/Login/SignIn",
  catalogs: "/Price/Catalogs",
  price: "/Price/",
  analogs: "/Price/Analogs",
  basket: "/Basket",
  basketAdd: "/Basket/Add",
  basketAddBatch: "/Basket/AddBatch",
  orderCreate: "/Order/Create",
  deliveryAvailable: "/Delivery/Available",
});

function getConfig() {
  return {
    baseUrl: String(process.env.EXIST_API_BASE_URL || "https://api.exist.ru/Opt").replace(/\/+$/, ""),
    token: String(process.env.EXIST_API_TOKEN || "").trim(),
    tokenHeader: String(process.env.EXIST_API_TOKEN_HEADER || "Authorization").trim(),
    tokenPrefix: String(process.env.EXIST_API_TOKEN_PREFIX || "Bearer").trim(),
    officeId: String(process.env.EXIST_OFFICE_ID || "").trim(),
  };
}

export function getExistProviderStatus() {
  const config = getConfig();
  return {
    configured: Boolean(config.token),
    baseUrl: config.baseUrl,
    officeIdConfigured: Boolean(config.officeId),
    capabilities: EXIST_CAPABILITIES,
    transportReady: false,
    reason: "Нужно подтвердить точные схемы запросов Price/Catalogs, Price и Price/Analogs по договору Exist Opt.",
  };
}

export async function existRequest(path, {
  method = "POST",
  body,
  headers = {},
} = {}) {
  const config = getConfig();

  if (!config.token) {
    const error = new Error("EXIST_API_TOKEN is missing");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const authValue = config.tokenPrefix
    ? `${config.tokenPrefix} ${config.token}`.trim()
    : config.token;

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
      [config.tokenHeader]: authValue,
      ...headers,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
      payload?.error ||
      `Exist API failed: HTTP ${response.status}`
    );
    error.code = "PROVIDER_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }

  return payload;
}

/*
  Важно:
  Здесь намеренно нет выдуманного searchParts().

  Документация подтверждает наличие Price/Catalogs, Price и Price/Analogs,
  но точная структура body и авторизации должна быть взята из полного
  пакета документации/договора Exist Opt. После получения схемы добавляем:

  searchOriginalCatalog(vehicle, operation)
  searchByArticle(article, brand)
  searchAnalogs(article, brand)
  getPriceOffers(article, brand, officeId)
  addToBasket(items)
*/
