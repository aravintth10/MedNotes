const readCookie = (request, name) => (request.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);

export async function getAdminSession(request, env) {
  const sessionId = readCookie(request, 'admin_session');
  if (!sessionId) return null;
  return env.DB.prepare(`SELECT admin_sessions.id AS session_id, admins.id AS admin_id, admins.email
    FROM admin_sessions JOIN admins ON admins.id = admin_sessions.admin_id
    WHERE admin_sessions.id = ? AND admin_sessions.expires_at > CURRENT_TIMESTAMP`)
    .bind(sessionId).first();
}

export async function requireAdmin(context) {
  const session = await getAdminSession(context.request, context.env);
  if (!session) return new Response(JSON.stringify({ error: 'Admin authentication required.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  return session;
}

export const noStoreJson = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
