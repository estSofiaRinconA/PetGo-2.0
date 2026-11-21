# Estado de PetGo 2.0

**Actualizado:** 20 de noviembre de 2026. **Trabajo local en desarrollo.**

## Comprobado durante la conversación

- Frontend construido con **HTML5, CSS y JavaScript** sobre Vite; portada naranja/crema, introducción a Paseos y Baño y peluquería.
- Páginas creadas: `index.html`, `login.html`, `registro.html`, `panel.html`, `mascotas.html`.
- Panel simplificado: una acción principal para nuevas reservas; accesos a mascotas y reservas; menús de notificaciones y perfil.
- Se ejecutó `npm test` en `backend/` con **23 pruebas aprobadas, 0 fallidas**. Son pruebas anteriores: **no prueban la nueva API de mascotas ni la autenticación en producción**.
- Código de `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` y ruta propuesta `GET/POST /api/pets`; la última fue integrada según los pasos dados, pero **no se obtuvo aún una respuesta HTTP comprobada**.
- Al probar `GET /api/pets` inicialmente hubo error de conexión porque el backend no estaba activo. Se indicó arrancar con `npm start`; no consta una respuesta 401 confirmada en el registro compartido.
- Migraciones `001`–`009` aplicadas anteriormente; `010_user_access_policies.sql` y `011_create_profiles_trigger.sql` creadas, **no consta su ejecución**.
- Supabase `petgo_v2.profiles`: RLS habilitado y `FORCE ROW LEVEL SECURITY`, propietario `postgres` (consulta SQL compartida).

## Funcionalidad visual vs real

| Área | Estado actual |
|---|---|
| Portada pública informativa | Interfaz creada; enlaces a login/registro |
| Login / registro | Formularios y llamadas API preparadas; sin prueba real de alta/sesión |
| Panel | Vista previa visual sin acceso autenticado consolidado |
| Mis mascotas | Formulario visual; no almacena datos aún |
| Catálogo detallado | Pendiente de acceso privado y protección backend |
| Reservas / perfil / notificaciones reales | Pendientes |
| Despliegue público | No confirmado |

## Decisiones de producto

- Sin módulos de profesionales, proveedores o empresas.
- Sin iniciar sesión: mostrar solo explicación pública de servicios, **no catálogo detallado ni precios**.
- Con sesión válida: mostrar catálogo y operaciones privadas solo cuando el backend controle permisos.
- Una acción principal de reserva; no repetir enlaces con idéntica función en el panel.
- No mostrar reservas ni alertas ficticias como datos reales.

## Próximos pasos, en orden

1. Revisar navegación local con `docs/NAVEGACION.md`; evitar enlaces rotos.
2. Añadir pruebas automáticas de `/api/pets` y confirmar respuesta 401 sin token.
3. Revisar/aplicar con seguridad migraciones 010 y 011 y creación de perfiles; no ejecutarlas a ciegas (RLS forzado y trigger previo del esquema antiguo).
4. Completar sesión segura (evitar almacenar credenciales privilegiadas en navegador), cierre de sesión, rutas privadas y autorización por propietario.
5. Conectar mascotas; después catálogo privado, reservas, perfil, notificaciones.
6. Revisar `git status`, excluir secretos, ejecutar pruebas, crear commit y PR.

**No se considera lista para producción.**
