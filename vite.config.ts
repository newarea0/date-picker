import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImportPlugin from './vite/plugins/auto-import'
import ComponentsPlugin from './vite/plugins/components'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImportPlugin(),
    ComponentsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
