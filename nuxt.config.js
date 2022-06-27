const devEnv = process.env.NODE_ENV === 'development'
const repositoryName = devEnv ? '' : '/line-notice'

export default {
  ssr: false,
  target: 'static',
  components: true,
  srcDir: 'src',
  router: { base: `${repositoryName}/` },
  server: { port: 8080 },
  env: {
    baseUrl: `${repositoryName}/`,
    devEnv,
    userId: process.env.LIFF_USER_ID,
    hostApi: process.env.HOST_API
  },
  head: {
    titleTemplate: title => `${title ? `${title} · ` : ''}Manager`,
    meta: [
      { charset: 'utf-8' },
      { name: 'application-name', content: 'Notice Manager' },
      { name: 'name', content: 'Notice Manager' },
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
      name: 'Notice Manager',
      lang: 'en',
      description: process.env.npm_package_description,
      short_name: 'Notice',
      start_url: `${repositoryName}/`,
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      browser_action: {
        default_icon: `${repositoryName}/favicon.ico`,
        default_popup: `${repositoryName}/`
      },
      icons: [
        {
          src: `${repositoryName}/favicon.ico`,
          sizes: '16x16',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: `${repositoryName}/favicon.ico`,
          sizes: '64x64',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: `${repositoryName}/favicon.ico`,
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
  // middleware: ['auth'],
  css: [
    '@/assets/index.scss'
  ],
  plugins: [
    '@/plugins/vue-liff.client.js',
    '@/plugins/vue-tabindex.js',
    '@/plugins/vue-clipboards.js'
  ],
  buildModules: [
    '@nuxtjs/fontawesome',
    '@nuxtjs/eslint-module'
  ],
  build: {
    babel: { compact: true },
    parallel: true,
    cache: true,
    extractCSS: !devEnv,
    optimizeCSS: true,
    optimization: {
      minimize: true,
      minimizer: [
        // terser-webpack-plugin
        // optimize-css-assets-webpack-plugin
      ],
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '.',
        name: undefined,
        cacheGroups: { styles: { name: 'styles', test: /\.(css|vue)$/, chunks: 'all', enforce: true } }
      }
    }
  },
  modules: [
    '@nuxtjs/markdownit',
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
    '@nuxtjs/pwa'
  ],
  axios: {
    baseURL: '/'
  },
  bootstrapVue: { bootstrapCSS: false, icons: false },
  fontawesome: {
    component: 'fa',
    icons: { solid: true, regular: true, brands: true }
  }
}
