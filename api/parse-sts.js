import fs from "fs";
import formidable from "formidable";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.aitunnel.ru/v1",
  });
}

function parseForm(req) {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function fileToDataUrl(file) {
  const buffer = fs.readFileSync(file.filepath);
  const mime = file.mimetype || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
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
    brand: "",
    model: "",
    generation: "",
    year: null,
    engine: "",
    transmission: "",
    drive: "",
    market: "unknown",
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { fields, files } = await parseForm(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!String(uploadedFile.mimetype || "").startsWith("image/")) {
      return res.status(400).json({
        error: "Пока поддерживаются только изображения СТС. PDF подключим отдельно.",
      });
    }

    const imageUrl = fileToDataUrl(uploadedFile);
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Ты распознаёшь российское СТС автомобиля. Верни только JSON. Извлеки VIN, марку, модель, год выпуска, категорию, госномер если есть. Не выдумывай отсутствующие поля.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Распознай СТС. Верни JSON строго вида: { vin, brand, model, year, plate, rawText, confidence }. Если поле не найдено, верни пустую строку или null.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const extracted = JSON.parse(response.choices[0].message.content || "{}");
    const vehicle = mockVinProvider(extracted.vin);

    return res.status(200).json({
      extracted,
      vehicle,
      profile: null,
      note:
        "СТС распознано. Если VIN есть в демо-поставщике, автомобиль заполнится. Генерацию профиля по фото СТС подключим после реального поставщика VIN.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to parse STS",
      details: error?.message || String(error),
    });
  }
}
