# Instalación y ejecución local — PetGo 2.0

## Requisitos

- Git.
- Node.js y npm instalados. El entorno que se probó utilizó Node.js `26.13.1` y npm `11.20.0`.
- Acceso autorizado al proyecto Supabase compartido.
- VS Code u otro editor.

> La plantilla heredada todavía podría incluir `engines.node: 18.x` en `backend/package.json`. Esa restricción genera `EBADENGINE` con Node 26; revisar antes del despliegue.

## Instalación

```powershell
git clone <URL-DE-TU-REPOSITORIO>
cd PetGo-2.0
git switch develop
cd backend
npm.cmd ci
```

Si `npm ci` falla porque falta un `package-lock.json` actualizado, revisar el estado del repositorio antes de instalar con `npm install` y guardar cambios.

## Configuración privada

Crear `backend/.env` tomando como guía `backend/.env.example`:

```dotenv
PORT=3000
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SECRET_KEY=TU_CLAVE_SECRETA
SUPABASE_SCHEMA=petgo_v2
```

Nunca copiar valores reales en el ejemplo ni subir `.env`. Comprobar desde `backend/`:

```powershell
Test-Path .\.env
node -e "require('dotenv').config(); console.log({url:!!process.env.SUPABASE_URL, secret:!!process.env.SUPABASE_SECRET_KEY, schema:process.env.SUPABASE_SCHEMA})"
```

## Requisitos de Supabase

- El esquema `petgo_v2` debe existir y estar incluido en **Data API → Exposed schemas**.
- Los permisos del rol utilizado por el backend deben permitir acceso al esquema y lectura de catálogo.
- Las migraciones están en `supabase/migrations/`. **No volver a ejecutarlas sin verificar si ya están aplicadas**.
- No modificar tablas del esquema `public` del proyecto compartido.

## Iniciar y verificar

```powershell
npm.cmd start
```

En una segunda terminal:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/api/services | ConvertTo-Json -Depth 5
```

Para la prueba técnica de Supabase desde `backend/`:

```powershell
node .\scripts\test-supabase.js
```

## Antes de publicar

- Definir orígenes CORS permitidos para el frontend y completar preflight.
- Ajustar `engines.node` y confirmar la versión soportada en el alojamiento.
- Crear pruebas automatizadas reales y corregir/eliminar el script `test` heredado si sigue apuntando a un archivo inexistente.
- Separar entorno de desarrollo/producción cuando sea viable. El proyecto Supabase es compartido.
- Configurar secretos en el servicio de despliegue, nunca en archivos versionados.
