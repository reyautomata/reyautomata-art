// functions/api/auth.js
// Inicia el flujo de login: redirige al usuario a GitHub para autorizar.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const clientId = env.GITHUB_CLIENT_ID;
  // A dónde vuelve GitHub tras autorizar (nuestro endpoint callback)
  const redirectUri = `${url.origin}/api/callback`;

  // Permisos que pedimos: 'repo' para poder leer/escribir en el repositorio
  const scope = 'repo,user';
  // Estado anti-CSRF simple
  const state = crypto.randomUUID();

  const githubAuthUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  return Response.redirect(githubAuthUrl, 302);
}
