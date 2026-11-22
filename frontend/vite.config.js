
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  build: {
    rollupOptions: {
      input: {
        inicio: resolve(raiz, 'index.html'),
        login: resolve(raiz, 'login.html'),
        registro: resolve(raiz, 'registro.html'),
        panel: resolve(raiz, 'panel.html'),
        mascotas: resolve(raiz, 'mascotas.html'),
        reservar: resolve(raiz, 'reservar.html'),
        reservas: resolve(raiz, 'reservas.html'),
        perfil: resolve(raiz, 'perfil.html'),
        admin: resolve(raiz, 'admin.html'),
        agenda: resolve(raiz, 'admin-agenda.html')
      }
    }
  }
});
