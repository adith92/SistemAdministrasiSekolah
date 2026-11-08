import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { seedDemo } from "./dist/core.mjs";

const { Pool } = pg;
const root = fileURLToPath(new URL(".", import.meta.url));
const defaultStaticDir = resolve(root, "dist");
const contentTypes = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8" };
const MAX_BODY = 1024 * 1024;

function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(value));
}

function authorized(req, password) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const supplied = Buffer.from(header.slice(6), "base64").toString("utf8");
    const expected = `sasapps:${password}`;
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch { return false; }
}

function validState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!value.school || typeof value.school !== "object") return false;
  const limits = { students: 500, invoices: 2000, payments: 5000, approvals: 2000, receipts: 5000, discounts: 500, feeTypes: 100, audit: 5000 };
  return value.classRates && typeof value.classRates === "object" && !Array.isArray(value.classRates)
    && value.contact && typeof value.contact === "object" && !Array.isArray(value.contact)
    && Object.entries(limits).every(([key, limit]) => Array.isArray(value[key]) && value[key].length <= limit);
}

async function readBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY) throw Object.assign(new Error("Request terlalu besar."), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("JSON tidak valid."), { status: 400 }); }
}

function noStoreHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
}

export function createApp({ pool, password, staticDir = defaultStaticDir }) {
  if (!pool) throw new Error("PostgreSQL pool wajib tersedia.");
  if (!password) throw new Error("SASAPPS_DEMO_PASSWORD wajib disetel.");
  const staticRoot = resolve(staticDir);

  return async function handle(req, res) {
    noStoreHeaders(res);
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/health" && req.method === "GET") return json(res, 200, { ok: true });

    if (!authorized(req, password)) {
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="SASapps Demo", charset="UTF-8"', "Cache-Control": "no-store" });
      return res.end("Akses terbatas. Masukkan kata sandi demo.");
    }

    if (url.pathname === "/api/state" && req.method === "GET") {
      try {
        const result = await pool.query("SELECT payload, version FROM sasapps_demo_state WHERE id = $1", ["current"]);
        if (!result.rows[0]) return json(res, 503, { error: "Data demo belum diinisialisasi." });
        return json(res, 200, { state: result.rows[0].payload, version: Number(result.rows[0].version) });
      } catch { return json(res, 503, { error: "Database demo tidak tersedia." }); }
    }

    if (url.pathname === "/api/state" && req.method === "PUT") {
      if (req.headers.origin) {
        try { if (new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: "Origin tidak diizinkan." }); }
        catch { return json(res, 403, { error: "Origin tidak valid." }); }
      }
      try {
        const body = await readBody(req);
        if (!Number.isSafeInteger(body.version) || !validState(body.state)) return json(res, 400, { error: "Struktur data demo tidak valid." });
        const result = await pool.query(
          "UPDATE sasapps_demo_state SET payload = $1::jsonb, version = version + 1, updated_at = now() WHERE id = $2 AND version = $3 RETURNING version",
          [JSON.stringify(body.state), "current", body.version]
        );
        if (result.rows[0]) return json(res, 200, { version: Number(result.rows[0].version) });
        const latest = await pool.query("SELECT payload, version FROM sasapps_demo_state WHERE id = $1", ["current"]);
        if (!latest.rows[0]) return json(res, 503, { error: "Data demo belum diinisialisasi." });
        return json(res, 409, { state: latest.rows[0].payload, version: Number(latest.rows[0].version), error: "Data telah berubah di perangkat lain." });
      } catch (error) { return json(res, error.status || 503, { error: error.status ? error.message : "Perubahan belum tersimpan ke database." }); }
    }

    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Metode tidak didukung." });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, { error: "Path tidak valid." }); }
    if (pathname === "/") pathname = "/index.html";
    const file = resolve(staticRoot, `.${pathname}`);
    if (!file.startsWith(staticRoot + sep) || pathname.includes("..")) return json(res, 404, { error: "Tidak ditemukan." });
    try {
      const info = await stat(file);
      if (!info.isFile()) return json(res, 404, { error: "Tidak ditemukan." });
      res.setHeader("Content-Type", contentTypes[extname(file)] || "application/octet-stream");
      res.setHeader("Content-Length", info.size);
      if (pathname === "/index.html") {
        res.removeHeader("Content-Length");
        let html = await readFile(file, "utf8");
        html = html.replace('<script type="module" src="./app.mjs"></script>', '<script>window.__SASAPPS_REMOTE__=true;</script><script type="module" src="./app.mjs"></script>');
        res.end(html);
      } else if (req.method === "HEAD") res.end();
      else createReadStream(file).pipe(res);
    } catch { return json(res, 404, { error: "Tidak ditemukan." }); }
  };
}

export async function initializeDatabase(pool) {
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
  await pool.query(
    "INSERT INTO sasapps_demo_state (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING",
    ["current", JSON.stringify(seedDemo())]
  );
}

async function main() {
  const { DATABASE_URL, SASAPPS_DEMO_PASSWORD } = process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL wajib disetel.");
  if (!SASAPPS_DEMO_PASSWORD || SASAPPS_DEMO_PASSWORD.length < 24) throw new Error("SASAPPS_DEMO_PASSWORD harus berisi minimal 24 karakter.");
  const pool = new Pool({ connectionString: DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
  await initializeDatabase(pool);
  const server = createServer(createApp({ pool, password: SASAPPS_DEMO_PASSWORD }));
  const port = Number(process.env.PORT || 10000);
  server.listen(port, "0.0.0.0", () => console.log(`SASapps listening on port ${port}`));
  const shutdown = () => server.close(() => pool.end().finally(() => process.exit(0)));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error("SASapps startup failed:", error.message); process.exit(1); });
}
