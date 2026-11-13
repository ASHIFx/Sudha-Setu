import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

test('server serves the built app and fails clearly when MongoDB is missing', { timeout: 15000 }, async (t) => {
  const port = 20000 + Math.floor(Math.random() * 30000);
  const child = spawn(process.execPath, ['src/server.js'], {
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', MONGO_URI: '', JWT_SECRET: 'test-only-secret-with-at-least-32-characters', CLIENT_ORIGINS: 'http://localhost:5173' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  t.after(async () => {
    if (child.exitCode === null) {
      const closed = once(child, 'exit');
      child.kill();
      await closed;
    }
  });
  const base = `http://127.0.0.1:${port}`;
  let health;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { health = await fetch(`${base}/api/health`); break; } catch {}
    if (child.exitCode !== null) assert.fail(output);
    await delay(50);
  }
  assert.ok(health, output);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).db, 'disconnected');
  const unavailable = await fetch(`${base}/api/auth/me`);
  assert.equal(unavailable.status, 503);
  assert.match((await unavailable.json()).message, /Database/);
  const blocked = await fetch(`${base}/api/health`, { headers: { Origin: 'https://untrusted.invalid' } });
  assert.equal(blocked.status, 403);
  const frontend = await fetch(`${base}/`, { headers: { Accept: 'text/html' } });
  assert.equal(frontend.status, 200);
  assert.match(await frontend.text(), /<div id="root">/);
});
