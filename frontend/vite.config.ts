import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: [
      'localhost',
      '[IP_ADDRESS]',
      '1f71-2401-4900-88eb-4d95-807-27a0-668b-59b4.ngrok-free.app',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        // target: 'https://6b88kn0l-8000.inc1.devtunnels.ms/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
