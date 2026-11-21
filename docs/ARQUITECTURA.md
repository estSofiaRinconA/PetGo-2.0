# Arquitectura — PetGo 2.0

**Actualizado:** 20 de noviembre de 2026.

```text
Navegador
  HTML5 + CSS3 + JavaScript (frontend/, Vite solo desarrollo)
  páginas: index, login, registro, panel (vista previa), mascotas
         │ /api (proxy Vite a puerto 3000)
         ▼
Backend Node.js con node:http
  server.js → routes/ → controllers/ / models/ → Supabase
             middleware Bearer → Supabase Auth
         ▼
Supabase PostgreSQL — esquema petgo_v2
 services | service_variants | profiles | pets | bookings
```

No usamos React para el frontend actual. `frontend/src/` puede ser un resto de la creación inicial con Vite; verificar antes de limpiar archivos.

## Tablas y relaciones

- `services`: servicios principales.
- `service_variants`: modalidades, inicialmente sin publicar.
- `profiles`: usuario (`id` vinculado a `auth.users`), datos y rol `cliente`/`admin`.
- `pets`: `id`, `user_id` FK a perfil, `nombre`, `especie`, `raza`, `fecha_nacimiento`, `descripcion`, `foto_path`, marcas de tiempo.
- `bookings`: reservas, integridad de propietario mascota mediante FK compuesta.

## Migraciones

`001`–`009`: aplicadas en el trabajo previo. `010_user_access_policies.sql` y `011_create_profiles_trigger.sql`: creadas en rama de trabajo, **sin constancia de aplicación**. Cinco tablas con RLS habilitado y forzado. Trigger previo de auth en esquema compartido requiere cuidado para evitar efectos sobre la versión antigua.

## Navegación y protección

La portada es pública y solo explica servicios. Panel y mascotas son visualmente accesibles durante desarrollo, **no son todavía áreas privadas listas**. Las páginas HTML y enlaces no constituyen control de acceso; la autorización real debe implementarse en backend para cada operación, y debe completarse la sesión del navegador. Ver [`NAVEGACION.md`](NAVEGACION.md).

## Alcance

PetGo 2.0 atiende clientes y servicios propios; no integra Marketplace de profesionales. Reservas y notificaciones reales pendientes.
