/**
 * Cloudflare Pages Function: starts the Google OAuth 2.0 authorization-code flow.
 * Required secrets: GOOGLE_CLIENT_ID, AUTH_ORIGIN.
 */
export async function onRequestGet({ request, env }) {
  const origin = env.AUTH_ORIGIN || new URL(request.url).origin;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}
