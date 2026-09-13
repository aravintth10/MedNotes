/**
 * Cloudflare Pages Function: verifies Google's callback server-side, then creates
 * an opaque signed-in session. Required secrets: GOOGLE_CLIENT_ID,
 * GOOGLE_CLIENT_SECRET, AUTH_ORIGIN. Required D1 binding: DB.
 */
const cookieValue = (request, name) => (request.headers.get('Cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const state = url.searchParams.get('state');
  if (!code || !state || state !== cookieValue(request, 'oauth_state')) return new Response('Invalid Google sign-in request.', { status: 400 });
  const origin = env.AUTH_ORIGIN || url.origin;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${origin}/api/auth/google/callback`, grant_type: 'authorization_code' }) });
  if (!tokenResponse.ok) return new Response('Google sign-in could not be completed.', { status: 401 });
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  const profile = await profileResponse.json();
  if (!profileResponse.ok || profile.aud !== env.GOOGLE_CLIENT_ID || !profile.email_verified) return new Response('Your Google account could not be verified.', { status: 401 });
  const userId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, email, name, google_sub) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, google_sub = excluded.google_sub').bind(userId, profile.email, profile.name || profile.email, profile.sub).run();
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(profile.email).first();
  const sessionId = crypto.randomUUID(); const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, user.id, expiresAt).run();
  return new Response(null, { status: 302, headers: { Location: '/', 'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` } });
}
