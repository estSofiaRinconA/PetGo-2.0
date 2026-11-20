# Arquitectura y base de datos — PetGo 2.0

## Arquitectura prevista

```text
Frontend (pendiente)
       |
       | HTTP/JSON
       v
API Node.js propia
  server.js → routes/ → controllers/ → models/
                                        |
                                        v
                            database/supabase.js
                                        |
                                        v
                            Supabase / PostgreSQL
                                 esquema petgo_v2
```

El backend sigue la estructura MVC de la plantilla Node.js del profesor. La interfaz futura debe utilizar la API propia para operaciones de negocio.

## Reutilización planificada en frontend

Separar componentes comunes (`Button`, `Modal`, `FormField`), mascotas (`PetCard`), servicios (`ServiceCard`), reservas (`BookingCard`) y perfiles (`ProfileCard`). Ninguno de estos componentes ha sido implementado en el nuevo repositorio al cierre de esta etapa.

## Esquema PostgreSQL

El proyecto de Supabase es **compartido**. Las tablas antiguas están en `public`; las nuevas se crean en `petgo_v2`. Un esquema separado **no implica una instancia separada**: Auth, configuración y recursos continúan compartiéndose.

### Tablas creadas en `petgo_v2`

| Tabla | Finalidad | Restricciones principales |
|---|---|---|
| `services` | Paseos y Baños | UUID; `slug` único; activo |
| `service_variants` | Modalidades | FK a services; slug único por servicio; precio y duración opcionales hasta su publicación |
| `profiles` | Datos de cliente/admin | PK/FK `id → auth.users.id`; rol `cliente` o `admin` |
| `pets` | Mascotas del cliente | FK `user_id → profiles.id`; combinación `UNIQUE(id,user_id)` |
| `bookings` | Reservas | FK a profiles, pets y service_variants; clave compuesta `(pet_id,user_id) → pets(id,user_id)` |

### Migraciones documentadas

1. `001_create_schema.sql`: crear `petgo_v2` y restringir acceso inicial.
2. `002_create_services.sql`: servicios y dos registros activos.
3. `003_create_service_variants.sql`: modalidades y RLS.
4. `004_seed_service_variants.sql`: modalidades iniciales inactivas.
5. `005_create_profiles.sql`: perfiles vinculados a Auth.
6. `006_create_pets.sql`: mascotas con relación a perfiles.
7. `007_create_bookings.sql`: reservas con precio/duración acordados.
8. `008_booking_pet_ownership.sql`: integridad cliente-mascota por clave compuesta.
9. `009_backend_catalog_permissions.sql`: lectura del catálogo para `service_role`.

**Nota:** son scripts SQL ejecutados manualmente. No se ha configurado todavía una herramienta automatizada de migraciones ni un historial que garantice su aplicación por entorno.

## Seguridad y reglas pendientes

- RLS está habilitado y forzado en las cinco tablas; al cierre de las verificaciones las políticas para usuario final eran cero.
- La clave secreta del backend puede operar con privilegios elevados: se debe validar la identidad y el rol en todos los endpoints protegidos.
- Las FK verifican existencia; la clave compuesta de reservas comprueba que la mascota corresponda al usuario indicado, **no** que quien llama a la API sea ese usuario.
- Falta proteger cambios de rol y desarrollar políticas, funciones de alta de perfiles y autorización administrativa.
- Falta resolver disponibilidad real, transiciones de estado, concurrencia, cancelaciones, precios calculados por el servidor y control de acceso por propietario.
