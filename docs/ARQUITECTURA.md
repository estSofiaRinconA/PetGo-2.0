# Arquitectura de PetGo 2.0

**Actualización:** 23 de noviembre de 2026.

```text
Navegador: HTML + CSS + JavaScript
    |  /api/* (mismo origen y cookies HttpOnly)
    v
Render: Node.js HTTP
    production.js → frontend/dist
                  → server.js → routes/*.routes.js
    |                              |
    |                              v
    +-------------------------- Supabase Auth + PostgreSQL
```

Vite compila once páginas HTML. En desarrollo ofrece un proxy local `/api`; en producción un único servicio Node publica tanto las páginas como la API. No se utiliza React ni se conecta directamente Supabase desde el navegador.

## Módulos

- `backend/server.js`: enrutador HTTP y validación de métodos.
- `backend/routes/`: autenticación, recuperación OTP, perfil, mascotas, servicios, reservas, notificaciones, administración y agenda.
- `backend/production.js`: servidor de archivos estáticos compilados e inyección de aviso de cookies/accesibilidad.
- `frontend/public/petgo-accesibilidad.js` y `.css`: panel global y aviso.
- `supabase/migrations/001`–`015`: esquema, permisos, reservas, notificaciones y reglas administrativas. El código incluye las tablas `petgo_admin_users` y `petgo_booking_audit`.

## Permisos y alcance

La asignación administrativa se valida en backend, no mediante la elección de un rol en el formulario de registro. El sitio atiende clientes y servicios propios; no incluye marketplace de profesionales. Los controles de autorización requieren pruebas negativas adicionales en producción.
