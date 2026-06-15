import fs from "fs";
import formidable from "formidable";
import OpenAI from "openai";

export const config = { api: { bodyParser: false } };

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.aitunnel.ru/v1" });
}

function parseForm(req) {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

function fileToDataUrl(file) {
  const buffer = fs.readFileSync(file.filepath);
  return `data:${file.mimetype || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

function mockVinProvider(vin) {
  const v = String(vin || "").trim().toUpperCase();
  if (v === "JF1SK7AC2MG117103") {
    return { vin: v, brand: "Subaru", model: "Forester", generation: "SK", year: 2020, engine: "FB20", transmission: "CVT", drive: "AWD", market: "RU", color: "темно-синий металлик" };
  }
  return { vin: v, brand: "", model: "", generation: "", year: null, engine: "", transmission: "", drive: "", market: "unknown", color: "" };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { fields, files } = await parseForm(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) return res.status(400).json({ error: "File is required" });
    if (!String(uploadedFile.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ error: "Пока поддерживаются только изображения СТС." });
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
          content: `Ты система распознавания российского СТС (свидетельство о регистрации транспортного средства).

Извлеки следующие поля:
- vin: VIN-номер (17 символов, только латиница и цифры)
- brand: марка автомобиля (как написано в документе)
- model: модель
- year: год выпуска (число)
- plate: государственный регистрационный номер
- category: категория ТС (A, B, C и т.д.)
- color: цвет автомобиля из СТС
- confidence: общая уверенность в распознавании ("high"/"medium"/"low")

Правила:
- Не выдумывай поля. Если поле не читается — верни null или пустую строку.
- VIN должен быть ровно 17 символов. Если короче или нечитаем — верни как есть с confidence: "low".
- Не интерпретируй текст как что-то другое — распознай буквально.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Распознай СТС. Верни JSON: { vin, brand, model, year, plate, category, color, confidence }. Пустые поля — null или пустая строка.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const extracted = JSON.parse(response.choices[0].message.content || "{}");
    const vehicle = {
      ...mockVinProvider(extracted.vin),
      color: extracted.color || mockVinProvider(extracted.vin).color || "",
    };

    return res.status(200).json({ extracted, vehicle, profile: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to parse STS", details: error?.message || String(error) });
  }
}
