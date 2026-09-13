const cookieValue = (request, name) => (request.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);

/** Google callback for admins only. A student account can never pass this email allow-list. */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const state = url.searchParams.get('state');
  if (!code || !state || state !== cookieValue(request, 'admin_oauth_state')) return new Response('Invalid admin sign-in request.', { status: 400 });
  const origin = env.AUTH_ORIGIN || url.origin;
  const tokensResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${origin}/setup/admin/callback`, grant_type: 'authorization_code' }) });
  if (!tokensResponse.ok) return new Response('Admin sign-in could not be completed.', { status: 401 });
  const tokens = await tokensResponse.json(); const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`); const profile = await profileResponse.json();
  const allowed = (env.ADMIN_ALLOWED_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!profileResponse.ok || profile.aud !== env.GOOGLE_CLIENT_ID || !profile.email_verified || !allowed.includes(profile.email.toLowerCase())) return new Response('This Google account is not authorised for MedNotes administration.', { status: 403 });
  const adminId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO admins (id, email, google_sub) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET google_sub = excluded.google_sub').bind(adminId, profile.email.toLowerCase(), profile.sub).run();
  const admin = await env.DB.prepare('SELECT id FROM admins WHERE email = ?').bind(profile.email.toLowerCase()).first(); const sessionId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES (?, ?, datetime(\'now\', \'+8 hours\'))').bind(sessionId, admin.id).run();
  await env.DB.prepare('INSERT INTO admin_audit_log (id, admin_id, action, ip) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), admin.id, 'sign_in', request.headers.get('CF-Connecting-IP') || null).run();
  return new Response(null, { status: 302, headers: { Location: '/admin.html', 'Set-Cookie': `admin_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` } });
}
