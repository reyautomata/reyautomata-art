// functions/api/callback.js
// GitHub vuelve aquí con un "code". Lo cambiamos por un token de acceso
// y se lo entregamos a Decap CMS mediante postMessage (ventana emergente).
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Falta el parámetro code', { status: 400 });
  }

  // Intercambia el code por un access_token con GitHub
  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'decap-cms-cloudflare'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const data = await tokenResp.json();

  // Prepara el mensaje que Decap CMS espera recibir
  let result, status;
  if (data.access_token) {
    result = JSON.stringify({ token: data.access_token, provider: 'github' });
    status = 'success';
  } else {
    result = JSON.stringify(data);
    status = 'error';
  }

  // Página que se comunica con la ventana de Decap (el opener) y se cierra
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
(function() {
  function postResult() {
    window.opener.postMessage(
      'authorization:github:${status}:' + ${JSON.stringify(result)},
      '*'
    );
  }
  // Decap hace un "handshake": primero avisa que está listo
  window.addEventListener('message', function(e) {
    postResult();
  }, false);
  // Inicia el handshake
  if (window.opener) {
    window.opener.postMessage('authorizing:github', '*');
  }
})();
</script>
<p>Autenticando… puedes cerrar esta ventana si no se cierra sola.</p>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
