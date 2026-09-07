import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const files = new Set([
  "/index.html",
  "/src/app.js",
  "/src/neural-background.js",
  "/src/state.js",
  "/src/icons.js",
  "/src/styles.css",
  "/src/production/styles.css",
  "/src/production/catalog.js",
  "/src/production/engine.js",
  "/src/production/ui.js",
]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  if (!files.has(requested)) {
    res.writeHead(404);
    res.end("Não encontrado");
    return;
  }
  try {
    const body = await readFile(path.join(root, requested));
    res.writeHead(200, {
      "Content-Type": mime[path.extname(requested)],
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500);
    res.end("Não foi possível abrir o arquivo.");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Órbita disponível em http://localhost:${port}`),
);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `A porta ${port} está ocupada. Use PORT=4174 node server.mjs`
      : error.message,
  );
  process.exitCode = 1;
});
