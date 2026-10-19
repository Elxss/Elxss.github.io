import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Let the dev server answer through an ngrok tunnel. The leading dot
    // allows every subdomain, since the free ngrok URL changes on each run.
    allowedHosts: ['.ngrok-free.app'],
  },
})
