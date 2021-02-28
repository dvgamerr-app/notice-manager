const production = !(process.env.NODE_ENV === 'development')

module.exports = {
  target: 'server',
  telemetry: false,
  components: true,
  head: {
    titleTemplate: title => `${title ? `${title} · ` : ''}LINE Manager`,
    meta: [
      { charset: 'utf-8' },
      { name: 'application-name', content: 'Notice LINE Manager' },
      { name: 'name', content: 'Notice LINE Manager' },
      { name: 'description', content: process.env.npm_package_description || '', id: 'desc' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'MobileOptimized', content: 'width' },
      { name: 'HandheldFriendly', content: 'true' },
      { name: 'author', content: 'Mr.Kananek Thongkam' }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Open+Sans:100,300,400,700' }
    ]
  },
  pwa: {
    manifest: {
      name: 'Notice',
      lang: 'en',
      description: '',
      short_name: 'Notice',
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
          src: '/favicon.ico',
          sizes: '16x16',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.ico',
          sizes: '64x64',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.ico',
          sizes: '196x196',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      offlinePage: []
    }
  },
  loading: {
    color: '#00B900',
    height: '2px'
  },
  middleware: ['auth'],
  css: [
    '~/assets/index.scss'
  ],
  plugins: [
    '~/plugins/vue-liff.client.js',
    '~/plugins/vue-focus.js',
    '~/plugins/vue-tabindex.js',
    '~/plugins/vue-clipboards.js'
  ],
  buildModules: [
    '@nuxtjs/fontawesome'
    // '@nuxtjs/eslint-module',
    // '@nuxtjs/stylelint-module'
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
  auth: {
    strategies: {
      local: {
        token: { property: 'token' },
        user: { property: 'user' },
        endpoints: {
          login: { url: '/auth/login', method: 'post' },
          user: { url: '/auth/user', method: 'post' }
        }
      }
    }
  },
  axios: { baseURL: process.env.AXIOS_BASE_URL || 'https://notice.touno.io' },
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
  env: {
    HOST_API: process.env.HOST_API || 'https://notice.touno.io'
  },
  server: { port: 4000, host: '0.0.0.0', timing: false }
}
