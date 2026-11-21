
function createRequireAuth(supabase) {
  return async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;

    const match = typeof authorization === 'string'
      ? /^Bearer ([^\s]+)$/i.exec(authorization)
      : null;

    if (!match) {
      res.writeHead(401, {
        'Content-Type': 'application/json'
      });

      return res.end(JSON.stringify({
        success: false,
        error: 'Autenticación requerida'
      }));
    }

    const token = match[1];

    try {
      const { data, error } =
        await supabase.auth.getUser(token);

      if (error || !data?.user?.id) {
        res.writeHead(401, {
          'Content-Type': 'application/json'
        });

        return res.end(JSON.stringify({
          success: false,
          error: 'Sesión inválida o expirada'
        }));
      }

      // Identidad verificada por Supabase Auth.
      req.user = data.user;

      return next();
    } catch {
      res.writeHead(503, {
        'Content-Type': 'application/json'
      });

      return res.end(JSON.stringify({
        success: false,
        error: 'Servicio de autenticación no disponible'
      }));
    }
  };
}

module.exports = { createRequireAuth };
