import OpenAI from "openai";

export const config = { maxDuration: 60 };

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.aitunnel.ru/v1/",
  });
}

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function extractImageUrl(result) {
  const first = result?.data?.[0] || {};
  if (first.url) return first.url;
  if (first.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first.image_url?.url) return first.image_url.url;
  if (typeof first.image_url === "string") return first.image_url;
  return null;
}

async function generateImage(openai, prompt, model) {
  return openai.images.generate({
    model,
    prompt,
    n: 1,
    size: "1024x1024",
    quality: process.env.IMAGE_QUALITY || "low",
  });
}

function buildRenderPrompt(vehicle) {
  const brand = safeText(vehicle?.brand, "car brand");
  const model = safeText(vehicle?.model, "car model");
  const generation = safeText(vehicle?.generation);
  const year = safeText(vehicle?.year);
  const color = safeText(vehicle?.color, "graphite metallic");
  const transmission = safeText(vehicle?.transmission);
  const drive = safeText(vehicle?.drive);
  const engine = safeText(vehicle?.engine);

  const vehicleName = [year, brand, model, generation].filter(Boolean).join(" ");
  const techLine = [engine, transmission, drive].filter(Boolean).join(", ");

  return [
    "Create a premium high-end automotive hero render for a mobile app dashboard.",
    `Subject: ${vehicleName || `${brand} ${model}`}.`,
    `Paint color: ${color}.`,
    techLine ? `Vehicle spec hints: ${techLine}.` : null,
    "Show exactly one car, no people, no extra vehicles, no dealership scene.",
    "View angle: front three-quarter view, centered, slightly low camera, expensive studio composition.",
    "Style: polished 3D render, realistic materials, luxury reflections, cinematic soft lighting, premium automotive ad quality.",
    "Background: dark midnight studio, subtle blue glow, minimal futuristic atmosphere, clean space for UI overlays.",
    "The car must look modern, desirable and believable for the specified make/model family.",
    "No text, no interface, no watermarks, no logos floating in the scene.",
    "Keep the body silhouette clearly readable and visually striking.",
  ].filter(Boolean).join(" ");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const vehicle = req.body?.vehicle;
    if (!vehicle?.brand || !vehicle?.model) {
      return res.status(400).json({ error: "Vehicle brand and model are required" });
    }

    const openai = getOpenAI();
    const prompt = buildRenderPrompt(vehicle);

    const preferredModel = process.env.IMAGE_MODEL || "gpt-image-1";
    const fallbackModel = preferredModel === "openai/gpt-image-1" ? "gpt-image-1" : "openai/gpt-image-1";

    let usedModel = preferredModel;
    let result;
    try {
      result = await generateImage(openai, prompt, preferredModel);
    } catch (firstError) {
      console.warn("Primary image model failed, retrying with fallback", {
        preferredModel,
        fallbackModel,
        error: firstError?.message || String(firstError),
      });
      usedModel = fallbackModel;
      result = await generateImage(openai, prompt, fallbackModel);
    }

    const imageUrl = extractImageUrl(result);

    if (!imageUrl) {
      return res.status(502).json({
        error: "Image generation returned no image",
        details: `AITUNNEL response did not contain url or b64_json. data[0] keys: ${Object.keys(result?.data?.[0] || {}).join(", ") || "none"}`,
        model: usedModel,
      });
    }

    return res.status(200).json({
      imageUrl,
      prompt,
      model: usedModel,
      quality: process.env.IMAGE_QUALITY || "low",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to generate vehicle render",
      details: error?.message || String(error),
    });
  }
}
