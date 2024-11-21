import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  rules: {
    'style/brace-style': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'antfu/if-newline': 'off',
    'antfu/curly': 'off',
  },
})
