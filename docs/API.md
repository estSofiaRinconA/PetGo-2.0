# Documentación de API REST — PetGo 2.0

**Versión de desarrollo:** 0.1  
**Base local:** `http://localhost:3000`  
**Estado:** catálogo funcional; autenticación, reservas y administración pendientes.

## Convenciones

- Las respuestas actuales utilizan JSON.
- Los errores públicos no deben filtrar credenciales ni detalles internos.
- La API utiliza Supabase desde el servidor. La clave secreta debe permanecer en `backend/.env`.

## GET `/`

Comprueba que el servidor está activo.

**200 OK** (versión posterior a la limpieza de MySQL):

```json
{ "success": true, "message": "API PetGo 2.0 activa" }
```

## GET `/api/services`

Devuelve únicamente los servicios cuyo campo `activo` es `true`.

**200 OK** (los `id` reales son UUID distintos):

```json
{
  "success": true,
  "data": [
    {
      "id": "<uuid>",
      "nombre": "Baños",
      "slug": "banos",
      "descripcion": "Servicio de baño e higiene para mascotas.",
      "imagen_path": null
    },
    {
      "id": "<uuid>",
      "nombre": "Paseos",
      "slug": "paseos",
      "descripcion": "Servicio de paseos para mascotas.",
      "imagen_path": null
    }
  ]
}
```

**500 Internal Server Error** si falla la consulta (texto previsto por el controlador):

```json
{ "success": false, "error": "No fue posible obtener los servicios" }
```

**405 Method Not Allowed** para `POST /api/services`, confirmado en pruebas:

```json
{ "success": false, "error": "Método no permitido" }
```

Cabecera esperada: `Allow: GET`.

## Rutas desconocidas

**404 Not Found**:

```json
{ "success": false, "error": "Ruta no encontrada" }
```

## Rutas previstas, NO implementadas

- Inicio de sesión y registro por Supabase Auth.
- Gestión de mascotas y perfiles.
- Consulta de modalidades, precios y disponibilidad.
- Creación, historial y cancelación de reservas.
- Operaciones de administración protegidas.

No consumir estas rutas desde el frontend hasta diseñar, implementar y probar sus contratos.

## Pruebas manuales

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/api/services | ConvertTo-Json -Depth 5
try { Invoke-WebRequest -Uri http://localhost:3000/api/services -Method POST } catch { [int]$_.Exception.Response.StatusCode }
```

## Pendiente de especificar en OpenAPI

Añadir `openapi.yaml` cuando estén definidos los endpoints de autenticación, validación de parámetros, operaciones de reservas y administración. No inventar contratos de funciones aún no desarrolladas.
