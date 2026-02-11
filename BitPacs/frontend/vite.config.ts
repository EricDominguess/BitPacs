import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Ajusta para buscar o .env na raiz do BitPacs
  const env = loadEnv(mode, process.cwd());
  console.log('Variáveis carregadas pelo loadEnv:', env);
  console.log('VITE_STORAGE_TOTAL_FAZENDA (build):', env.VITE_STORAGE_TOTAL_FAZENDA);
  
  // URLs das unidades
  const orthancRioBranco = env.VITE_ORTHANC_IP_RIOBRANCO || 'http://localhost:8042';
  const orthancFozIguacu = env.VITE_ORTHANC_IP_FOZIGUACU || 'http://localhost:8042';
  const orthancFazenda = env.VITE_ORTHANC_IP_FAZENDA || 'http://localhost:8042';
  const orthancFaxinal = env.VITE_ORTHANC_IP_FAXINAL || 'http://localhost:8042';
  const orthancSantaMariana = env.VITE_ORTHANC_IP_SANTAMARIANA || 'http://localhost:8042';
  const orthancGuarapuava = env.VITE_ORTHANC_IP_GUARAPUAVA || 'http://localhost:8042';
  const orthancCarlopolis = env.VITE_ORTHANC_IP_CARLOPOLIS || 'http://localhost:8042';
  const orthancArapoti = env.VITE_ORTHANC_IP_ARAPOTI || 'http://localhost:8042';
  
  // Proxy padrão (Rio Branco como fallback para rotas legadas)
  const orthancUrl = orthancRioBranco;

  // Configuração padrão do proxy (sem senhas)
  const proxyConfig = {
    target: orthancUrl,
    changeOrigin: true,
    secure: false,
  };

  // Configuração do proxy para cada unidade
  const createProxyConfig = (target: string) => ({
    target,
    changeOrigin: true,
    secure: false,
  });

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
        '/orthanc-riobranco': {
          ...createProxyConfig(orthancRioBranco),
          rewrite: (path) => path.replace(/^\/orthanc-riobranco/, ''),
        },
        '/orthanc-foziguacu': {
          ...createProxyConfig(orthancFozIguacu),
          rewrite: (path) => path.replace(/^\/orthanc-foziguacu/, ''),
        },
        '/orthanc-fazenda': {
          ...createProxyConfig(orthancFazenda),
          rewrite: (path) => path.replace(/^\/orthanc-fazenda/, ''),
        },
        '/orthanc-faxinal': {
          ...createProxyConfig(orthancFaxinal),
          rewrite: (path) => path.replace(/^\/orthanc-faxinal/, ''),
        },
        '/orthanc-santamariana': {
          ...createProxyConfig(orthancSantaMariana),
          rewrite: (path) => path.replace(/^\/orthanc-santamariana/, ''),
        },
        '/orthanc-guarapuava': {
          ...createProxyConfig(orthancGuarapuava),
          rewrite: (path) => path.replace(/^\/orthanc-guarapuava/, ''),
        },
        '/orthanc-carlopolis': {
          ...createProxyConfig(orthancCarlopolis),
          rewrite: (path) => path.replace(/^\/orthanc-carlopolis/, ''),
        },
        '/orthanc-arapoti': {
          ...createProxyConfig(orthancArapoti),
          rewrite: (path) => path.replace(/^\/orthanc-arapoti/, ''),
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