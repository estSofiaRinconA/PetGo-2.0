# PetGo 2.0 🐾

Proyecto académico de plataforma web para servicios de **paseos y baños para mascotas**. Se desarrolla en un repositorio propio basado en la plantilla Node.js/MVC del profesor.

> **Estado actual (19 de noviembre de 2026): backend inicial y base de datos en desarrollo.** Todavía **no existe una interfaz pública terminada**, un flujo de reservas operativo ni un panel de administración funcional.

## Funcionalidades verificadas

- API HTTP propia con `GET /` y `GET /api/services`.
- `GET /api/services` devuelve los servicios activos **Baños** y **Paseos** desde Supabase.
- `POST /api/services` responde `405 Method Not Allowed`.
- Supabase usa el esquema `petgo_v2`, separado de las tablas del sistema anterior en `public`.
- Tablas creadas: `services`, `service_variants`, `profiles`, `pets` y `bookings`.
- Las cinco tablas tienen RLS habilitado y forzado, sin políticas para usuarios finales todavía.
- Las modalidades iniciales (paseo individual, paseo extendido y baño básico) están **inactivas y sin precio ni duración**.
- Se retiró la dependencia npm de MySQL; el servidor actual ya no intenta conectarse a MySQL.

## Tecnologías

- **Backend:** Node.js (CommonJS), módulo HTTP nativo, organización MVC, `@supabase/supabase-js` y `dotenv`.
- **Datos:** Supabase / PostgreSQL, Supabase Auth previsto para el registro y los roles.
- **Frontend:** pendiente; se planifica HTML, CSS y JavaScript modular con componentes reutilizables.
- **Git:** trabajo por ramas (`develop` y `feature/*`).

## Estructura

```text
PetGo-2.0/
├── backend/
│   ├── controllers/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
├── supabase/migrations/
├── docs/
├── .gitignore
└── README.md
```

## Inicio rápido (Windows PowerShell)

```powershell
cd backend
npm.cmd ci
# Crear backend/.env a partir de backend/.env.example y completar valores privados
npm.cmd start
```

Probar en otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/api/services | ConvertTo-Json -Depth 5
```

> Nunca publiques `backend/.env`, claves secretas, cadenas de conexión ni contraseñas. `backend/.env.example` debe contener **solo marcadores de ejemplo**.

## Documentación

- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Manual de administración (planificado)](docs/MANUAL_ADMIN.md)
- [Manual de errores](docs/MANUAL_ERRORES.md)
- [API REST](docs/API.md)
- [Arquitectura y base de datos](docs/ARQUITECTURA.md)
- [Instalación y ejecución](docs/INSTALACION.md)
- [Seguridad](docs/SEGURIDAD.md)
- [Estado y próximos pasos](docs/ESTADO_PROYECTO.md)

## Advertencias conocidas

- La plantilla inicial declaraba Node.js `18.x`, mientras que el entorno de desarrollo verificado usa Node.js `26.13.1`; queda pendiente revisar `engines` y la compatibilidad de producción.
- La plantilla original incluye archivos heredados de usuarios/MySQL. Se conservan como referencia, pero no deben reactivarse sin adaptarlos.
- `package.json` puede conservar el script antiguo `test` que apunta a `test-api.js`; aún no se confirmó una suite automatizada válida para PetGo 2.0.
- No se ha configurado todavía CORS para el frontend ni la autenticación/autorización de los nuevos endpoints.

## Autoría y referencia

Desarrollo de PetGo 2.0 como trabajo académico individual, basado en la plantilla backend del profesor. Conservar atribuciones/licencias de los archivos heredados cuando corresponda.
