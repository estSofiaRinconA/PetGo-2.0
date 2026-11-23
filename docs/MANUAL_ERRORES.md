# Manual de errores — PetGo 2.0

**Actualizado:** 23 de noviembre de 2026.

## `vite: not found` durante la compilación en Render

Vite está declarado como dependencia de desarrollo. Si Render usa `NODE_ENV=production`, instalar con `--include=dev`:

```bash
npm --prefix backend ci && npm --prefix frontend ci --include=dev && npm --prefix frontend run build
```

## `Cannot find module backend/production.js`

Verificar que el archivo exista en la raíz `backend/`, y ejecutar `node backend\production.js` desde la raíz del repositorio. No es la misma orden que `npm start`, que inicia únicamente la API.

## `Ruta no encontrada` en recuperación OTP

Revisar que las rutas `/api/auth/password/recovery`, `/verify` y `/reset` estén registradas en `backend/server.js`. Reiniciar Node después de actualizar archivos. Un código expirado o inválido debe producir error de validación, no 404.

## Gmail SMTP: `535 5.7.8 Username and Password not accepted`

El rechazo ocurre entre Supabase Auth y Gmail. Revisar usuario SMTP, correo remitente y contraseña de aplicación de Google. No copiar contraseñas en GitHub o mensajes. El aviso de proveedor de correo personal es distinto de un error de autenticación.

## Cambios de accesibilidad o cookies no visibles

Revisar que existan `frontend/public/petgo-accesibilidad.js` y `.css`, recompilar con `npm --prefix frontend run build`, reiniciar `node backend\production.js` y refrescar con `Ctrl+F5`. El aviso puede estar oculto si ya se confirmó en almacenamiento local; comprobar en una ventana privada.

## Sesión perdida tras actualizar

Comprobar la ruta HTTPS, que la cookie se envíe al mismo dominio y tenga atributos correctos (`Secure`, `HttpOnly`, `SameSite`, `Path`); revisar respuesta de `/api/auth/me` y renovación. No corregir pasando tokens privilegiados al JavaScript del navegador.

## Verificación general

- Confirmar que Render muestre **Live** y revisar logs sin revelar secretos.
- Comprobar variables privadas de Supabase en Render.
- Comparar la rama que Render despliega con el commit subido a GitHub.
- Para errores de permisos, probar la solicitud con la cuenta y rol adecuados.
