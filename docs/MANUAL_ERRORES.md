# Manual de errores — PetGo 2.0

**Alcance:** problemas observados en la instalación y desarrollo inicial. No se incluyen credenciales.

| Síntoma | Causa probable | Solución segura |
|---|---|---|
| `node` o `npm` no se reconoce | Node.js ausente o PATH sin actualizar | Instalar Node.js, cerrar y reabrir VS Code, comprobar `node -v` y `npm.cmd -v`. |
| `EBADENGINE` (`node: 18.x`) | Plantilla heredada declara Node 18, equipo usa Node 26 | Advertencia, no necesariamente fallo. Revisar `engines` y compatibilidad antes del despliegue. |
| `npm error ENOENT ... package.json` | Se ejecuta npm en la raíz, pero `package.json` está en `backend/` | `cd backend` antes de `npm.cmd start`, o usar `npm.cmd --prefix .\backend start`. |
| `fatal: not a git repository` | Terminal fuera de `PetGo-2.0` | Volver con `cd .\PetGo-2.0` desde Escritorio; comprobar `git status`. |
| `MODULE_NOT_FOUND: ./routes/services.routes` | Falta el archivo o está en otra carpeta | Comprobar con `Test-Path .\routes\services.routes.js` desde `backend/`; no crear carpetas anidadas por error. |
| `MODULE_NOT_FOUND: scripts/test-supabase.js` | Prueba guardada en ruta equivocada | Crear/verificar `backend/scripts/test-supabase.js`; ejecutar desde `backend/`. |
| `Falta configurar SUPABASE_URL o SUPABASE_SECRET_KEY` | `backend/.env` no existe o no se carga | Verificar `Test-Path .\.env`, nombres de variables y ubicación; **no compartir valores**. |
| `Invalid schema: petgo_v2` | Esquema no incluido en Data API/Exposed schemas | Agregar `petgo_v2` sin quitar los existentes; comprobar permisos del rol del backend. |
| `ECONNREFUSED` a MySQL | La plantilla antigua intentaba conectar MySQL local | Retirar la importación legacy y el paquete `mysql` tras adaptar las rutas a Supabase. |
| `DEP0169 url.parse()` | Uso de API de URL antigua | Sustituir por el constructor `new URL()`. |
| `GET /api/services` devuelve 404 | Ruta no registrada, servidor viejo en puerto 3000 o código sin reiniciar | Revisar `server.js`, reiniciar y comprobar el proceso que escucha en 3000. |
| `POST /api/services` devuelve 405 | Método no admitido por el endpoint público | **Es correcto**: solo se permite GET. |
| Una consulta SQL muestra `NULL` en precio/duración | Modalidades creadas sin valores definidos | **Es correcto** mientras estén inactivas; completar reglas antes de habilitar reservas. |
| Sin resultados desde el navegador de otro origen | CORS todavía no configurado | Definir orígenes permitidos y responder a preflight correctamente antes de integrar frontend. |

## Diagnóstico mínimo de PowerShell

Desde la raíz del proyecto:

```powershell
git status
git branch --show-current
cd backend
Test-Path .\.env
Test-Path .\routes\services.routes.js
npm.cmd start
```

Desde otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/api/services | ConvertTo-Json -Depth 5
```

## Procedimiento cuando ocurre un error

1. Copiar el mensaje exacto de la terminal, **sin datos secretos**.
2. Anotar el comando y la carpeta desde la que se ejecutó.
3. Comprobar la ruta del archivo antes de cambiar código.
4. Si el problema es de SQL, **no repetir migraciones a ciegas**; verificar qué objetos se crearon.
5. No borrar tablas `public` ni ejecutar `DROP` para «arreglar» una conexión.
6. Tras la corrección, repetir las pruebas y registrar el resultado.
