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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { vehicle, profile, data, question } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты AI-механик AutoPulse. Отвечай по-русски, кратко, практично и с опорой на данные конкретного автомобиля. Не выдумывай факты. Если данных не хватает, скажи что нужно проверить.",
        },
        {
          role: "user",
          content: JSON.stringify({
            vehicle,
            profile,
            currentMileage: data?.mileage,
            serviceLogs: data?.logs,
            question,
          }),
        },
      ],
    });

    return res.status(200).json({
      answer: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to ask AI mechanic",
      details: error?.message || String(error),
    });
  }
}

