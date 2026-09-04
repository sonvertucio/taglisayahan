import { createHmac, timingSafeEqual } from 'node:crypto';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let payload;
  try { payload = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const expectedUser = process.env.TAGLISAYAHAN_ADMIN_USERNAME || 'sacci.admin';
  const expectedPassword = process.env.TAGLISAYAHAN_ADMIN_PASSWORD || 'SACCI2026!';
  if (!safeEqual(payload.username, expectedUser) || !safeEqual(payload.password, expectedPassword)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  const secret = process.env.TAGLISAYAHAN_SESSION_SECRET || `${expectedPassword}::taglisayahan-2026`;
  const claims = Buffer.from(JSON.stringify({ sub: expectedUser, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(claims).digest('base64url');
  return json({ token: `${claims}.${signature}`, expiresIn: 28800 });
};
