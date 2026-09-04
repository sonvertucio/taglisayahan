import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const verifyToken = (token = '') => {
  const [claims, signature] = token.split('.');
  if (!claims || !signature) return false;
  const password = process.env.TAGLISAYAHAN_ADMIN_PASSWORD || 'SACCI2026!';
  const secret = process.env.TAGLISAYAHAN_SESSION_SECRET || `${password}::taglisayahan-2026`;
  const expected = createHmac('sha256', secret).update(claims).digest('base64url');
  const actualBuffer = Buffer.from(signature); const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try { return JSON.parse(Buffer.from(claims, 'base64url').toString()).exp > Date.now(); }
  catch { return false; }
};

const validState = (state) => state && Array.isArray(state.families) && state.families.length === 5
  && state.families.every((family) => typeof family.id === 'string' && Number.isFinite(family.points))
  && Array.isArray(state.results) && Array.isArray(state.announcements) && state.meta;

export default async (request) => {
  const store = getStore('taglisayahan-championship');
  if (request.method === 'GET') {
    const state = await store.get('live-state', { type: 'json', consistency: 'strong' });
    return json({ state: state || null });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const auth = request.headers.get('authorization') || '';
  if (!verifyToken(auth.replace(/^Bearer\s+/i, ''))) return json({ error: 'Unauthorized' }, 401);
  if (Number(request.headers.get('content-length') || 0) > 1_000_000) return json({ error: 'Payload too large' }, 413);
  let payload;
  try { payload = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!validState(payload.state)) return json({ error: 'Invalid championship state' }, 422);
  await store.setJSON('live-state', payload.state);
  return json({ ok: true, updatedAt: payload.state.meta.updatedAt });
};
