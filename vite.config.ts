import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      // Alias for pdfjs worker to ensure proper resolution
      'pdfjs-dist/build/pdf.worker.min.js': 'pdfjs-dist/build/pdf.worker.min.js'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure worker files are properly handled
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.worker.js') || assetInfo.name?.endsWith('.worker.min.js')) {
            return 'workers/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});