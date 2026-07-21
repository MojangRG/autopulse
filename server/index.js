import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, "api");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT || 8080);
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_BYTES || 2 * 1024 * 1024);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function enhanceResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
    }
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload) => {
    if (Buffer.isBuffer(payload)) {
      res.end(payload);
      return res;
    }

    if (typeof payload === "object" && payload !== null) {
      return res.json(payload);
    }

    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end(String(payload ?? ""));
    return res;
  };

  return res;
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      const error = new Error("JSON body is too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Invalid JSON");
    error.statusCode = 400;
    throw error;
  }
}

async function loadApiHandlers() {
  const handlers = new Map();

  if (!fs.existsSync(API_DIR)) return handlers;

  const files = fs.readdirSync(API_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

  for (const file of files) {
    const route = `/api/${file.name.replace(/\.js$/, "")}`;
    const moduleUrl = pathToFileURL(path.join(API_DIR, file.name)).href;
    const mod = await import(moduleUrl);

    if (typeof mod.default === "function") {
      handlers.set(route, mod.default);
    }
  }

  return handlers;
}

function safeStaticPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const normalized = path.posix.normalize(decoded);
  if (normalized.includes("..")) return null;

  const relative = normalized === "/" ? "index.html" : normalized.replace(/^\/+/, "");
  const absolute = path.join(DIST_DIR, relative);

  if (!absolute.startsWith(DIST_DIR)) return null;
  return absolute;
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");

  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }

  fs.createReadStream(filePath)
    .on("error", () => {
      if (!res.headersSent) res.statusCode = 500;
      res.end("Internal Server Error");
    })
    .pipe(res);
}

const apiHandlers = await loadApiHandlers();

const server = http.createServer(async (req, rawRes) => {
  const res = enhanceResponse(rawRes);
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  req.query = Object.fromEntries(requestUrl.searchParams.entries());

  if (pathname === "/healthz") {
    return res.status(200).json({
      ok: true,
      service: "motrix",
      runtime: "yandex-serverless-container-ready",
      apiRoutes: apiHandlers.size,
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname.startsWith("/api/")) {
    const handler = apiHandlers.get(pathname);

    if (!handler) {
      return res.status(404).json({ error: "API route not found" });
    }

    try {
      const contentType = String(req.headers["content-type"] || "").toLowerCase();

      if (contentType.includes("application/json")) {
        req.body = await readJsonBody(req);
      }

      await handler(req, res);

      if (!res.writableEnded) {
        res.status(204).end();
      }
    } catch (error) {
      console.error("API runtime error", {
        pathname,
        message: error?.message || String(error),
      });

      if (!res.writableEnded) {
        res.status(error?.statusCode || 500).json({
          error: error?.statusCode === 400
            ? "Некорректный JSON"
            : error?.statusCode === 413
              ? "Слишком большой запрос"
              : "Внутренняя ошибка Motrix",
        });
      }
    }

    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).send("Method Not Allowed");
  }

  const staticPath = safeStaticPath(pathname);

  if (staticPath && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    if (req.method === "HEAD") {
      res.statusCode = 200;
      return res.end();
    }
    return serveFile(res, staticPath);
  }

  const indexPath = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexPath)) {
    return serveFile(res, indexPath);
  }

  return res.status(503).send("Motrix frontend is not built");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Motrix listening on 0.0.0.0:${PORT}`);
  console.log(`Loaded ${apiHandlers.size} API routes`);
});
