import fs from "fs";
import formidable from "formidable";
import OpenAI from "openai";
import { canonicalServiceId, CANONICAL_SERVICE_IDS, SERVICE_IDS } from "../src/utils/serviceIds.js";

export const config = { api: { bodyParser: false } };

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.aitunnel.ru/v1" });
}

function parseForm(req) {
  const form = formidable({ multiples: false, maxFileSize: 4 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

function getFieldValue(v) { return Array.isArray(v) ? v[0] : v; }
function fileToDataUrl(file) {
  const buffer = fs.readFileSync(file.filepath);
  return `data:${file.mimetype || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { fields, files } = await parseForm(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) return res.status(400).json({ error: "File is required" });
    if (!String(uploadedFile.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ error: "Пока поддерживаются только изображения. PDF подключим отдельно." });
    }

    const vehicle = JSON.parse(getFieldValue(fields.vehicle) || "{}");
    const profile = JSON.parse(getFieldValue(fields.profile) || "{}");
    const mileage = Number(getFieldValue(fields.mileage) || 0);
    const imageUrl = fileToDataUrl(uploadedFile);
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты нормализатор сервисных документов для AutoPulse.

Задача: разобрать документ СТО (заказ-наряд, чек, квитанция) и вернуть нормализованный список выполненных работ. Верни только валидный json без markdown, пояснений и текста вне json.

Правила нормализации:
- «колодки» → «Замена тормозных колодок»
- «диски» → «Замена тормозных дисков»
- «масло» или «масло 0W-20» → определи по контексту: «Замена масла двигателя», «Замена масла CVT», «Замена масла редукторов»
- «фильтр» → «Замена масляного фильтра» (если рядом с маслом) или «Замена воздушного фильтра» / «Замена салонного фильтра»
- «свечи» → «Замена свечей зажигания»
- «антифриз» или «охлаждающая жидкость» → normalizedId: "other", title: «Замена охлаждающей жидкости»
- «ремонт автомобиля» или «работа» без деталей — пропусти, не добавляй как отдельную запись
- «диагностика» без подробностей — пропусти или добавь с низкой уверенностью
- Запчасти без работы (только «прокладка», «болт» и т.п.) — пропусти

Если в документе видно общий пробег автомобиля — верни его в поле documentMileage.
Если видна дата — верни в поле documentDate (формат YYYY-MM-DD).
Если видна общая сумма — не суммируй построчно, верни только итог в totalCost если он явно указан.

Поле confidence для каждой работы: "high" если тип работы однозначен, "medium" если есть сомнение, "low" если работа неясна.
Поле sourceText — оригинальный текст из документа для этой строки (коротко, как в документе).

Не выдумывай пробег и стоимость. Если пробег не виден в документе — используй currentMileage из запроса. Ответ должен быть строго в формате json_object.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                vehicle,
                currentMileage: mileage,
                allowedNormalizedIds: CANONICAL_SERVICE_IDS,
                outputFormat: `json schema: {
  "logs": [
    {
      "normalizedId": string,
      "title": string,
      "mileage": number,
      "cost": number,
      "datePerformed": string|null,
      "note": string,
      "confidence": "high"|"medium"|"low",
      "sourceText": string
    }
  ],
  "documentMileage": number|null,
  "documentDate": string|null
}`,
              }),
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const logs = Array.isArray(parsed.logs)
      ? parsed.logs.map((log) => ({
          normalizedId: CANONICAL_SERVICE_IDS.includes(canonicalServiceId(log.normalizedId)) ? canonicalServiceId(log.normalizedId) : SERVICE_IDS.OTHER,
          title: log.title || "Работа из документа",
          mileage: Number(log.mileage || mileage || 0),
          cost: Number(log.cost || 0),
          note: log.note || "",
          datePerformed: log.datePerformed || null,
          confidence: log.confidence || "medium",
          sourceText: log.sourceText || "",
        }))
      : [];

    return res.status(200).json({
      logs,
      documentMileage: parsed.documentMileage ? Number(parsed.documentMileage) : null,
      documentDate: parsed.documentDate || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to parse service document", details: error?.message || String(error) });
  }
}
