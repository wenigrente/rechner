import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/rechner/',

  resolve: {
    alias: {
      '@core':  resolve(__dirname, 'src/core'),
      '@ui':    resolve(__dirname, 'src/ui'),
      '@i18n':  resolve(__dirname, 'src/i18n'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
