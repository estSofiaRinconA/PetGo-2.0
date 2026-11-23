# Instalación y ejecución — PetGo 2.0

**Actualización:** 23 de noviembre de 2026.

## Requisitos

Node.js compatible con el despliegue (Render emplea Node `22.16.0`); npm; cuenta Supabase configurada con migraciones y credenciales privadas. La copia local del proyecto fue probada también con Node 26. El campo `engines` de `backend/package.json` es heredado y está pendiente de alineación.

Desde la raíz:

```cmd
npm --prefix backend ci
npm --prefix frontend ci --include=dev
```

Crear `backend/.env` a partir de `backend/.env.example` y completar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`. No subir `.env` a Git.

## Desarrollo local

Terminal 1:

```cmd
cd backend
npm start
```

Terminal 2, desde otra terminal en la raíz:

```cmd
npm --prefix frontend run dev
```

Abrir la URL que indique Vite, usualmente `http://localhost:5173/`. El proxy `/api` de Vite se usa solo durante desarrollo.

## Producción local

Desde la raíz:

```cmd
npm --prefix frontend run build
node backend\production.js
```

Abrir `http://localhost:3000/`. Las páginas HTML y los recursos de accesibilidad salen de `frontend/dist`; los controles se insertan desde el servidor de producción.

## Pruebas

```cmd
cd backend
npm test
```

Las pruebas automáticas no reemplazan validación de permisos y procesos completos en la URL pública. Ver [despliegue](DESPLIEGUE_RENDER.md).
