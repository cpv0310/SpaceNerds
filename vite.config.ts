import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    minify: 'esbuild',
    reportCompressedSize: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
