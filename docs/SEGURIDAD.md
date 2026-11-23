# Seguridad y privacidad — PetGo 2.0

**Actualizado:** 23 de noviembre de 2026.

## Controles presentes en el código

- Credenciales privilegiadas de Supabase reservadas al backend; `.env` está ignorado por Git.
- Cookies de autenticación `HttpOnly`, `SameSite=Lax` y `Secure` cuando `NODE_ENV=production`.
- Reglas de acceso administrativas consultadas en la base de datos; los roles no se eligen desde el navegador.
- Restricción de solicitudes y comprobación de origen en el flujo OTP; cookie temporal de recuperación, limitada y de un solo uso según la implementación.
- El aviso de cookies corresponde a sesiones y preferencias locales; no supone una plataforma de consentimiento publicitario.

## Pruebas y límites pendientes

1. Confirmar persistencia de las cookies tras refrescar, abrir pestaña nueva y renovar sesión.
2. Probar negativamente todas las rutas administrativas con cuenta cliente y las rutas de cliente con cuenta administradora.
3. Completar análisis CSRF/origen en todas las mutaciones, gestión de expiración y limitación de solicitudes.
4. Auditar seguridad de capacidad/solapamiento de reservas, propiedad de datos, RLS y privilegios de Supabase.
5. Ejecutar recuperación OTP completa y revisar SMTP, códigos caducados y reinicios del servidor. Los tickets OTP actualmente se almacenan en memoria, no en almacenamiento compartido.
6. Revisar accesibilidad y cumplimiento legal de privacidad y cookies antes de uso público real.

## Antes de publicar código

```cmd
git check-ignore backend/.env
git status --short
git diff --cached --name-only
```

Nunca versionar `.env`, contraseñas, claves de servicio, correos privados de usuarios ni respaldos con datos sensibles. Si se divulga un secreto, revocarlo y rotarlo.
