import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootPath = path.resolve(__dirname, '../../');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4100,
    host: true,
    fs: {
      // Allow serving files from root directory
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Explicitly resolve from root node_modules
      'react-router-dom': path.resolve(rootPath, 'node_modules/react-router-dom'),
      '@tanstack/react-query': path.resolve(rootPath, 'node_modules/@tanstack/react-query'),
      'reactflow': path.resolve(rootPath, 'node_modules/reactflow'),
      'recharts': path.resolve(rootPath, 'node_modules/recharts'),
      'clsx': path.resolve(rootPath, 'node_modules/clsx'),
      'tailwind-merge': path.resolve(rootPath, 'node_modules/tailwind-merge'),
    },
    preserveSymlinks: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'reactflow',
      'recharts',
      'clsx',
      'tailwind-merge',
    ],
    force: true,
  },
  clearScreen: false,
});
