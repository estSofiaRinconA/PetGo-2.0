# Despliegue de PetGo 2.0 en Render

**Actualizado:** 23 de noviembre de 2026.

**Sitio público:** **https://petgo-2-0.onrender.com** (sustituir antes del commit).

## Configuración del servicio web

| Campo | Valor |
|---|---|
| GitHub | `estSofiaRinconA/PetGo-2.0` |
| Nombre del servicio | `petgo-2-0` |
| Rama usada inicialmente | `feature/schedule-admin-v2` |
| Runtime | `Node` |
| Root Directory | Vacío: raíz del repositorio |
| Build Command | `npm --prefix backend ci && npm --prefix frontend ci --include=dev && npm --prefix frontend run build` |
| Start Command | `node backend/production.js` |
| NODE_VERSION | `22.16.0` |
| NODE_ENV | `production` |

## Entorno privado de Render

Configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY` en Render → Environment. Nunca incluir valores privados en GitHub ni documentación. Render asigna `PORT` automáticamente.

`backend/production.js` sirve `frontend/dist`, inyecta los recursos de accesibilidad y dirige las rutas `/api` al enrutador de Node.js. No publicar en GitHub Pages, porque allí la API no se ejecutaría.

## Publicación y comprobación

1. Subir a GitHub la rama que Render sigue.
2. En Render elegir **Manual Deploy → Deploy latest commit** (o usar Auto-Deploy).
3. Confirmar estado **Live** y abrir la URL HTTPS.
4. Probar portada, login, redirección por rol, mascotas, reservas, administración, cierre de sesión, aviso de cookies y controles accesibles.
5. Comprobar con `F5` persistencia de sesión y que las APIs rechazan accesos de roles no autorizados. Estas verificaciones no se consideran cerradas.
6. En Supabase Authentication → URL Configuration adaptar las redirecciones a la URL HTTPS real cuando se necesiten enlaces por correo.

## Después del merge

Si Render sigue configurado en `feature/schedule-admin-v2`, **fusionar a `develop` no cambia automáticamente la rama publicada**. Para que Render siga `develop`, cambiar la opción Branch en Render y desplegar el último commit de `develop` después de comprobar que contiene las mismas funcionalidades. No eliminar la rama de trabajo hasta confirmar el nuevo despliegue.

El servicio gratuito puede tener arranques en frío. La publicación no es una certificación de seguridad ni accesibilidad.
