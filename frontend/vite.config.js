import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  // Ajout pour la compatibilité des modules Node.js dans le navigateur
  define: {
    'process.env': {},
    global: {},
  },
  resolve: {
    alias: {
      // Ajout de l'alias pour le paquet 'buffer'
      buffer: 'buffer/',
    },
  },
})