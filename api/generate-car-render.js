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

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
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

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const first = result?.data?.[0];
    const imageUrl = first?.b64_json
      ? `data:image/png;base64,${first.b64_json}`
      : first?.url || null;

    if (!imageUrl) {
      throw new Error("Image generation returned no image");
    }

    return res.status(200).json({
      imageUrl,
      prompt,
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
