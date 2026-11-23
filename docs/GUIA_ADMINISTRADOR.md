# Guía del administrador de PetGo 2.0

**Sitio:** https://petgo-2-0.onrender.com

La guía está disponible en `/admin-guia.html` después de comprobar el rol del usuario mediante `/api/auth/me`.

## 1. Acceso

Accede por `/login.html` con una cuenta designada como administradora en `petgo_admin_users`. El correo de Google no concede permisos por sí solo. Si la cuenta tiene el rol administrativo, la API redirige al panel de administración.

## 2. Reservas

- **Activas:** pendientes y confirmadas.
- **Historial:** completadas y canceladas.
- **Actualizar lista:** consulta el estado vigente.
- **Confirmar:** solo solicitudes pendientes y previa comprobación de disponibilidad.
- **Completar:** una reserva confirmada, después de prestar el servicio.

Las acciones se realizan mediante `/api/admin/bookings/status` y pueden registrar auditoría. No elimines el historial para ocultar reservas anteriores.

## 3. Agenda

En `/admin-agenda.html` configura días, apertura, cierre, duración y capacidad de cada modalidad. Guarda las reglas y consulta de nuevo los valores. Zona horaria: America/Bogota.

**Limitación:** el cálculo completo de solapamientos y capacidades todavía requiere validación; no asumas que las reglas por sí solas impiden toda sobreocupación.

## 4. Cierre y resolución de errores

Cierra sesión al terminar. Ante errores consulta el estado de Render, los logs de API y Supabase, pero no compartas llaves secretas ni tokens.

## 5. Google

Google permite autenticar al usuario, pero la autorización administrativa continúa vinculada al UUID en `petgo_admin_users`. Una cuenta nueva de Google es cliente hasta que se le otorgue el rol por el procedimiento administrativo autorizado.
