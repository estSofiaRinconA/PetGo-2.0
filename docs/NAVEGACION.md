# Navegación — PetGo 2.0

**Actualizado:** 23 de noviembre de 2026.

## Páginas públicas

- `index.html`: portada y presentación de servicios.
- `login.html`: iniciar sesión.
- `registro.html`: crear cuenta.
- `recuperar.html`: recuperar contraseña con OTP; comprobación completa pendiente.

## Cliente autenticado

- `panel.html`: vista general y accesos principales.
- `mascotas.html`: mascotas registradas.
- `reservar.html`: nueva solicitud de reserva.
- `reservas.html`: reservas activas e historial.
- `perfil.html`: información y ajustes del perfil.

## Administración

- `admin.html`: reservas y estados administrativos.
- `admin-agenda.html`: reglas de agenda.

La autorización real corresponde al backend. Es posible que los archivos HTML sean accesibles por URL, pero **sus datos y acciones privadas deben exigir permisos**.

El botón flotante de accesibilidad y el aviso de cookies se insertan en todas las páginas HTML al servir `frontend/dist` con `backend/production.js`.
