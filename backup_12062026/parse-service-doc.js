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

function getFieldValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function fileToDataUrl(file) {
  const buffer = fs.readFileSync(file.filepath);
  const mime = file.mimetype || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
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
        error: "Пока поддерживаются только изображения заказ-нарядов/чеков. PDF подключим отдельно.",
      });
    }

    const vehicle = JSON.parse(getFieldValue(fields.vehicle) || "{}");
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
          content:
            "Ты извлекаешь данные из заказ-наряда, чека или акта выполненных работ СТО. Верни только JSON. Не выдумывай работы, пробег и стоимость. Если поле не видно, ставь null.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                task:
                  "Извлеки выполненные работы из документа СТО. Верни JSON строго вида { logs: [{ title, mileage, cost, note, date }] }. title должен быть коротким названием работы. Если пробег не найден, используй текущий пробег.",
                vehicle,
                currentMileage: mileage,
              }),
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");

    const logs = Array.isArray(parsed.logs)
      ? parsed.logs.map((log) => ({
          title: log.title || "Работа из документа",
          mileage: Number(log.mileage || mileage || 0),
          cost: Number(log.cost || 0),
          note: log.note || "Добавлено из документа СТО",
          date: log.date || null,
        }))
      : [];

    return res.status(200).json({ logs });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to parse service document",
      details: error?.message || String(error),
    });
  }
}
