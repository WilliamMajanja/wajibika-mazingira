
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Make the server accessible externally (e.g., on your local network).
    // This is useful for testing on different devices and for Netlify's preview features.
    host: true, 
  },
  // The manual API proxy has been removed from this file.
  // The recommended local development workflow is to use the Netlify CLI: `netlify dev`.
  // This command automatically handles proxying API requests to your Netlify Functions,
  // creating a development environment that perfectly matches the production setup.
  // See the README.md for more details on getting started.
})
