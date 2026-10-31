import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { attachAuth } from './server/index.js'

function authApi() {
  return {
    name: 'harmony-auth',
    configureServer(server) {
      attachAuth(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [authApi(), react(), tailwindcss()],
})
