
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Make the server accessible externally.
    // This is needed for Netlify's preview and live sharing features.
    host: true,
    proxy: {
      '/api': {
        // This proxies requests to the Netlify Functions server running locally
        // when running `vite` directly. `netlify dev` handles this automatically.
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
      },
    },
    // The `allowedHosts` setting, which can be overly restrictive for local 
    // development with `netlify dev`, has been removed to improve stability.
  },
})
