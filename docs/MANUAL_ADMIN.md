# Manual de administración — PetGo 2.0

**Estado al 20 de noviembre de 2026: planificación.** El panel de administración **no está implementado**. No se ha añadido ningún acceso «Soy administrador» al sitio público.

## Diseño previsto

La misma autenticación de clientes, con autorización estricta según rol persistido en la base de datos. Un usuario no puede darse permisos `admin` durante el registro.

## Funciones futuras

- Mantener modalidades y disponibilidad de Paseos y Baño y peluquería.
- Definir y publicar precios y duración antes de habilitar reservas.
- Revisar y gestionar solicitudes y estados de reservas.
- Consultar información personal solo cuando sea necesario y autorizado.

## Seguridad antes de implementar

Comprobar cada petición administrativa en el backend, políticas RLS y privilegios mínimos; probar que un usuario cliente recibe denegación. No habilitar funciones hasta tener pruebas y reglas definidas.
