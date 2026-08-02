import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/zone-data': {
        target: 'https://88zones.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/zone-data/, '/data')
      }
    }
  }
});
