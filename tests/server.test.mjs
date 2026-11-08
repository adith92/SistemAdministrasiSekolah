import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createApp, initializeDatabase } from "../server.mjs";
import { seedDemo } from "../dist/core.mjs";

class MemoryPool {
  constructor() { this.payload = seedDemo(); this.version = 1; }
  async query(sql, params = []) {
    if (sql.startsWith("SELECT payload")) return { rows: [{ payload: structuredClone(this.payload), version: this.version }] };
    if (sql.startsWith("UPDATE sasapps_demo_state")) {
      if (params[2] !== this.version) return { rows: [] };
      this.payload = JSON.parse(params[0]);
      this.version += 1;
      return { rows: [{ version: this.version }] };
    }
    return { rows: [] };
  }
}

async function withServer(t, pool = new MemoryPool()) {
  const server = createServer(createApp({ pool, password: "test-demo-password-which-is-long-enough", staticDir: fileURLToPath(new URL("../dist/", import.meta.url)) }));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  return { pool, base: `http://127.0.0.1:${address.port}`, auth: `Basic ${Buffer.from("sasapps:test-demo-password-which-is-long-enough").toString("base64")}` };
}

test("health check stays minimal and private API requires its demo password", async t => {
  const { base, auth } = await withServer(t);
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });
  const denied = await fetch(`${base}/api/state`);
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get("www-authenticate"), /Basic realm/);
  const allowed = await fetch(`${base}/api/state`, { headers: { Authorization: auth } });
  assert.equal(allowed.status, 200);
});

test("state changes use version checks and reject stale browser updates", async t => {
  const { base, auth, pool } = await withServer(t);
  const headers = { Authorization: auth, "Content-Type": "application/json" };
  const first = await fetch(`${base}/api/state`, { headers });
  const original = await first.json();
  assert.equal(original.state.students.length, 20);
  const changed = { ...original.state, school: { ...original.state.school, name: "Sekolah Demo Render" } };
  const update = await fetch(`${base}/api/state`, { method: "PUT", headers, body: JSON.stringify({ version: original.version, state: changed }) });
  assert.equal(update.status, 200);
  assert.deepEqual(await update.json(), { version: 2 });
  assert.equal(pool.payload.school.name, "Sekolah Demo Render");
  const stale = await fetch(`${base}/api/state`, { method: "PUT", headers, body: JSON.stringify({ version: original.version, state: original.state }) });
  assert.equal(stale.status, 409);
  const conflict = await stale.json();
  assert.equal(conflict.state.school.name, "Sekolah Demo Render");
  assert.equal(conflict.version, 2);
});

test("state endpoint validates the demo shape and same-origin writes", async t => {
  const { base, auth } = await withServer(t);
  const headers = { Authorization: auth, "Content-Type": "application/json" };
  const invalid = await fetch(`${base}/api/state`, { method: "PUT", headers, body: JSON.stringify({ version: 1, state: { students: [] } }) });
  assert.equal(invalid.status, 400);
  const crossOrigin = await fetch(`${base}/api/state`, { method: "PUT", headers: { ...headers, Origin: "https://example.com" }, body: JSON.stringify({ version: 1, state: seedDemo() }) });
  assert.equal(crossOrigin.status, 403);
});

test("static site injects remote storage only on the Render server", async t => {
  const { base, auth } = await withServer(t);
  const response = await fetch(base, { headers: { Authorization: auth } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /window\.__SASAPPS_REMOTE__=true/);
  assert.match(html, /SASapps — Sekolah Swasta Nasional/);
  const traversal = await fetch(`${base}/%2e%2e/server.mjs`, { headers: { Authorization: auth } });
  assert.equal(traversal.status, 404);
});

test("database bootstrap creates schema and preserves initialized rows", async () => {
  const calls = [];
  const pool = { async query(sql, params) { calls.push({ sql, params }); return { rows: [] }; } };
  await initializeDatabase(pool);
  assert.match(calls[0].sql, /CREATE TABLE IF NOT EXISTS sasapps_demo_state/);
  assert.match(calls[1].sql, /ON CONFLICT \(id\) DO NOTHING/);
  assert.equal(JSON.parse(calls[1].params[1]).students.length, 20);
});
