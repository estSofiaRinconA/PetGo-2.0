# Estado y siguientes pasos — PetGo 2.0

**Corte de documentación:** 19 de noviembre de 2026 (según el historial de desarrollo compartido).

## Terminado y verificado manualmente

- Fork del backend del profesor y nueva organización en `backend`, `frontend`, `supabase`, `docs`.
- Rama `develop` y rama de trabajo `feature/supabase-setup`.
- Migraciones `001` a `009` preparadas durante el desarrollo (confirmar presencia local de cada archivo al hacer commit).
- Tablas `services`, `service_variants`, `profiles`, `pets` y `bookings` en `petgo_v2`.
- Servicios activos: Paseos y Baños.
- Tres modalidades inactivas sin precio ni duración.
- RLS de las cinco tablas activado y forzado; seis FK iniciales y restricción compuesta posterior.
- Conexión Node.js ↔ Supabase probada.
- API `GET /`, `GET /api/services` probada; `POST /api/services` devuelve 405.
- Eliminación npm del paquete `mysql`; servidor sin error de MySQL ni aviso de `url.parse()` en la última comprobación.

## Pendiente / no probado

- Automatización de pruebas y CI.
- CORS seguro para el frontend.
- Auth, autorización por rol y panel de administración.
- CRUD de mascotas, reservas, disponibilidad, cancelaciones y notificaciones.
- Integridad de disponibilidad (no solapar horarios) y reglas de precios.
- Completar RLS/políticas y permisos de escritura.
- Diseñar e implementar frontend móvil, componentes reutilizables, cookies y accesibilidad.
- Fotografías y diseño visual definitivo.
- Documentación OpenAPI completa y despliegue Render de la nueva versión.
- Revisar/retirar código heredado de MySQL y script antiguo `npm test`.

## Siguiente hito recomendado

1. Revisar y limpiar la carpeta accidental `backend/database/backend/`, **sin eliminar contenido sin inspeccionarlo**.
2. Confirmar que los archivos esperados y las migraciones están guardados en el repositorio.
3. Actualizar README y documentación.
4. Ejecutar prueba manual de `/` y `/api/services`, revisar `git status` y crear commit en `feature/supabase-setup`.
5. Abrir PR a `develop`; verificar que ninguna credencial aparezca en los archivos modificados.
6. En nueva rama, crear pruebas automatizadas y eliminar dependencias heredadas sin romper MVC.

## Criterio de entrega de cada función

Implementación + prueba + documentación + revisión de permisos + validación de UX/accesibilidad cuando corresponda. Un checklist marcado por sí solo no reemplaza la salida de la prueba.
