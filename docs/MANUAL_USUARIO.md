# Manual de usuario — PetGo 2.0

**Versión:** 0.2, 20 de noviembre de 2026. **Estado:** prototipo local; funciones privadas aún no listas.

## ¿Qué es PetGo?

PetGo presenta servicios para mascotas administrados directamente por la plataforma. La versión actual se concentra en **Paseos** y **Baño y peluquería**; no incorpora perfiles públicos de profesionales ni proveedores externos.

## 1. Conocer PetGo sin registrarse

1. Abrir `http://localhost:5173/` durante el desarrollo local.
2. Elegir **Conoce nuestros servicios** para ir a la explicación pública.
3. Leer las posibilidades previstas: paseos individuales o grupales; alternativas de baño y peluquería.
4. Para conocer catálogo detallado, precios y reservar, usar **Registrarse** o **Iniciar sesión** cuando las funciones privadas estén activadas.

La página pública es **informativa**: las modalidades mencionadas son propuestas, no garantía de disponibilidad ni precio.

## 2. Registrarse (interfaz disponible; alta real pendiente de validación)

1. Pulsar **Registrarse** o **Crear mi cuenta**.
2. Completar nombre, correo, contraseña de al menos 12 caracteres y confirmación.
3. Si las contraseñas difieren, el formulario muestra un aviso.
4. El botón **Crear mi cuenta** intenta comunicarse con `/api/auth/register`.

**Precaución:** el trigger de perfiles y los permisos de Supabase todavía deben validarse antes de utilizar cuentas reales. No interpretar un formulario visual como garantía de alta completada.

## 3. Iniciar sesión (integración pendiente)

1. Abrir **Iniciar sesión**.
2. Introducir correo y contraseña.
3. El formulario llama a `/api/auth/login` cuando el backend está activo.

La sesión del navegador, la redirección a un panel seguro y el cierre de sesión **no están terminados**. No se guardan tokens mediante el JavaScript del prototipo.

## 4. Conocer el panel (vista previa local)

Durante el desarrollo se puede abrir directamente `http://localhost:5173/panel.html` para **ver el diseño**, no para acceder a datos protegidos. Incluye:

- **Reservar un servicio:** futuro proceso para crear una reserva.
- **Mis mascotas:** abre `mascotas.html`.
- **Mis reservas:** futuro historial de reservas.
- **Campana:** menú visual de notificaciones (sin datos reales).
- **Mi perfil:** acceso visual a datos personales y cierre de sesión (pendientes).

## 5. Mis mascotas (formulario visual)

1. Desde la vista previa del panel, pulsar **Mis mascotas**.
2. Pulsar **Agregar mascota**.
3. Completar nombre, especie, raza opcional y observaciones opcionales.
4. Pulsar **Guardar mascota**: **actualmente solo valida; NO guarda información en Supabase**.
5. Pulsar **Cancelar** para cerrar sin guardar.
6. Usar **Volver a mi espacio** para regresar al panel.

## 6. Funciones todavía no disponibles

Reservar y pagar servicios, consultar precios detallados desde sesión autenticada, ver historial real, recibir notificaciones reales, actualizar perfil y cerrar sesión de forma segura. No ingresar información personal real en flujos no validados.

## 7. Problemas frecuentes

Si un enlace dice «en preparación», todavía no se ha implementado. Si aparece un error de conexión, revisar el estado de Vite (`5173`) y Node.js (`3000`) en [`MANUAL_ERRORES.md`](MANUAL_ERRORES.md).
