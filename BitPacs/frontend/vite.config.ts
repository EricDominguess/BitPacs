import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const orthancUrl = env.VITE_ORTHANC_IP_FAZENDA || 'http://localhost:8042';

  // Configuração padrão do proxy (sem senhas)
  const proxyConfig = {
    target: orthancUrl,
    changeOrigin: true,
    secure: false,
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      proxy: {
        // 1. Rota Principal (HTML do visualizador)
        '/orthanc': {
          ...proxyConfig,
          rewrite: (path) => path.replace(/^\/orthanc/, ''),
        },
        
        // 2. Rotas de API que o Stone exige na raiz
        '/studies': proxyConfig,
        '/series': proxyConfig,
        '/instances': proxyConfig,
        '/dicom-web': proxyConfig,
        '/wado': proxyConfig,
        '/stone-webviewer': proxyConfig,
        '/plugins': proxyConfig,
        '/system': proxyConfig,
        '/tools': proxyConfig,
        '/app': proxyConfig,
        '/fonts': proxyConfig,
      }
    }
  }
})