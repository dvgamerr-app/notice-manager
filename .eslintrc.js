module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    'plugin:nuxt/recommended'
  ],
  // add your custom rules here
  rules: {
    indent: 'off',
    'nuxt/no-cjs-in-config': 'off',
    'template-curly-spacing': 'off',
    'vue/max-attributes-per-line': [
      'error', {
        singleline: 10,
        multiline: { max: 3, allowFirstLine: false }
      }
    ]
  }
}
