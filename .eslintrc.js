module.exports = {
  env: { browser: true, es6: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:vue/essential"
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: [
    "vue",
    "classes"
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/attributes-order': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
}
