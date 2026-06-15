import OpenAI from "openai";
import { CANONICAL_SERVICE_IDS } from "../src/utils/serviceIds.js";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.aitunnel.ru/v1",
  });
}

function mockVinProvider(vin) {
  const normalizedVin = String(vin || "").trim().toUpperCase();

  if (normalizedVin === "JF1SK7AC2MG117103") {
    return {
      vin: normalizedVin,
      brand: "Subaru",
      model: "Forester",
      generation: "SK",
      year: 2020,
      engine: "FB20",
      transmission: "CVT",
      drive: "AWD",
      market: "RU",
    };
  }

  return {
    vin: normalizedVin,
    brand: "Unknown",
    model: "Unknown",
    generation: "",
    year: null,
    engine: "",
    transmission: "",
    drive: "",
    market: "unknown",
  };
}

const serviceProfileSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vehicle: {
      type: "object",
      additionalProperties: false,
      properties: {
        vin: { type: "string" },
        brand: { type: "string" },
        model: { type: "string" },
        generation: { type: "string" },
        year: { type: ["number", "null"] },
        engine: { type: "string" },
        transmission: { type: "string" },
        drive: { type: "string" },
        market: { type: "string" },
      },
      required: [
        "vin",
        "brand",
        "model",
        "generation",
        "year",
        "engine",
        "transmission",
        "drive",
        "market",
      ],
    },
    serviceItems: {
      type: "array",
      minItems: 6,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", enum: CANONICAL_SERVICE_IDS },
          name: { type: "string" },
          category: { type: "string" },
          intervalKm: { type: ["number", "null"] },
          intervalMonths: { type: ["number", "null"] },
          warningBeforeKm: { type: "number" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          notes: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
        },
        required: [
          "id",
          "name",
          "category",
          "intervalKm",
          "intervalMonths",
          "warningBeforeKm",
          "severity",
          "confidence",
          "notes",
          "aliases",
        ],
      },
    },
    commonIssues: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", enum: CANONICAL_SERVICE_IDS },
          name: { type: "string" },
          riskMileageFrom: { type: ["number", "null"] },
          riskMileageTo: { type: ["number", "null"] },
          risk: { type: "string", enum: ["low", "medium", "high"] },
          symptoms: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: [
          "id",
          "name",
          "riskMileageFrom",
          "riskMileageTo",
          "risk",
          "symptoms",
          "recommendation",
          "confidence",
        ],
      },
    },
    recommendations: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    disclaimer: { type: "string" },
  },
  required: ["vehicle", "serviceItems", "commonIssues", "recommendations", "disclaimer"],
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { vin, mileage } = req.body || {};
    const vehicle = mockVinProvider(vin);

    if (vehicle.brand === "Unknown") {
      return res.status(404).json({
        error: "VIN пока не найден в демо-поставщике",
      });
    }

    const openai = getOpenAI();

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            `Ты автомобильный сервисный инженер AutoPulse. Создай не общие советы, а техническую сервисную карту конкретного автомобиля. Работай строго по автомобилю, двигателю, коробке, приводу, году и пробегу. Запрещено писать универсальные советы вроде 'проходите ТО', 'следите за маслом', 'проверяйте тормоза' без привязки к машине. serviceItems должны быть именно регламентными позициями. В поле id разрешены только canonical service IDs из списка: ${CANONICAL_SERVICE_IDS.join(", ")}. commonIssues должны быть типовыми рисками именно для данной модели/поколения/двигателя/коробки. recommendations — ровно 3 коротких вывода, актуальных на текущем пробеге. Если уверенность низкая, ставь confidence low и объясняй, что нужно подтвердить документами. Не выдумывай точные факты, если не уверен.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create specific AI service profile for this exact vehicle",
            vehicle,
            currentMileage: Number(mileage || 0),
            region: "RU",
            language: "ru",
            allowedServiceItemIds: CANONICAL_SERVICE_IDS,
            outputRules: [
              "serviceItems[].id must be one of allowedServiceItemIds exactly",
              "do not invent custom service item ids",
              "recommendations must contain exactly 3 important points",
              "avoid generic advice",
              "focus on concrete mileage-based maintenance",
              "focus on model-specific risks",
              "mention uncertainty when data is not confirmed",
            ],
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "vehicle_service_profile",
          strict: true,
          schema: serviceProfileSchema,
        },
      },
    });

    const profile = JSON.parse(response.output_text);

    return res.status(200).json({
      vehicle,
      profile,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create vehicle profile",
      details: error?.message || String(error),
    });
  }
}