/* Vite configuration for React admin dashboard */
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:4000'

  return {
    plugins: [react()],
    base: './',
    envDir: '.',
    envPrefix: ['VITE_'],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
