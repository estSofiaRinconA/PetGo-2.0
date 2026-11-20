# Seguridad y privacidad — PetGo 2.0

## Implementado o verificado

- Variables privadas configuradas en `backend/.env` con archivo ignorado por Git.
- Acceso al catálogo mediante API propia y cliente de Supabase del servidor.
- Esquema lógico `petgo_v2`, distinto de `public`.
- Cinco tablas nuevas con RLS habilitado y forzado.
- Restricción de reserva-mascota mediante FK compuesta.
- Lectura del catálogo habilitada para el rol del backend.

## Advertencias importantes

1. **La clave `SUPABASE_SECRET_KEY` es privilegiada.** Nunca debe exponerse al navegador, imprimirse en logs ni enviarse en capturas.
2. **RLS forzado no reemplaza autorización del servidor** y un rol con `BYPASSRLS` puede eludir políticas.
3. **Esquema ≠ proyecto aislado.** El sistema antiguo y PetGo 2.0 comparten Supabase Auth y configuración global.
4. El catálogo es actualmente público por intención; ello **no autoriza** acceso público a perfiles, mascotas o reservas.
5. El backend aún no implementa autenticación de usuarios ni autorización en cada endpoint; no exponer operaciones privadas hasta resolverlo.

## Obligatorio antes de activar funcionalidades

- Verificar tokens de Supabase Auth en el backend y derivar el identificador de usuario desde la sesión, nunca aceptar `user_id` arbitrario como propietario.
- Restringir rol `admin` a asignación segura y pruebas contra escalamiento de privilegios.
- Definir políticas RLS por tabla y permisos SQL mínimos.
- Validación de entrada, control de errores, límites de peticiones y registro de eventos sin PII innecesaria.
- Configurar CORS con lista de orígenes autorizados, métodos y cabeceras exactas.
- Verificar transacciones y conflictos de reserva en el servidor y en PostgreSQL.
- Implementar consentimiento de cookies para usos opcionales, aviso de privacidad y accesibilidad.

## Comprobación antes de Git

```powershell
git check-ignore backend/.env
git status
git diff --cached --name-only
```

Comprobar que `.env` real, contraseñas y secretos **no estén** en lo preparado para el commit. Si se expone una clave, revocarla/rotarla y revisar el historial; borrarla del archivo actual no basta.
