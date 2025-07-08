// AIDEV-NOTE: Vite config with optimized bundling, path aliases, and chunk splitting
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/gikamura/' : '/',
  plugins: [react()],
  resolve: {
    // AIDEV-NOTE: Path aliases for cleaner imports (FSD architecture ready)
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@shared': path.resolve(__dirname, './src/shared'),
    }
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // AIDEV-NOTE: Manual chunk splitting for better caching and performance
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          remotestorage: ['remotestoragejs', 'remotestorage-widget']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true
  },
  // AIDEV-NOTE: Pre-bundle frequently used dependencies for faster dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query']
  }
})
