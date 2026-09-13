import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/pages',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        principle: resolve(projectRoot, 'index.html'),
        circuit: resolve(projectRoot, 'circuit/index.html'),
        design: resolve(projectRoot, 'design/index.html'),
      },
    },
  },
});
