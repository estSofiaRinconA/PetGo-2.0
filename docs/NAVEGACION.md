# Mapa de navegación — PetGo 2.0

**Corte:** 20 de noviembre de 2026. HTML/CSS/JavaScript + Vite.

## Páginas que existen en el proyecto según el trabajo realizado

| Página | Accesos actuales previstos | Estado |
|---|---|---|
| `/index.html` (`/`) | Iniciar sesión → `/login.html`; Registrarse / Crear cuenta → `/registro.html`; Conoce nuestros servicios → `#servicios` | Informativa pública |
| `/login.html` | enlace a `/registro.html`; logo → `/index.html` | Formulario conectado a endpoint, sesión real pendiente |
| `/registro.html` | enlace a `/login.html`; logo → `/index.html` | Formulario conectado a endpoint, alta real pendiente |
| `/panel.html` | logo → `/index.html`; Mis mascotas → `/mascotas.html` | **Vista previa**, no área autenticada aún |
| `/mascotas.html` | Volver a mi espacio → `/panel.html` | Formulario local sin persistencia |

## Destinos que todavía NO existen

- `/reservar.html`: reservar nuevo servicio.
- `/reservas.html`: historial y estados de reservas.
- `/perfil.html`: datos personales.

En `panel.html` hay enlaces preparados hacia esos destinos. **Para no llevar al usuario a un 404**, `frontend/js/navigation-guard.js` muestra un aviso local cuando se pulsan esos accesos. El aviso **no crea la función ni reemplaza el control de permisos**. Al implementar una página real, quitar su ruta de `pendientes` dentro del JS.

## Instalación del aviso local

El paquete de cierre incluye `tools/aplicar-navegacion.ps1` y `frontend/js/navigation-guard.js`. Ejecutar el instalador **desde la raíz del repo** siguiendo `INSTRUCCIONES.md`; hace copia de seguridad de `panel.html` e inserta la importación sin reemplazar el diseño.

**No enlazar automáticamente `login.html` a `panel.html` como si hubiera sesión válida:** ahora el formulario de login no persiste sesión segura; el panel solo debe abrirse manualmente en desarrollo. En producción proteger la página y, especialmente, la API.

## Comprobación manual de navegación

1. Abrir `http://localhost:5173/`.
2. Probar Inicio → Iniciar sesión → Registrarse → Iniciar sesión.
3. Probar logo de login/registro → Inicio.
4. Abrir **manualmente para vista previa** `http://localhost:5173/panel.html`.
5. Probar Accesos rápidos → Mis mascotas → Volver al panel.
6. Probar Reservar, Mis reservas y Mis datos: deben mostrar mensaje de «en preparación», **sin navegar a un 404**.
7. Comprobar campana y menú perfil, Escape y clic fuera; el cierre de sesión sigue pendiente de integración.
