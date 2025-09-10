import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [react(), tailwindcss(), visualizer({ open: true })],
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
    // 'process.env': {}, // Commenté pour permettre l'utilisation de process.env
    global: 'globalThis',
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  resolve: {
    alias: {
      // Ajout de l'alias pour le paquet 'buffer'
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})