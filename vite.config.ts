import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // 部署到 GitHub Pages 时的 base 路径
  base: '/GYM-app/',
  plugins: [
    vue(),
    VitePWA({
      // PWA 配置
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: '健身计时器',
        short_name: '健身计时',
        description: '移动端健身训练计时工具',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/GYM-app/',
        icons: [
          {
            src: '/GYM-app/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/GYM-app/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/GYM-app/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 缓存策略
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    // 开发服务器配置，支持移动端访问
    host: '0.0.0.0',
    port: 5173
  }
})
