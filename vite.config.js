import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        suzhou: 'suzhou.html',
        recorder: 'recorder.html'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 代理 API 请求到后端服务器
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // 代理路由请求到后端服务器
      '/compose': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/record': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
