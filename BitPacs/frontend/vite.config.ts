import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Ajusta para buscar o .env na raiz do BitPacs
  const env = loadEnv(mode, process.cwd());
  console.log('Variáveis carregadas pelo loadEnv:', env);
  console.log('VITE_STORAGE_TOTAL_FAZENDA (build):', env.VITE_STORAGE_TOTAL_FAZENDA);
  
  // URLs das unidades
  const orthancFazenda = env.VITE_ORTHANC_IP_FAZENDA || 'http://localhost:8042';
  const orthancRioBranco = env.VITE_ORTHANC_IP_RIOBRANCO || 'http://localhost:8042';
  
  // Proxy padrão (Rio Branco como fallback para rotas legadas)
  const orthancUrl = orthancRioBranco;

  // Configuração padrão do proxy (sem senhas)
  const proxyConfig = {
    target: orthancUrl,
    changeOrigin: true,
    secure: false,
  };

  // Configuração do proxy para Fazenda
  const proxyConfigFazenda = {
    target: orthancFazenda,
    changeOrigin: true,
    secure: false,
  };

  // Configuração do proxy para Rio Branco
  const proxyConfigRioBranco = {
    target: orthancRioBranco,
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
        // Proxies por unidade
        '/orthanc-fazenda': {
          ...proxyConfigFazenda,
          rewrite: (path) => path.replace(/^\/orthanc-fazenda/, ''),
        },
        '/orthanc-riobranco': {
          ...proxyConfigRioBranco,
          rewrite: (path) => path.replace(/^\/orthanc-riobranco/, ''),
        },
        
        // 1. Rota Principal legada (HTML do visualizador) - usa Rio Branco como padrão
        '/orthanc': {
          ...proxyConfig,
          rewrite: (path) => path.replace(/^\/orthanc/, ''),
        },
        
        // 2. Rotas de API que o Stone exige na raiz
        // NOTA: /studies removido para não conflitar com a rota React /studies
        // O Stone deve usar /orthanc/studies ou acessar via dicom-web
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