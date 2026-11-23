# API HTTP — PetGo 2.0

**Actualización:** 23 de noviembre de 2026. Base en producción: el mismo origen HTTPS que la web. Base local: `http://localhost:3000` (servidor de producción) o proxy Vite para desarrollo.

Las respuestas son JSON. Las rutas privadas utilizan cookies de sesión `HttpOnly`; las mutaciones requieren validaciones del backend. La siguiente tabla se basa en las rutas registradas en `backend/server.js`, no en una especificación hipotética.

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Consultar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/password/recovery` | Solicitar código de recuperación |
| POST | `/api/auth/password/verify` | Verificar OTP |
| POST | `/api/auth/password/reset` | Cambiar contraseña tras verificar |
| GET / PATCH | `/api/profile` | Leer y actualizar perfil |
| GET / POST | `/api/pets` | Consultar y registrar mascotas |
| PATCH / DELETE | `/api/pets/item` | Editar y eliminar mascota |
| GET | `/api/services` | Consultar catálogo de servicios |
| GET / POST | `/api/reservations` | Listar y crear reservas |
| PATCH | `/api/reservations/cancel` | Cancelar reserva permitida |
| GET | `/api/notifications` | Consultar notificaciones |
| PATCH | `/api/notifications/read` | Marcar notificación leída |
| GET | `/api/admin/me` | Comprobar acceso administrativo |
| GET | `/api/admin/bookings` | Consultar reservas administrativas |
| PATCH | `/api/admin/bookings/status` | Cambiar estado de reserva |
| GET / PATCH | `/api/admin/schedule` | Consultar y modificar agenda |

El frontend nunca debe recibir `SUPABASE_SECRET_KEY`. La verificación de OTP y recuperación siguen pendientes de comprobación integral por correo; los controles de acceso entre roles deben probarse directamente sobre la API.
