import OpenAI from "openai";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.aitunnel.ru/v1" });
}

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topPriorities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title:    { type: "string" },
          reason:   { type: "string" },
          action:   { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          category: { type: "string" },
          dataStatus: { type: "string", enum: ["confirmed", "no-data", "predicted", "overdue"] },
        },
        required: ["title", "reason", "action", "severity", "category", "dataStatus"],
      },
    },
  },
  required: ["topPriorities"],
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { vehicle, profile, data, ownerProfile } = req.body || {};
    if (!vehicle || !data) return res.status(400).json({ error: "Vehicle and data are required" });

    const openai = getOpenAI();

    const usageContext = ownerProfile ? [
      ownerProfile.monthlyKm && `Пробег в месяц: ${ownerProfile.monthlyKm}`,
      ownerProfile.usage && `Режим использования: ${ownerProfile.usage}`,
      ownerProfile.priority && `Приоритет владельца: ${ownerProfile.priority}`,
      ownerProfile.service && `Обслуживание: ${ownerProfile.service}`,
    ].filter(Boolean).join(". ") : null;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `Ты AI-аналитик AutoPulse. Выбери ровно 3 самых важных действия для конкретного автомобиля.

Правила:
- Опирайся только на реальные данные из запроса. Не выдумывай факты.
- Если работа недавно выполнена (есть в журнале), НЕ ставь её в приоритет.
- Если данных нет — укажи dataStatus: "no-data" и объясни.
- Если работа просрочена по пробегу — dataStatus: "overdue".
- Если запись подтверждена в журнале — dataStatus: "confirmed".
- Если это прогноз — dataStatus: "predicted".
- Не давай общих советов вроде "проходите ТО" или "следите за маслом" без конкретного обоснования из данных автомобиля.
- Если у владельца приоритет "Максимальная надёжность", смещай рекомендации к превентивным мерам.
- Если режим "Такси / работа" — учитывай повышенные нагрузки.
- Ответ строго в JSON по схеме.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            vehicle,
            currentMileage: data.mileage,
            serviceLogs: data.logs,
            serviceProfile: profile,
            ownerUsage: usageContext || "не указан",
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "vehicle_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    });

    const analysis = JSON.parse(response.output_text);
    return res.status(200).json({ analysis });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to analyze vehicle", details: error?.message || String(error) });
  }
}
