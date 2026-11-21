# API REST — PetGo 2.0

**Actualizado:** 20 de noviembre de 2026. **Base local:** `http://localhost:3000`. JSON; usar backend para todas las operaciones sensibles.

| Método / ruta | Estado de código | Verificación |
|---|---|---|
| `GET /` | Implementado | Probado |
| `GET /api/services` | Implementado, catálogo activo **actualmente público** | Probado con simulación + previamente manual |
| `POST /api/auth/register` | Implementado | Pruebas simuladas; alta real NO verificada |
| `POST /api/auth/login` | Implementado | Pruebas simuladas; inicio real NO verificado |
| `GET /api/auth/me` | Middleware Bearer | Pruebas de acceso sin token y métodos |
| `GET /api/pets` | Código de ruta añadido en desarrollo | **Pendiente comprobación HTTP y pruebas nuevas** |
| `POST /api/pets` | Código de ruta añadido en desarrollo | **Pendiente comprobación HTTP y pruebas nuevas** |
| Reservas, notificaciones, edición de perfil | No implementadas | Pendientes |

## Autenticación

`POST /api/auth/register` recibe `{ "nombre": "...", "email": "...", "password": "..." }`; valida longitud mínima de 12 caracteres y asigna metadatos `nombre`, **sin aceptar rol de administrador del cliente**. La migración del trigger de perfil aún no ha sido validada en vivo.

`POST /api/auth/login` recibe `{ "email": "...", "password": "..." }`; el controlador devuelve `access_token`, `refresh_token`, `expires_in` y usuario en respuesta de éxito. **El frontend de desarrollo no persiste sesión; no publicar sin diseñar manejo seguro.**

`GET /api/auth/me` requiere `Authorization: Bearer <token>` y responde con `id` y `email` cuando la autenticación es válida.

## Mascotas (código nuevo, sin integración validada)

`GET /api/pets` requiere token; consulta registros filtrados por `req.user.id`.

`POST /api/pets` requiere token y cuerpo por ejemplo:

```json
{ "nombre": "Max", "especie": "perro", "raza": "Criollo", "observaciones": "Prefiere paseos tranquilos" }
```

Campos: `nombre` obligatorio (máximo 100), `especie` `perro` o `gato`, `raza` opcional (máximo 100), `observaciones` opcionales (máximo 1000), convertidas en columna `descripcion`. El servidor debe fijar `user_id` desde `req.user.id` aunque el cuerpo envíe otro ID.

Respuestas previstas: 200 listado, 201 creación, 400 entrada inválida, 401 sin token, 405 método no admitido, 409 perfil ausente (`23503`), 503 fallo de datos. **Estos resultados de la ruta nueva aún no están verificados en ejecución real.**

## Riesgos pendientes

- La intención de producto es que las modalidades/precios detallados se vean solo tras login, pero `GET /api/services` sigue público. **Se necesita protección backend antes de producción**.
- Esquema `petgo_v2` usa FORCE RLS; el cliente administrativo y los permisos de tabla deben probarse.
- Las reservas deben calcular precios en el servidor y comprobar pertenencia de mascota, disponibilidad y permisos.
