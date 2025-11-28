import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      
      // ✅ HOẶC sửa thành đúng như này (không có proxy cũng được)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // ✅ QUAN TRỌNG: Giữ cookie
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward cookies
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Forward Set-Cookie headers
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie;
            }
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});