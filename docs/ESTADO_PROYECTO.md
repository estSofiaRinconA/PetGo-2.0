# Estado de PetGo 2.0

**Corte:** 23 de noviembre de 2026.

## Entrega web

- Render ejecuta el frontend compilado y la API Node.js bajo HTTPS; el usuario confirmó estado **Live** y carga de la portada.
- Fueron comprobados manualmente: login, registro como página, redirección de administrador, lista administrativa de reservas, cierre de sesión, acceso a mascotas, reservas y perfil.
- La actualización de cookies y accesibilidad pasó seis verificaciones manuales: botón accesible, alto contraste, cambio de tamaño del texto, lectura en voz alta, aviso de cookies e inicio de sesión/panel tras actualizar el despliegue.
- El código de Supabase y las migraciones `001`–`015` están presentes. Las comprobaciones anteriores sobre funciones de reservas, mascotas, notificaciones y agenda se realizaron en desarrollo; el informe de publicación no implica una auditoría completa de cada operación.

## Componentes implementados

| Componente | Estado |
|---|---|
| Portada y páginas HTML | Desplegadas |
| Registro e inicio de sesión | Implementados; login probado en Render |
| Perfil y mascotas | Implementados; páginas verificadas |
| Servicios, reservas y cancelaciones | Implementados; requieren pruebas regresivas en entorno público |
| Notificaciones | Implementadas |
| Panel de administración y agenda | Implementados; acceso y reservas comprobados en Render |
| Recuperación OTP | Implementada con código, verificación y nueva contraseña; flujo extremo a extremo pendiente de confirmar |
| Cookies y accesibilidad | Implementadas y comprobadas manualmente |
| HTTPS y servicio Node.js | Desplegados en Render |
| Google OAuth | No implementado en la versión entregada |

## Pendientes conocidos

1. Confirmar que la sesión se conserva al actualizar con `F5` y al abrir una pestaña nueva. Esta prueba quedó pendiente en la revisión anterior.
2. Verificar mediante solicitudes reales que clientes no acceden a rutas administrativas y que administradores no obtienen permisos indebidos de cliente.
3. Revisar disponibilidad por solapamiento de horarios y capacidad real, no solo coincidencias exactas.
4. Ejecutar el flujo completo de recuperación OTP desde correo hasta acceso con la nueva contraseña.
5. Completar auditoría de accesibilidad, seguridad de cookies, CSRF, pruebas automatizadas e integración.
6. Registrar la URL pública real de Render en `README.md` y `docs/DESPLIEGUE_RENDER.md`.

## Criterio de presentación

Se puede demostrar la versión publicada con cuentas de prueba. No se afirma que la plataforma esté auditada para usuarios reales ni que funciones pendientes estén terminadas.
