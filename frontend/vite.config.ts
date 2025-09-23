import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api 的请求代理到后端服务
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true, // 需要虚拟主机站点
        // 例: 前端请求 /api/upload 会被代理到 http://localhost:8080/upload
      },
    },
  },
})
