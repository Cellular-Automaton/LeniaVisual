// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cssInjectedByJsPlugin()
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: 'src/main.jsx',
      name: 'LeniaVisual',
      fileName: 'LeniaVisual',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
      external: [], // Ne pas externaliser le CSS
    },
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
