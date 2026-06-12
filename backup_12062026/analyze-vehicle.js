import OpenAI from "openai";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.aitunnel.ru/v1",
  });
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
          title: { type: "string" },
          reason: { type: "string" },
          action: { type: "string" },
          severity: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          category: { type: "string" },
        },
        required: ["title", "reason", "action", "severity", "category"],
      },
    },
  },
  required: ["topPriorities"],
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { vehicle, profile, data } = req.body || {};

    if (!vehicle || !data) {
      return res.status(400).json({ error: "Vehicle and data are required" });
    }

    const openai = getOpenAI();

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Ты AI-аналитик AutoPulse. Твоя задача — выбрать ровно 3 самых важных пункта обслуживания конкретного автомобиля. Не давай общие советы. Не пиши очевидности вроде 'проходите ТО'. Опирайся на автомобиль, пробег, сервисный профиль и журнал обслуживания. Если работа недавно выполнена, не ставь её в приоритет. Если данных не хватает, укажи это как причину. Ответ строго в JSON по схеме.",
        },
        {
          role: "user",
          content: JSON.stringify({
            vehicle,
            profile,
            currentMileage: data.mileage,
            serviceLogs: data.logs,
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

    return res.status(500).json({
      error: "Failed to analyze vehicle",
      details: error?.message || String(error),
    });
  }
}
