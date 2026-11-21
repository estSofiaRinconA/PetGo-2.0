# Manual de errores — PetGo 2.0

**Actualizado:** 20 de noviembre de 2026. Sin contraseñas ni datos privados.

| Síntoma | Posible causa | Acción |
|---|---|---|
| `Invoke-RestMethod: No es posible conectar con el servidor remoto` en puerto `3000` | Backend no iniciado | En terminal 1: `cd backend; npm start`. En terminal 2 repetir solicitud. |
| Backend iniciado, `GET /api/pets` devuelve **401** sin token | La ruta exige autenticación | **Correcto**: no es un fallo. |
| `GET /api/pets` devuelve **404** | Ruta no conectada, URL equivocada o servidor antiguo | Comprobar `backend/server.js`, `backend/routes/pets.routes.js` y reiniciar Node. |
| El navegador muestra `404` al ir a `reservar.html`, `reservas.html` o `perfil.html` | Esas páginas aún no existen | Instalar `navigation-guard.js` o evitar los enlaces hasta implementar las páginas. |
| Vite muestra pantalla React o versión anterior | Archivos antiguos o caché | Verificar `frontend/index.html`, detener/reiniciar Vite y pulsar `Ctrl + Shift + R`. |
| `localhost:5173` no abre | Vite apagado o en otro puerto | `cd frontend; npm run dev`; abrir la URL exacta indicada. |
| Las páginas abren, pero los formularios dan error de red | Backend apagado o proxy `/api` incorrecto | Arrancar backend; revisar `frontend/vite.config.js` → puerto `3000`. |
| Registro indica fallo / no crea perfil | Supabase Auth, trigger de perfil o RLS sin validar | No reintentar masivamente; revisar migraciones `010` y `011` y permisos con cautela. |
| `MODULE_NOT_FOUND` de rutas nuevas | Archivo faltante o `require` mal escrito | Revisar `backend/routes/` y `backend/server.js`; ejecutar `npm test`. |
| Error `Invalid schema: petgo_v2` | Esquema no expuesto o sin permisos | Revisar Data API y permisos; no hacer `DROP` ni abrir privilegios generales. |
| Error `23503` al insertar mascota | Usuario autenticado sin perfil en `petgo_v2.profiles` | Validar trigger, existencia de perfil y FK; no forzar `user_id`. |
| `GET /api/services` responde datos pero no debería ser catálogo público | API todavía pública según implementación anterior | Antes de publicar, proteger **ruta del backend**, no solo ocultar enlace HTML. |
| `POST /api/services` devuelve 405 | Solo admite GET | Es el resultado esperado. |
| Fotos externas no se muestran | Fallo de red o recurso remoto | Comprobar conexión; usar imágenes propias con licencia antes de publicar. |
| Errores `EBADENGINE` | Configuración vieja `node: 18.x` con Node local 26 | Revisar compatibilidad real y `backend/package.json` antes de desplegar. |
| `npm test` pasa pero registro/mascotas fallan realmente | Pruebas simuladas no cubren integración | Añadir pruebas de API y pruebas controladas en Supabase. |

## Diagnóstico rápido (PowerShell)

**Terminal del backend**:

```powershell
cd "C:\Users\aikok\OneDrive\Escritorio\PetGo-2.0\backend"
npm start
```

**Terminal del frontend**:

```powershell
cd "C:\Users\aikok\OneDrive\Escritorio\PetGo-2.0\frontend"
npm run dev
```

**Tercera terminal**:

```powershell
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/pets" -Method GET
} catch {
  if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode }
  else { $_.Exception.Message }
}
```

**Resultado deseado sin token:** `401`. Si aparece error de conexión, no atribuirlo a RLS antes de encender el servidor.

## Procedimiento de resolución

1. Registrar síntoma, fecha, comando y carpeta de trabajo; nunca compartir `.env`, tokens ni contraseñas.
2. Confirmar qué procesos están activos y en qué puertos.
3. Comprobar archivo y ruta antes de modificar código.
4. No ejecutar migraciones repetidas ni borrar esquemas antiguos a ciegas.
5. Volver a ejecutar `npm test`; recordar que 23 pruebas anteriores no cubren todos los cambios nuevos.
