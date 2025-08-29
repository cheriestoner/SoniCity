import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  // 获取环境变量，如果没有设置则使用默认值
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
  
  return {
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
          target: API_BASE_URL,
          changeOrigin: true
        },
        // 代理路由请求到后端服务器
        '/compose': {
          target: API_BASE_URL,
          changeOrigin: true
        },
        '/record': {
          target: API_BASE_URL,
          changeOrigin: true
        }
      }
    }
  }
})
