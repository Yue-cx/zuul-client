import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: 'localhost', // 仅绑定到 localhost
    port: 8081, // 指定前端开发服务器端口
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 你的Spring Boot后端地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // 移除/api前缀（如果需要）
        // ws: true // 如果需要代理WebSockets
      }
    }
  }
})
