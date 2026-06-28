const PRODUCTS = {
  single_review: "MOTRIX_CHECKOUT_SINGLE_URL",
  pro_year: "MOTRIX_CHECKOUT_YEAR_URL",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const product = String(req.body?.product || "");
  const envKey = PRODUCTS[product];
  if (!envKey) return res.status(400).json({ error: "Неизвестный тариф" });
  const checkoutUrl = process.env[envKey];
  if (!checkoutUrl) {
    return res.status(503).json({
      code: "BILLING_NOT_CONFIGURED",
      error: "Тариф готов, но приём оплаты ещё не подключён. До подключения эквайринга Motrix работает в бесплатном beta-режиме.",
    });
  }
  try {
    const url = new URL(checkoutUrl);
    if (url.protocol !== "https:") throw new Error("Checkout URL must use HTTPS");
    return res.status(200).json({ checkoutUrl: url.toString(), product });
  } catch {
    return res.status(500).json({ error: "Платёжная ссылка настроена некорректно" });
  }
}
