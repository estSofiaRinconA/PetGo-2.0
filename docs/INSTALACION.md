# Instalación y ejecución local — PetGo 2.0

**Actualizado:** 20 de noviembre de 2026. Entorno usado: Windows PowerShell, Node.js 26.13.1, npm 11.20.0. Revisar `engines` heredado de Node 18 antes del despliegue.

## Estructura

```text
PetGo-2.0/
├── backend/       # Node.js HTTP + Supabase
├── frontend/      # HTML, CSS, JavaScript + Vite (sin React como base)
├── supabase/      # SQL migraciones
└── docs/
```

## Configuración

En `backend/.env` (ignorado por Git) configurar las variables necesarias según `.env.example`, incluidas `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SCHEMA=petgo_v2` y `PORT=3000`. **Nunca copiar secretos en documentación ni Git.**

Las migraciones `010` y `011` son pendientes de validación y ejecución; no aplicarlas sin revisar RLS y el trigger compartido de `auth.users`.

## Ejecutar, en dos terminales

**Terminal 1 — Backend**:

```powershell
cd "C:\Users\aikok\OneDrive\Escritorio\PetGo-2.0\backend"
npm start
```

**Terminal 2 — Frontend**:

```powershell
cd "C:\Users\aikok\OneDrive\Escritorio\PetGo-2.0\frontend"
npm run dev
```

Si faltan dependencias, ejecutar `npm install` en la carpeta correspondiente. La URL habitual de Vite es `http://localhost:5173/`, pero usar la que muestre la terminal. El `frontend/vite.config.js` usa proxy `/api` hacia `http://localhost:3000` durante desarrollo; **no es configuración de producción**.

## Revisión

```powershell
cd "C:\Users\aikok\OneDrive\Escritorio\PetGo-2.0\backend"
npm test
```

**Último resultado compartido:** 23 aprobadas y 0 fallidas. No cubren todavía integración real de mascotas.

En otra terminal, con backend iniciado:

```powershell
Invoke-RestMethod http://localhost:3000/
try { Invoke-RestMethod http://localhost:3000/api/pets } catch { [int]$_.Exception.Response.StatusCode }
```

Esperado para `/api/pets` sin token: 401, **aún por comprobar en el entorno del usuario**.

Consultar [`NAVEGACION.md`](NAVEGACION.md) para enlaces y vista previa del panel.

## Antes de publicar

Validar registro real y trigger de perfiles; sesión segura y cierre; protección del catálogo detallado; políticas de autorización y tests específicos de `/api/pets`; disponibilidad y reservas reales; privacidad, accesibilidad, imágenes propias/licencias; despliegue; revisión de secretos y `git status`.
