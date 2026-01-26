import { defineConfig, loadEnv } from 'vite' // 1. Importe o loadEnv
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/orthanc': {
          target: env.VITE_ORTHANC_IP_FAZENDA || 'http://localhost:8042', 
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/orthanc/, ''),
        },
      }
    }
  }
})