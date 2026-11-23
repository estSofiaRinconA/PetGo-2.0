# Manual de usuario — PetGo 2.0

**Actualizado:** 23 de noviembre de 2026.

## Acceder

Abrir la [web pública](../README.md#-sitio-web), elegir **Registrarse** o **Iniciar sesión**. El registro solicita datos de cuenta y confirmación por correo. Después de iniciar sesión como cliente, se abre el panel privado.

## Mascotas

En **Mis mascotas** es posible consultar y registrar mascotas, actualizar sus datos y eliminarlas cuando las reglas de reservas lo permiten. Los registros se consultan en Supabase mediante la API propia de PetGo.

## Reservas y notificaciones

En **Reservar**, seleccionar modalidad, mascota, fecha y horario disponibles según los controles implementados. En **Mis reservas**, consultar las activas y el historial; una reserva pendiente puede cancelarse si la API lo permite. Las notificaciones muestran cambios vinculados con las solicitudes.

La disponibilidad mostrada no implica que esté auditado el cálculo de todos los solapamientos de duración y cupo; es una limitación conocida.

## Perfil, cierre y recuperación

Desde **Perfil** consultar o actualizar datos. Usar **Cerrar sesión** al terminar. La recuperación de contraseña solicita correo, verifica un código OTP y solo entonces muestra nueva contraseña y confirmación; su envío SMTP y su resultado final deben probarse en el entorno de entrega.

## Cookies y accesibilidad

El aviso informa sobre las cookies necesarias para la sesión y el almacenamiento local de preferencias. El botón flotante **Accesibilidad** permite alto contraste, tamaño de texto (100 % a 150 %) y lectura en voz alta, si el navegador la admite. La preferencia de aviso y los ajustes de accesibilidad se guardan en el propio navegador.

## Recomendaciones

Utilizar cuentas de demostración y no publicar información privada. Si la sesión se pierde al actualizar, reportarlo como error pendiente, no como funcionamiento normal.
