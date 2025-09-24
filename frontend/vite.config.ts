import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api 的请求代理到后端服务
      '/api': {
        target: 'http://localhost:8080', // 您的Go后端地址
        changeOrigin: true,
        // 现在前端请求 /api/..., 代理会直接转发到 http://localhost:8080/api/...
        // 这与后端新的路由结构完全匹配。
      },
    },
  },
})
