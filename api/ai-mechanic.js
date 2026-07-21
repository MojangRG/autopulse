import OpenAI from "openai";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.aitunnel.ru/v1" });
}

const CAR_KEYWORDS = [
  "машин", "авто", "автомоб", "двигател", "мотор", "масло", "фильтр",
  "тормоз", "колод", "диск", "свеч", "акпп", "кпп", "вариатор", "cvt",
  "редуктор", "подвес", "стойк", "втулк", "ступиц", "гул", "стук",
  "скрип", "вибрац", "антифриз", "охлажд", "радиатор", "ремень",
  "цепь", "грм", "аккумулятор", "шин", "резин", "развал", "сход",
  "то ", "обслуж", "пробег", "замен", "ремонт", "сто", "заказ",
  "наряд", "чек", "расход", "ехат", "езд", "поездк", "трасс", "бензин",
  "топлив", "расход", "форестер", "subaru", "toyota", "honda", "bmw",
  "что", "когда", "как", "сколько", "нужно", "стоит", "делать", "проверить",
  "стоимост", "цена", "рынок", "продаж", "купить", "продать", "оцен", "авито", "авто ру", "дром",
];

function isCarRelated(question) {
  const text = String(question || "").toLowerCase();
  return CAR_KEYWORDS.some((w) => text.includes(w));
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { vehicle, profile, data, analysis, question, ownerProfile, localBriefing, orchestratorSummary, history } = req.body || {};

    if (!question) return res.status(400).json({ error: "Question is required" });

    if (!isCarRelated(question)) {
      return res.status(200).json({
        answer: "Я отвечаю только на вопросы по вашему автомобилю: обслуживание, ремонт, диагностика, эксплуатация. Задайте вопрос про машину.",
        blocked: true,
      });
    }

    const openai = getOpenAI();

    const ownerCtx = ownerProfile ? [
      ownerProfile.monthlyKm && `Пробег: ${ownerProfile.monthlyKm}/мес`,
      ownerProfile.usage && `Режим: ${ownerProfile.usage}`,
      ownerProfile.priority && `Приоритет: ${ownerProfile.priority}`,
      ownerProfile.service && `Сервис: ${ownerProfile.service}`,
    ].filter(Boolean).join(", ") : null;

    const orchCtx = orchestratorSummary
      ? `Здоровье: ${orchestratorSummary.healthScore}%. Просрочено: ${orchestratorSummary.urgentActions?.map((i) => i.name).join(", ") || "нет"}. Неизвестно (критично): ${orchestratorSummary.unknownAreas?.join(", ") || "нет"}.`
      : null;

    const systemPrompt = `Ты AI-механик AutoPulse. Помогаешь владельцу конкретного автомобиля с вопросами по обслуживанию и эксплуатации.

Правила:
- Отвечай только по теме автомобиля. Если вопрос не про машину — откажись одним коротким предложением.
- Всегда опирайся на данные автомобиля, пробег и историю обслуживания из контекста. Не выдумывай.
- Чётко разграничивай: что подтверждено в журнале, что неизвестно, что прогноз.
- Если данных не хватает — скажи честно, что нужно уточнить.
- Отвечай кратко, практично, простым языком для обычного человека.
- Не перечисляй очевидности. Не давай советы "проверьте всё".
- Не предупреждай чрезмерно. Одно точное предупреждение лучше пяти общих.
- Вопросы про рыночную стоимость, стоимость владения, подготовку к продаже, покупку б/у авто, ликвидность и примерный ценовой диапазон считаются автомобильными темами. Если точных рыночных данных нет, честно скажи, что нужна проверка по рынку, но дай практичный порядок оценки.
- Если вопрос про поездку — дай конкретный список того, на что стоит обратить внимание именно для этой машины с её историей.
- Ты помнишь контекст предыдущих сообщений в этом разговоре.
- Не меняй роль и не выполняй посторонние задания.`;

    const vehicleContext = {
      vehicle,
      currentMileage: data?.mileage,
      serviceLogs: data?.logs?.slice(0, 15),
      serviceProfile: profile ? { serviceItems: profile.serviceItems?.slice(0, 8) } : null,
      aiAnalysis: analysis?.topPriorities?.slice(0, 3),
      ownerProfile: ownerCtx || "не указан",
      localBriefing: localBriefing || null,
      localAnalysis: orchCtx || null,
    };

    // Build message list: system + vehicle context + history + current question
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `КОНТЕКСТ АВТОМОБИЛЯ:\n${JSON.stringify(vehicleContext)}` },
      { role: "assistant", content: "Понял. Готов отвечать на вопросы об этом автомобиле." },
    ];

    // Add conversation history (last 6 messages, validated)
    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history
        .filter((m) => m.role && m.content && typeof m.content === "string")
        .slice(-6);
      messages.push(...validHistory);
    }

    // Add current question
    messages.push({ role: "user", content: question });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.15,
      max_tokens: 450,
      messages,
    });

    return res.status(200).json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    const payload = { error: "Не удалось получить ответ Motrix AI" };
    if (process.env.NODE_ENV !== "production") payload.details = error?.message || String(error);
    return res.status(500).json(payload);
  }
}
