import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 1. Configuração para o Orthanc
      '/orthanc': {
        target: 'http://10.31.0.42:8042', // Porta do Orthanc no Docker
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/orthanc/, ''),
      },
    }
  }
})
