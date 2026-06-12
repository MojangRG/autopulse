import fs from "fs";
import formidable from "formidable";
import OpenAI from "openai";

export const config = { api: { bodyParser: false } };

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.aitunnel.ru/v1" });
}

function parseForm(req) {
  const form = formidable({ multiples: false, maxFileSize: 4 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });
}

function getFieldValue(value) { return Array.isArray(value) ? value[0] : value; }
function fileToDataUrl(file) {
  const buffer = fs.readFileSync(file.filepath);
  const mime = file.mimetype || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { fields, files } = await parseForm(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) return res.status(400).json({ error: "File is required" });
    if (!String(uploadedFile.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ error: "Пока поддерживаются только изображения заказ-нарядов/чеков. PDF подключим отдельно." });
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
        { role: "system", content: "Ты нормализатор заказ-нарядов СТО для AutoPulse. Нужно не переписать текст документа, а понять смысл выполненных работ и привести их к нормальным сервисным событиям. Если написано 'колодки', верни 'Замена тормозных колодок'. Если 'диски', верни 'Замена тормозных дисков'. Если 'масло', определи по контексту: двигатель, CVT, редуктор. Если написано 'ремонт автомобиля' без деталей, не добавляй как отдельную работу, а перенеси в note. Не выдумывай пробег и стоимость. Если пробег не виден, используй текущий пробег." },
        { role: "user", content: [
          { type: "text", text: JSON.stringify({ task: "Extract and normalize service logs from this service document.", vehicle, profile, currentMileage: mileage, allowedNormalizedIds: ["engine_service","engine_oil","oil_filter","cabin_filter","air_filter","spark_plugs","cvt_fluid","diff_fluid","brake_fluid","front_pads","front_discs","rear_pads","rear_discs","fuel_cleaning","suspension_check","other"], outputFormat: "{ logs: [{ normalizedId, title, mileage, cost, note, datePerformed }] }", rules: ["Return only JSON", "Do not include vague rows like 'ремонт автомобиля' as separate service logs", "Normalize short names into clear service names", "If axle/front/rear is unclear for brakes, use generic brake wording and normalizedId other", "If several parts clearly belong to one operation, group them logically"] }) },
          { type: "image_url", image_url: { url: imageUrl } }
        ] }
      ],
    });
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const logs = Array.isArray(parsed.logs) ? parsed.logs.map((log) => ({ normalizedId: log.normalizedId || "other", title: log.title || "Работа из документа", mileage: Number(log.mileage || mileage || 0), cost: Number(log.cost || 0), note: log.note || "Добавлено из документа СТО", datePerformed: log.datePerformed || null })) : [];
    return res.status(200).json({ logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to parse service document", details: error?.message || String(error) });
  }
}
