# PetGo 2.0 🐾

Plataforma web académica para la gestión de **paseos, baños y peluquería de mascotas**. Permite a clientes consultar servicios, administrar mascotas y solicitar reservas; incluye funciones administrativas para gestionar reservas y horarios.

**Estado (23 de noviembre de 2026):** sitio desplegado y comprobado en Render mediante HTTPS. Se verificaron el acceso, el panel administrativo, las páginas privadas y los controles de accesibilidad. La persistencia de sesión después de actualizar, las restricciones de acceso entre roles y el flujo completo de recuperación OTP requieren una última verificación; no se declara lista para uso público irrestricto.

## 🌐 Sitio web

**URL pública de PetGo:** **https://petgo-2-0.onrender.com**

> Sustituir este marcador con la dirección HTTPS real del servicio Render antes del commit. No se utiliza GitHub Pages porque la aplicación requiere una API Node.js activa.

## Funciones

- Registro, confirmación por correo, inicio/cierre de sesión y consulta de perfil mediante Supabase Auth y la API propia.
- Administración de mascotas (alta, consulta, edición y eliminación con controles de integridad).
- Catálogo de paseos, baños y modalidades; reservas con estados y cancelación.
- Notificaciones de reservas y panel con información de la cuenta.
- Panel administrativo y agenda: consulta de solicitudes, actualización de estados, registro de auditoría y configuración de reglas horarias.
- Recuperación de contraseña por código OTP con verificación previa al cambio (requiere confirmar entrega SMTP y pruebas completas).
- Aviso de cookies necesarias y panel de accesibilidad: alto contraste, tamaño de texto y lectura en voz alta (según compatibilidad del navegador).

## Tecnologías y arquitectura

**Frontend:** HTML, CSS, JavaScript y Vite (compilación multipágina).

**Backend:** Node.js con `node:http`, rutas `/api/*`, cookies de sesión `HttpOnly` y control de acceso del lado del servidor.

**Persistencia y autenticación:** Supabase (PostgreSQL y Auth). Las claves de Supabase no se envían al frontend.

**Producción:** Render ejecuta `backend/production.js`, que sirve simultáneamente `frontend/dist` y la API desde un solo dominio HTTPS.

```text
Navegador (HTML/CSS/JS)
         | HTTPS /api/*
         v
Render / Node.js (production.js + server.js + routes/)
         |
         v
Supabase Auth + PostgreSQL
```

## Ejecutar localmente

Instalar dependencias en `backend/` y `frontend/`, y crear `backend/.env` con las variables de `backend/.env.example` (nunca versionar secretos).

```cmd
npm --prefix backend ci
npm --prefix frontend ci --include=dev
```

Para desarrollo, ejecutar `npm start` desde `backend/` y `npm run dev` desde `frontend/` en terminales separadas.

Para simular la publicación:

```cmd
npm --prefix frontend run build
node backend\production.js
```

Abrir `http://localhost:3000/` en el segundo caso.

## Despliegue Render

- **Repositorio:** `https://github.com/estSofiaRinconA/PetGo-2.0`
- **Build:** `npm --prefix backend ci && npm --prefix frontend ci --include=dev && npm --prefix frontend run build`
- **Start:** `node backend/production.js`
- **Environment:** `NODE_ENV=production`, `NODE_VERSION=22.16.0` y `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` definidas **solo en Render**.
- **Rama de publicación antes del merge:** `feature/schedule-admin-v2`. Tras integrar a `develop`, decidir en Render cuándo cambiar la rama conectada.

## Documentación

Consulta el [índice de documentación](docs/README.md), el [manual de usuario](docs/MANUAL_USUARIO.md), el [manual administrativo](docs/MANUAL_ADMIN.md), la [API](docs/API.md), las [instrucciones de despliegue](docs/DESPLIEGUE_RENDER.md) y el [estado del proyecto](docs/ESTADO_PROYECTO.md).

**Nota de seguridad:** la interfaz y un despliegue exitoso no sustituyen pruebas de autorización, cookies, disponibilidad y privacidad. No utilizar datos reales de terceros durante la demostración.
