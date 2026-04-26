import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force all dependencies to use the same React instance
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    // Ensuring core dependencies are pre-bundled together
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('framer-motion') || id.includes('@studio-freight') || id.includes('lenis')) return 'motion-vendor';
          if (id.includes('recharts')) return 'charts-vendor';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) return 'markdown-vendor';
          return 'vendor';
        },
      },
    },
  },
});
