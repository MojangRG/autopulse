import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      required: ["vin", "brand", "model", "generation", "year", "engine", "transmission", "drive", "market"],
    },
    serviceItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          intervalKm: { type: ["number", "null"] },
          intervalMonths: { type: ["number", "null"] },
          warningBeforeKm: { type: "number" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          notes: { type: "string" },
        },
        required: ["id", "name", "category", "intervalKm", "intervalMonths", "warningBeforeKm", "severity", "confidence", "notes"],
      },
    },
    commonIssues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          riskMileageFrom: { type: ["number", "null"] },
          riskMileageTo: { type: ["number", "null"] },
          risk: { type: "string", enum: ["low", "medium", "high"] },
          symptoms: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["id", "name", "riskMileageFrom", "riskMileageTo", "risk", "symptoms", "recommendation", "confidence"],
      },
    },
    recommendations: {
      type: "array",
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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Ты автомобильный сервисный инженер. Верни только структурированный сервисный профиль автомобиля. Не выдумывай точные факты, если не уверен. Для сомнительных пунктов ставь confidence low или medium.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create AI service profile for this vehicle",
            vehicle,
            currentMileage: Number(mileage || 0),
            region: "RU",
            language: "ru",
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
