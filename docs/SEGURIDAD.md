# Seguridad — PetGo 2.0

**Actualizado:** 20 de noviembre de 2026.

## Implementado parcialmente

- `backend/.env` no debe versionarse; cliente administrativo usa clave privilegiada **solo en backend**.
- Middleware Bearer valida token con Supabase Auth y asigna usuario a la solicitud.
- Login/registro con validaciones básicas; pruebas automatizadas simuladas, no integración real.
- Código de `/api/pets` filtra por `req.user.id` y toma propietario del token, no del cuerpo enviado.
- `petgo_v2` aislado lógicamente de `public`, pero comparte Supabase Auth y proyecto.
- RLS de `profiles`, `pets` y `bookings` activado y forzado; no confundir FORCE RLS con permiso automático del backend.

## Bloqueos antes de publicar

1. Confirmar las migraciones `010` y `011`, trigger de creación de perfiles y compatibilidad con RLS forzado; verificar operación real controlada.
2. Diseñar sesiones del navegador y cierre de sesión seguros. El código de login devuelve tokens; **evitar exponerlos accidentalmente o guardarlos sin un modelo de amenaza**. El frontend de demostración no guarda tokens.
3. Controlar acceso a catálogo detallado en la API (`GET /api/services` sigue público en la versión actual) y a todos los endpoints privados; no basta esconder botones.
4. Probar que usuarios no acceden ni modifican mascotas ajenas y no pueden convertirse en `admin` desde el formulario.
5. Configurar CORS para producción, límites de peticiones, errores sin filtración de datos, accesibilidad y privacidad.
6. Evitar desplegar `panel.html` como panel real sin comprobación de sesión: actualmente es una vista de diseño.

## Revisión antes de commit

```powershell
git check-ignore backend/.env
git status --short
git diff --cached --name-only
```

No compartir `.env`, contraseñas, refresh tokens ni claves de Supabase. Si una clave se publica por error, rotarla y revisar historial.
