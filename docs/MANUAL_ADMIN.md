# Manual del administrador — PetGo 2.0

**Actualizado:** 23 de noviembre de 2026.

## Entrada

El administrador utiliza el mismo formulario de inicio de sesión que el cliente. La API consulta la autorización administrativa y redirige al panel `admin.html` cuando corresponde; no se activa el rol desde el registro público.

## Gestionar reservas

En el panel se muestran reservas activas y su historial. El personal autorizado puede revisar solicitudes, confirmar las pendientes y completar las confirmadas. Los cambios se registran mediante los mecanismos de auditoría del proyecto y pueden generar notificaciones al cliente.

## Agenda

En `admin-agenda.html` se consultan y ajustan reglas por día de la semana, horarios y características de las modalidades de servicio. Las reglas configuradas se almacenan en Supabase a través de la API; el cálculo de disponibilidad por solapamientos y cupo requiere revisión adicional.

## Seguridad y cierre de sesión

Usar el botón **Cerrar sesión** al terminar. La protección debe comprobarse en el backend para cada ruta `/api/admin/*` y se debe verificar con una cuenta de cliente que la API deniegue los accesos indebidos. No compartir cuentas administrativas.
