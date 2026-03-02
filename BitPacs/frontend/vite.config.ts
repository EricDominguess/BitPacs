import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(() => {

  // --- AJUSTE DE SEGURANÇA ---
  // Definimos o IP de fallback (Rio Branco) fixo para o Proxy Local.
  // Isso evita que o Vite tente usar "/orthanc-riobranco" como URL se o .env mudar.
  const FALLBACK_ORTHANC_IP = 'http://10.31.0.36:8042'; 

  // Configuração padrão do proxy (sem senhas)
  const proxyConfig = {
    target: FALLBACK_ORTHANC_IP,
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
      host: true, // Permite acesso externo (útil se testar do celular/outra máquina)
      proxy: {
        // --- PROXIES POR UNIDADE (PERFEITO!) ---
        '/orthanc-riobranco': {
          target: 'http://10.31.0.36:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-riobranco/, '')
        },
        '/orthanc-foziguacu': {
          target: 'http://10.31.0.39:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-foziguacu/, '')
        },
        '/orthanc-fazenda': {
          target: 'http://10.31.0.38:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-fazenda/, '')
        },
        '/orthanc-faxinal': {
          target: 'http://10.31.0.37:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-faxinal/, ''),
        },
        '/orthanc-santamariana': {
          target: 'http://10.31.0.46:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-santamariana/, ''),
        },
        '/orthanc-guarapuava': {
          target: 'http://10.31.0.47:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-guarapuava/, ''),
        },
        '/orthanc-carlopolis': {
          target: 'http://10.31.0.48:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-carlopolis/, ''),
        },
        '/orthanc-arapoti': {
          target: 'http://10.31.0.49:8042',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/orthanc-arapoti/, ''),
        },
        
        // --- BACKEND API E AVATARES ---
        '/api': {
          target: 'http://localhost:5151',
          changeOrigin: true,
          secure: false,
        },
        '/avatars': {
          target: 'http://localhost:5151',
          changeOrigin: true,
          secure: false,
        },

        // --- ROTAS LEGADAS / FALLBACK ---
        // Usa a constante FALLBACK_ORTHANC_IP definida lá em cima
        
        '/orthanc': {
          ...proxyConfig,
          rewrite: (path) => path.replace(/^\/orthanc/, ''),
        },
        
        // Rotas que o Stone Webviewer exige na raiz
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
