module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:nuxt/recommended"
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'nuxt/no-cjs-in-config': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'vue/no-v-html': 'off'
  }
}
