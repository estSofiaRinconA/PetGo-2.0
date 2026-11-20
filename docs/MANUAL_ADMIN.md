# Manual de administración — PetGo 2.0 (PLANIFICADO)

**Estado:** panel administrativo y autenticación por rol **no implementados**.

## Acceso propuesto

El administrador ingresará correo electrónico y contraseña en el inicio de sesión normal. No habrá botón público «Soy administrador». El backend verificará el rol real y permitirá la redirección al panel solo después de validar la sesión.

## Funcionalidades previstas

- Administrar disponibilidad y modalidades de Paseos y Baños.
- Actualizar precios y duraciones; mantener la información acordada de reservas anteriores.
- Consultar, confirmar y gestionar reservas según reglas definidas.
- Consultar datos de clientes y mascotas únicamente cuando sea necesario y esté autorizado.
- Revisar estados y errores operativos.

## Reglas de seguridad obligatorias antes de activar el panel

- Supabase Auth para comprobar identidad.
- El rol `admin` nunca podrá establecerse desde un formulario público.
- Verificación de permisos en **cada endpoint administrativo**, no solo ocultando botones.
- RLS y privilegios SQL cuidadosamente definidos; las credenciales privilegiadas nunca se exponen al frontend.
- Pruebas que confirmen que un usuario `cliente` no puede invocar operaciones de administrador.

Este archivo deberá actualizarse con capturas y procedimientos reales cuando el panel esté construido.
