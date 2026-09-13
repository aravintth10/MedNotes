import { getAdminSession } from '../../_lib/admin-auth.js';

/** Starts a separate Google OAuth flow for the admin allow-list. */
export async function onRequestGet(context) {
  const existing = await getAdminSession(context.request, context.env);
  if (existing) return Response.redirect(new URL('/admin.html', context.request.url), 302);
  const origin = context.env.AUTH_ORIGIN || new URL(context.request.url).origin;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({ client_id: context.env.GOOGLE_CLIENT_ID, redirect_uri: `${origin}/setup/admin/callback`, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return new Response(null, { status: 302, headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, 'Set-Cookie': `admin_oauth_state=${state}; Path=/setup/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=600` } });
}
