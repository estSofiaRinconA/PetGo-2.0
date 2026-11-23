# PetGo 2.0 — Cierre en GitHub y merge

## 1. Añadir la URL HTTPS real

El archivo `README.md` y `docs/DESPLIEGUE_RENDER.md` contienen el marcador `PEGAR_AQUI_URL_HTTPS_DE_RENDER`. Reemplazar **ambas apariciones** por la dirección HTTPS exacta del servicio Render (por ejemplo, `https://<tu-servicio>.onrender.com`, sin usar esa dirección de ejemplo como definitiva).

Desde PowerShell, en la raíz, se puede ejecutar el siguiente comando, reemplazando la URL de ejemplo por la real:

```powershell
$url = 'https://TU-SITIO-REAL.onrender.com'
@('README.md','docs/DESPLIEGUE_RENDER.md') | ForEach-Object {
  (Get-Content $_ -Raw -Encoding UTF8).Replace('[PEGAR_AQUI_URL_HTTPS_DE_RENDER]', $url) | Set-Content $_ -Encoding UTF8
}
```

## 2. Guardar documentación en la rama de Render

Abrir CMD en la raíz del repositorio local, donde ya se descomprimió el paquete:

```cmd
git branch --show-current
git status --short
git check-ignore backend/.env
git add README.md docs render.yaml
git diff --cached --name-only
git diff --cached --check
git commit -m "docs: actualizar entrega y despliegue publico PetGo"
git push origin feature/schedule-admin-v2
```

Si `git branch --show-current` no imprime `feature/schedule-admin-v2`, no cambiar de rama hasta revisar los cambios locales. Verificar que `.env` NO esté en la lista staged. El archivo RAR adjunto trae `.git` y `backend/.env`: **jamás agregar el RAR al repositorio ni incluir `.env` en un ZIP público**.

## 3. Merge a develop

Solo después del commit y push anteriores, con árbol de trabajo limpio:

```cmd
git status --short
git switch develop
git pull --ff-only origin develop
git merge --no-ff feature/schedule-admin-v2 -m "merge: integrar entrega PetGo 2.0"
git push origin develop
```

Si Git informa conflicto, DETENERSE y revisarlo. No usar `git push --force`, `git reset --hard` ni borrar la rama de características. Si se exige Pull Request, crear PR de `feature/schedule-admin-v2` hacia `develop` desde GitHub en lugar de hacer el merge local, y aprobarlo allí.

## 4. Confirmar versión publicada

Render aún puede seguir la rama `feature/schedule-admin-v2`. Fusionar a `develop` NO cambia su rama automáticamente. Después del merge, puedes configurar Render → Settings → Branch → `develop` y desplegar el último commit, solo tras comprobar que el merge quedó correcto y la web continúa funcionando.

Guardar en el README el enlace público real, la documentación actualizada y una captura opcional de la portada, siempre sin información personal. Para presentar la aplicación, utilizar el enlace de Render, no GitHub Pages (la API requiere Node).
