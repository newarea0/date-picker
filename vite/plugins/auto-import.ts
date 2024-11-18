import AutoImport from 'unplugin-auto-import/vite'

export default function AutoImportPlugin() {
  return AutoImport({
    imports: ['vue', 'vue-router', 'pinia'],
    dts: 'src/types/auto-imports.d.ts',
  })
}
