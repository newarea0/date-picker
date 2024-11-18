import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import components from 'unplugin-vue-components/vite'

export default function createComponents() {
  return components({
    dts: './src/types/components.d.ts',
    resolvers: [
      AntDesignVueResolver ({
        importStyle: false,
        resolveIcons: true,
      }),
    ],
  })
}
