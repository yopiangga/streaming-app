import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: parseInt(env.PORT) || 5173,
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'TikTok',
          short_name: 'TikTok',
          description: 'Streaming platform like TikTok Live',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'fullscreen',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/tl.webp',
              sizes: '192x192',
              type: 'image/webp'
            },
            {
              src: '/tl.webp',
              sizes: '512x512',
              type: 'image/webp'
            }
          ]
        }
      })
    ],
  }
})
