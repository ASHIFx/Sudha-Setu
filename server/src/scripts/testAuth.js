/**
 * Automated Auth Endpoint Tests for Sudha Setu
 *
 * Usage: Start the server first (`npm run dev`), then in another terminal:
 *   node src/scripts/testAuth.js
 *
 * Uses native `fetch` (Node 18+). No external test deps required.
 */

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const API = `${BASE}/api/auth`;

// Unique email per run to avoid collisions.
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'StrongP@ss123';
const TEST_NAME = 'Test Patient';

let savedCookies = '';

/** Tiny helper to extract Set-Cookie headers and merge them. */
const extractCookies = (res) => {
  const raw = res.headers.getSetCookie?.() || [];
  return raw.map((c) => c.split(';')[0]).join('; ');
};

const mergeCookies = (existing, incoming) => {
  if (!incoming) return existing;
  const map = {};
  [existing, incoming].forEach((str) =>
    str.split('; ').filter(Boolean).forEach((pair) => {
      const [k] = pair.split('=');
      map[k] = pair;
    })
  );
  return Object.values(map).join('; ');
};

let passed = 0;
let failed = 0;

const assert = (condition, label) => {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
};

const run = async () => {
  console.log(`\n🔬 Sudha Setu Auth Tests — ${API}\n${'─'.repeat(50)}`);

  // ──────────────────────────────────────────
  // 1. Register a new patient → 201 + cookies
  // ──────────────────────────────────────────
  console.log('\n[1] POST /register — new patient');
  {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const body = await res.json();
    const cookies = extractCookies(res);
    savedCookies = mergeCookies(savedCookies, cookies);

    assert(res.status === 201, `Status 201 (got ${res.status})`);
    assert(cookies.includes('accessToken'), 'accessToken cookie set');
    assert(cookies.includes('refreshToken'), 'refreshToken cookie set');
    assert(body.user?.email === TEST_EMAIL.toLowerCase(), 'Response contains user.email');
    assert(body.user?.role === 'patient', 'Default role is patient');
  }

  // ──────────────────────────────────────────
  // 2. Register duplicate email → 400
  // ──────────────────────────────────────────
  console.log('\n[2] POST /register — duplicate email');
  {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    assert(res.status === 400, `Status 400 (got ${res.status})`);
  }

  // ──────────────────────────────────────────
  // 3. Login with correct credentials → 200
  // ──────────────────────────────────────────
  console.log('\n[3] POST /login — correct credentials');
  {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const body = await res.json();
    const cookies = extractCookies(res);
    savedCookies = mergeCookies(savedCookies, cookies);

    assert(res.status === 200, `Status 200 (got ${res.status})`);
    assert(cookies.includes('accessToken'), 'accessToken cookie refreshed');
    assert(body.user?.id, 'Response contains user.id');
  }

  // ──────────────────────────────────────────
  // 4a. GET /me without token → 401
  // ──────────────────────────────────────────
  console.log('\n[4a] GET /me — no token');
  {
    const res = await fetch(`${API}/me`);
    assert(res.status === 401, `Status 401 (got ${res.status})`);
  }

  // ──────────────────────────────────────────
  // 4b. GET /me with cookie → 200
  // ──────────────────────────────────────────
  console.log('\n[4b] GET /me — with cookie');
  {
    const res = await fetch(`${API}/me`, {
      headers: { Cookie: savedCookies },
    });
    const body = await res.json();

    assert(res.status === 200, `Status 200 (got ${res.status})`);
    assert(body.user?.name === TEST_NAME, `user.name matches (got "${body.user?.name}")`);
  }

  // ──────────────────────────────────────────
  // 5. Patient accessing doctor-only route → 403
  // ──────────────────────────────────────────
  console.log('\n[5] GET /cases/queue — patient → 403 Forbidden');
  {
    const res = await fetch(`${BASE}/api/cases/queue`, {
      headers: { Cookie: savedCookies },
    });
    assert(res.status === 403, `Status 403 (got ${res.status})`);
  }

  // ──────────────────────────────────────────
  // 6. POST /refresh → 200 + new access token
  // ──────────────────────────────────────────
  console.log('\n[6] POST /refresh — issue new access token');
  {
    const res = await fetch(`${API}/refresh`, {
      method: 'POST',
      headers: { Cookie: savedCookies },
    });
    const cookies = extractCookies(res);

    assert(res.status === 200, `Status 200 (got ${res.status})`);
    assert(cookies.includes('accessToken'), 'New accessToken cookie set');

    // Update saved cookies with new access token
    savedCookies = mergeCookies(savedCookies, cookies);
  }

  // ──────────────────────────────────────────
  // 7. GET /me after refresh → still works
  // ──────────────────────────────────────────
  console.log('\n[7] GET /me — after refresh');
  {
    const res = await fetch(`${API}/me`, {
      headers: { Cookie: savedCookies },
    });
    assert(res.status === 200, `Status 200 (got ${res.status})`);
  }

  // ──────────────────────────────────────────
  // 8. POST /logout → 200 + cookies cleared
  // ──────────────────────────────────────────
  console.log('\n[8] POST /logout');
  {
    const res = await fetch(`${API}/logout`, {
      method: 'POST',
      headers: { Cookie: savedCookies },
    });
    const body = await res.json();
    const cookies = extractCookies(res);

    assert(res.status === 200, `Status 200 (got ${res.status})`);
    assert(body.message === 'Logged out successfully', 'Logout message returned');
    // After logout, cookies should be cleared (maxAge=0 or empty value)
    assert(cookies.includes('accessToken'), 'accessToken cookie cleared header present');
  }

  // ──────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.\n');
    process.exit(1);
  }
};

run().catch((err) => {
  console.error('\n💥 Test runner error:', err.message);
  console.error('   Make sure the server is running: npm run dev\n');
  process.exit(1);
});
