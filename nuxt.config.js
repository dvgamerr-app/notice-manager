const production = !(process.env.NODE_ENV === 'development')

module.exports = {
  mode: 'universal',
  target: 'server',
  telemetry: false,
  head: {
    titleTemplate: title => `${title ? `${title} · ` : ''}LINE-Notify`,
    meta: [
      { charset: 'utf-8' },
      { name: 'application-name', content: 'LINE Notify Manager' },
      { name: 'name', content: 'LINE Notify Manager' },
      { name: 'description', content: process.env.npm_package_description || '', id: 'desc' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'MobileOptimized', content: 'width' },
      { name: 'HandheldFriendly', content: 'true' },
      { name: 'author', content: 'Mr. Kananek Thongkam' }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Open+Sans:100,300,400,700' }
    ]
  },
  pwa: {
    manifest: {
      name: 'Notify',
      lang: 'en',
      description: '',
      short_name: 'Notify',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      browser_action: {
        default_icon: '/favicon.ico',
        default_popup: '/'
      },
      icons: [
        {
          src: '/favicon-16.png',
          sizes: '16x16',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon-64.png',
          sizes: '64x64',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.png',
          sizes: '196x196',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      offlinePage: ['/', '/login']
    }
  },
  loading: {
    color: '#00B900',
    height: '2px'
  },
  css: [
    '~/assets/index.scss'
  ],
  plugins: [
    '~/plugins/vue-focus.js',
    '~/plugins/vue-tabindex.js'
  ],
  buildModules: [
    '@nuxtjs/fontawesome',
    '@nuxtjs/eslint-module',
    '@nuxtjs/stylelint-module'
  ],
  modules: [
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/pwa'
  ],
  bootstrapVue: { bootstrapCSS: false, icons: false },
  fontawesome: {
    component: 'fa',
    icons: { solid: true, regular: true, brands: true }
  },
  axios: { baseURL: process.env.HOST_API || process.env.AXIOS_BASE_URL || 'https://notice.touno.io' },
  env: {
    PROXY_API: process.env.PROXY_API || 'https://notice.touno.io',
    HOST_API: process.env.HOST_API || 'https://notice.touno.io'
  },
  build: {
    parallel: !production,
    cache: true,
    extractCSS: production,
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: { name: 'styles', test: /\.(css|vue)$/, chunks: 'all', enforce: true }
        }
      }
    }
  },
  server: { port: 4000, host: '0.0.0.0', timing: false }
}
