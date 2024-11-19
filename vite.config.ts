import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import AutoImportPlugin from './vite/plugins/auto-import'
import ComponentsPlugin from './vite/plugins/components'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImportPlugin(),
    ComponentsPlugin(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
