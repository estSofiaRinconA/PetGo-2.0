# Manual de usuario — PetGo 2.0

**Versión:** 0.1 (documentación de desarrollo)  
**Estado:** el sitio público para clientes **todavía no está implementado**.

## 1. Objetivo

PetGo ofrecerá dos servicios administrados directamente por la plataforma: **paseos** y **baños** para mascotas. No se permitirá que negocios externos se registren para ofrecer servicios.

## 2. Qué puede utilizarse hoy

La funcionalidad comprobada es técnica: una API que devuelve el catálogo de servicios activos. No se ha verificado todavía una interfaz desde la cual un cliente pueda registrarse, gestionar sus mascotas o reservar.

Para comprobar la API durante el desarrollo:

1. Iniciar el backend siguiendo `INSTALACION.md`.
2. Abrir `http://localhost:3000/` para confirmar que está activo.
3. Abrir `http://localhost:3000/api/services` para consultar el catálogo.

## 3. Recorrido previsto para el cliente (NO disponible todavía)

1. Visitar la página de inicio y comprender qué incluyen Paseos y Baños.
2. Explorar el servicio y sus modalidades, con precios, duración y condiciones claros.
3. Crear cuenta o iniciar sesión.
4. Registrar o seleccionar una mascota propia.
5. Elegir fecha y horario disponibles.
6. Revisar un resumen con precio y duración **calculados por el servidor**.
7. Enviar la solicitud y recibir el estado correcto: `pendiente`, `confirmada`, `completada` o `cancelada`.
8. Consultar o cancelar según las reglas publicadas.

**Aviso:** las modalidades actuales están inactivas y todavía no tienen precios o duraciones definidos. No debe habilitarse un botón de reserva hasta que existan reglas de disponibilidad y autorización reales.

## 4. Accesibilidad y privacidad (requisitos pendientes)

La interfaz final deberá permitir navegación mediante teclado, foco visible, controles compatibles con móviles, contraste adecuado, zoom de texto y mensajes comprensibles. También tendrá aviso de cookies con opciones de aceptación, rechazo y cambio posterior de preferencias. Estas funciones **no han sido validadas en PetGo 2.0**.

## 5. Errores frecuentes

Si una petición a la API falla, revisa `MANUAL_ERRORES.md`. Los errores de conexión y permisos de Supabase son diagnósticos técnicos, no mensajes que deban mostrarse literalmente a usuarios finales.
